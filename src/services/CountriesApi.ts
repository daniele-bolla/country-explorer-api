import config from '../config';
import { CountryApiResponse, RestCountryFields } from '../types/countryModel';
import ApiService from './ApiService';

export async function fetchCountriesFromApi(): Promise<CountryApiResponse[]> {
  const wtihFields: RestCountryFields[] = [
    'name',
    'cca3',
    'region',
    'subregion',
    'capital',
    'flags',
    'population',
    'languages',
    'currencies',
  ];
  const { data } = await ApiService.get(
    `${config.api.countriesBaseUrl}/all?fields=${wtihFields.join(',')}`,
  );
  return data;
}
