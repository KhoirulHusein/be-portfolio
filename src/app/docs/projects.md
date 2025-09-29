# Projects Module Documentation

## Overview

The Projects module provides comprehensive functionality for managing project portfolios, including public endpoints for showcasing projects and admin endpoints for content management. This module follows the same patterns and conventions as the About and Experience modules.

## Database Schema

### Project Model

The `Project` model represents individual projects in the portfolio.

#### Fields

- **id**: `String` (Primary Key, CUID) - Unique project identifier
- **title**: `String` (Required) - Project name displayed in cards and details
- **slug**: `String` (Unique, Required) - URL-friendly identifier for public access
- **summary**: `String?` (Optional) - Short description for cards and listings
- **description**: `String?` (Optional) - Detailed markdown content for project description
- **coverImageUrl**: `String?` (Optional) - URL for the main project image
- **galleryUrls**: `String[]` (Array) - Additional project images for galleries/sliders
- **repoUrl**: `String?` (Optional) - Repository URL (GitHub/GitLab)
- **liveUrl**: `String?` (Optional) - Live demo/website URL
- **videoUrl**: `String?` (Optional) - Demo video URL (YouTube/Vimeo)
- **links**: `Json?` (Optional) - Additional links (docs, npm, app stores, etc.)
- **techStack**: `String[]` (Array) - Primary technologies used (for filtering)
- **tags**: `String[]` (Array) - Thematic tags (for search/categorization)
- **status**: `ProjectStatus` (Enum) - Project state (ONGOING/COMPLETED/ARCHIVED)
- **featured**: `Boolean` (Default: false) - Spotlight projects on landing page
- **order**: `Int?` (Optional) - Manual ordering for admin display
- **startDate**: `DateTime?` (Optional) - Project start date
- **endDate**: `DateTime?` (Optional) - Project completion date
- **published**: `Boolean` (Default: false) - Public visibility control
- **createdBy**: `String?` (Optional) - Creator user ID
- **updatedBy**: `String?` (Optional) - Last updater user ID
- **createdAt**: `DateTime` (Auto) - Creation timestamp
- **updatedAt**: `DateTime` (Auto) - Last update timestamp

#### Indexes

- `@@index([published])` - Optimize public queries
- `@@index([featured])` - Optimize featured project queries
- `@@index([status])` - Optimize status filtering
- `@@index([updatedAt])` - Optimize sorting by update time

### ProjectStatus Enum

```prisma
enum ProjectStatus {
  ONGOING    // Currently in development
  COMPLETED  // Finished project
  ARCHIVED   // No longer maintained
}
```

## RBAC Permissions

### Project Permissions

| Permission | Description | Admin Role | User Role |
|------------|-------------|------------|-----------|
| `project:create` | Create new projects | ✅ | ❌ |
| `project:read` | Read project information (admin access) | ✅ | ❌ |
| `project:update` | Update project entries | ✅ | ❌ |
| `project:delete` | Delete project entries | ✅ | ❌ |
| `project:publish` | Publish/unpublish projects | ✅ | ❌ |

**Note**: Public endpoints do not require authentication and only show published projects.

## API Endpoints

### Public Endpoints

#### GET /api/v1/projects

List published projects with filtering, searching, and pagination.

**Query Parameters:**
- `page` (number, default: 1) - Page number for pagination
- `limit` (number, default: 12, max: 100) - Items per page
- `sort` (string, default: "-updatedAt") - Sort field and direction
  - Format: `field` (ascending) or `-field` (descending)
  - Valid fields: `updatedAt`, `title`, `order`, `startDate`, `endDate`, `createdAt`
