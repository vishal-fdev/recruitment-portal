import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Vendor } from './vendors.entity';
import { VendorProfile } from './vendor-profile.entity';
import { VendorEscalation } from './vendor-escalation.entity';
import { VendorEngagement } from './vendor-engagement.entity';
import { VendorSOW } from './vendor-sow.entity';
import { User, UserRole } from '../users/user.entity';

@Injectable()
export class VendorsService {

  constructor(
    @InjectRepository(Vendor)
    private readonly vendorRepo: Repository<Vendor>,

    @InjectRepository(VendorProfile)
    private readonly profileRepo: Repository<VendorProfile>,

    @InjectRepository(VendorEscalation)
    private readonly escalationRepo: Repository<VendorEscalation>,

    @InjectRepository(VendorEngagement)
    private readonly engagementRepo: Repository<VendorEngagement>,

    @InjectRepository(VendorSOW)
    private readonly sowRepo: Repository<VendorSOW>,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  /* ================= GET ALL ================= */

  async getAll() {
    return this.vendorRepo.find({
      order: { createdAt: 'DESC' },
    });
  }

  /* ================= GET BY ID ================= */

  async getVendorById(id: string) {

    const vendor = await this.vendorRepo.findOne({
      where: { id },
      relations: [
        'escalations',
        'engagements',
        'sows',
      ],
    });

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    return vendor;
  }

  /* ================= CREATE ================= */

  async createVendor(body: any) {

    if (!body.email) {
      throw new BadRequestException('Email is required');
    }

    const existingUser = await this.userRepo.findOne({
      where: { email: body.email },
    });

    if (existingUser) {
      throw new BadRequestException(
        'User with this email already exists',
      );
    }

    const vendor = this.vendorRepo.create({
      name: body.name,
      email: body.email,
      isActive: true,
    });

    const savedVendor = await this.vendorRepo.save(vendor);

    /* Create Vendor Profile */

    if (body.contactPerson || body.phone) {

      const profile = this.profileRepo.create({
        contactPerson: body.contactPerson,
        phone: body.phone,
        country: body.country,
        state: body.state,
        city: body.city,
        address: body.address,
        taxId: body.taxId,
        vendorType: body.vendorType,
        vendor: savedVendor,
      });

      await this.profileRepo.save(profile);
    }

    /* Create Vendor Login User */

    const user = this.userRepo.create({
      email: body.email,
      role: UserRole.VENDOR,
      isActive: true,
      vendor: savedVendor,
    });

    await this.userRepo.save(user);

    return savedVendor;
  }

  /* ================= TOGGLE ================= */

  async toggleStatus(id: string) {

    const vendor = await this.vendorRepo.findOneBy({ id });

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    vendor.isActive = !vendor.isActive;

    await this.vendorRepo.save(vendor);

    return {
      success: true,
      isActive: vendor.isActive,
    };
  }

  /* ================= ESCALATIONS ================= */

  async getEscalations(vendorId: string) {

    return this.escalationRepo.find({
      where: { vendor: { id: vendorId } },
      order: { id: 'DESC' },
    });

  }

  async createEscalation(
    vendorId: string,
    body: any,
    role: UserRole,
  ) {

    const vendor = await this.vendorRepo.findOneBy({ id: vendorId });

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    const approvalStatus =
      role === UserRole.VENDOR ? 'Pending' : 'Approved';

    const escalation = this.escalationRepo.create({
      ...body,
      approvalStatus,
      vendor,
    });

    return this.escalationRepo.save(escalation);
  }

  async updateEscalation(id: string, body: any) {

    const escalation = await this.escalationRepo.findOneBy({ id });

    if (!escalation) {
      throw new NotFoundException('Escalation not found');
    }

    Object.assign(escalation, body);

    return this.escalationRepo.save(escalation);
  }

  async approveEscalation(id: string) {

    const escalation = await this.escalationRepo.findOneBy({ id });

    if (!escalation) {
      throw new NotFoundException('Escalation not found');
    }

    escalation.approvalStatus = 'Approved';

    return this.escalationRepo.save(escalation);
  }

  /* ================= ENGAGEMENT ================= */

  async getEngagements(vendorId: string) {

    return this.engagementRepo.find({
      where: { vendor: { id: vendorId } },
      order: { id: 'DESC' },
    });

  }

  async createEngagement(vendorId: string, body: any) {

    const vendor = await this.vendorRepo.findOneBy({ id: vendorId });

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    const engagement = this.engagementRepo.create({
      ...body,
      vendor,
    });

    return this.engagementRepo.save(engagement);
  }

  async updateEngagement(id: number, body: any) {

    const engagement = await this.engagementRepo.findOneBy({ id });

    if (!engagement) {
      throw new NotFoundException('Engagement not found');
    }

    Object.assign(engagement, body);

    return this.engagementRepo.save(engagement);
  }

  /* ================= SOW ================= */

  async getSOWs(vendorId: string) {

    return this.sowRepo.find({
      where: { vendor: { id: vendorId } },
      order: { id: 'DESC' },
    });

  }

  async createSOW(vendorId: string, body: any) {

    const vendor = await this.vendorRepo.findOneBy({ id: vendorId });

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    const sow = this.sowRepo.create({
      ...body,
      vendor,
    });

    return this.sowRepo.save(sow);
  }

  async updateSOW(id: number, body: any) {

    const sow = await this.sowRepo.findOneBy({ id });

    if (!sow) {
      throw new NotFoundException('SOW not found');
    }

    Object.assign(sow, body);

    return this.sowRepo.save(sow);
  }

}