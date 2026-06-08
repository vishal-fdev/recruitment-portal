import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { randomUUID } from 'crypto';
import {
  VendorDocument,
  VendorDocumentModel,
} from '../mongodb/schemas/vendor.schema';
import { UserRole } from '../users/user.entity';
import { UsersService } from '../users/users.service';
import { Vendor } from './vendors.entity';

@Injectable()
export class VendorsService {
  constructor(
    @InjectModel(VendorDocumentModel.name)
    private readonly vendorMongoModel: Model<VendorDocument>,
    private readonly usersService: UsersService,
  ) {}

  async getAll() {
    const docs = await this.vendorMongoModel
      .find()
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    return docs.map((doc) => this.mapMongoVendor(doc));
  }

  async getVendorById(id: string) {
    const doc = await this.vendorMongoModel
      .findOne({ postgresId: id })
      .lean()
      .exec();

    if (!doc) {
      throw new NotFoundException('Vendor not found');
    }

    return this.mapMongoVendor(doc);
  }

  async createVendor(body: any) {
    const normalizedEmail = this.normalizeEmail(body.email);
    if (!normalizedEmail) {
      throw new BadRequestException('Email is required');
    }

    const existingVendor = await this.vendorMongoModel
      .findOne({ email: new RegExp(`^${this.escapeRegex(normalizedEmail)}$`, 'i') })
      .lean()
      .exec();

    if (existingVendor) {
      throw new BadRequestException('Vendor with this email already exists');
    }

    const existingUser = await this.usersService.findByEmail(normalizedEmail);
    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }

    const vendorDoc = await this.vendorMongoModel.create({
      postgresId: randomUUID(),
      name: body.name,
      email: normalizedEmail,
      isActive: true,
      profile:
        body.contactPerson || body.phone || body.country || body.state || body.city || body.address || body.taxId || body.vendorType
          ? {
              id: 1,
              contactPerson: body.contactPerson || '',
              phone: body.phone || '',
              country: body.country || '',
              state: body.state || '',
              city: body.city || '',
              address: body.address || '',
              taxId: body.taxId || '',
              vendorType: body.vendorType || '',
            }
          : null,
      escalations: [],
      engagements: [],
      sows: [],
    });

