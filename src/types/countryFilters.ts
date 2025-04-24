import { PaginationOptions } from './pagination';

export interface CountryFilter {
  name?: string;
  cca3?: string;
  region?: string;
  subregion?: string;
  language?: string;
  currency?: string;
  population?: {
    min?: number;
    max?: number;
  };
}

export interface CountrySortOptions {
  field: 'name' | 'population' | 'region' | 'cca3' | 'capital';
  direction: 'asc' | 'desc';
}

export interface CountryListOptions extends PaginationOptions {
  filter?: CountryFilter;

  sort?: CountrySortOptions;

  includeRelations?: boolean;
}
