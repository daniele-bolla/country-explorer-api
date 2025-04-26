import { getServer, startServer, stopServer } from '../../testutils/server';
import { clearDatabase } from '../../testutils/clearDatabase';
import {
  validCountryInput,
  invalidCountryInput,
  europeanCountries,
  asianCountries,
  countriesWithMultipleLanguages,
  countriesWithEuro,
} from '../../fixtures/countries';
import { bulkCreateCountries } from '../../services/PopulateCountriesFromAPIService';
import { CountryResponse } from '../../types/countryModel';

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

  describe('GET /api/countries', () => {
    it('should retrieve all countries', async () => {
      // Add a mix of countries from different regions
      const testCountries = [
        ...europeanCountries.slice(0, 2),
        ...asianCountries.slice(0, 2),
      ];
      await bulkCreateCountries(testCountries);

      const response = await server.inject({
        method: 'GET',
        url: '/api/countries',
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      expect(result.data).toHaveLength(4);
      expect(result.meta.total).toBe(4);
    });

    it('should filter countries by region', async () => {
      // Add countries from Europe and Asia
      await bulkCreateCountries([
        ...europeanCountries.slice(0, 3),
        ...asianCountries.slice(0, 2),
      ]);

      const response = await server.inject({
        method: 'GET',
        url: '/api/countries?region=Europe',
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);

      expect(result.data.length).toBe(3);
      result.data.forEach((country: CountryResponse) => {
        expect(country.region).toBe('Europe');
      });
    });

    it('should filter countries by language', async () => {
      // Add countries with different languages
      await bulkCreateCountries(countriesWithMultipleLanguages);

      const response = await server.inject({
        method: 'GET',
        url: '/api/countries?language=English',
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);

      // All these countries should have English as a language
      expect(result.data.length).toBeGreaterThan(0);
      result.data.forEach((country: CountryResponse) => {
        expect(
          country.languages.every((l) => l.name == 'English'),
        ).toBeTruthy();
      });
    });

    it('should filter countries by currency', async () => {
      // Add Euro and non-Euro countries
      await bulkCreateCountries([
        ...countriesWithEuro,
        ...asianCountries.slice(0, 2),
      ]);

      const response = await server.inject({
        method: 'GET',
        url: '/api/countries?currency=EUR',
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);

      expect(result.data.length).toBe(countriesWithEuro.length);
      result.data.forEach((country: CountryResponse) => {
        expect(country.currencies.every((c) => c.code == 'EUR')).toBeTruthy();
      });
    });

    it('should paginate results', async () => {
      // Add enough countries to test pagination
      await bulkCreateCountries([...europeanCountries, ...asianCountries]);

      const pageSize = 3;
      const response1 = await server.inject({
        method: 'GET',
        url: `/api/countries?page=1&pageSize=${pageSize}`,
      });

      expect(response1.statusCode).toBe(200);
      const result1 = JSON.parse(response1.payload);

      expect(result1.data.length).toBe(pageSize);
      expect(result1.meta.page).toBe(1);
      expect(result1.meta.pageSize).toBe(pageSize);

      // Get the second page
      const response2 = await server.inject({
        method: 'GET',
        url: `/api/countries?page=2&pageSize=${pageSize}`,
      });

      expect(response2.statusCode).toBe(200);
      const result2 = JSON.parse(response2.payload);

      // Make sure we got different countries on page 2
      const page1Ids = result1.data.map(
        (country: CountryResponse) => country.id,
      );
      const page2Ids = result2.data.map(
        (country: CountryResponse) => country.id,
      );

      page2Ids.forEach((id: number) => {
        expect(page1Ids).not.toContain(id);
      });
    });

    it('should sort countries by population', async () => {
      // Add countries with different population sizes
      const testCountries = [
        europeanCountries[1], // France - 67M

        europeanCountries[0], // Germany - 83M
        asianCountries[0], // Japan - 126M
      ];
      await bulkCreateCountries(testCountries);

      // Sort by population descending
      const response = await server.inject({
        method: 'GET',
        url: '/api/countries?sortField=population&sortDirection=desc',
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);

      // Countries should be in order of population (largest first)
      expect(result.data[0].name).toBe('Japan');
      expect(result.data[1].name).toBe('Germany');
      expect(result.data[2].name).toBe('France');

      // Verify populations are in descending order
      for (let i = 0; i < result.data.length - 1; i++) {
        expect(result.data[i].population).toBeGreaterThanOrEqual(
          result.data[i + 1].population,
        );
      }
    });

    it('should search countries by name', async () => {
      await bulkCreateCountries([...europeanCountries, ...asianCountries]);

      const response = await server.inject({
        method: 'GET',
        url: '/api/countries?name=ger',
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);

      expect(result.data.length).toBe(1);
      expect(result.data[0].name).toBe('Germany');
    });
  });
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
