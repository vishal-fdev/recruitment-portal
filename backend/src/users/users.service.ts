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

  /**
   * ✅ Runs once when application boots
   */
  async onModuleInit() {
    await this.seedSystemUsers();
  }

  // ======================
  // BASIC QUERIES
  // ======================
  async findAll(): Promise<User[]> {
    return this.userRepo.find();
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepo.findOne({
      where: { email },
    });
  }

  // ======================
  // 🔒 SYSTEM USER SEEDING
  // ======================
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
        email: 'hiringmanager@test.com',
        role: UserRole.HIRING_MANAGER,
      },
      {
        email: 'vmh@test.com',
        role: UserRole.VENDOR_MANAGER_HEAD,
      },
    ];

    for (const u of usersToSeed) {
      const exists = await this.userRepo.findOne({
        where: { email: u.email },
      });

      if (!exists) {
        const user = this.userRepo.create({
          email: u.email,
          role: u.role,
          isActive: true,
        });

        await this.userRepo.save(user);
        console.log(`✅ Seeded user: ${u.email}`);
      }
    }
  }
}
