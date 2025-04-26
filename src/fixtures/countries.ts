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

export const china = {
  name: {
    common: 'China',
  },
  cca3: 'CHN',
  population: 1402000000,
  region: 'Asia',
  subregion: 'Eastern Asia',
  languages: {
    zho: 'Chinese',
  },
  currencies: {
    CNY: {
      name: 'Chinese yuan',
      symbol: '¥',
    },
  },
  capital: ['Beijing'],
  flags: {
    png: 'https://flagcdn.com/w320/cn.png',
    svg: 'https://flagcdn.com/cn.svg',
  },
};

// Germany in simplified REST Countries format
export const germany = {
  name: {
    common: 'Germany',
  },
  cca3: 'DEU',
  population: 83240525,
  region: 'Europe',
  subregion: 'Western Europe',
  languages: {
    deu: 'German',
  },
  currencies: {
    EUR: {
      name: 'Euro',
      symbol: '€',
    },
  },
  capital: ['Berlin'],
  flags: {
    png: 'https://flagcdn.com/w320/de.png',
    svg: 'https://flagcdn.com/de.svg',
  },
};

export const france = {
  name: {
    common: 'France',
  },
  cca3: 'FRA',
  population: 67391582,
  region: 'Europe',
  subregion: 'Western Europe',
  languages: {
    fra: 'French',
  },
  currencies: {
    EUR: {
      name: 'Euro',
      symbol: '€',
    },
  },
  capital: ['Paris'],
  flags: {
    png: 'https://flagcdn.com/w320/fr.png',
    svg: 'https://flagcdn.com/fr.svg',
  },
};

export const japan = {
  name: {
    common: 'Japan',
  },
  cca3: 'JPN',
  population: 125836021,
  region: 'Asia',
  subregion: 'Eastern Asia',
  languages: {
    jpn: 'Japanese',
  },
  currencies: {
    JPY: {
      name: 'Japanese yen',
      symbol: '¥',
    },
  },
  capital: ['Tokyo'],
  flags: {
    png: 'https://flagcdn.com/w320/jp.png',
    svg: 'https://flagcdn.com/jp.svg',
  },
};

export const unitedStates = {
  name: {
    common: 'United States',
  },
  cca3: 'USA',
  population: 329484123,
  region: 'Americas',
  subregion: 'North America',
  languages: {
    eng: 'English',
  },
  currencies: {
    USD: {
      name: 'United States dollar',
      symbol: '$',
    },
  },
  capital: ['Washington, D.C.'],
  flags: {
    png: 'https://flagcdn.com/w320/us.png',
    svg: 'https://flagcdn.com/us.svg',
  },
};

export const india = {
  name: {
    common: 'India',
  },
  cca3: 'IND',
  population: 1380004385,
  region: 'Asia',
  subregion: 'Southern Asia',
  languages: {
    eng: 'English',
    hin: 'Hindi',
    tam: 'Tamil',
  },
  currencies: {
    INR: {
      name: 'Indian rupee',
      symbol: '₹',
    },
  },
  capital: ['New Delhi'],
  flags: {
    png: 'https://flagcdn.com/w320/in.png',
    svg: 'https://flagcdn.com/in.svg',
  },
};

export const malta = {
  name: {
    common: 'Malta',
  },
  cca3: 'MLT',
  population: 525285,
  region: 'Europe',
  subregion: 'Southern Europe',
  languages: {
    eng: 'English',
    mlt: 'Maltese',
  },
  currencies: {
    EUR: {
      name: 'Euro',
      symbol: '€',
    },
  },
  capital: ['Valletta'],
  flags: {
    png: 'https://flagcdn.com/w320/mt.png',
    svg: 'https://flagcdn.com/mt.svg',
  },
};

export const vatican = {
  name: {
    common: 'Vatican City',
  },
  cca3: 'VAT',
  population: 825,
  region: 'Europe',
  subregion: 'Southern Europe',
  languages: {
    ita: 'Italian',
    lat: 'Latin',
  },
  currencies: {
    EUR: {
      name: 'Euro',
      symbol: '€',
    },
  },
  capital: ['Vatican City'],
  flags: {
    png: 'https://flagcdn.com/w320/va.png',
    svg: 'https://flagcdn.com/va.svg',
  },
};

export const singapore = {
  name: {
    common: 'Singapore',
  },
  cca3: 'SGP',
  population: 5685807,
  region: 'Asia',
  subregion: 'South-Eastern Asia',
  languages: {
    eng: 'English',
    zho: 'Chinese',
    msa: 'Malay',
    tam: 'Tamil',
  },
  currencies: {
    SGD: {
      name: 'Singapore dollar',
      symbol: '$',
    },
  },
  capital: ['Singapore'],
  flags: {
    png: 'https://flagcdn.com/w320/sg.png',
    svg: 'https://flagcdn.com/sg.svg',
  },
};

