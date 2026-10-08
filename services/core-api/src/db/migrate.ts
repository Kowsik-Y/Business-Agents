/**
 * Database migration runner.
 */
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { db, sql } from './index.js';

async function runMigrations(): Promise<void> {
  console.log('Running migrations...');
  await migrate(db, { migrationsFolder: './drizzle' });
  console.log('Migrations complete.');
  await sql.end();
}

runMigrations().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
