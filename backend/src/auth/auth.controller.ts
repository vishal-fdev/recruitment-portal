// src/auth/auth.controller.ts
import {
  Controller,
  Post,
  Body,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { UserRole } from '../users/user.entity';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  @Post('login')
  async login(
    @Body('email') email: string,
    @Body('role') roleFromUI: UserRole,
  ) {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('User inactive');
    }

    // 🔒 HARD RBAC CHECK
    if (user.role !== roleFromUI) {
      throw new UnauthorizedException('Invalid role');
    }

    // ✅ JWT HAS vendorId (CRITICAL)
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      vendorId: user.vendor?.id ?? null,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        vendorId: user.vendor?.id ?? null,
      },
    };
  }
}
