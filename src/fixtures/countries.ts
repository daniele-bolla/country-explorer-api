export const validCountryInput = {
  name: 'Test Country',
  cca3: 'TST',
  capital: ['Test City'],
  region: 'Test Region',
  subregion: 'Test Subregion',
  population: 1000000,
  flagSvg: 'https://example.com/flag.svg',
  flagPng: 'https://example.com/flag.png',
  languages: [{ code: 'tst', name: 'Test Language' }],
  currencies: [{ code: 'TSC', name: 'Test Currency' }],
};

export const invalidCountryInput = {
  name: 'Invalid Country',
  cca3: 'INVALID', // Too long for cca3
  population: -100, // Negative population
};

export const updateCountryInput = {
  name: 'Updated Country',
  population: 2000000,
  languages: [
    { code: 'tst', name: 'Test Language' },
    { code: 'new', name: 'New Language' },
  ],
};
