import Hapi from '@hapi/hapi';
// import Inert from '@hapi/inert';
// import Vision from '@hapi/vision';
// import HapiSwagger from '@hapi/swagger';
import config from './config';
import routes from './routes/index';
import { db } from './db';
import { count } from 'drizzle-orm';
import { countriesTable } from './db/schema';
import { importCountriesFromApi } from './services/PopulateCountriesFromAPIService';

export const init = async (serverPort?: number) => {
  const server = Hapi.server({
    port: serverPort || config.server.port,
    host: config.server.host,
    routes: {
      cors: {
        origin: ['*'],
      },
    },
  });

  // Register Swagger documentation
  //   const swaggerOptions = {
  //     info: {
  //       title: 'Country Explorer API Documentation',
  //       version: '1.0.0',
  //     },
  //   };

  //   await server.register([
  //     Inert,
  //     Vision,
  //     {
  //       plugin: HapiSwagger,
  //       options: swaggerOptions,
  //     },
  //   ]);

  await routes(server);
  try {
    const [result] = await db.select({ count: count() }).from(countriesTable);

    if (result.count === 0) {
      console.log('Database is empty. Loading initial country data...');
      await importCountriesFromApi();
    } else {
      console.log(`Database already contains ${result.count} countries.`);
    }
  } catch (error) {
    console.error('Error checking/loading initial data:', error);
  }

  await server.start();
  console.log(`Server running on ${server.info.uri}`);
  console.log(`Documentation available at ${server.info.uri}/documentation`);

  return server;
};

process.on('unhandledRejection', (err) => {
  console.error(err);
  process.exit(1);
});

init();
