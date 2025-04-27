import { defineConfig } from 'drizzle-kit';
import config from './src/config';
const connectionString = `postgres://${config.db.user}:${config.db.password}@${config.db.host}:${config.db.port}/${config.db.database}`;
console.log(connectionString, '324234234');
export default defineConfig({
  out: './drizzle',
  schema: './src/db/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: connectionString!,
  },
});
