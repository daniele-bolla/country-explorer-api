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

export interface CountryApiResponse {
  name: {
    common: string;
  };
  cca3: string;
  region: string;
  subregion: string;
  languages?: Record<string, string>;
  currencies?: Record<
    string,
    {
      name: string;
      symbol?: string;
    }
  >;
  population: number;
  flags: {
    png: string;
    svg: string;
  };
  capital?: string[];
}
export type RestCountryFields = keyof CountryApiResponse;
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

export type CountryEntity = Country & {
  region: Region | null;
  subregion: Subregion | null;
  languages: Array<{ language: Language }>;
  currencies: Array<{ currency: Currency }>;
};

export interface CountryResponse extends Country {
  languages: Language[] | null;
  currencies: Currency[] | null;
  region: Region | null;
  subregion: Subregion | null;
}

export interface UpdateCountryInput {
  name?: string;
  cca3?: string;
  capital?: string[];
  region?: string;
  subregion?: string;
  population?: number;
  flagSvg?: string;
  flagPng?: string;
  languages?: Array<{ code: string; name: string }>;
  currencies?: Array<{ code: string; name: string }>;
}
