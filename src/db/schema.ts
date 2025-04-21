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
} from 'drizzle-orm/pg-core';
export const countriesTable = pgTable('countries', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  cca3: varchar('cca3', { length: 3 }).notNull().unique(),
  capital: text('capital').array(),
  region: varchar('region', { length: 100 }),
  population: bigint('population', { mode: 'number' }),
  flagPng: text('flag_png'),
  flagSvg: text('flag_svg'),
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

export const countryCurrencies = pgTable(
  'country_currencies',
  {
    countryId: integer('country_id')
      .notNull()
      .references(() => countriesTable.id),
    currencyId: integer('currency_id')
      .notNull()
      .references(() => currenciesTable.id),
  },
  (t) => [primaryKey({ columns: [t.countryId, t.currencyId] })],
);
export const countryLanguages = pgTable(
  'country_languages',
  {
    countryId: integer('country_id')
      .notNull()
      .references(() => countriesTable.id),
    languageId: integer('language_id')
      .notNull()
      .references(() => languagesTable.id),
  },
  (t) => [primaryKey({ columns: [t.countryId, t.languageId] })],
);

// Define relations for the countries table.
export const countryRelations = relations(countriesTable, ({ many }) => ({
  languages: many(countryLanguages),
  currencies: many(countryCurrencies),
}));

// Define relations for the countryLanguages join table.
export const countryLanguagesRelations = relations(
  countryLanguages,
  ({ one }) => ({
    country: one(countriesTable, {
      fields: [countryLanguages.countryId],
      references: [countriesTable.id],
    }),
    language: one(languagesTable, {
      fields: [countryLanguages.languageId],
      references: [languagesTable.id],
    }),
  }),
);

// Define relations for the countryCurrencies join table.
export const countryCurrenciesRelations = relations(
  countryCurrencies,
  ({ one }) => ({
    country: one(countriesTable, {
      fields: [countryCurrencies.countryId],
      references: [countriesTable.id],
    }),
    currency: one(currenciesTable, {
      fields: [countryCurrencies.currencyId],
      references: [currenciesTable.id],
    }),
  }),
);

// Export types for TypeScript

export type Country = typeof countriesTable.$inferSelect;
export type Language = typeof languagesTable.$inferSelect;
export type Currency = typeof currenciesTable.$inferSelect;
