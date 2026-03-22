import {
  Controller,
  Post,
  Body,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  @Post('login')
  async login(@Body('email') email: string) {
    if (!email) {
      throw new UnauthorizedException('Email is required');
    }

    // ✅ NORMALIZE EMAIL (VERY IMPORTANT)
    const normalizedEmail = email.trim().toLowerCase();

    const user = await this.usersService.findByEmail(normalizedEmail);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('User inactive');
    }

    const payload = {
      userId: user.id, // ✅ consistent
      email: user.email,
      role: user.role,
      vendorId: user.vendor?.id ?? null,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: payload,
    };
  }
}