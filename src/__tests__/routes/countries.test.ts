import { getServer, startServer, stopServer } from '../../testutils/server';
import { clearDatabase } from '../../testutils/db';
import {
  validCountryInput,
  invalidCountryInput,
} from '../../fixtures/countries';

describe('Country Routes', () => {
  let server: any;

  beforeAll(async () => {
    server = await getServer();
    await startServer(server);
  });

  afterAll(async () => {
    await stopServer(server);
  });

  beforeEach(async () => {
    await clearDatabase();
  });

  // describe('POST /api/countries', () => {
  //   it('should create a new country with valid input', async () => {
  //     const response = await server.inject({
  //       method: 'POST',
  //       url: '/api/countries',
  //       payload: validCountryInput,
  //     });

  //     expect(response.statusCode).toBe(201);
  //     const responseJson = JSON.parse(response.payload);
  //     expect(responseJson.name).toBe(validCountryInput.name);
  //     expect(responseJson.cca3).toBe(validCountryInput.cca3);
  //     expect(responseJson).toHaveProperty('id');
  //     expect(responseJson).toHaveProperty('createdAt');
  //     expect(responseJson).toHaveProperty('updatedAt');
  //     expect(responseJson.region).toBe(validCountryInput.region);
  //     expect(responseJson.subregion).toBe(validCountryInput.subregion);
  //     expect(responseJson.languages).toHaveLength(1);
  //     expect(responseJson.currencies).toHaveLength(1);
  //   });

  //   it('should return 400 with invalid input', async () => {
  //     const response = await server.inject({
  //       method: 'POST',
  //       url: '/api/countries',
  //       payload: invalidCountryInput,
  //     });

  //     expect(response.statusCode).toBe(400);
  //     const responseJson = JSON.parse(response.payload);
  //     expect(responseJson).toHaveProperty('error');
  //     expect(responseJson).toHaveProperty('message');
  //   });

  //   it('should prevent creating duplicate countries with the same cca3', async () => {
  //     // First creation should succeed
  //     await server.inject({
  //       method: 'POST',
  //       url: '/api/countries',
  //       payload: validCountryInput,
  //     });

  //     // Second creation with same cca3 should fail
  //     const response = await server.inject({
  //       method: 'POST',
  //       url: '/api/countries',
  //       payload: validCountryInput,
  //     });

  //     expect(response.statusCode).toBe(409);
  //     const responseJson = JSON.parse(response.payload);
  //     expect(responseJson.message).toContain('already exists');
  //   });
  // });

  describe('GET /api/countries/{id}', () => {
    let countryId: number;

    beforeEach(async () => {
      // Create a test country to retrieve
      const response = await server.inject({
        method: 'POST',
        url: '/api/countries',
        payload: validCountryInput,
      });

      const country = JSON.parse(response.payload);

      countryId = country.id;
    });

    it('should retrieve a country by ID', async () => {
      const response = await server.inject({
        method: 'GET',
        url: `/api/countries/${countryId}`,
      });

      expect(response.statusCode).toBe(200);
      const { data: country } = JSON.parse(response.payload);

      expect(country.id).toBe(countryId);
      expect(country.name).toBe(validCountryInput.name);
      expect(country.cca3).toBe(validCountryInput.cca3);
    });

    // it('should return 404 for non-existent country ID', async () => {
    //   const nonExistentId = 9999;
    //   const response = await server.inject({
    //     method: 'GET',
    //     url: `/api/countries/${nonExistentId}`,
    //   });

    //   expect(response.statusCode).toBe(404);
    //   const error = JSON.parse(response.payload);
    //   expect(error).toHaveProperty('error');
    //   expect(error.message).toContain('not found');
    // });

    it('should return 400 for invalid country ID format', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/countries/invalid',
      });

      expect(response.statusCode).toBe(400);
      const error = JSON.parse(response.payload);
      expect(error).toHaveProperty('error');
    });
  });

  // describe('PUT /api/countries/{id}', () => {
  //   let countryId: number;

  //   beforeEach(async () => {
  //     // Create a test country to update
  //     const response = await server.inject({
  //       method: 'POST',
  //       url: '/api/countries',
  //       payload: validCountryInput,
  //     });

  //     const country = JSON.parse(response.payload);
  //     countryId = country.id;
  //   });

  //   it('should update a country with valid input', async () => {
  //     const response = await server.inject({
  //       method: 'PUT',
  //       url: `/api/countries/${countryId}`,
  //       payload: {
  //         name: 'Updated Name',
  //         population: 5000000,
  //         region: 'New Region',
  //       },
  //     });

  //     expect(response.statusCode).toBe(200);
  //     const updated = JSON.parse(response.payload);
  //     expect(updated.id).toBe(countryId);
  //     expect(updated.name).toBe('Updated Name');
  //     expect(updated.population).toBe(5000000);
  //     expect(updated.region).toBe('New Region');

  //     // Fields not included in the update should remain unchanged
  //     expect(updated.cca3).toBe(validCountryInput.cca3);
  //   });

  //   it('should return 404 when updating non-existent country', async () => {
  //     const nonExistentId = 9999;
  //     const response = await server.inject({
  //       method: 'PUT',
  //       url: `/api/countries/${nonExistentId}`,
  //       payload: {
  //         name: 'This Should Fail',
  //       },
  //     });

  //     expect(response.statusCode).toBe(404);
  //     const error = JSON.parse(response.payload);
  //     expect(error).toHaveProperty('error');
  //     expect(error.message).toContain('not exist');
  //   });

  //   it('should return 400 when updating with invalid data', async () => {
  //     const response = await server.inject({
  //       method: 'PUT',
  //       url: `/api/countries/${countryId}`,
  //       payload: {
  //         population: -100, // Invalid negative population
  //       },
  //     });

  //     expect(response.statusCode).toBe(400);
  //     const error = JSON.parse(response.payload);
  //     expect(error).toHaveProperty('error');
  //   });

  //   it('should prevent conflicting cca3 codes during update', async () => {
  //     // Create another country first
  //     const anotherCountry = {
  //       ...validCountryInput,
  //       name: 'Another Country',
  //       cca3: 'ANO',
  //     };

  //     await server.inject({
  //       method: 'POST',
  //       url: '/api/countries',
  //       payload: anotherCountry,
  //     });

  //     // Now try to update the first country to use the second's cca3
  //     const response = await server.inject({
  //       method: 'PUT',
  //       url: `/api/countries/${countryId}`,
  //       payload: {
  //         cca3: 'ANO',
  //       },
  //     });

  //     expect(response.statusCode).toBe(400);
  //     const error = JSON.parse(response.payload);
  //     expect(error.message).toContain('already exists');
  //   });
  // });

  describe('DELETE /api/countries/{id}', () => {
    let countryId: number;

    beforeEach(async () => {
      // Create a test country to delete
      const response = await server.inject({
        method: 'POST',
        url: '/api/countries',
        payload: validCountryInput,
      });

      const country = JSON.parse(response.payload);
      countryId = country.id;
    });

    it('should delete a country by ID', async () => {
      const response = await server.inject({
        method: 'DELETE',
        url: `/api/countries/${countryId}`,
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      expect(result.data.country.id).toBe(countryId);

      // Verify the country is gone
      const getResponse = await server.inject({
        method: 'GET',
        url: `/api/countries/${countryId}`,
      });

      expect(getResponse.statusCode).toBe(404);
    });

    it('should return error when deleting non-existent country', async () => {
      const nonExistentId = 9999;
      const response = await server.inject({
        method: 'DELETE',
        url: `/api/countries/${nonExistentId}`,
      });

      expect(response.statusCode).toBe(404);
      const error = JSON.parse(response.payload);
      expect(error).toHaveProperty('error');
    });

    // it('should clean up orphaned entities after deletion', async () => {
    //   // This test requires direct DB access to verify cleanup
    //   // We'll verify via the response
    //   const response = await server.inject({
    //     method: 'DELETE',
    //     url: `/api/countries/${countryId}`,
    //   });

    //   expect(response.statusCode).toBe(200);
    //   const result = JSON.parse(response.payload);

    //   // Check that we have cleanup data in the response
    //   expect(result).toHaveProperty('cleanup');
    //   expect(result.cleanup).toHaveProperty('regions');
    //   expect(result.cleanup).toHaveProperty('subregions');

    //   // Verify relationships were counted correctly
    //   expect(result.relationships.languages).toBe(1);
    //   expect(result.relationships.currencies).toBe(1);
    // });
  });
});
