import TestDatabase from '../helpers/test-database';

export default async function globalTeardown() {
  await Promise.all([TestDatabase.stop()]);
}