export const hongKong = {
  name: {
    common: 'Hong Kong',
  },
  cca3: 'HKG',
  population: 7500700,
  region: 'Asia',
  subregion: 'Eastern Asia',
  languages: {
    eng: 'English',
    zho: 'Chinese',
  },
  currencies: {
    HKD: {
      name: 'Hong Kong dollar',
      symbol: '$',
    },
  },
  capital: ['City of Victoria'],
  flags: {
    png: 'https://flagcdn.com/w320/hk.png',
    svg: 'https://flagcdn.com/hk.svg',
  },
};

// Jamaica in simplified REST Countries format
export const jamaica = {
  name: {
    common: 'Jamaica',
  },
  cca3: 'JAM',
  population: 2961161,
  region: 'Americas',
  subregion: 'Caribbean',
  languages: {
    eng: 'English',
    jam: 'Jamaican Patois',
  },
  currencies: {
    JMD: {
      name: 'Jamaican dollar',
      symbol: '$',
    },
  },
  capital: ['Kingston'],
  flags: {
    png: 'https://flagcdn.com/w320/jm.png',
    svg: 'https://flagcdn.com/jm.svg',
  },
};

// Fiji in simplified REST Countries format
export const fiji = {
  name: {
    common: 'Fiji',
  },
  cca3: 'FJI',
  population: 896444,
  region: 'Oceania',
  subregion: 'Melanesia',
  languages: {
    eng: 'English',
    fij: 'Fijian',
    hif: 'Fiji Hindi',
  },
  currencies: {
    FJD: {
      name: 'Fijian dollar',
      symbol: '$',
    },
  },
  capital: ['Suva'],
  flags: {
    png: 'https://flagcdn.com/w320/fj.png',
    svg: 'https://flagcdn.com/fj.svg',
  },
};

// Australia in simplified REST Countries format
export const australia = {
  name: {
    common: 'Australia',
  },
  cca3: 'AUS',
  population: 25687041,
  region: 'Oceania',
  subregion: 'Australia and New Zealand',
  languages: {
    eng: 'English',
  },
  currencies: {
    AUD: {
      name: 'Australian dollar',
      symbol: '$',
    },
  },
  capital: ['Canberra'],
  flags: {
    png: 'https://flagcdn.com/w320/au.png',
    svg: 'https://flagcdn.com/au.svg',
  },
};

// South Africa in simplified REST Countries format
export const southAfrica = {
  name: {
    common: 'South Africa',
  },
  cca3: 'ZAF',
  population: 59308690,
  region: 'Africa',
  subregion: 'Southern Africa',
  languages: {
    afr: 'Afrikaans',
    eng: 'English',
    nbl: 'Southern Ndebele',
    nso: 'Northern Sotho',
    sot: 'Southern Sotho',
    ssw: 'Swati',
    tsn: 'Tswana',
    tso: 'Tsonga',
    ven: 'Venda',
    xho: 'Xhosa',
    zul: 'Zulu',
  },
  currencies: {
    ZAR: {
      name: 'South African rand',
      symbol: 'R',
    },
  },
  capital: ['Pretoria', 'Cape Town', 'Bloemfontein'],
  flags: {
    png: 'https://flagcdn.com/w320/za.png',
    svg: 'https://flagcdn.com/za.svg',
  },
};

// Brazil in simplified REST Countries format
export const brazil = {
  name: {
    common: 'Brazil',
  },
  cca3: 'BRA',
  population: 212559409,
  region: 'Americas',
  subregion: 'South America',
  languages: {
    por: 'Portuguese',
  },
  currencies: {
    BRL: {
      name: 'Brazilian real',
      symbol: 'R$',
    },
  },
  capital: ['Brasília'],
  flags: {
    png: 'https://flagcdn.com/w320/br.png',
    svg: 'https://flagcdn.com/br.svg',
  },
};

// Russia in simplified REST Countries format
export const russia = {
  name: {
    common: 'Russia',
  },
  cca3: 'RUS',
  population: 144104080,
  region: 'Europe',
  subregion: 'Eastern Europe',
  languages: {
    rus: 'Russian',
  },
  currencies: {
    RUB: {
      name: 'Russian ruble',
      symbol: '₽',
    },
  },
  capital: ['Moscow'],
  flags: {
    png: 'https://flagcdn.com/w320/ru.png',
    svg: 'https://flagcdn.com/ru.svg',
  },
};

export const europeanCountries = [germany, france, malta, vatican, russia];
export const asianCountries = [japan, india, singapore, hongKong, china];
export const countriesWithEuro = [germany, france, malta, vatican];
export const islandCountries = [japan, jamaica, fiji, australia, malta];
export const countriesWithMultipleLanguages = [
  malta,
  india,
  singapore,
  southAfrica,
  fiji,
  hongKong,
];
export const smallPopulationCountries = [vatican, malta, fiji];
export const largePopulationCountries = [
  india,
  china,
  unitedStates,
  brazil,
  russia,
];
export const mostPopulousCountries = [
  china,
  india,
  unitedStates,
  brazil,
  japan,
];
export const largestAreaCountries = [
  russia,
  china,
  unitedStates,
  brazil,
  australia,
];
export const countriesWithManyCapitals = [southAfrica];
export const countriesInAmericas = [unitedStates, brazil, jamaica];
export const countriesInOceania = [australia, fiji];
export const countriesInAfrica = [southAfrica];