- `q` (string) - Search query (searches title and summary)
- `tag` (string) - Filter by single tag
- `tech` (string) - Filter by single technology
- `status` (string) - Filter by status (ONGOING/COMPLETED/ARCHIVED)
- `featured` (boolean) - Filter by featured flag

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "clxxx",
        "title": "E-Commerce Platform",
        "slug": "ecommerce-platform",
        "summary": "Full-stack e-commerce solution...",
        "coverImageUrl": "https://example.com/cover.jpg",
        "repoUrl": "https://github.com/user/repo",
        "liveUrl": "https://demo.com",
        "videoUrl": "https://youtube.com/watch?v=123",
        "techStack": ["React", "Node.js", "PostgreSQL"],
        "tags": ["fullstack", "ecommerce"],
        "status": "COMPLETED",
        "featured": true,
        "order": 1,
        "startDate": "2023-01-01T00:00:00Z",
        "endDate": "2023-06-30T00:00:00Z",
        "createdAt": "2023-01-01T00:00:00Z",
        "updatedAt": "2023-07-01T00:00:00Z"
      }
    ],
    "page": 1,
    "limit": 12,
    "total": 25,
    "totalPages": 3
  }
}
```

**Cache Headers:**
- `Cache-Control: public, max-age=300` (5 minutes)

#### GET /api/v1/projects/[slug]

Get published project details by slug.

**Parameters:**
- `slug` (string, required) - Project slug

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "clxxx",
    "title": "E-Commerce Platform",
    "slug": "ecommerce-platform",
    "summary": "Full-stack e-commerce solution...",
    "description": "# E-Commerce Platform\n\nDetailed description...",
    "coverImageUrl": "https://example.com/cover.jpg",
    "galleryUrls": ["https://example.com/1.jpg", "https://example.com/2.jpg"],
    "repoUrl": "https://github.com/user/repo",
    "liveUrl": "https://demo.com",
    "videoUrl": "https://youtube.com/watch?v=123",
    "links": {
      "docs": "https://docs.example.com",
      "api": "https://api.example.com"
    },
    "techStack": ["React", "Node.js", "PostgreSQL"],
    "tags": ["fullstack", "ecommerce"],
    "status": "COMPLETED",
    "featured": true,
    "order": 1,
    "startDate": "2023-01-01T00:00:00Z",
    "endDate": "2023-06-30T00:00:00Z",
    "createdAt": "2023-01-01T00:00:00Z",
    "updatedAt": "2023-07-01T00:00:00Z"
  }
}
```

**Cache Headers:**
- `ETag: "hash"` - Entity tag for conditional requests
- `Cache-Control: public, max-age=300` (5 minutes)
- Returns `304 Not Modified` if `If-None-Match` header matches ETag

### Admin Endpoints

All admin endpoints require authentication and appropriate permissions.

#### GET /api/v1/admin/projects

List all projects (published and unpublished) for admin management.

**Required Permission:** `project:read`

**Query Parameters:**
- `page`, `pageSize`, `sort` - Standard pagination/sorting
- `title` (string) - Filter by title (case-insensitive contains)
- `status` (string) - Filter by status
- `published` (boolean) - Filter by published status
- `featured` (boolean) - Filter by featured status
- `tag` (string) - Filter by tag
- `tech` (string) - Filter by technology

#### POST /api/v1/admin/projects

Create a new project.

**Required Permission:** `project:create`

**Request Body:**
```json
{
  "title": "New Project",
  "slug": "custom-slug", // Optional, auto-generated from title if not provided
  "summary": "Project summary",
  "description": "# Detailed Description\n\nMarkdown content...",
  "coverImageUrl": "https://example.com/cover.jpg",
  "galleryUrls": ["https://example.com/1.jpg"],
  "repoUrl": "https://github.com/user/repo",
  "liveUrl": "https://demo.com",
  "videoUrl": "https://youtube.com/watch?v=123",
  "links": {
    "docs": "https://docs.example.com"
  },
  "techStack": ["React", "TypeScript"],
  "tags": ["web", "frontend"],
  "status": "ONGOING",
  "featured": true,
  "order": 1,
  "startDate": "2024-01-01",
  "endDate": null,
  "published": false
}
```

**Response:** `201 Created` with created project data

#### GET /api/v1/admin/projects/[id]

Get project details by ID (admin can see unpublished).

**Required Permission:** `project:read`

#### PATCH /api/v1/admin/projects/[id]

Update project by ID.

**Required Permission:** `project:update`

**Request Body:** Partial project data (same structure as POST, all fields optional)

**Special Validation:**
- Slug uniqueness checked if slug is being updated
- End date must be >= start date if both provided
- URLs must be valid format

#### DELETE /api/v1/admin/projects/[id]

Delete project by ID.

**Required Permission:** `project:delete`

**Response:** `204 No Content`

#### PATCH /api/v1/admin/projects/[id]/publish

Toggle project publish status.

**Required Permission:** `project:publish`

**Request Body:**
```json
{
  "published": true
}
```

**Response:** Updated project data

#### PATCH /api/v1/admin/projects/[id]/reorder

Set project order for admin display.

**Required Permission:** `project:update`

