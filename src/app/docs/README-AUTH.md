# Authentication Module Documentation

## Overview

This is a complete authentication system built for Next.js App Router (API only) with the following features:

- User registration and login
- JWT-based authentication with access and refresh tokens
- Password hashing with bcrypt
- Rate limiting for login attempts
- CORS support
- Modular and scalable architecture

## Tech Stack

- **Next.js 15.5.2** (App Router, Route Handlers)
- **TypeScript**
- **Prisma 6.15.0** (ORM with PostgreSQL for production)
- **bcrypt** (Password hashing)
- **jsonwebtoken** (JWT tokens)
- **CORS** support

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   └── v1/
│   │       ├── health/route.ts
│   │       └── auth/
│   │           ├── register/route.ts
│   │           ├── login/route.ts
│   │           ├── me/route.ts
│   │           ├── refresh/route.ts
│   │           ├── logout/route.ts
│   │           └── change-password/route.ts
│   ├── docs/
│   │   └── README-AUTH.md        (This documentation)
│   └── test/
│       └── test-api.sh           (API testing script)
├── lib/
│   ├── prisma.ts                 (Database client)
│   ├── auth/
│   │   ├── jwt.ts                (JWT utilities)
│   │   ├── password.ts           (Password hashing)
│   │   ├── cors.ts               (CORS handling)
│   │   ├── rate-limit.ts         (Rate limiting)
│   │   └── errors.ts             (Custom error classes)
│   └── utils/
│       ├── response.ts           (API response helpers)
│       └── validators/
│           └── auth.ts           (Input validation)
├── middleware/
│   └── auth-middleware.ts        (JWT extraction helper)
└── prisma/
    ├── schema.prisma
    └── migrations/
```

## Files Location

- **Documentation**: `src/app/docs/README-AUTH.md`
- **API Testing Script**: `src/app/test/test-api.sh`

## Database Schema

```prisma
model User {
  id           String   @id @default(cuid())
  email        String   @unique
  username     String   @unique
  passwordHash String
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  refreshTokens RefreshToken[]

  @@index([email])
  @@index([username])
}

model RefreshToken {
  id        String   @id @default(cuid())
  userId    String
  token     String   @unique
  revoked   Boolean  @default(false)
  expiresAt DateTime
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id])

  @@index([userId])
  @@index([expiresAt])
  @@index([token])
}
```

## Setup Instructions

### 1. Environment Variables

Copy `.env.example` to `.env` and update the values:

```bash
cp .env.example .env
```

Required environment variables:
- `DATABASE_URL`: Database connection string
- `JWT_ACCESS_SECRET`: Secret for access tokens (minimum 32 characters)
- `JWT_REFRESH_SECRET`: Secret for refresh tokens (minimum 32 characters)
- `JWT_ACCESS_EXPIRES`: Access token expiry (default: 15m)
- `JWT_REFRESH_EXPIRES`: Refresh token expiry (default: 7d)
- `CORS_ORIGINS`: Allowed origins for CORS (comma-separated)

### 2. Database Setup

Make sure you have PostgreSQL running and create a database for the project.

```bash
# Install dependencies
pnpm install

# Run database migration
npx prisma migrate dev --name init

# Generate Prisma client
npx prisma generate

# (Optional) Open Prisma Studio
npx prisma studio
```

**Note**: The system uses PostgreSQL in production. Make sure your `DATABASE_URL` in `.env` points to your PostgreSQL database.

### 3. Start Development Server

```bash
pnpm run dev
```

The API will be available at `http://localhost:4000`

## API Endpoints

### Base URL: `http://localhost:4000/api/v1`

### Health Check
- **GET** `/health`
- Returns server status and uptime

### Authentication Endpoints

#### Register
- **POST** `/auth/register`
- **Body**: `{ "email": "user@example.com", "username": "username", "password": "password123" }`
- **Response**: `{ "success": true, "data": { "id": "...", "email": "...", "username": "...", "createdAt": "..." } }`

