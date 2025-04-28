import Hapi, { Server } from '@hapi/hapi';
import Inert from '@hapi/inert';
import Vision from '@hapi/vision';
import HapiSwagger from 'hapi-swagger';
import config, { isProd } from './config';
import routes from './routes/index';
import { db } from './db';
import { count } from 'drizzle-orm';
import { countriesTable } from './db/schema';
import { importCountriesFromApi } from './services/ImportCountriesService';
import HapiPino from 'hapi-pino';
import { devLog } from './utils/devLog';

export let server: Server;
export const init = async (serverPort?: number) => {
  server = Hapi.server({
    debug: false,
    port: serverPort || config.server.port,
    host: config.server.host,
    routes: {
      cors: {
        origin: ['*'],
      },
    },
  });
  await server.register({
    plugin: HapiPino,
    options: {
      level: isProd ? 'info' : 'debug',
      redact: ['req.headers.authorization'],
      logEvents: ['onPostStart', 'onPostStop', 'response', 'request-error'],
    },
  });

  const swaggerOptions = {
    info: {
      title: 'Country Explorer API Documentation',
      version: '1.0.0',
    },
    grouping: 'tags',
    sortEndpoints: 'ordered',
  };

  await server.register([
    Inert,
    Vision,
    {
      plugin: HapiSwagger,
      options: swaggerOptions,
    },
  ]);

  await routes(server);
  try {
    const [result] = await db.select({ count: count() }).from(countriesTable);

    if (result.count === 0) {
      devLog('Database is empty. Loading initial country data...');
      await importCountriesFromApi();
    } else {
      devLog(`Database already contains ${result.count} countries.`);
    }
  } catch (error) {
    server.logger.error('Error checking/loading initial data:', error);
  }

  await server.start();

  return server;
};

process.on('unhandledRejection', (err) => {
  console.error(err);
  process.exit(1);
});

init();
