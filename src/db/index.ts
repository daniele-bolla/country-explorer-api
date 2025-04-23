import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';

import config from '../config';

// Create postgres connection
const connectionString = `postgres://${config.db.user}:${config.db.password}@${config.db.host}:${config.db.port}/${config.db.database}`;
export const db = drizzle(connectionString!);

export type DB = typeof db;
export type Transaction = Parameters<typeof db.transaction>[0] extends (
  tx: infer T,
) => any
  ? T
  : never;
