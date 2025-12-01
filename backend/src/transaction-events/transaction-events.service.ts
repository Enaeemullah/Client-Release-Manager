import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { TransactionEvent } from './transaction-event.entity';
import { ProjectsService } from '../projects/projects.service';
import { CreateTransactionEventDto } from './dto/create-transaction-event.dto';
import { normalizeKey } from '../shared/normalize-key';
import { TransactionEventPayload, TransactionEventsResponse } from './transaction-events.types';
import { UpdateTransactionEventDto } from './dto/update-transaction-event.dto';

@Injectable()
export class TransactionEventsService {
  constructor(
    @InjectRepository(TransactionEvent)
    private readonly transactionEventsRepository: Repository<TransactionEvent>,
    private readonly projectsService: ProjectsService,
  ) {}

  async getEventsForUser(userId: string): Promise<TransactionEventsResponse> {
    const projectIds = await this.projectsService.getAccessibleProjectIds(userId);

    if (projectIds.length === 0) {
      return {};
    }

    const events = await this.transactionEventsRepository.find({
      where: { projectId: In(projectIds) },
      relations: { project: true },
      order: { petEventCode: 'ASC' },
    });

    return events.reduce<TransactionEventsResponse>((acc, event) => {
      if (!event.project) {
        return acc;
      }

      const client = event.project.slug;
      if (!acc[client]) {
        acc[client] = [];
      }

      acc[client].push(this.mapToPayload(event));
      return acc;
    }, {});
  }

  async createTransactionEvent(userId: string, dto: CreateTransactionEventDto): Promise<TransactionEventsResponse> {
    const normalizedClient = normalizeKey(dto.client);
    const normalizedCode = normalizeKey(dto.petEventCode);

    const existing = await this.transactionEventsRepository.findOne({
      where: { codeKey: normalizedCode },
    });

    if (existing) {
      throw new ConflictException('Transaction event already exists');
    }

    const project = await this.projectsService.findAccessibleProjectBySlug(userId, normalizedClient);

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const event = this.transactionEventsRepository.create({
      projectId: project.id,
      petEventCode: dto.petEventCode.trim(),
      codeKey: normalizedCode,
      petEventDesc: dto.petEventDesc.trim(),
    });

    await this.transactionEventsRepository.save(event);

    await this.projectsService.recordActivity(project.id, userId, 'transaction_event_created', {
      transactionId: event.id,
      petEventCode: event.petEventCode,
    });

    return this.getEventsForUser(userId);
  }

  async updateTransactionEvent(
    userId: string,
    eventId: string,
    dto: UpdateTransactionEventDto,
  ): Promise<TransactionEventsResponse> {
    const event = await this.transactionEventsRepository.findOne({
      where: { id: eventId },
      relations: { project: true },
    });

    if (!event || !event.project) {
      throw new NotFoundException('Transaction event not found');
    }

    const canEdit = await this.projectsService.isUserInProject(event.projectId, userId);
    if (!canEdit) {
      throw new ForbiddenException('You do not have access to this transaction event');
    }

    const normalizedCode = normalizeKey(dto.petEventCode);
    if (normalizedCode !== event.codeKey) {
      const conflict = await this.transactionEventsRepository.findOne({
        where: { codeKey: normalizedCode },
      });

      if (conflict && conflict.id !== event.id) {
        throw new ConflictException('Transaction event already exists');
      }

      event.codeKey = normalizedCode;
    }

    const normalizedClient = normalizeKey(dto.client);
    if (normalizedClient !== event.project.slug) {
      const targetProject = await this.projectsService.findAccessibleProjectBySlug(userId, normalizedClient);

      if (!targetProject) {
        throw new NotFoundException('Project not found');
      }

      event.projectId = targetProject.id;
      event.project = targetProject;
    }

    event.petEventCode = dto.petEventCode.trim();
    event.petEventDesc = dto.petEventDesc.trim();

    await this.transactionEventsRepository.save(event);

    await this.projectsService.recordActivity(event.projectId, userId, 'transaction_event_updated', {
      transactionId: event.id,
      petEventCode: event.petEventCode,
    });

    return this.getEventsForUser(userId);
  }

  private mapToPayload(event: TransactionEvent): TransactionEventPayload {
    return {
      id: event.id,
      client: event.project.slug,
      projectId: event.projectId,
      projectName: event.project.name,
      petEventCode: event.petEventCode,
      petEventDesc: event.petEventDesc,
      createdAt: event.createdAt.toISOString(),
      updatedAt: event.updatedAt.toISOString(),
    };
  }
}
