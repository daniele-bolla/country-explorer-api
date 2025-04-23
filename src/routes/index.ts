import Hapi from '@hapi/hapi';
import countriesRoutes from './countriesRoutes';

export default async (server: Hapi.Server) => {
  await server.register([{ plugin: countriesRoutes }]);
};
