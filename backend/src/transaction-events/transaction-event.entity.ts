import { Column, CreateDateColumn, Entity, Index, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Project } from '../projects/project.entity';

@Entity('transaction_events')
@Index(['codeKey'], { unique: true })
export class TransactionEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'code' })
  petEventCode: string;

  @Column()
  codeKey: string;

  @Column({ type: 'text', name: 'description' })
  petEventDesc: string;

  @ManyToOne(() => Project, (project) => project.transactionEvents, {
    onDelete: 'CASCADE',
  })
  project: Project;

  @Column()
  projectId: string;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
