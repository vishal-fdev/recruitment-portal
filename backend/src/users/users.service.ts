import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  UserDocument,
  UserDocumentModel,
} from '../mongodb/schemas/user.schema';
import {
  VendorDocument,
  VendorDocumentModel,
} from '../mongodb/schemas/vendor.schema';
import { Vendor } from '../vendors/vendors.entity';
import { User, UserRole } from './user.entity';

@Injectable()
export class UsersService implements OnModuleInit {
  constructor(
    @InjectModel(UserDocumentModel.name)
    private readonly userMongoModel: Model<UserDocument>,

    @InjectModel(VendorDocumentModel.name)
    private readonly vendorMongoModel: Model<VendorDocument>,
  ) {}

  async onModuleInit() {
    await this.seedSystemUsers();
  }

  async findAll(): Promise<User[]> {
    const docs = await this.userMongoModel
      .find()
      .sort({ postgresId: 1 })
      .lean()
      .exec();

    return docs.map((doc) => this.mapMongoUser(doc));
  }

  async findByEmail(email: string): Promise<User | null> {
    const normalizedEmail = this.normalizeEmail(email);
    if (!normalizedEmail) {
      return null;
    }

    const doc = await this.userMongoModel
      .findOne({ email: new RegExp(`^${this.escapeRegex(normalizedEmail)}$`, 'i') })
      .lean()
      .exec();

    if (!doc) {
      return null;
    }

    const hydrated = await this.ensureVendorSnapshot(doc);
    return this.mapMongoUser(hydrated);
  }

  async ensureActiveUser(email: string, role: UserRole): Promise<User> {
    const normalizedEmail = this.normalizeEmail(email);
    if (!normalizedEmail) {
      throw new Error('Email is required');
    }

    let doc = await this.userMongoModel
      .findOne({ email: new RegExp(`^${this.escapeRegex(normalizedEmail)}$`, 'i') })
      .exec();

    if (!doc) {
      doc = new this.userMongoModel({
        postgresId: await this.getNextUserId(),
        email: normalizedEmail,
        role,
        isActive: true,
        vendorPostgresId: null,
        vendorSnapshot: null,
        vendorRef: null,
      });
    } else {
      doc.email = normalizedEmail;
      doc.role = role;
      doc.isActive = true;
    }

    await doc.save();
    const hydrated = await this.ensureVendorSnapshot(doc.toObject());
    return this.mapMongoUser(hydrated);
  }

  async linkVendorUser(email: string, vendorDoc: any) {
    const normalizedEmail = this.normalizeEmail(email);
    if (!normalizedEmail) return;

    let user = await this.userMongoModel
      .findOne({ email: new RegExp(`^${this.escapeRegex(normalizedEmail)}$`, 'i') })
      .exec();

    if (!user) {
      user = new this.userMongoModel({
        postgresId: await this.getNextUserId(),
        email: normalizedEmail,
        role: UserRole.VENDOR,
        isActive: true,
      });
    }

    user.role = UserRole.VENDOR;
    user.isActive = true;
    user.vendorPostgresId = vendorDoc.postgresId;
    user.vendorSnapshot = this.serialize(vendorDoc);
    user.vendorRef = (vendorDoc as any)._id?.toString?.() || null;
    await user.save();
  }

  private async seedSystemUsers(): Promise<void> {
    const usersToSeed: Array<{ email: string; role: UserRole }> = [
      { email: 'vendormanager@test.com', role: UserRole.VENDOR_MANAGER },
      { email: 'hiringmanager@test.com', role: UserRole.HIRING_MANAGER },
      { email: 'badgedhiring@test.com', role: UserRole.VENDOR_MANAGER },
      { email: 'shanu.saha@test.com', role: UserRole.VENDOR_MANAGER_HEAD },
      { email: 'rishikesh.kumar@test.com', role: UserRole.VENDOR_MANAGER_HEAD },
    ];

    for (const seededUser of usersToSeed) {
      const normalizedEmail = this.normalizeEmail(seededUser.email);
      const existing = await this.userMongoModel
        .findOne({ email: new RegExp(`^${this.escapeRegex(normalizedEmail)}$`, 'i') })
        .exec();

      if (!existing) {
        await this.userMongoModel.create({
          postgresId: await this.getNextUserId(),
          email: normalizedEmail,
          role: seededUser.role,
          isActive: true,
          vendorPostgresId: null,
          vendorSnapshot: null,
          vendorRef: null,
        });
        continue;
      }

      existing.email = normalizedEmail;
      existing.role = seededUser.role;
      existing.isActive = true;
      await existing.save();
    }
  }

  private async ensureVendorSnapshot(doc: any) {
    if (!doc) return doc;
    if (doc.role !== UserRole.VENDOR) return doc;
    if (doc.vendorSnapshot && doc.vendorPostgresId) return doc;

    const email = this.normalizeEmail(doc.email);
    if (!email) return doc;

    const vendorDoc = await this.vendorMongoModel
      .findOne({ email: new RegExp(`^${this.escapeRegex(email)}$`, 'i') })
      .lean()
      .exec();

    if (!vendorDoc) {
      return doc;
    }

    await this.userMongoModel.updateOne(
      { _id: doc._id },
      {
        $set: {
          vendorPostgresId: vendorDoc.postgresId,
          vendorSnapshot: this.serialize(vendorDoc),
          vendorRef: (vendorDoc as any)._id?.toString?.() || null,
        },
      },
    );

    return {
      ...doc,
      vendorPostgresId: vendorDoc.postgresId,
      vendorSnapshot: this.serialize(vendorDoc),
      vendorRef: (vendorDoc as any)._id?.toString?.() || null,
    };
  }

  private mapMongoUser(doc: any): User {
    const user = new User();
    user.id = Number(doc.postgresId);
    user.email = doc.email;
    user.role = doc.role;
    user.isActive = doc.isActive;

    const vendorSnapshot = doc.vendorSnapshot || null;
    if (vendorSnapshot || doc.vendorPostgresId) {
      const vendor = new Vendor();
      vendor.id = vendorSnapshot?.postgresId || vendorSnapshot?.id || doc.vendorPostgresId;
      vendor.name = vendorSnapshot?.name || '';
      vendor.email = vendorSnapshot?.email || '';
      vendor.isActive = vendorSnapshot?.isActive ?? true;
      vendor.createdAt = vendorSnapshot?.createdAt
        ? new Date(vendorSnapshot.createdAt)
        : new Date();
      user.vendor = vendor;
    }

    return user;
  }

  private async getNextUserId() {
    const latest = await this.userMongoModel
      .findOne()
      .sort({ postgresId: -1 })
      .select({ postgresId: 1 })
      .lean()
      .exec();

    return Number(latest?.postgresId || 0) + 1;
  }

  private normalizeEmail(email?: string | null) {
    return (email || '').trim().toLowerCase();
  }

  private escapeRegex(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private serialize<T>(value: T): T {
    return JSON.parse(JSON.stringify(value));
  }
}