    await this.usersService.linkVendorUser(normalizedEmail, vendorDoc.toObject());
    return this.mapMongoVendor(vendorDoc.toObject());
  }

  async toggleStatus(id: string) {
    const vendorDoc = await this.vendorMongoModel.findOne({ postgresId: id }).exec();
    if (!vendorDoc) {
      throw new NotFoundException('Vendor not found');
    }

    vendorDoc.isActive = !vendorDoc.isActive;
    await vendorDoc.save();
    await this.usersService.linkVendorUser(vendorDoc.email, vendorDoc.toObject());

    return {
      success: true,
      isActive: vendorDoc.isActive,
    };
  }

  async getEscalations(vendorId: string) {
    const vendorDoc = await this.findVendorDoc(vendorId);
    return this.sortDescById(vendorDoc.escalations || []);
  }

  async createEscalation(vendorId: string, body: any, role: UserRole) {
    const vendorDoc = await this.findVendorDoc(vendorId);
    const escalations = Array.isArray(vendorDoc.escalations) ? [...vendorDoc.escalations] : [];

    const escalation = {
      id: this.getNextNumericId(escalations),
      ...body,
      approvalStatus: role === UserRole.VENDOR ? 'Pending' : 'Approved',
      vendor: { id: vendorDoc.postgresId },
    };

    escalations.unshift(escalation);
    vendorDoc.escalations = escalations;
    await vendorDoc.save();
    return escalation;
  }

  async updateEscalation(id: string, body: any) {
    const { vendorDoc, item } = await this.findNestedRecord('escalations', Number(id), 'Escalation');
    Object.assign(item, body);
    await vendorDoc.save();
    return item;
  }

  async approveEscalation(id: string) {
    const { vendorDoc, item } = await this.findNestedRecord('escalations', Number(id), 'Escalation');
    item.approvalStatus = 'Approved';
    await vendorDoc.save();
    return item;
  }

  async getEngagements(vendorId: string) {
    const vendorDoc = await this.findVendorDoc(vendorId);
    return this.sortDescById(vendorDoc.engagements || []);
  }

  async createEngagement(vendorId: string, body: any) {
    const vendorDoc = await this.findVendorDoc(vendorId);
    const engagements = Array.isArray(vendorDoc.engagements) ? [...vendorDoc.engagements] : [];

    const engagement = {
      id: this.getNextNumericId(engagements),
      ...body,
      vendor: { id: vendorDoc.postgresId },
    };

    engagements.unshift(engagement);
    vendorDoc.engagements = engagements;
    await vendorDoc.save();
    return engagement;
  }

  async updateEngagement(id: number, body: any) {
    const { vendorDoc, item } = await this.findNestedRecord('engagements', Number(id), 'Engagement');
    Object.assign(item, body);
    await vendorDoc.save();
    return item;
  }

  async getSOWs(vendorId: string) {
    const vendorDoc = await this.findVendorDoc(vendorId);
    return this.sortDescById(vendorDoc.sows || []);
  }

  async createSOW(vendorId: string, body: any) {
    const vendorDoc = await this.findVendorDoc(vendorId);
    const sows = Array.isArray(vendorDoc.sows) ? [...vendorDoc.sows] : [];

    const sow = {
      id: this.getNextNumericId(sows),
      ...body,
      vendor: { id: vendorDoc.postgresId },
    };

    sows.unshift(sow);
    vendorDoc.sows = sows;
    await vendorDoc.save();
    return sow;
  }

  async updateSOW(id: number, body: any) {
    const { vendorDoc, item } = await this.findNestedRecord('sows', Number(id), 'SOW');
    Object.assign(item, body);
    await vendorDoc.save();
    return item;
  }

  private async findVendorDoc(vendorId: string) {
    const vendorDoc = await this.vendorMongoModel.findOne({ postgresId: vendorId }).exec();
    if (!vendorDoc) {
      throw new NotFoundException('Vendor not found');
    }
    return vendorDoc;
  }

  private async findNestedRecord(
    key: 'escalations' | 'engagements' | 'sows',
    id: number,
    label: string,
  ) {
    const vendorDoc = await this.vendorMongoModel
      .findOne({ [`${key}.id`]: id })
      .exec();

    if (!vendorDoc) {
      throw new NotFoundException(`${label} not found`);
    }

    const collection = Array.isArray(vendorDoc[key]) ? vendorDoc[key] : [];
    const item = collection.find((entry: any) => Number(entry?.id) === Number(id));

    if (!item) {
      throw new NotFoundException(`${label} not found`);
    }

    return { vendorDoc, item };
  }

  private getNextNumericId(items: any[]) {
    return items.reduce((max, item) => Math.max(max, Number(item?.id || 0)), 0) + 1;
  }

  private sortDescById(items: any[]) {
    return [...items].sort((a, b) => Number(b?.id || 0) - Number(a?.id || 0));
  }

  private mapMongoVendor(doc: any): Vendor {
    const vendor = new Vendor();
    vendor.id = doc.postgresId;
    vendor.name = doc.name;
    vendor.email = doc.email;
    vendor.isActive = doc.isActive;
    vendor.createdAt = doc.createdAt ? new Date(doc.createdAt) : new Date();
    vendor.profile = (doc.profile as any) || null;
    vendor.escalations = (doc.escalations as any) || [];
    vendor.engagements = (doc.engagements as any) || [];
    vendor.sows = (doc.sows as any) || [];
    return vendor;
  }

  private normalizeEmail(email?: string | null) {
    return (email || '').trim().toLowerCase();
  }

  private escapeRegex(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
