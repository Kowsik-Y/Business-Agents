/**
 * Database connection and Drizzle ORM client.
 */
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema.js';

const DATABASE_URL = process.env['DATABASE_URL'] ?? 'postgresql://postgres:postgres@localhost:5433/csp_dev';

/** Raw postgres.js client (for migrations) */
export const sql = postgres(DATABASE_URL);

/** Drizzle ORM client with schema */
export const db = drizzle(sql, { schema });

export type Database = typeof db;
