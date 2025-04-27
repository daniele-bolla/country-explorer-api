Collapse

# Country Explorer API

A REST API for exploring country information built with TypeScript, PostgreSQL, and Drizzle ORM.

## Overview

This API provides access to country data including regions, languages, currencies, and demographics through a clean RESTful interface.

## Tech Stack

- TypeScript
- Node.js
- PostgreSQL
- Drizzle ORM
- Docker
- Jest

## Database Schema (Realtions)

- **Regions**: Geographic regions (e.g., Europe, Asia)

  - Has many subregions
  - Has many countries

- **Subregions**: Geographic areas within regions (e.g., Northern Europe)

  - Belongs to one region
  - Has many countries

- **Countries**: Individual countries with properties

  - Belongs to one region
  - Belongs to one subregion
  - Has many languages (many-to-many)
  - Has many currencies (many-to-many)

- **Languages**: Languages spoken worldwide

  - Used in many countries (many-to-many)

- **Currencies**: Currencies used worldwide
  - Used in many countries (many-to-many)

Many-to-many relationships are implemented through junction tables:

- `country_languages`: Links countries to their languages
- `country_currencies`: Links countries to their currencies

## Setup

1. Start DBs

```bash
docker-compose up -d
```

2. Set up DBs:

```bash
npm run db:push
npm run db:push:test
```

2. Start the webserver:

```bash
npm run dev
```

3. Test:

```bash
npm run test
```

# Swagger

Documentation available at `http://{ENV.HOST}:{ENV.PORT}/documentation`

# Country Explorer API Implementation

I have implemented a simple Country Explorer API for this task. The application imports data from [restcountries.com](https://restcountries.com/) and provides endpoints to query this information.

## Data Import Approach

Rather than creating individual API calls for each country, I implemented a bulk creation that imports all countries at once from the **all countries** endpoint:

1. **Fetches data** from restcountries.com
2. **Transforms** the data to match the database schema, selecting only the fields we need
3. **Performs a batch insert** into the database

> The bulk import automatically runs when the database is empty, populating it with all countries.  
> I considered adding a dedicated import script (e.g., `npm run import`) but prioritized other features instead.

## API Design Decisions

I chose to implement a single, powerful `GET /api/countries` endpoint with comprehensive filtering, sorting, and pagination capabilities. This endpoint supports:

- **Filtering** by region, subregion, population, area, language, currency, etc.
- **Sorting** by various fields in ascending/descending order
- **Pagination** with customizable page size

However, this led to more complex code, particularly around joins and filtering.

## Implementation Challenges

The implementation of the `getCountries` method became quite complex due to:

- Multiple table joins required for the relationships (regions, subregions, languages, currencies)
- The need to support various filtering parameters
- Limitations in Drizzle ORM’s current beta version

I initially hoped to use Drizzle’s `findMany` feature with relationship queries, but this wasn’t feasible with the current version, requiring more manual query construction.

## Alternative Approaches Considered

I could have opted for splitting the API into multiple dedicated endpoints:

```http
GET /api/countries/byregion/{name}/?{filtering&sorting}
GET /api/countries/bylanguage/{name}/?{filtering&sorting}
GET /api/countries/bycurrency/{name}/?{filtering&sorting}
```

## Filtering and Sorting

### Filter by minimum population

GET /api/countries?populationMin=10000000

### Filter by maximum population

GET /api/countries?populationMax=5000000

### Filter by region

GET /api/countries?region=Europe

### Filter by subregion

GET /api/countries?subregion=Western%20Europe

### Filter by language code or name

GET /api/countries?language=eng

### Filter by name

GET /api/countries?name=united

### Filter by curency code or name

GET /api/countries?currency=EUR

### Sort by name (ascending - default)

GET /api/countries?sortField=name

### Sort by name (descending)

GET /api/countries?sortField=name&sortDirection=desc

### Sort by capital city

GET /api/countries?sortField=capital

### Sort by population (ascending)

GET /api/countries?sortField=population

### Sort by population (descending)

GET /api/countries?sortField=population&sortDirection=desc

### First page with default limit (25)

GET /api/countries

### Specific page

GET /api/countries?page=2

### Adjust items per page

GET /api/countries?page=1&pageSize=10

## Error Handling and Logging

Routes use Boom for errors and Pino for logs, currently only in `countriesRoutes.ts`. I’ll add a global error handler and a centralized Pino logger in `server.ts` and the API service.

## Tests

Unit tests (mocked) run on separate DB.

## Caching

Caching is not still implmented but aiming to use Redis and Catbox.
