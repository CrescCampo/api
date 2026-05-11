/* eslint-disable no-console */
import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';

export default class TestDatabase {
  private static container: StartedPostgreSqlContainer;

  private static externalConnectionUri: string | null = null;

  static async start(): Promise<void> {
    if (this.container || this.externalConnectionUri) {
      return;
    }

    if (process.env.E2E_USE_EXTERNAL_POSTGRES === 'true') {
      const host = process.env.POSTGRES_HOST;
      const port = process.env.POSTGRES_PORT;
      const user = process.env.POSTGRES_USER;
      const pass = process.env.POSTGRES_PASS;
      const db = process.env.POSTGRES_DB_NAME;

      if (!host || !port || !user || !pass || !db) {
        throw new Error(
          'E2E_USE_EXTERNAL_POSTGRES=true requires POSTGRES_HOST, POSTGRES_PORT, POSTGRES_USER, POSTGRES_PASS and POSTGRES_DB_NAME',
        );
      }

      process.env.APP_ENV = 'test';
      this.externalConnectionUri = `postgres://${user}:${pass}@${host}:${port}/${db}`;
      console.log(`Using external PostgreSQL at ${host}:${port}`);
      return;
    }

    console.log('Starting PostgreSQL TestContainer...');

    try {
      this.container = await new PostgreSqlContainer('postgres')
        .withDatabase('test')
        .withUsername('test')
        .withPassword('test')
        .withExposedPorts(5432)
        .withReuse()
        .withStartupTimeout(120000)
        .start();

      process.env.POSTGRES_HOST = this.container.getHost();
      process.env.POSTGRES_PORT = this.container.getPort().toString();
      process.env.POSTGRES_USER = this.container.getUsername();
      process.env.POSTGRES_PASS = this.container.getPassword();
      process.env.POSTGRES_DB_NAME = this.container.getDatabase();
      process.env.APP_ENV = 'test';

      console.log(
        `PostgreSQL started at ${this.container.getHost()}:${this.container.getPort()}`,
      );
    } catch (error) {
      console.error('Failed to start PostgreSQL TestContainer:', error);
      throw error;
    }
  }

  static async stop(): Promise<void> {
    if (this.container) {
      console.log('Stopping PostgreSQL TestContainer...');
      await this.container.stop();
    }
  }

  static getConnectionUri(): string {
    if (this.externalConnectionUri) {
      return this.externalConnectionUri;
    }
    if (!this.container) {
      throw new Error('Container not started');
    }
    return this.container.getConnectionUri();
  }
}
