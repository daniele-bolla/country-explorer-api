export const countryRelations = relations(countriesTable, ({ manyToMany }) => ({
  languages: manyToMany(languagesTable, countryLanguages, {
    column: countryLanguages.countryId,
    inverseColumn: countryLanguages.languageId,
  }),
  currencies: manyToMany(currenciesTable, countryCurrencies, {
    column: countryCurrencies.countryId,
    inverseColumn: countryCurrencies.currencyId,
  }),
}));
