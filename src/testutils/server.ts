import Hapi, { Server } from '@hapi/hapi';
import routes from '../routes';

const server = Hapi.server({
  port: 3002,
  host: 'localhost',
});

export const getServer = async (): Promise<Server> => {
  await routes(server);
  await server.initialize();
  return server;
};

export const stopServer = async (server: Server): Promise<void> => {
  if (server) {
    await server.stop();
  }
};

export const startServer = async (server: Server): Promise<Server> => {
  await server.start();
  console.log(`Test Server running at: ${server.info.uri}`);
  return server;
};
