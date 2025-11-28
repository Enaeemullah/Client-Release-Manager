import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Project } from '../projects/project.entity';
import { ProjectMember } from '../projects/project-member.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  passwordHash: string;

  @Column({ nullable: true, length: 120 })
  displayName: string | null;

  @Column({ type: 'longtext', nullable: true })
  avatarUrl: string | null;

  @Column({ nullable: true, length: 120 })
  jobTitle: string | null;

  @Column({ nullable: true, length: 120 })
  location: string | null;

  @Column({ type: 'text', nullable: true })
  bio: string | null;

  @Column({ nullable: true, length: 40 })
  phoneNumber: string | null;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  @OneToMany(() => Project, (project) => project.owner)
  ownedProjects: Project[];

  @OneToMany(() => ProjectMember, (member) => member.user)
  projectMemberships: ProjectMember[];
}
