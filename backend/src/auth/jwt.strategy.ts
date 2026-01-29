import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: 'DEV_JWT_SECRET_123456',
    });
  }

  async validate(payload: any) {
    // ✅ SINGLE SOURCE OF TRUTH FOR req.user
    return {
      id: payload.id,
      email: payload.email,
      role: payload.role,
      vendorId: payload.vendorId,
    };
  }
}
