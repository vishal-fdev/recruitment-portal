// src/users/users.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './user.entity';

@Injectable()
export class UsersService implements OnModuleInit {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  // ✅ ONLY seed non-vendor system users
  async onModuleInit() {
    await this.seedSystemUsers();
  }

  async findAll(): Promise<User[]> {
    return this.userRepo.find();
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepo.findOne({
      where: { email },
    });
  }

  // ======================
  // 🔒 SYSTEM USERS ONLY
  // ======================
  private async seedSystemUsers(): Promise<void> {
    const usersToSeed = [
      {
        email: 'vendormanager@test.com',
        role: UserRole.VENDOR_MANAGER,
      },
      {
        email: 'hiringmanager@test.com',
        role: UserRole.HIRING_MANAGER,
      },
    ];

    for (const u of usersToSeed) {
      const exists = await this.userRepo.findOne({
        where: { email: u.email },
      });

      if (!exists) {
        await this.userRepo.save({
          email: u.email,
          role: u.role,
          isActive: true,
        });
      }
    }

    console.log('✅ System users seeded');
  }
}
