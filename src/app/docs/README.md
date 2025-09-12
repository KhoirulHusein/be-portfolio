# Next.js Portfolio Backend Documentation

## Overview
This directory contains comprehensive documentation for the Portfolio Backend API project with role-based access control (RBAC) and standardized environment management.

## 📁 Project Structure
```
src/
  app/
    docs/           # Documentation (this folder)
      auth/         # Authentication & RBAC docs
      api/          # API endpoint documentation
      rbac/         # Role-based access control docs
    api/            # API routes
      auth/         # Authentication endpoints
      rbac/         # RBAC management endpoints
      admin/        # Admin-only endpoints
```

## 🚀 Quick Start

### Development Environment
```bash
# Install dependencies
pnpm install

# Set up development database
pnpm prisma:migrate:dev

# Create superadmin user (development)
pnpm rbac:bootstrap:dev

# Start development server
pnpm dev
```

### Environment Management
The project uses **separated environments** with dedicated databases:

- **Development**: `nextjs_portfolio_dev` database
- **Test**: `nextjs_portfolio_test` database  
- **Production**: `nextjs_portfolio_prod` database

Environment files:
- `.env.development` - Development configuration
- `.env.test` - Testing configuration
- `.env.production` - Production configuration
- `.env.example` - Template with all required variables

## 📚 Documentation Structure
- **[auth/](./auth/)** - Authentication & RBAC system documentation
- **[rbac/](./rbac/)** - Role-Based Access Control detailed docs
- **[api/](./api/)** - API endpoint documentation
- **[testing.md](./testing.md)** - Testing guide and best practices

## 🛠 Available Scripts

### Development
```bash
pnpm dev            # Start dev server with development environment
pnpm build:dev      # Build for development
pnpm start:dev      # Start built development server
```

### Testing
```bash
pnpm test           # Run tests with test environment
pnpm test:watch     # Run tests in watch mode
```

### Database Operations
```bash
pnpm prisma:migrate:dev    # Run migrations (development)
pnpm prisma:migrate:test   # Run migrations (test)
pnpm prisma:migrate:prod   # Run migrations (production)
pnpm prisma:studio         # Open Prisma Studio
pnpm prisma:reset:dev      # Reset development database
```

### RBAC Bootstrap
```bash
pnpm rbac:bootstrap:dev    # Create superadmin (development)
pnpm rbac:bootstrap:prod   # Create superadmin (production)
```

## 🔧 Configuration

### Database Setup
1. Create PostgreSQL databases:
```sql
CREATE DATABASE nextjs_portfolio_dev;
CREATE DATABASE nextjs_portfolio_test;
CREATE DATABASE nextjs_portfolio_prod;
```

2. Update environment files with your database credentials
3. Run migrations: `pnpm prisma:migrate:dev`
4. Bootstrap superadmin: `pnpm rbac:bootstrap:dev`

## 🧪 Development & Testing
- All test files are organized under `src/app/test/unit/`
- Import aliases use `@/` prefix for consistency
- Test utilities and factories are in `src/app/test/setup/`
- Tests use Vitest with comprehensive coverage
- Each environment has isolated database for proper testing

## 📝 Key Features
- **Environment Separation**: Clean dev/test/prod isolation
- **Database Per Environment**: Separate PostgreSQL databases
- **RBAC System**: Role-based access control with permissions
- **Idempotent Bootstrap**: Per-database superadmin creation
- **Simplified Scripts**: Minimal, clear npm script structure
