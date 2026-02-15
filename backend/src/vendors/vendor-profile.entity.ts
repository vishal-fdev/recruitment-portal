import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Vendor } from './vendors.entity';

@Entity()
export class VendorProfile {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  contactPerson: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  country: string;

  @Column({ nullable: true })
  state: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  taxId: string;

  @Column({ nullable: true })
  vendorType: string;

  @OneToOne(() => Vendor, (vendor) => vendor.profile)
  @JoinColumn()
  vendor: Vendor;
}
