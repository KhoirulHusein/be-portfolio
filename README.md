# Portfolio Backend API

A robust authentication and RBAC API built with Next.js App Router, designed specifically for portfolio projects.

## Features

- 🔐 Complete authentication system (register, login, logout, refresh tokens)
- 🔑 JWT-based authentication with access and refresh tokens
- � Role-Based Access Control (RBAC) with permissions
- �🛡️ Password hashing with bcrypt
- 🚦 Rate limiting for security
- 🌐 CORS support for frontend integration
- 📁 Modular and scalable architecture
- 🗃️ PostgreSQL with Prisma ORM
- 📝 TypeScript for type safety
- ✅ Comprehensive test suite with Vitest

## Quick Start

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database URL and JWT secrets

# Set up database
npx prisma migrate dev --name init
npx prisma generate

# Start development server
pnpm dev
```

The API will be available at `http://localhost:4000`

## Documentation

- 📖 **[Authentication](./src/app/docs/auth/)** - Auth system documentation
- 👥 **[RBAC](./src/app/docs/rbac/)** - Role-Based Access Control documentation
- 🏗️ **[Project Structure](./src/app/docs/)** - Architecture and organization

## Testing

Run the comprehensive test suite:

```bash
# Run all tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Reset and prepare test environment
pnpm test:reset && pnpm test:prepare
```

## Project Structure

```
src/
├── app/
│   ├── api/v1/           # API endpoints
│   │   ├── auth/        # Authentication endpoints
│   │   └── admin/       # RBAC admin endpoints
│   ├── docs/            # Documentation
│   │   ├── auth/        # Auth documentation
│   │   └── rbac/        # RBAC documentation
│   └── test/            # Test files (organized by domain)
│       ├── setup/       # Test utilities and factories
│       └── unit/        # Unit tests
│           ├── auth/    # Auth tests
│           └── rbac/    # RBAC tests
├── lib/                 # Core libraries
│   ├── auth/           # Authentication utilities
│   └── utils/          # Helper functions
└── middleware/         # Request middleware
```

## Learn More

To learn more about the technologies used:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API
- [Prisma Documentation](https://www.prisma.io/docs) - database ORM
- [Vitest Documentation](https://vitest.dev/) - testing framework
- [JWT Documentation](https://jwt.io/) - JSON Web Tokens

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
