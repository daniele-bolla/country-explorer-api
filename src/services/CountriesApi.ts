import config from '../config';
import { RestCountryFields } from '../types/countryModel';
import ApiService from './ApiService';

export async function fetchCountriesFromApi() {
  const wtihFields: RestCountryFields[] = [
    'name',
    'cca3',
    'region',
    'capital',
    'flags',
    'population',
    'languages',
    'currencies',
  ];
  const data = await ApiService.get(
    `${config.api.countriesBaseUrl}/all?fields=${wtihFields.join(',')}`,
  );
  console.log(data);
  return data;
}
