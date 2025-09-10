# TESTING-AUTH.md

## Authentication Testing Guide

Dokumentasi lengkap untuk testing sistem autentikasi Next.js App Router dengan Vitest.

### 📋 **Setup & Installation**

#### 1. Install Dependencies
```bash
pnpm add -D vitest @vitest/coverage-v8 @types/node dotenv
```

#### 2. Setup Test Database
```bash
# Buat database test PostgreSQL
psql "postgresql://postgres@localhost:5432/postgres" -c "CREATE DATABASE nextjs_portfolio_test;"

# Apply migrations ke test database
DATABASE_URL="postgresql://postgres@localhost:5432/nextjs_portfolio_test?schema=public" npx prisma migrate deploy

# Generate Prisma client
npx prisma generate
```

### 🗂️ **Struktur Folder Testing**

```
src/app/test/
├── setup/
│   ├── test-env.ts          # Environment setup & validation
│   ├── prisma-clean.ts      # Database cleanup between tests
│   └── request-helpers.ts   # HTTP request utilities
└── unit/
    ├── auth.register.test.ts
    ├── auth.login.test.ts
    ├── auth.me.test.ts
    ├── auth.refresh.test.ts
    ├── auth.logout.test.ts
    ├── auth.change-password.test.ts
    └── auth.cors-preflight.test.ts
```

### ⚙️ **Environment Configuration**

#### .env.test
```env
# PostgreSQL test database
DATABASE_URL="postgresql://postgres@localhost:5432/nextjs_portfolio_test?schema=public"

# JWT secrets (test values)
JWT_ACCESS_SECRET="test-access-secret"
JWT_REFRESH_SECRET="test-refresh-secret"
JWT_ACCESS_EXPIRES="15m"
JWT_REFRESH_EXPIRES="7d"

# CORS origins
CORS_ORIGINS="http://localhost:3000,http://localhost:4000"
```

### 📝 **Running Tests**

#### Scripts Available
```json
{
  "test": "vitest run",
  "test:unit": "vitest run --dir src/app/test/unit",
  "test:watch": "vitest",
  "test:coverage": "vitest run --coverage",
  "test:prepare": "prisma migrate deploy",
  "test:reset": "prisma migrate reset --force --skip-generate --skip-seed"
}
```

#### Commands
```bash
# Run all tests
pnpm test

# Run only unit tests
pnpm test:unit

# Watch mode
pnpm test:watch

# Coverage report
pnpm test:coverage

# Prepare test database
pnpm test:prepare

# Reset test database
pnpm test:reset
```

### 🧪 **Test Coverage**

#### Endpoints Tested
- ✅ **POST /api/v1/auth/register** - User registration
- ✅ **POST /api/v1/auth/login** - User authentication  
- ✅ **GET /api/v1/auth/me** - Get current user
- ✅ **POST /api/v1/auth/refresh** - Token refresh
- ✅ **POST /api/v1/auth/logout** - User logout
- ✅ **PUT /api/v1/auth/change-password** - Password change
- ✅ **OPTIONS (all endpoints)** - CORS preflight

#### Test Scenarios
- ✅ Success cases
- ✅ Validation errors (400)
- ✅ Authentication errors (401)  
- ✅ Conflict errors (409)
- ✅ CORS preflight handling
- ✅ Database state verification

### 🛠️ **Technical Configuration**

#### vitest.config.ts
```typescript
import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  test: {
    environment: 'node',
    include: ['src/app/test/**/*.test.ts'],
    setupFiles: ['src/app/test/setup/test-env.ts'],
    hookTimeout: 30000,
    testTimeout: 30000,
    restoreMocks: true,
    globals: true,
  },
})
```

#### Runtime Configuration
Semua route handlers auth harus menggunakan Node.js runtime:
```typescript
export const runtime = 'nodejs'
```

#### Alias Import
Tests menggunakan alias `@/` untuk import yang clean:
```typescript
import { prisma } from '@/lib/prisma'
import { applyCORS } from '@/lib/auth'
```

### 🔧 **Database Management**

#### Test Database Cleanup
Database dibersihkan otomatis antar test:
```typescript
beforeEach(async () => {
  // Order matters due to foreign keys
  await prisma.refreshToken.deleteMany({})
  await prisma.user.deleteMany({})
})
```

#### Reset Test Database
```bash
# Reset dan apply ulang migrations
pnpm test:reset
```

### 🚨 **Troubleshooting**

#### Common Issues

1. **Database Connection**
   ```bash
   # Pastikan PostgreSQL running
   # Pastikan test database exists
   # Check .env.test DATABASE_URL
   ```

2. **Prisma Client Issues**
   ```bash
   npx prisma generate
   ```

3. **Migration Issues**
   ```bash
   DATABASE_URL="postgresql://postgres@localhost:5432/nextjs_portfolio_test?schema=public" npx prisma migrate deploy
   ```

4. **Rate Limiting in Tests**
   Tests sudah mock rate limiting functions untuk menghindari interference.

### ✅ **Success Indicators**

Testing setup berhasil jika:
- ✅ Vitest dapat menjalankan semua test files
- ✅ Database test terisolasi dari development
- ✅ Semua endpoint auth tercakup
- ✅ Coverage report dapat dijalankan
- ✅ CORS preflight tests pass

### 📊 **Expected Test Results**

```bash
✓ Auth - Register (5 tests)
✓ Auth - Login (6 tests)  
✓ Auth - Me (5 tests)
✓ Auth - Refresh (5 tests)
✓ Auth - Logout (5 tests)
✓ Auth - Change Password (6 tests)
✓ Auth - CORS Preflight (8 tests)

Test Files: 7 passed
Tests: 40 passed
```

---

**Testing framework siap untuk comprehensive authentication testing dengan isolasi database dan mocking yang proper.**
