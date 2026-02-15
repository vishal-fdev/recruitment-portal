// src/vendors/vendors.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  OneToMany,
  CreateDateColumn,
} from 'typeorm';

import { User } from '../users/user.entity';
import { VendorProfile } from './vendor-profile.entity';
import { VendorEscalation } from './vendor-escalation.entity';
import { VendorEngagement } from './vendor-engagement.entity';
import { VendorSOW } from './vendor-sow.entity';

@Entity()
export class Vendor {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  /* ================= USER LINK ================= */

  @OneToOne(() => User, (user) => user.vendor)
  user: User;

  /* ================= PROFILE ================= */

  @OneToOne(() => VendorProfile, (profile) => profile.vendor, {
    cascade: true,
    eager: true,
  })
  profile: VendorProfile;

  /* ================= ESCALATIONS ================= */

  @OneToMany(() => VendorEscalation, (e) => e.vendor, {
    cascade: true,
    eager: true,
  })
  escalations: VendorEscalation[];

  /* ================= ENGAGEMENTS ================= */

  @OneToMany(() => VendorEngagement, (e) => e.vendor, {
    cascade: true,
    eager: true,
  })
  engagements: VendorEngagement[];

  /* ================= SOW ================= */

  @OneToMany(() => VendorSOW, (s) => s.vendor, {
    cascade: true,
    eager: true,
  })
  sows: VendorSOW[];
}
