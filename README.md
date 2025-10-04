# FrightByte - Top Rated Streaming Horror

Discover the highest-rated horror movies and series currently streaming. Rated by critics and audiences across all major platforms.

## Quick Start

### 1. Prerequisites

```bash
# Install Node.js 20+ (required for ARM64 support)
brew install node@20

# Install PostgreSQL
brew install postgresql@15
brew services start postgresql@15

# Create database
createdb frightbyte_dev
```

### 2. Setup Project

```bash
# Clone and install
git clone <repository-url>
cd frightbyte
npm install

# Configure environment
cp .env.example .env
# Edit .env with your database details
```

### 3. Initialize Database

```bash
# Push schema to database
npm run db:push

# Optional: Add sample data
npx tsx server/seed.ts
```

### 4. Start Development

```bash
npm run dev
```

## Development Commands

```bash
# Development server
npm run dev

# Run tests
npx jest
npx jest --watch
npx jest --coverage

# Database operations
npm run db:push          # Push schema changes
npx drizzle-kit generate # Generate migrations

# Type checking
npm run check
```
