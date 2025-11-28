import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Release } from '../releases/release.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  passwordHash: string;

  @OneToMany(() => Release, (release) => release.user)
  releases: Release[];
}
