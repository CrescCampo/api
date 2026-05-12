import { Injectable } from '@nestjs/common';
import CultureRepository from 'domain/application/repositories/CultureRepository';
import FarmerRepository from 'domain/application/repositories/FarmerRepository';
import HarvestRepository from 'domain/application/repositories/HarvestRepository';
import OutboxEventRepository from 'domain/application/repositories/OutboxEventRepository';
import TransactionCategoryRepository from 'domain/application/repositories/TransactionCategoryRepository';
import TransactionRepository from 'domain/application/repositories/TransactionRepository';
import UnitOfWork from 'domain/application/unit-of-work/UnitOfWork';
import Culture from 'domain/enterprise/entities/Culture';
import Harvest from 'domain/enterprise/entities/Harvest';
import Transaction from 'domain/enterprise/entities/Transaction';
import TransactionCategory from 'domain/enterprise/entities/TransactionCategory';
import TransactionType from 'domain/enterprise/enums/TransactionType';

export enum OutboxEventType {
  CREATE = 'create',
}

export enum OutboxEventEntity {
  CULTURE = 'cultures',
  HARVEST = 'harvest',
  TRANSACTION = 'transaction',
  TRANSACTION_CATEGORY = 'transaction_category',
}

export interface OutboxEvent {
  id: string;
  event: OutboxEventType;
  entity: OutboxEventEntity;
  payload: string;
  createdAt: number;
}

export interface Input {
  outbox: OutboxEvent[];
}

export interface TransactionDTO {
  id: string;
  harvestId: string;
  type: TransactionType;
  description: string;
  amount: number;
  categoryId: string;
  date: number;
}

export interface CultureDTO {
  id: string;
  name: string;
}

export interface TransactionCategoryDTO {
  id: string;
  name: string;
}

export interface HarvestDTO {
  id: string;
  name: string;
  cultureId: string;
  startDate: number;
  endDate?: number;
  revenue: number;
  expenses: number;
}

type ParsedOutboxEventBase = Omit<OutboxEvent, 'payload'>;

export type ParsedOutboxEvent =
  | (ParsedOutboxEventBase & {
      entity: OutboxEventEntity.CULTURE;
      payload: CultureDTO;
    })
  | (ParsedOutboxEventBase & {
      entity: OutboxEventEntity.HARVEST;
      payload: HarvestDTO;
    })
  | (ParsedOutboxEventBase & {
      entity: OutboxEventEntity.TRANSACTION;
      payload: TransactionDTO;
    })
  | (ParsedOutboxEventBase & {
      entity: OutboxEventEntity.TRANSACTION_CATEGORY;
      payload: TransactionCategoryDTO;
    });

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isString = (value: unknown): value is string => typeof value === 'string';

const isNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const isTransactionType = (value: unknown): value is TransactionType =>
  value === TransactionType.REVENUE || value === TransactionType.EXPENSE;

const isCultureDTO = (value: unknown): value is CultureDTO =>
  isRecord(value) && isString(value.id) && isString(value.name);

const isTransactionCategoryDTO = (
  value: unknown,
): value is TransactionCategoryDTO =>
  isRecord(value) && isString(value.id) && isString(value.name);

const isHarvestDTO = (value: unknown): value is HarvestDTO =>
  isRecord(value) &&
  isString(value.id) &&
  isString(value.name) &&
  isString(value.cultureId) &&
  isNumber(value.startDate) &&
  (value.endDate === undefined || isNumber(value.endDate)) &&
  isNumber(value.revenue) &&
  isNumber(value.expenses);

const isTransactionDTO = (value: unknown): value is TransactionDTO =>
  isRecord(value) &&
  isString(value.id) &&
  isString(value.harvestId) &&
  isTransactionType(value.type) &&
  isString(value.description) &&
  isNumber(value.amount) &&
  isString(value.categoryId) &&
  isNumber(value.date);

const toDate = (value: number): Date => new Date(value);

const toOptionalDate = (value?: number): Date | null =>
  value === undefined ? null : new Date(value);

@Injectable()
export default class AppPushUseCase {
  constructor(
    private readonly farmerRepository: FarmerRepository,
    private readonly cultureRepository: CultureRepository,
    private readonly harvestRepository: HarvestRepository,
    private readonly transactionCategoryRepository: TransactionCategoryRepository,
    private readonly transactionRepository: TransactionRepository,
    private readonly outboxEventRepository: OutboxEventRepository,
    private readonly unitOfWork: UnitOfWork,
  ) {}

