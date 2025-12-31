import { seedDatabase } from './index';

seedDatabase()
  .then(() => {
    process.stdout.write('Seed completed\n');
  })
  .catch(error => {
    process.stderr.write(
      `Seed failed: ${error instanceof Error ? error.message : String(error)}\n`,
    );
    process.exitCode = 1;
  });