**Request Body:**
```json
{
  "order": 5
}
```

## Validation Rules

### Create/Update Validation

- **title**: Required, 1-100 characters
- **slug**: Optional (auto-generated), URL-friendly format, unique, max 100 characters
- **summary**: Optional, max 500 characters
- **description**: Optional, max 10,000 characters (markdown content)
- **URLs**: Must be valid URL format if provided
- **galleryUrls**: Array of valid URLs, max 10 items
- **techStack**: Array of strings, max 20 items, each max 50 characters
- **tags**: Array of strings, max 10 items, each max 30 characters
- **status**: Must be ONGOING, COMPLETED, or ARCHIVED
- **featured**: Boolean
- **order**: Integer
- **dates**: Valid date format, endDate >= startDate
- **published**: Boolean

### Publish Validation

- **published**: Required, boolean

### Reorder Validation

- **order**: Required, integer

## Error Responses

### Common Error Codes

- `400 Bad Request` - Validation errors, invalid parameters
- `401 Unauthorized` - Missing or invalid authentication
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Project not found
- `409 Conflict` - Duplicate slug
- `500 Internal Server Error` - Server errors

### Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Title is required, Cover image URL must be a valid URL"
  }
}
```

## CORS Support

All endpoints support CORS with appropriate headers:
- Public endpoints: Allow all origins
- Admin endpoints: Configurable origin restrictions
- Preflight requests handled via OPTIONS methods

## Caching Strategy

### Public Endpoints

- **List**: 5-minute cache with `Cache-Control: public, max-age=300`
- **Detail**: ETag-based conditional caching with 5-minute max-age
- Cache invalidation via `updatedAt` changes

### Admin Endpoints

- No caching (always fresh data for content management)

## Usage Examples

### Frontend Integration

```typescript
// Fetch featured projects for homepage
const featuredProjects = await fetch('/api/v1/projects?featured=true&limit=3')

// Search projects by technology
const reactProjects = await fetch('/api/v1/projects?tech=React&sort=title')

// Get project details
const project = await fetch('/api/v1/projects/ecommerce-platform')

// Admin: Create new project
const newProject = await fetch('/api/v1/admin/projects', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(projectData)
})
```

### URL Structure Examples

```
/api/v1/projects                              # All published projects
/api/v1/projects?featured=true                # Featured projects only
/api/v1/projects?tech=React&status=COMPLETED  # React projects that are completed
/api/v1/projects?q=ecommerce&sort=title       # Search for "ecommerce", sort by title
/api/v1/projects/my-awesome-project           # Specific project by slug

/api/v1/admin/projects                        # Admin: All projects
/api/v1/admin/projects/clxxx                  # Admin: Specific project by ID
/api/v1/admin/projects/clxxx/publish          # Admin: Toggle publish status
/api/v1/admin/projects/clxxx/reorder          # Admin: Set display order
```

## Testing

Comprehensive test coverage includes:

### Public Endpoint Tests
- List projects with various filters
- Search functionality
- Pagination and sorting
- Project detail retrieval
- Cache header validation
- CORS support

### Admin Endpoint Tests
- CRUD operations with RBAC
- Validation error handling
- Permission enforcement
- Duplicate slug prevention
- Publish/unpublish workflow

### Integration Tests
- End-to-end project lifecycle
- Multi-user permission scenarios
- Cache invalidation flows

Run tests with:
```bash
pnpm test:unit -- projects  # Run all project tests
pnpm test:unit -- project.public  # Run public endpoint tests only
pnpm test:unit -- project.admin   # Run admin endpoint tests only
```

## Deployment Considerations

### Database Migration

```bash
pnpm prisma:migrate:dev    # Apply migration
pnpm prisma:generate       # Generate Prisma client
pnpm rbac:sync            # Sync RBAC permissions
pnpm prisma:seed          # Add sample data
```

### Environment Variables

No additional environment variables required beyond existing database and auth configuration.

### Performance Optimization

- Database indexes on frequently queried fields
- Efficient pagination with cursor-based queries for large datasets
- Image optimization recommendations for gallery URLs
- CDN usage for static assets (cover images, galleries)

## Future Enhancements

### Potential Features
- Project categories/collections
- Collaboration tracking (team members)
- Technology proficiency ratings
- Project metrics (GitHub stars, downloads)
- Related projects suggestions
- Project timeline visualization
- Advanced analytics and reporting