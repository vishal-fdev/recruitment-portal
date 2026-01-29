import { Module } from '@nestjs/common'; 
import { JwtModule } from '@nestjs/jwt'; 
import { PassportModule } from '@nestjs/passport'; 
import { AuthController } from './auth.controller'; 
import { JwtStrategy } from './jwt.strategy'; 
import { UsersModule } from '../users/users.module'; 


@Module({ 
  imports: [ 
    PassportModule, 
    UsersModule, 
    JwtModule.register({ secret: 'DEV_JWT_SECRET_123456', 
      signOptions: { expiresIn: '1d' }, 
    }), 
  ], 
  controllers: [AuthController], 
  providers: [JwtStrategy], 
}) 
export class AuthModule {}