#### Login
- **POST** `/auth/login`
- **Body**: `{ "emailOrUsername": "user@example.com", "password": "password123" }`
- **Response**: `{ "success": true, "data": { "accessToken": "...", "refreshToken": "...", "user": {...} } }`

#### Get Current User
- **GET** `/auth/me`
- **Headers**: `Authorization: Bearer <access_token>`
- **Response**: `{ "success": true, "data": { "id": "...", "email": "...", "username": "..." } }`

#### Refresh Token
- **POST** `/auth/refresh`
- **Body**: `{ "refreshToken": "..." }`
- **Response**: `{ "success": true, "data": { "accessToken": "...", "refreshToken": "...", "user": {...} } }`

#### Logout
- **POST** `/auth/logout`
- **Body**: `{ "refreshToken": "..." }`
- **Response**: `{ "success": true, "data": { "success": true } }`

#### Change Password
- **PUT** `/auth/change-password`
- **Headers**: `Authorization: Bearer <access_token>`
- **Body**: `{ "currentPassword": "...", "newPassword": "..." }`
- **Response**: `{ "success": true, "data": { "success": true } }`

## Example Usage

### 1. Register a new user
```bash
curl -X POST http://localhost:4000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "username": "testuser", "password": "password123"}'
```

### 2. Login
```bash
curl -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"emailOrUsername": "test@example.com", "password": "password123"}'
```

### 3. Get current user (use access token from login response)
```bash
curl -X GET http://localhost:4000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 4. Refresh token
```bash
curl -X POST http://localhost:4000/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "YOUR_REFRESH_TOKEN"}'
```

### 5. Change password
```bash
curl -X PUT http://localhost:4000/api/v1/auth/change-password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{"currentPassword": "password123", "newPassword": "newpassword123"}'
```

### 6. Logout
```bash
curl -X POST http://localhost:4000/api/v1/auth/logout \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "YOUR_REFRESH_TOKEN"}'
```

## Response Format

All API responses follow this format:

```json
{
  "success": true|false,
  "data": <payload|null>,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error message"
  }
}
```

## Error Codes

- `VALIDATION_ERROR`: Input validation failed
- `INVALID_CREDENTIALS`: Invalid email/username or password
- `USER_EXISTS`: User already exists
- `UNAUTHORIZED`: Missing or invalid authentication
- `TOKEN_EXPIRED`: Access token has expired
- `TOKEN_REVOKED`: Refresh token has been revoked
- `TOO_MANY_REQUESTS`: Rate limit exceeded
- `METHOD_NOT_ALLOWED`: HTTP method not supported
- `INTERNAL_ERROR`: Server error

## Security Features

- **Password Hashing**: Passwords are hashed using bcrypt with 12 salt rounds
- **JWT Tokens**: Access tokens expire in 15 minutes, refresh tokens in 7 days
- **Rate Limiting**: Login attempts are limited to 5 per minute per IP
- **CORS**: Configurable CORS support for cross-origin requests
- **Token Revocation**: Refresh tokens can be revoked and are invalidated on password change
- **Input Validation**: All input is validated for security and correctness

## Architecture Notes

- **Modular Design**: Each component is separated for easy maintenance
- **Error Handling**: Centralized error handling with custom error classes
- **Type Safety**: Full TypeScript support throughout the codebase
- **Database Abstraction**: Uses Prisma ORM for type-safe database operations
- **Scalability**: Rate limiting and refresh token management for production use

## Development

- The system uses SQLite for development (easy setup)
- Can be easily switched to PostgreSQL for production
- All endpoints support CORS and OPTIONS preflight requests
- Rate limiting is implemented with in-memory storage (can be switched to Redis)

## Production Considerations

1. **Database**: Switch from SQLite to PostgreSQL
2. **Rate Limiting**: Use Redis instead of in-memory storage
3. **Secrets**: Use strong, randomly generated secrets
4. **HTTPS**: Ensure all traffic uses HTTPS
5. **Monitoring**: Add logging and monitoring
6. **Backup**: Implement database backup strategy
