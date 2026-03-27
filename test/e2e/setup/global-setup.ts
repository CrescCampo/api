import TestDatabase from '../helpers/test-database';

export default async function setup() {
  await TestDatabase.start();

  return async function teardown() {
    await TestDatabase.stop();
  };
}
