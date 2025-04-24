import { CountryApiResponse } from '../types/countryModel';
import { CountryInput } from '../types/countryModel';

export function adapterApiToCountryInput(
  apiCountry: CountryApiResponse,
): CountryInput {
  const languages = apiCountry.languages
    ? Object.entries(apiCountry.languages).map(([code, name]) => ({
        code: code.toLowerCase(),
        name: String(name),
      }))
    : [];

  const currencies = apiCountry.currencies
    ? Object.entries(apiCountry.currencies).map(([code, details]) => ({
        code: code.toUpperCase(),
        name: String((details as { name: string }).name),
      }))
    : [];

  return {
    name: apiCountry.name.common,
    cca3: apiCountry.cca3,
    capital: apiCountry.capital || [],
    region: apiCountry.region,
    subregion: apiCountry.subregion,
    population: apiCountry.population,
    flagSvg: apiCountry.flags.svg,
    flagPng: apiCountry.flags.png,
    languages,
    currencies,
  };
}
