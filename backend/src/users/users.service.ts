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
  return this.userRepo
    .createQueryBuilder('user')
    .where('LOWER(user.email) = LOWER(:email)', { email })
    .getOne();
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
        email: 'vmemailtestt@gmail.com',
        role: UserRole.VENDOR_MANAGER,
      },
      {
        email: 'shanu.saha@test.com', // ✅ UPDATED
        role: UserRole.HIRING_MANAGER,
      },
      {
        email: 'thevishalrajj@gmail.com',
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
