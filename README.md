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

## Database Schema

The database uses a normalized schema with the following tables:
regions
┃
┣━━ subregions
┃ ┃
┣━━━━┻━━ countries ━━━┓
┃
languages ━━━━━━━━━━━━━━┫
┃
currencies ━━━━━━━━━━━━━┛

Collapse

### Entity Relationships

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

1. Start the database:
   ```bash
   docker-compose up -d
   Apply schema:
   ```

BASH

npm run db:push
Start the server:

BASH

npm run dev
API Usage
BASH

# Get all countries

GET /api/countries

# Filter by population

GET /api/countries?populationGte=10000000

# Sort by name

GET /api/countries?sortField=name&sortDirection=desc
Testing
BASH

npm test
Tests use a separate database (port 5433) that's automatically set up with the schema.

License
MIT
