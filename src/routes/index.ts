import Hapi from '@hapi/hapi';
import countries from './countryRoutes';

export default async (server: Hapi.Server) => {
  await server.register([{ plugin: countries }]);
};
