import { getServer, startServer, stopServer } from '../../testutils/server';
import { clearDatabase } from '../../testutils/clearDatabase';
import {
  validCountryInput,
  invalidCountryInput,
} from '../../fixtures/countries';
import { Language } from '../../db/schema';

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

  // describe('GET /api/countries', () => {
  //   beforeEach(async () => {
  //     await server.inject({
  //       method: 'POST',
  //       url: '/api/countries',
  //       payload: {
  //         ...validCountryInput,
  //         name: 'Germany',
  //         cca3: 'DEU',
  //         region: 'Europe',
  //         subregion: 'Western Europe',
  //         population: 83000000,
  //         languages: ['German'],
  //         currencies: ['EUR'],
  //       },
  //     });

  //     await server.inject({
  //       method: 'POST',
  //       url: '/api/countries',
  //       payload: {
  //         ...validCountryInput,
  //         name: 'France',
  //         cca3: 'FRA',
  //         region: 'Europe',
  //         subregion: 'Western Europe',
  //         population: 67000000,
  //         languages: ['French'],
  //         currencies: ['EUR'],
  //       },
  //     });

  //     // Add an Asian country
  //     await server.inject({
  //       method: 'POST',
  //       url: '/api/countries',
  //       payload: {
  //         ...validCountryInput,
  //         name: 'Japan',
  //         cca3: 'JPN',
  //         region: 'Asia',
  //         subregion: 'Eastern Asia',
  //         population: 126000000,
  //         languages: ['Japanese'],
  //         currencies: ['JPY'],
  //       },
  //     });

  //     // Add an African country
  //     await server.inject({
  //       method: 'POST',
  //       url: '/api/countries',
  //       payload: {
  //         ...validCountryInput,
  //         name: 'Kenya',
  //         cca3: 'KEN',
  //         region: 'Africa',
  //         subregion: 'Eastern Africa',
  //         population: 53000000,
  //         languages: ['Swahili', 'English'],
  //         currencies: ['KES'],
  //       },
  //     });
  //   });

  //   it('should retrieve all countries with default pagination', async () => {
  //     const response = await server.inject({
  //       method: 'GET',
  //       url: '/api/countries',
  //     });

  //     expect(response.statusCode).toBe(200);
  //     const result = JSON.parse(response.payload);

  //     expect(result).toHaveProperty('data');
  //     expect(result).toHaveProperty('meta');
  //     expect(result.data).toHaveLength(4); // All 4 countries we created
  //     expect(result.meta.total).toBe(4);
  //     expect(result.meta.page).toBe(1);
  //   });

  //   it('should filter countries by region', async () => {
  //     const response = await server.inject({
  //       method: 'GET',
  //       url: '/api/countries?filter[region]=Europe',
  //     });

  //     expect(response.statusCode).toBe(200);
  //     const result = JSON.parse(response.payload);

  //     expect(result.data).toHaveLength(2); // Germany and France
  //     expect(result.meta.total).toBe(2);
  //     expect(result.data[0].region).toBe('Europe');
  //     expect(result.data[1].region).toBe('Europe');
  //   });

  //   it('should filter countries by name', async () => {
  //     const response = await server.inject({
  //       method: 'GET',
  //       url: '/api/countries?filter[name]=Ger',
  //     });

  //     expect(response.statusCode).toBe(200);
  //     const result = JSON.parse(response.payload);

  //     expect(result.data).toHaveLength(1);
  //     expect(result.data[0].name).toBe('Germany');
  //   });

  //   it('should filter countries by cca3 code', async () => {
  //     const response = await server.inject({
  //       method: 'GET',
  //       url: '/api/countries?filter[cca3]=JPN',
  //     });

  //     expect(response.statusCode).toBe(200);
  //     const result = JSON.parse(response.payload);

  //     expect(result.data).toHaveLength(1);
  //     expect(result.data[0].name).toBe('Japan');
  //   });

  //   it('should filter countries by population range', async () => {
  //     const response = await server.inject({
  //       method: 'GET',
  //       url: '/api/countries?filter[population][min]=100000000',
  //     });

  //     expect(response.statusCode).toBe(200);
  //     const result = JSON.parse(response.payload);

  //     expect(result.data).toHaveLength(1); // Just Japan
  //     expect(result.data[0].name).toBe('Japan');
  //   });

  //   it('should filter countries by language', async () => {
  //     const response = await server.inject({
  //       method: 'GET',
  //       url: '/api/countries?filter[language]=English',
  //     });

  //     expect(response.statusCode).toBe(200);
  //     const result = JSON.parse(response.payload);

  //     expect(result.data).toHaveLength(1); // Kenya has English
  //     expect(result.data[0].name).toBe('Kenya');
  //   });

  //   it('should filter countries by currency', async () => {
  //     const response = await server.inject({
  //       method: 'GET',
  //       url: '/api/countries?filter[currency]=EUR',
  //     });

  //     expect(response.statusCode).toBe(200);
  //     const result = JSON.parse(response.payload);

  //     expect(result.data).toHaveLength(2); // Germany and France
  //     expect(result.data.map((c: Language) => c.name).sort()).toEqual([
  //       'France',
  //       'Germany',
  //     ]);
  //   });

  //   it('should paginate results correctly', async () => {
  //     const response = await server.inject({
  //       method: 'GET',
  //       url: '/api/countries?page=1&pageSize=2',
  //     });

  //     expect(response.statusCode).toBe(200);
  //     const result = JSON.parse(response.payload);

  //     expect(result.data).toHaveLength(2); // Only 2 per page
  //     expect(result.meta.total).toBe(4); // But 4 total
  //     expect(result.meta.page).toBe(1);
  //     expect(result.meta.pageSize).toBe(2);
  //     expect(result.meta.pageCount).toBe(2); // 4 items with 2 per page = 2 pages

  //     // Get second page
  //     const responsePage2 = await server.inject({
  //       method: 'GET',
  //       url: '/api/countries?page=2&pageSize=2',
  //     });

  //     const resultPage2 = JSON.parse(responsePage2.payload);
  //     expect(resultPage2.data).toHaveLength(2);
  //     expect(resultPage2.meta.page).toBe(2);

  //     // Ensure we got different countries on different pages
  //     const page1Countries = new Set(result.data.map((c: any) => c.id));
  //     const page2Countries = new Set(resultPage2.data.map((c: any) => c.id));

  //     // Check for intersection - should be empty
  //     const intersection = [...page1Countries].filter((x) =>
  //       page2Countries.has(x),
  //     );
  //     expect(intersection).toHaveLength(0);
  //   });

  //   it('should sort countries by name', async () => {
  //     const ascResponse = await server.inject({
  //       method: 'GET',
  //       url: '/api/countries?sort[field]=name&sort[direction]=asc',
  //     });

  //     expect(ascResponse.statusCode).toBe(200);
  //     const ascResult = JSON.parse(ascResponse.payload);

  //     // Alphabetical: France, Germany, Japan, Kenya
  //     expect(ascResult.data[0].name).toBe('France');

  //     const descResponse = await server.inject({
  //       method: 'GET',
  //       url: '/api/countries?sort[field]=name&sort[direction]=desc',
  //     });

  //     const descResult = JSON.parse(descResponse.payload);
  //     // Reversed alphabetical
  //     expect(descResult.data[0].name).toBe('Kenya');
  //   });

  //   it('should sort countries by population', async () => {
  //     const response = await server.inject({
  //       method: 'GET',
  //       url: '/api/countries?sort[field]=population&sort[direction]=desc',
  //     });

  //     expect(response.statusCode).toBe(200);
  //     const result = JSON.parse(response.payload);

  //     // Highest population first
  //     expect(result.data[0].name).toBe('Japan'); // 126M
  //     expect(result.data[1].name).toBe('Germany'); // 83M
  //   });

  //   it('should include relations when requested', async () => {
  //     const response = await server.inject({
  //       method: 'GET',
  //       url: '/api/countries?includeRelations=true',
  //     });

  //     expect(response.statusCode).toBe(200);
  //     const result = JSON.parse(response.payload);

  //     // Check that the first country has relations included
  //     const firstCountry = result.data[0];
  //     expect(firstCountry).toHaveProperty('region');
  //     expect(firstCountry).toHaveProperty('subregion');
  //     expect(firstCountry).toHaveProperty('languages');
  //     expect(firstCountry).toHaveProperty('currencies');

  //     // Verify the relations have detailed information
  //     expect(firstCountry.languages[0]).toHaveProperty('language');
  //     expect(firstCountry.currencies[0]).toHaveProperty('currency');
  //   });

  //   it('should combine multiple filters correctly', async () => {
  //     const response = await server.inject({
  //       method: 'GET',
  //       url: '/api/countries?filter[region]=Europe&filter[population][min]=70000000',
  //     });

  //     expect(response.statusCode).toBe(200);
  //     const result = JSON.parse(response.payload);

  //     expect(result.data).toHaveLength(1); // Only Germany
  //     expect(result.data[0].name).toBe('Germany');
  //   });

  //   it('should handle non-existent filter values gracefully', async () => {
  //     const response = await server.inject({
  //       method: 'GET',
  //       url: '/api/countries?filter[region]=Antarctica',
  //     });

  //     expect(response.statusCode).toBe(200);
  //     const result = JSON.parse(response.payload);

  //     expect(result.data).toHaveLength(0); // No countries found
  //     expect(result.meta.total).toBe(0);
  //   });
  // });

  describe('POST /api/countries', () => {
    it('should create a new country with valid input', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/countries',
        payload: validCountryInput,
      });

      expect(response.statusCode).toBe(201);
      const responseJson = JSON.parse(response.payload);
      expect(responseJson.name).toBe(validCountryInput.name);
      expect(responseJson.cca3).toBe(validCountryInput.cca3);
      expect(responseJson).toHaveProperty('id');
      expect(responseJson).toHaveProperty('createdAt');
      expect(responseJson).toHaveProperty('updatedAt');
      expect(responseJson.region).toBe(validCountryInput.region);
      expect(responseJson.subregion).toBe(validCountryInput.subregion);
      expect(responseJson.languages).toHaveLength(1);
      expect(responseJson.currencies).toHaveLength(1);
    });

    it('should return 400 with invalid input', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/countries',
        payload: invalidCountryInput,
      });

      expect(response.statusCode).toBe(400);
      const responseJson = JSON.parse(response.payload);
      expect(responseJson).toHaveProperty('error');
      expect(responseJson).toHaveProperty('message');
    });

    it('should prevent creating duplicate countries with the same cca3', async () => {
      await server.inject({
        method: 'POST',
        url: '/api/countries',
        payload: validCountryInput,
      });

      const response = await server.inject({
        method: 'POST',
        url: '/api/countries',
        payload: validCountryInput,
      });

      expect(response.statusCode).toBe(409);
      const responseJson = JSON.parse(response.payload);
      expect(responseJson.message).toContain('already exists');
    });
  });

  describe('GET /api/countries/{id}', () => {
    let countryId: number;

    beforeEach(async () => {
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

    it('should return 404 for non-existent country ID', async () => {
      const nonExistentId = 9999;
      const response = await server.inject({
        method: 'GET',
        url: `/api/countries/${nonExistentId}`,
      });

      expect(response.statusCode).toBe(404);
      const error = JSON.parse(response.payload);
      expect(error).toHaveProperty('error');
      expect(error.message).toContain('not found');
    });

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

  describe('PATCH /api/countries/{id}', () => {
    let countryId: number;

    beforeEach(async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/countries',
        payload: validCountryInput,
      });

      const country = JSON.parse(response.payload);
      countryId = country.id;
    });

    it('should update a country with valid input', async () => {
      const response = await server.inject({
        method: 'PATCH',
        url: `/api/countries/${countryId}`,
        payload: {
          name: 'Updated Name',
          population: 5000000,
          region: 'New Region',
        },
      });
      expect(response.statusCode).toBe(200);
      const { data: updated } = JSON.parse(response.payload);
      expect(updated.id).toBe(countryId);
      expect(updated.name).toBe('Updated Name');
      expect(updated.population).toBe(5000000);
      expect(updated.region).toBe('New Region');

      // Fields not included in the update should remain unchanged
      expect(updated.cca3).toBe(validCountryInput.cca3);
    });

    it('should return 404 when updating non-existent country', async () => {
      const nonExistentId = 9999;
      const response = await server.inject({
        method: 'PATCH',
        url: `/api/countries/${nonExistentId}`,
        payload: {
          name: 'This Should Fail',
        },
      });

      expect(response.statusCode).toBe(404);
      const error = JSON.parse(response.payload);
      expect(error).toHaveProperty('error');
      expect(error.message).toContain('not found');
    });

    it('should return 400 when updating with invalid data', async () => {
      const response = await server.inject({
        method: 'PATCH',
        url: `/api/countries/${countryId}`,
        payload: {
          population: -100, // Invalid negative population
        },
      });

      expect(response.statusCode).toBe(400);
      const error = JSON.parse(response.payload);
      expect(error).toHaveProperty('error');
    });

    it('should prevent conflicting cca3 codes during update', async () => {
      const anotherCountry = {
        ...validCountryInput,
        name: 'Another Country',
        cca3: 'ANO',
      };

      await server.inject({
        method: 'POST',
        url: '/api/countries',
        payload: anotherCountry,
      });

      const response = await server.inject({
        method: 'PATCH',
        url: `/api/countries/${countryId}`,
        payload: {
          cca3: 'ANO',
        },
      });

      expect(response.statusCode).toBe(409);
      const error = JSON.parse(response.payload);
      expect(error.message).toContain('already exists');
    });
  });

  describe('DELETE /api/countries/{id}', () => {
    let countryId: number;

    beforeEach(async () => {
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

      const getResponse = await server.inject({
        method: 'GET',
        url: `/api/countries/${countryId}`,
      });

      expect(getResponse.statusCode).toBe(404);
    });

    it('should return 404 when deleting non-existent country', async () => {
      const nonExistentId = 9999;
      const response = await server.inject({
        method: 'DELETE',
        url: `/api/countries/${nonExistentId}`,
      });

      expect(response.statusCode).toBe(404);
      const payload = JSON.parse(response.payload);
      expect(payload).toHaveProperty('error');
    });

    it('should clean up orphaned entities after deletion', async () => {
      const response = await server.inject({
        method: 'DELETE',
        url: `/api/countries/${countryId}`,
      });

      expect(response.statusCode).toBe(200);
      const { data } = JSON.parse(response.payload);

      // Need to check directly if thos regions and suregions still exist
      expect(data).toHaveProperty('cleanup');
      expect(data.cleanup).toHaveProperty('regions');
      expect(data.cleanup).toHaveProperty('subregions');
    });
  });
});
