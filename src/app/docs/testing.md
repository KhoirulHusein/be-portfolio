# Testing Guide

## Overview
This project uses Vitest for comprehensive unit testing of authentication and RBAC functionality.

## Test Structure
```
src/app/test/
├── setup/               # Test utilities and configuration
│   ├── database.ts     # Database test utilities
│   ├── factories.ts    # Data factories for tests
│   └── request-helpers.ts  # HTTP request helpers
└── unit/               # Unit tests organized by domain
    ├── auth/           # Authentication tests
    │   ├── register.test.ts
    │   ├── login.test.ts
    │   ├── me.test.ts
    │   ├── refresh.test.ts
    │   ├── logout.test.ts
    │   ├── change-password.test.ts
    │   └── cors-preflight.test.ts
    └── rbac/           # RBAC tests
        ├── assign-role.test.ts
        ├── revoke-role.test.ts
        ├── permissions.test.ts
        └── roles.test.ts
```

## Running Tests

### Basic Commands
```bash
# Run all tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Reset test database and prepare
pnpm test:reset && pnpm test:prepare
```

### Test Environment
- Uses separate test database (configured via `.env.test`)
- Tests run in isolated transactions
- Database is reset between test suites
- All tests are self-contained and can run independently

## Test Patterns

### Authentication Tests
- Test all auth endpoints: register, login, logout, refresh, me
- Test validation, error handling, and security scenarios
- Test CORS preflight requests

### RBAC Tests
- Test role assignment and revocation
- Test permission-based access control
- Test admin endpoint protection
- Test error scenarios (non-existent users/roles)

### Test Utilities
- **factories.ts**: Creates test users, roles, and permissions
- **database.ts**: Database connection and cleanup utilities
- **request-helpers.ts**: HTTP request helpers for testing endpoints

## Best Practices
1. Use descriptive test names following the pattern: `should [expected behavior] [under condition]`
2. Group related tests using `describe()` blocks with endpoint patterns
3. Use factories for consistent test data creation
4. Clean up test data after each test
5. Test both success and error scenarios
6. Use type-safe request helpers
