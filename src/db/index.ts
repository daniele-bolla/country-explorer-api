import 'dotenv/config';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema';
import config from '../config';

const connectionString = `postgres://${config.db.user}:${config.db.password}@${config.db.host}:${config.db.port}/${config.db.database}`;
const pool = new Pool({ connectionString });

export const db = drizzle(pool, {
  schema,
  logger: false,
});

export type DB = typeof db;
export type Transaction = Parameters<typeof db.transaction>[0] extends (
  tx: infer T,
) => any
  ? T
  : never;
