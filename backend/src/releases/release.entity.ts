import {
  Column,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Project } from '../projects/project.entity';

@Entity('releases')
@Index(['projectId', 'environment'], { unique: true })
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

  @Column({ type: 'text', nullable: true })
  commitMessage: string | null;

  @ManyToOne(() => Project, (project) => project.releases, {
    onDelete: 'CASCADE',
  })
  project: Project;

  @Column()
  projectId: string;
}
