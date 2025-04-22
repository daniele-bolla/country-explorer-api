import { relations } from 'drizzle-orm';
import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  bigint,
  timestamp,
  primaryKey,
  boolean,
} from 'drizzle-orm/pg-core';

export const regionsTable = pgTable('regions', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const subregionsTable = pgTable('subregions', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  regionId: integer('region_id')
    .notNull()
    .references(() => regionsTable.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const countriesTable = pgTable('countries', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  cca3: varchar('cca3', { length: 3 }).notNull().unique(),
  capital: text('capital').array(),
  regionId: integer('region_id').references(() => regionsTable.id),
  subregionId: integer('subregion_id').references(() => subregionsTable.id),
  population: bigint('population', { mode: 'number' }),
  flagSvg: text('flag_svg'),
  flagPng: text('flag_png'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const languagesTable = pgTable('languages', {
  id: serial('id').primaryKey(),
  code: varchar('code', { length: 10 }).notNull().unique(),
  name: varchar('name', { length: 100 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const currenciesTable = pgTable('currencies', {
  id: serial('id').primaryKey(),
  code: varchar('code', { length: 10 }).notNull().unique(),
  name: varchar('name', { length: 100 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const countryCurrenciesTable = pgTable(
  'country_currencies',
  {
    countryId: integer('country_id')
      .notNull()
      .references(() => countriesTable.id, { onDelete: 'cascade' }),
    currencyId: integer('currency_id')
      .notNull()
      .references(() => currenciesTable.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.countryId, t.currencyId] })],
);

export const countryLanguagesTable = pgTable(
  'country_languages',
  {
    countryId: integer('country_id')
      .notNull()
      .references(() => countriesTable.id, { onDelete: 'cascade' }),
    languageId: integer('language_id')
      .notNull()
      .references(() => languagesTable.id, { onDelete: 'cascade' }),
    official: boolean('official').default(false),
  },
  (t) => [primaryKey({ columns: [t.countryId, t.languageId] })],
);

/**
 * Relations:
 * - A Region has many countries
 * - A Region has many subregions
 * - A Country has one region
 * - A Country has one subregion
 * - A Country has many languages and currencies
 * - A Language has many countries
 * - A Currency has many countries
 */

export const regionRelations = relations(regionsTable, ({ many }) => ({
  countries: many(countriesTable),
  subregions: many(subregionsTable),
}));

export const subregionRelations = relations(
  subregionsTable,
  ({ one, many }) => ({
    region: one(regionsTable, {
      fields: [subregionsTable.regionId],
      references: [regionsTable.id],
    }),
    countries: many(countriesTable),
  }),
);

export const countryRelations = relations(countriesTable, ({ many, one }) => ({
  languages: many(countryLanguagesTable),
  currencies: many(countryCurrenciesTable),
  region: one(regionsTable, {
    fields: [countriesTable.regionId],
    references: [regionsTable.id],
  }),
  subregion: one(subregionsTable, {
    fields: [countriesTable.subregionId],
    references: [subregionsTable.id],
  }),
}));

export const languageRelations = relations(languagesTable, ({ many }) => ({
  countries: many(countryLanguagesTable),
}));

export const currencyRelations = relations(currenciesTable, ({ many }) => ({
  countries: many(countryCurrenciesTable),
}));

export const countryLanguagesRelations = relations(
  countryLanguagesTable,
  ({ one }) => ({
    country: one(countriesTable, {
      fields: [countryLanguagesTable.countryId],
      references: [countriesTable.id],
    }),
    language: one(languagesTable, {
      fields: [countryLanguagesTable.languageId],
      references: [languagesTable.id],
    }),
  }),
);

export const countryCurrenciesRelations = relations(
  countryCurrenciesTable,
  ({ one }) => ({
    country: one(countriesTable, {
      fields: [countryCurrenciesTable.countryId],
      references: [countriesTable.id],
    }),
    currency: one(currenciesTable, {
      fields: [countryCurrenciesTable.currencyId],
      references: [currenciesTable.id],
    }),
  }),
);

export type Region = typeof regionsTable.$inferSelect;
export type Subregion = typeof subregionsTable.$inferSelect;
export type Country = typeof countriesTable.$inferSelect;
export type Language = typeof languagesTable.$inferSelect;
export type Currency = typeof currenciesTable.$inferSelect;
