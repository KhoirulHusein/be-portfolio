# Experience Module Documentation

## Overview

The Experience module provides work experience management functionality for the portfolio backend. It supports both public read access and administrative CRUD operations with RBAC (Role-Based Access Control) integration.

## Features

- **Public API**: Read-only access to published experiences with pagination, filtering, and sorting
- **Admin API**: Full CRUD operations for experience management
- **RBAC Integration**: Permission-based access control for admin operations
- **Data Validation**: Comprehensive input validation for all operations
- **Flexible Schema**: Supports current positions (endDate = null), company logos, tech stacks, highlights, and more

## Data Schema

### Experience Model

```typescript
interface Experience {
  id: string                    // Unique identifier (CUID)
  company: string              // Company name (required, max 100 chars)
  role: string                 // Job title/role (required, max 100 chars)
  companyLogoUrl?: string      // Optional company logo URL
  startDate: Date              // Employment start date (required)
  endDate?: Date | null        // Employment end date (null = current position)
  location?: string            // Work location (max 100 chars)
  employmentType?: string      // Employment type (Full-time, Contract, etc.)
  summary?: string             // Role description (max 1000 chars)
  highlights: string[]         // Key achievements/responsibilities (max 200 chars each)
  techStack: string[]          // Technologies used (max 50 chars each)
  order: number               // Manual sorting order (default: 0)
  published: boolean          // Visibility flag (default: true)
  
  // Audit fields
  createdBy?: string
  updatedBy?: string
  createdAt: Date
  updatedAt: Date
}
```

### Employment Types

Supported employment types:
- Full-time
- Part-time
- Contract
- Temporary
- Volunteer
- Internship
- Freelance
- Self-employed

## API Endpoints

### Public Endpoints

#### GET /api/v1/experiences

Retrieve published experiences with pagination and filtering.

**Query Parameters:**
- `page` (number, default: 1) - Page number
- `pageSize` (number, default: 10, max: 100) - Items per page
- `sort` (string, default: "startDate:desc") - Sort field and order
- `current` (boolean) - Filter by current positions (`true`) or past positions (`false`)
- `company` (string) - Search by company name (case-insensitive)
- `role` (string) - Search by role title (case-insensitive)

**Valid Sort Fields:**
- `startDate`, `endDate`, `company`, `role`, `order`, `createdAt`, `updatedAt`
- Sort orders: `asc`, `desc`

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "cmf...",
        "company": "Tech Corp",
        "role": "Senior Backend Engineer",
        "companyLogoUrl": "https://example.com/logo.png",
        "startDate": "2023-01-01T00:00:00.000Z",
        "endDate": null,
        "location": "Remote",
        "employmentType": "Full-time",
        "summary": "Led backend development...",
        "highlights": ["Built scalable APIs", "Improved performance by 40%"],
        "techStack": ["Node.js", "TypeScript", "PostgreSQL"],
        "order": 0,
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "page": 1,
    "pageSize": 10,
    "total": 5,
    "totalPages": 1
  },
  "error": null
}
```

#### GET /api/v1/experiences/[id]

Retrieve a specific published experience by ID.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "cmf...",
    "company": "Tech Corp",
    // ... other experience fields
  },
  "error": null
}
```

**Error Responses:**
- `404 NOT_FOUND` - Experience not found or not published

### Admin Endpoints (Authentication Required)

All admin endpoints require:
- Valid JWT token in Authorization header
- Appropriate permissions (see RBAC section)

#### GET /api/v1/admin/experiences

Retrieve all experiences (published and unpublished) with admin filtering.

**Additional Query Parameters:**
- `published` (boolean) - Filter by published status

**Required Permission:** `experience:read`

#### GET /api/v1/admin/experiences/[id]

Retrieve any experience by ID (admin can see unpublished).

**Required Permission:** `experience:read`

#### POST /api/v1/admin/experiences

Create a new experience entry.

**Required Permission:** `experience:create`

**Request Body:**
```json
{
  "company": "New Company",
  "role": "Software Engineer",
  "companyLogoUrl": "https://example.com/logo.png",
  "startDate": "2024-01-01",
  "endDate": "2024-12-31",
  "location": "San Francisco, CA",
  "employmentType": "Full-time",
  "summary": "Developed web applications...",
  "highlights": ["Built API", "Led team"],
  "techStack": ["React", "Node.js"],
  "order": 1,
  "published": true
}
```

**Response:** `201 Created` with created experience data

#### PUT /api/v1/admin/experiences/[id]

Update an existing experience entry.

**Required Permission:** `experience:update`

**Request Body:** Same as POST (all fields optional)

**Response:** `200 OK` with updated experience data

#### DELETE /api/v1/admin/experiences/[id]

Delete an experience entry.

**Required Permission:** `experience:delete`

**Response:** `204 No Content`

#### POST /api/v1/admin/experiences/[id]/publish

Toggle or set the published status of an experience.

**Required Permission:** `experience:publish`

**Request Body:**
```json
{
  "published": true
}
```

**Response:** `200 OK` with updated experience data

## RBAC Permissions

The Experience module uses the following permissions:

- `experience:create` - Create new experience entries
- `experience:read` - Read experience information (admin view)
- `experience:update` - Update existing experience entries  
- `experience:delete` - Delete experience entries
- `experience:publish` - Publish/unpublish experience entries

**Admin Role:** Has all permissions automatically

**Permission Errors:** Return `403 FORBIDDEN` with specific permission name in error message

## Validation Rules

### Required Fields (Create)
- `company` - Non-empty string, max 100 characters
- `role` - Non-empty string, max 100 characters
- `startDate` - Valid date

### Optional Fields
- `companyLogoUrl` - Valid URL format if provided
- `endDate` - Valid date, must be >= startDate if provided
- `location` - String, max 100 characters
- `employmentType` - Must be from supported employment types
- `summary` - String, max 1000 characters
- `highlights` - Array of strings, each max 200 characters
- `techStack` - Array of strings, each max 50 characters
- `order` - Integer >= 0
- `published` - Boolean

### Update Rules
- All fields optional
- Same validation rules as create when provided
- Empty strings not allowed for required fields

## Error Handling

### Standard Error Response
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message"
  }
}
```

### Common Error Codes
- `VALIDATION_ERROR` (400) - Invalid input data
- `UNAUTHORIZED` (401) - Missing or invalid authentication
- `FORBIDDEN` (403) - Insufficient permissions
- `NOT_FOUND` (404) - Experience not found
- `INTERNAL_ERROR` (500) - Server error

## CORS Support

All endpoints support CORS preflight requests via OPTIONS method with appropriate headers:
- `Access-Control-Allow-Origin`
- `Access-Control-Allow-Methods`
- `Access-Control-Allow-Headers`
- `Access-Control-Max-Age`

## Caching

### Public Endpoints
- ETags generated from `id` and `updatedAt`
- Cache-Control headers set to 5 minutes for individual experiences
- 304 Not Modified responses when content unchanged

### Admin Endpoints
- No caching (always fresh data for administrative operations)

## Usage Examples

### Get current positions
```
GET /api/v1/experiences?current=true&sort=startDate:desc
```

### Search by company
```
GET /api/v1/experiences?company=google&pageSize=5
```

### Admin: Get all unpublished
```
GET /api/v1/admin/experiences?published=false
Authorization: Bearer <jwt_token>
```

### Create new experience
```
POST /api/v1/admin/experiences
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "company": "Acme Corp",
  "role": "Senior Developer",
  "startDate": "2024-01-01",
  "techStack": ["TypeScript", "React", "Node.js"]
}
```
