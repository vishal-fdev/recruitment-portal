// src/users/users.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './user.entity';
import { Vendor } from '../vendors/vendors.entity';

@Injectable()
export class UsersService implements OnModuleInit {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    @InjectRepository(Vendor)
    private readonly vendorRepo: Repository<Vendor>,
  ) {}

  async onModuleInit() {
    await this.seedSystemUsers();
  }

  async findAll(): Promise<User[]> {
    return this.userRepo.find();
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.userRepo
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.vendor', 'vendor')
      .where('LOWER(user.email) = LOWER(:email)', { email })
      .getOne();

    if (!user) {
      return null;
    }

    if (user.role === UserRole.VENDOR && !user.vendor) {
      const vendor = await this.vendorRepo
        .createQueryBuilder('vendor')
        .where('LOWER(vendor.email) = LOWER(:email)', { email })
        .getOne();

      if (vendor) {
        user.vendor = vendor;
        await this.userRepo.save(user);
      }
    }

    return user;
  }

  async ensureActiveUser(
    email: string,
    role: UserRole,
  ): Promise<User> {
    const normalizedEmail = email.trim().toLowerCase();

    let user = await this.userRepo.findOne({
      where: { email: normalizedEmail },
    });

    if (!user) {
      user = this.userRepo.create({
        email: normalizedEmail,
        role,
        isActive: true,
      });

      return this.userRepo.save(user);
    }

    user.email = normalizedEmail;
    user.isActive = true;

    if (user.role === role) {
      return this.userRepo.save(user);
    }

    return this.userRepo.save(user);
  }

  /* ====================== */
  /* 🔒 SYSTEM USER SEEDING */
  /* ====================== */

  private async seedSystemUsers(): Promise<void> {
    const usersToSeed: {
      email: string;
      role: UserRole;
    }[] = [
      {
        email: 'vendormanager@test.com',
        role: UserRole.VENDOR_MANAGER,
      },
      {
        email: 'shanu.saha@test.com', // ✅ UPDATED
        role: UserRole.HIRING_MANAGER,
      },
      {
        email: 'rishikesh.kumar@test.com', // ✅ UPDATED
        role: UserRole.VENDOR_MANAGER_HEAD,
      },
    ];

    for (const u of usersToSeed) {
      const normalizedEmail = u.email.trim().toLowerCase();

      let user = await this.userRepo.findOne({
        where: { email: normalizedEmail },
      });

      if (!user) {
        user = this.userRepo.create({
          email: normalizedEmail,
          role: u.role,
          isActive: true,
        });

        await this.userRepo.save(user);
        console.log(`✅ Seeded user: ${normalizedEmail}`);
      } else {
  // 🔥 FIX: normalize existing users also
  user.email = normalizedEmail;
  user.role = u.role;
  await this.userRepo.save(user);
}
    }
  }
}
