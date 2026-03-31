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

  async onModuleInit() {
    await this.seedSystemUsers();
  }

  async findAll(): Promise<User[]> {
    return this.userRepo.find();
  }

  async findByEmail(email: string): Promise<User | null> {
    const normalizedEmail = email.trim().toLowerCase();

    return this.userRepo.findOne({
      where: { email: normalizedEmail },
    });
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
        // ✅ ensure role is correct if already exists
        user.role = u.role;
        await this.userRepo.save(user);
      }
    }
  }
}