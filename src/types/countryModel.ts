import { Country, Currency, Language, Region, Subregion } from '../db/schema';

export interface CountryNameNative {
  official: string;
  common: string;
}

export interface CountryName {
  common: string;
  official: string;
  nativeName?: Record<string, CountryNameNative>;
}

export interface RestCountryResponse {
  name: CountryName;
  cca3: string;
  capital?: string[];
  region?: string;
  subregion?: string;
  languages?: Record<string, LanguageInput>;
  currencies?: Record<string, CurrencyInput>;
  population: number;
  flags?: {
    png: string;
    svg: string;
  };
}
export type RestCountryFields = keyof RestCountryResponse;
export type LanguageInput = Omit<Language, 'id' | 'createdAt' | 'updatedAt'>;
export type CurrencyInput = Omit<Currency, 'id' | 'createdAt' | 'updatedAt'>;
export type RegionInput = Omit<Region, 'id' | 'createdAt' | 'updatedAt'>;
export type SubregionInput = Omit<Subregion, 'id' | 'createdAt' | 'updatedAt'>;

export interface CountryInput
  extends Omit<
    Country,
    'id' | 'createdAt' | 'updatedAt' | 'regionId' | 'subregionId'
  > {
  languages: LanguageInput[];
  currencies: CurrencyInput[];
  region: RegionInput['name'];
  subregion: SubregionInput['name'];
}

export interface CountryEntity extends Country {
  languages: Language[];
  currencies: Currency[];
  region?: Region;
  subregion?: Subregion;
}

export interface CountryResponse
  extends Omit<Country, 'regionId' | 'subregionId'> {
  languages: Language[];
  currencies: Currency[];
  region?: RegionInput['name'];
  subregion?: SubregionInput['name'];
}