  async execute(userId: string, input: Input): Promise<ParsedOutboxEvent[]> {
    const farmer = await this.farmerRepository.findById(userId);

    if (!farmer) {
      throw new Error(`Farmer ${userId} not found`);
    }

    const { farmId } = farmer;
    const processedIds = new Set<string>();

    const parsedEvents = input.outbox.reduce<ParsedOutboxEvent[]>(
      (acc, event) => {
        if (processedIds.has(event.id)) {
          return acc;
        }

        processedIds.add(event.id);

        if (event.event !== OutboxEventType.CREATE) {
          throw new Error(`Unsupported outbox event type ${event.event}`);
        }

        let payload: unknown;

        try {
          payload = JSON.parse(event.payload);
        } catch (error) {
          throw new Error(
            `Invalid JSON payload for outbox event ${event.id}, ${error}`,
          );
        }

        if (event.entity === OutboxEventEntity.CULTURE) {
          if (!isCultureDTO(payload)) {
            throw new Error(
              `Invalid culture payload for outbox event ${event.id}`,
            );
          }

          acc.push({
            ...event,
            entity: OutboxEventEntity.CULTURE,
            payload,
          });
          return acc;
        }

        if (event.entity === OutboxEventEntity.HARVEST) {
          if (!isHarvestDTO(payload)) {
            throw new Error(
              `Invalid harvest payload for outbox event ${event.id}`,
            );
          }

          acc.push({
            ...event,
            entity: OutboxEventEntity.HARVEST,
            payload,
          });
          return acc;
        }

        if (event.entity === OutboxEventEntity.TRANSACTION) {
          if (!isTransactionDTO(payload)) {
            throw new Error(
              `Invalid transaction payload for outbox event ${event.id}`,
            );
          }

          acc.push({
            ...event,
            entity: OutboxEventEntity.TRANSACTION,
            payload,
          });
          return acc;
        }

        if (event.entity === OutboxEventEntity.TRANSACTION_CATEGORY) {
          if (!isTransactionCategoryDTO(payload)) {
            throw new Error(
              `Invalid transaction category payload for outbox event ${event.id}`,
            );
          }

          acc.push({
            ...event,
            entity: OutboxEventEntity.TRANSACTION_CATEGORY,
            payload,
          });
          return acc;
        }

        throw new Error(`Unsupported outbox entity ${event.entity}`);
      },
      [],
    );

    await parsedEvents.reduce<Promise<void>>(async (previous, event) => {
      await previous;

      await this.unitOfWork.run(async () => {
        const alreadyProcessed = await this.outboxEventRepository.exists(
          event.id,
        );

        if (alreadyProcessed) {
          return;
        }

        if (event.entity === OutboxEventEntity.CULTURE) {
          const culture = Culture.create(
            {
              name: event.payload.name,
              farmId,
            },
            event.payload.id,
          );

          await this.cultureRepository.save(culture);
          await this.outboxEventRepository.save({
            id: event.id,
            event: event.event,
            entity: event.entity,
            createdAt: event.createdAt,
          });
          return;
        }

        if (event.entity === OutboxEventEntity.HARVEST) {
          const culture = await this.cultureRepository.findById(
            event.payload.cultureId,
          );

          if (!culture) {
            throw new Error(
              `Culture ${event.payload.cultureId} not found for harvest ${event.id}`,
            );
          }

          const harvest = Harvest.create(
            {
              name: event.payload.name,
              culture,
              farmId: culture.farmId,
              startDate: toDate(event.payload.startDate),
              endDate: toOptionalDate(event.payload.endDate),
              revenue: event.payload.revenue,
              expenses: event.payload.expenses,
              createdAt: toDate(event.createdAt),
            },
            event.payload.id,
          );

          await this.harvestRepository.save(harvest);
          await this.outboxEventRepository.save({
            id: event.id,
            event: event.event,
            entity: event.entity,
            createdAt: event.createdAt,
          });
          return;
        }

        if (event.entity === OutboxEventEntity.TRANSACTION_CATEGORY) {
          const category = TransactionCategory.create(
            {
              name: event.payload.name,
              farmId,
              createdAt: toDate(event.createdAt),
            },
            event.payload.id,
          );

          await this.transactionCategoryRepository.save(category);
          await this.outboxEventRepository.save({
            id: event.id,
            event: event.event,
            entity: event.entity,
            createdAt: event.createdAt,
          });
          return;
        }

        if (event.entity === OutboxEventEntity.TRANSACTION) {
          const harvest = await this.harvestRepository.findById(
            event.payload.harvestId,
          );

          if (!harvest) {
            throw new Error(
              `Harvest ${event.payload.harvestId} not found for transaction ${event.id}`,
            );
          }

          const category = await this.transactionCategoryRepository.findById(
            event.payload.categoryId,
          );

          if (!category) {
            throw new Error(
              `Transaction category ${event.payload.categoryId} not found for transaction ${event.id}`,
            );
          }

          const transaction = Transaction.create(
            {
              harvestId: event.payload.harvestId,
              type: event.payload.type,
              description: event.payload.description,
              amount: event.payload.amount,
              category,
              date: toDate(event.payload.date),
              createdAt: toDate(event.createdAt),
            },
            event.payload.id,
          );

          harvest.applyTransaction(
            event.payload.type,
            event.payload.amount,
            toDate(event.createdAt),
          );
          await this.transactionRepository.save(transaction);
          await this.harvestRepository.save(harvest);
          await this.outboxEventRepository.save({
            id: event.id,
            event: event.event,
            entity: event.entity,
            createdAt: event.createdAt,
          });
          return;
        }

        throw new Error(`Unsupported outbox entity ${event}`);
      });
    }, Promise.resolve());

    return parsedEvents;
  }
}
