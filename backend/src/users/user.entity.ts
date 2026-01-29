// src/users/user.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Vendor } from '../vendors/vendors.entity';

export enum UserRole {
  VENDOR = 'VENDOR',
  VENDOR_MANAGER = 'VENDOR_MANAGER',
  HIRING_MANAGER = 'HIRING_MANAGER',
}

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  /**
   * ✅ SQLITE-SAFE ENUM
   * Stored as TEXT, enforced by TS + logic
   */
  @Column({ type: 'text' })
  role: UserRole;

  @Column({ default: true })
  isActive: boolean;

  /**
   * ✅ Vendor linkage (only for vendor users)
   */
  @OneToOne(() => Vendor, (vendor) => vendor.user, {
    nullable: true,
    eager: true,
  })
  @JoinColumn()
  vendor?: Vendor;
}
