// src/vendors/vendors.service.ts

import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Vendor } from './vendors.entity';
import { VendorProfile } from './vendor-profile.entity';
import { User, UserRole } from '../users/user.entity';

@Injectable()
export class VendorsService {
  constructor(
    @InjectRepository(Vendor)
    private readonly vendorRepo: Repository<Vendor>,

    @InjectRepository(VendorProfile)
    private readonly profileRepo: Repository<VendorProfile>,

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

    // 🔍 Check if user already exists
    const existingUser = await this.userRepo.findOne({
      where: { email: body.email },
    });

    if (existingUser) {
      throw new BadRequestException(
        'User with this email already exists',
      );
    }

    // 1️⃣ Create Vendor
    const vendor = this.vendorRepo.create({
      name: body.name,
      email: body.email,
      isActive: true,
    });

    const savedVendor = await this.vendorRepo.save(vendor);

    // 2️⃣ Create Vendor Profile (optional)
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

    // 3️⃣ Create User for login
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
    const vendor = await this.vendorRepo.findOne({
      where: { id },
    });

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
}
