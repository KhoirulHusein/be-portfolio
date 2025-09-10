# RBAC Usage Guide

## 🚀 Quick Start

### **1. Database Setup**
```bash
# Apply RBAC migrations
npx prisma migrate deploy

# Seed default roles and permissions
npx prisma db seed
```

### **2. Check User Roles**
```typescript
import { getUserRoles, hasRole, hasPermission } from '@/lib/auth/rbac'

// Get all user roles
const userRoles = await getUserRoles(userId)
console.log(userRoles) // ['USER'] or ['ADMIN', 'USER']

// Check specific role
const isAdmin = await hasRole(userId, ['ADMIN'])

// Check permission
const canAssignRoles = await hasPermission(userId, ['role:assign'])
```

### **3. Protect API Routes**

#### **Role-Based Protection**
```typescript
import { withAuth } from '@/middleware/require-auth'

// Protect with ADMIN role
export const GET = withAuth(async (req) => {
  // Only ADMIN users can access this
  return Response.json({ message: 'Admin data' })
}, { roles: ['ADMIN'] })
```

#### **Permission-Based Protection**
```typescript
// Protect with specific permission
export const POST = withAuth(async (req) => {
  // Only users with role:assign permission
  return Response.json({ message: 'Role assigned' })
}, { permissions: ['role:assign'] })
```

#### **Multiple Requirements**
```typescript
// Require both role AND permission
export const DELETE = withAuth(async (req) => {
  // Must be ADMIN AND have role:revoke permission
  return Response.json({ message: 'Role revoked' })
}, { 
  roles: ['ADMIN'], 
  permissions: ['role:revoke'] 
})
```

---

## 🔧 **API Endpoints**

### **Admin Endpoints**

#### **List Users** (ADMIN role required)
```bash
GET /api/v1/admin/users?page=1&limit=10
Authorization: Bearer <admin_token>

Response:
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "user_id",
        "email": "user@example.com",
        "username": "username",
        "roles": ["USER"]
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "totalPages": 3
    }
  }
}
```

#### **Assign Role** (role:assign permission required)
```bash
POST /api/v1/admin/users/{userId}/roles
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "roleName": "ADMIN"
}

Response:
{
  "success": true,
  "data": {
    "message": "Role ADMIN assigned to user username",
    "userId": "user_id",
    "roleName": "ADMIN"
  }
}
```

#### **Revoke Role** (role:revoke permission required)
```bash
DELETE /api/v1/admin/users/{userId}/roles/{roleName}
Authorization: Bearer <admin_token>

Response:
{
  "success": true,
  "data": {
    "message": "Role ADMIN revoked from user username",
    "userId": "user_id", 
    "roleName": "ADMIN"
  }
}
```

---

## 🛡 **Security Features**

### **Built-in Protection**
- ✅ **USER role cannot be revoked** (prevents lockout)
- ✅ **Real-time role validation** (checks database on each request)
- ✅ **Granular permissions** (resource:action format)
- ✅ **CORS handling** (automatic preflight support)

### **Error Responses**
```typescript
// 403 Forbidden (missing role)
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Access denied. Required roles: ADMIN"
  }
}

// 403 Permission Denied (missing permission)
{
  "success": false,
  "error": {
    "code": "PERMISSION_DENIED", 
    "message": "Access denied. Required permissions: role:assign"
  }
}

// 404 Not Found
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "User not found"
  }
}
```

---

## ⚙️ **Configuration**

### **Default Roles & Permissions**

#### **ADMIN Role**
- user:read ✅
- user:write ✅
- role:read ✅
- role:assign ✅
- role:revoke ✅

#### **USER Role**
- user:read ✅

### **Permission Format**
```typescript
// Format: "resource:action"
"user:read"      // Read user data
"user:write"     // Modify user data  
"role:read"      // View roles
"role:assign"    // Assign roles to users
"role:revoke"    // Remove roles from users
```

---

## 🔄 **Integration Examples**

### **React Frontend Integration**
```typescript
// Check if user is admin
const { data: userData } = await fetch('/api/v1/auth/me', {
  headers: { Authorization: `Bearer ${token}` }
})

const isAdmin = userData.roles.includes('ADMIN')

// Conditionally render admin UI
{isAdmin && (
  <AdminPanel />
)}
```

### **Next.js Middleware Integration**
```typescript
// middleware.ts
import { withAuth } from '@/middleware/require-auth'

export const middleware = withAuth(
  function middleware(req) {
    // Admin-only pages
    if (req.nextUrl.pathname.startsWith('/admin')) {
      return // Continue if authorized
    }
  },
  { roles: ['ADMIN'] }
)

export const config = {
  matcher: '/admin/:path*'
}
```

---

## 🧪 **Testing**

### **Run All Tests**
```bash
# All RBAC tests
pnpm test

# Specific test suites
pnpm test rbac.roles.test.ts
pnpm test rbac.permissions.test.ts
pnpm test rbac.assign-role.test.ts
pnpm test rbac.revoke-role.test.ts
```

### **Test Coverage**
- ✅ Role-based access control
- ✅ Permission-based access control  
- ✅ Admin endpoint protection
- ✅ Error handling and validation
- ✅ CORS preflight handling

---

## 📝 **Best Practices**

### **1. Use Permissions Over Roles**
```typescript
// ❌ Don't check roles directly in business logic
const isAdmin = user.roles.includes('ADMIN')

// ✅ Check permissions instead
const canManageUsers = await hasPermission(userId, ['user:write'])
```

### **2. Combine Multiple Protection Layers**
```typescript
// ✅ Role + Permission protection
export const handler = withAuth(businessLogic, {
  roles: ['ADMIN'],
  permissions: ['user:write']
})
```

### **3. Handle Errors Gracefully**
```typescript
try {
  await assignRole(userId, 'ADMIN')
} catch (error) {
  if (error.code === 'NOT_FOUND') {
    return { error: 'User not found' }
  }
  throw error
}
```

---

## 🔍 **Troubleshooting**

### **Common Issues**

#### **"Role not found" Error**
```bash
# Ensure database is seeded
npx prisma db seed
```

#### **"Permission denied" for Admin User**
```typescript
// Check user actually has ADMIN role
const roles = await getUserRoles(userId)
console.log('User roles:', roles)
```

#### **Tests Failing**
```bash
# Ensure test database is migrated and seeded
DATABASE_URL="test_db_url" npx prisma migrate deploy
DATABASE_URL="test_db_url" npx prisma db seed
```

---

**Ready to use! 🚀**
