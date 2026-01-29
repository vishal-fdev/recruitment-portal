// src/vendors/vendors.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vendor } from './vendors.entity';
import { User, UserRole } from '../users/user.entity';

@Injectable()
export class VendorsService {
  constructor(
    @InjectRepository(Vendor)
    private readonly vendorRepo: Repository<Vendor>,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async findAll() {
    return this.vendorRepo.find({
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * ✅ Create Vendor + Vendor Login (SINGLE SOURCE OF TRUTH)
   */
  async createVendor(body: any) {
    // 1️⃣ Vendor
    const vendor = this.vendorRepo.create({
      name: body.name,
      email: body.email,
      isActive: true,
    });

    const savedVendor = await this.vendorRepo.save(vendor);

    // 2️⃣ Vendor User
    const user = this.userRepo.create({
      email: body.email,
      role: UserRole.VENDOR,
      isActive: true,
      vendor: savedVendor,
    });

    await this.userRepo.save(user);

    return savedVendor;
  }

  async toggleStatus(id: string) {
    const vendor = await this.vendorRepo.findOne({
      where: { id },
    });

    if (!vendor) return null;

    vendor.isActive = !vendor.isActive;
    return this.vendorRepo.save(vendor);
  }
}
