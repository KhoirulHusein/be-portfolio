# API Documentation

## Overview
RESTful API endpoints for the Portfolio Backend with role-based access control.

## Base URL
- **Development**: `http://localhost:3000/api`
- **Production**: `https://your-domain.com/api`

## Authentication
All protected endpoints require authentication via NextAuth.js session.

```typescript
// Example authenticated request
const response = await fetch('/api/protected-endpoint', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    // Session cookie automatically included
  }
})
```

## Endpoints

### Authentication
- `POST /api/auth/signin` - User sign in
- `POST /api/auth/signout` - User sign out
- `GET /api/auth/session` - Get current session
- `POST /api/auth/signup` - User registration

### RBAC Management
- `GET /api/rbac/roles` - List all roles
- `POST /api/rbac/roles` - Create new role (Admin only)
- `GET /api/rbac/permissions` - List permissions
- `POST /api/rbac/assign-role` - Assign role to user (Admin only)

### User Management
- `GET /api/users` - List users (Admin only)
- `GET /api/users/[id]` - Get user details
- `PUT /api/users/[id]` - Update user (Self or Admin)
- `DELETE /api/users/[id]` - Delete user (Admin only)

### Admin Operations
- `GET /api/admin/dashboard` - Admin dashboard data
- `POST /api/admin/bootstrap` - Bootstrap superadmin (Dev only)
- `GET /api/admin/settings` - System settings

## Response Format

### Success Response
```json
{
  "success": true,
  "data": {
    // Response data
  },
  "message": "Operation completed successfully"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message"
  }
}
```

## Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

## Rate Limiting
- **Standard endpoints**: 100 requests per minute
- **Authentication endpoints**: 10 requests per minute
- **Admin endpoints**: 50 requests per minute

## RBAC Authorization

### Roles
- **SUPERADMIN** - Full system access
- **ADMIN** - Administrative operations
- **USER** - Basic user operations

### Permissions
- `READ_USERS` - View user data
- `WRITE_USERS` - Create/update users
- `DELETE_USERS` - Delete users
- `MANAGE_ROLES` - Assign/remove roles
- `ADMIN_ACCESS` - Access admin endpoints

### Authorization Check
Each protected endpoint checks:
1. Valid session exists
2. User has required role/permission
3. Resource ownership (for user-specific operations)

## Environment-Specific Notes

### Development
- Bootstrap endpoints available
- Extended debugging information
- Relaxed rate limiting

### Production
- Bootstrap endpoints disabled
- Enhanced security headers
- Strict rate limiting
- Error details minimized

## Testing
API endpoints are thoroughly tested with:
- Unit tests for business logic
- Integration tests for complete flows
- Authentication/authorization testing
- Error scenario validation

See [testing documentation](../testing.md) for details.