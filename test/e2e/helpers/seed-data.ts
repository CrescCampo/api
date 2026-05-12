import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { randomUUID } from 'crypto';
import makeOutboxEvent from '../factories/make-outbox-event';

export interface SeedCulture {
  id: string;
  name: string;
  [key: string]: unknown;
}

export interface SeedTransactionCategory {
  id: string;
  name: string;
  [key: string]: unknown;
}

export interface SeedHarvest {
  id: string;
  name: string;
  cultureId: string;
  startDate: number;
  endDate?: number;
  revenue: number;
  expenses: number;
  [key: string]: unknown;
}

export interface SeedTransaction {
  id: string;
  harvestId: string;
  type: 'revenue' | 'expense';
  description: string;
  amount: number;
  categoryId: string;
  date: number;
  [key: string]: unknown;
}

export async function seedCulture(
  app: INestApplication,
  token: string,
  culture?: Partial<SeedCulture>,
): Promise<SeedCulture> {
  const data: SeedCulture = {
    id: culture?.id ?? randomUUID(),
    name: culture?.name ?? 'Cultura Teste',
  };

  await request(app.getHttpServer())
    .post('/app/push')
    .set('Authorization', `Bearer ${token}`)
    .send({ outbox: [makeOutboxEvent('cultures', data)] });

  return data;
}

export async function seedTransactionCategory(
  app: INestApplication,
  token: string,
  category?: Partial<SeedTransactionCategory>,
): Promise<SeedTransactionCategory> {
  const data: SeedTransactionCategory = {
    id: category?.id ?? randomUUID(),
    name: category?.name ?? 'Categoria Teste',
  };

  await request(app.getHttpServer())
    .post('/app/push')
    .set('Authorization', `Bearer ${token}`)
    .send({ outbox: [makeOutboxEvent('transaction_category', data)] });

  return data;
}

export async function seedHarvest(
  app: INestApplication,
  token: string,
  cultureId: string,
  harvest?: Partial<SeedHarvest>,
): Promise<SeedHarvest> {
  const data: SeedHarvest = {
    id: harvest?.id ?? randomUUID(),
    name: harvest?.name ?? 'Safra Teste',
    cultureId,
    startDate: harvest?.startDate ?? Date.now(),
    endDate: harvest?.endDate,
    revenue: harvest?.revenue ?? 0,
    expenses: harvest?.expenses ?? 0,
  };

  await request(app.getHttpServer())
    .post('/app/push')
    .set('Authorization', `Bearer ${token}`)
    .send({ outbox: [makeOutboxEvent('harvest', data)] });

  return data;
}

export async function seedTransaction(
  app: INestApplication,
  token: string,
  harvestId: string,
  categoryId: string,
  transaction?: Partial<SeedTransaction>,
): Promise<SeedTransaction> {
  const data: SeedTransaction = {
    id: transaction?.id ?? randomUUID(),
    harvestId,
    type: transaction?.type ?? 'expense',
    description: transaction?.description ?? 'Transação Teste',
    amount: transaction?.amount ?? 100,
    categoryId,
    date: transaction?.date ?? Date.now(),
  };

  await request(app.getHttpServer())
    .post('/app/push')
    .set('Authorization', `Bearer ${token}`)
    .send({ outbox: [makeOutboxEvent('transaction', data)] });

  return data;
}

export async function seedFullDataSet(
  app: INestApplication,
  token: string,
  overrides?: {
    culture?: Partial<SeedCulture>;
    harvest?: Partial<SeedHarvest>;
    category?: Partial<SeedTransactionCategory>;
    transaction?: Partial<SeedTransaction>;
  },
) {
  const culture = await seedCulture(app, token, overrides?.culture);
  const category = await seedTransactionCategory(
    app,
    token,
    overrides?.category,
  );
  const harvest = await seedHarvest(app, token, culture.id, overrides?.harvest);
  const transaction = await seedTransaction(
    app,
    token,
    harvest.id,
    category.id,
    overrides?.transaction,
  );

  return { culture, category, harvest, transaction };
}
