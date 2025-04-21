import Hapi, { Request } from '@hapi/hapi';
// import Inert from '@hapi/inert';
// import Vision from '@hapi/vision';
// import HapiSwagger from '@hapi/swagger';
import config from './config';
import routes from './routes/index';

const init = async () => {
  const server = Hapi.server({
    port: config.server.port,
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

  // Register routes
  await routes(server);

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
