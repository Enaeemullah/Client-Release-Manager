import {
  Column,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../users/user.entity';

@Entity('releases')
@Index(['userId', 'client', 'environment'], { unique: true })
export class Release {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  client: string;

  @Column()
  environment: string;

  @Column()
  branch: string;

  @Column()
  version: string;

  @Column({ type: 'int' })
  build: number;

  @Column({ type: 'date' })
  date: string;

  @ManyToOne(() => User, (user) => user.releases, {
    onDelete: 'CASCADE',
  })
  user: User;

  @Column()
  userId: string;
}
