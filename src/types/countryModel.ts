/**
 * Types modeling the REST Countries API response structure
 */
export interface CountryNameNative {
  official: string;
  common: string;
}

export interface CountryName {
  common: string;
  official: string;
  nativeName?: Record<string, CountryNameNative>;
}

export interface CountryCurrency {
  name: string;
  symbol: string;
}

export interface RestCountryResponse {
  name: CountryName;
  cca3: string;
  capital?: string[];
  region?: string;
  subregion?: string;
  languages?: Record<string, string>;
  currencies?: Record<string, CountryCurrency>;
  population: number;
  flags?: {
    png?: string;
    svg?: string;
  };
}

/**
 * Types for our database entities
 */
export interface LanguageEntity {
  code: string;
  name: string;
}

export interface CurrencyEntity {
  code: string;
  name: string;
  symbol?: string;
}

export interface CountryApiInput {
  id: string;
  name: string;
  cca3: string;
  capital: string[];
  region: string | null;
  population: number;
  flagPng: string | null;
  flagSvg: string | null;
  languages: LanguageEntity[];
  currencies: CurrencyEntity[];
}

export interface CountryApiUpdateInput
  extends Partial<Omit<CountryApiInput, 'cca3'>> {
  id: number;
}

/**
 * Type for a country with its loaded relations
 */
export interface CountryEntity {
  id: number;
  name: string;
  cca3: string;
  capital: string[];
  region: string | null;
  population: number;
  flagPng: string | null;
  flagSvg: string | null;
  createdAt: Date;
  updatedAt: Date;
  languages: LanguageEntity[];
  currencies: CurrencyEntity[];
}

/**
 * Type for query filters
 */
export interface CountryFilter {
  name?: string;
  region?: string;
  language?: string;
  currency?: string;
  population?: number;
  limit?: number;
  offset?: number;
}

/**
 * API response types
 */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginationMeta {
  total: number;
  pages: number;
  currentPage: number;
  perPage: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface SyncResult {
  added: number;
  updated: number;
  skipped: number;
  total: number;
}
