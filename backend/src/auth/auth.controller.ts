// src/auth/auth.controller.ts

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

    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('User inactive');
    }

    /*
      ROLE IS NOW TAKEN DIRECTLY FROM DATABASE
      NO ROLE COMPARISON FROM UI
    */

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