import 'dotenv/config';

// src/config/index.js
const environments = ['development', 'test', 'production'];
const env = process.env.NODE_ENV || 'development';

if (!environments.includes(env)) {
  console.warn(
    `Warning: Invalid NODE_ENV '${env}'. Defaulting to 'development'`,
  );
}

// Base configuration
const baseConfig = {
  server: {
    port: process.env.PORT || 3000,
    host: process.env.HOST || 'localhost',
  },
  api: {
    countriesBaseUrl: 'https://restcountries.com/v3.1',
  },
};

// Environment-specific configurations
const configs = {
  development: {
    ...baseConfig,
    db: {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'countries_db',
    },
  },

  test: {
    ...baseConfig,
    db: {
      host: process.env.TEST_DB_HOST || 'localhost',
      port: parseInt(process.env.TEST_DB_PORT || '5433'),
      user: process.env.TEST_DB_USER || 'postgres',
      password: process.env.TEST_DB_PASSWORD || 'postgres',
      database: process.env.TEST_DB_NAME || 'countries_test_db',
    },
  },

  production: {
    ...baseConfig,
    db: {
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '5432'),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      ssl:
        process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    },
  },
};

export default configs[env as keyof typeof configs];
