# Portfolio Backend API

A robust authentication API built with Next.js App Router, designed specifically for portfolio projects.

## Features

- 🔐 Complete authentication system (register, login, logout, refresh tokens)
- 🔑 JWT-based authentication with access and refresh tokens
- 🛡️ Password hashing with bcrypt
- 🚦 Rate limiting for security
- 🌐 CORS support for frontend integration
- 📁 Modular and scalable architecture
- 🗃️ PostgreSQL with Prisma ORM
- 📝 TypeScript for type safety

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

## API Documentation

See the complete API documentation: [`src/app/docs/README-AUTH.md`](./src/app/docs/README-AUTH.md)

## Testing

Run the API test suite:

```bash
# Run all endpoint tests
./src/app/test/test-api.sh
```

## Project Structure

```
src/
├── app/
│   ├── api/v1/           # API endpoints
│   ├── docs/             # Documentation
│   └── test/             # Testing scripts
├── lib/                  # Core libraries
│   ├── auth/            # Authentication utilities
│   └── utils/           # Helper functions
└── middleware/          # Request middleware
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## API Routes

This directory contains example API routes for the headless API app.

For more details, see [route.js file convention](https://nextjs.org/docs/app/api-reference/file-conventions/route).
