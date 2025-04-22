import { Country, Currency, Language } from '../db/schema';

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

export interface CountryApiInput
  extends Omit<Country, 'id' | 'createdAt' | 'updatedAt'> {
  languages: LanguageInput[];
  currencies: CurrencyInput[];
}
