# Versioned Deployments

This document describes the versioned deployment system that automatically syncs posts from the API and creates tagged deployments.

## Overview

The versioned deployment system provides:
- **Automatic API Sync**: Posts are fetched from the API during build
- **Version Tagging**: Each build creates a timestamped version tag
- **Backup Management**: Previous versions are automatically backed up
- **Safe Deployments**: Easy rollback to previous versions
- **Build Artifacts**: Complete deployment tracking and management

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Posts API     │───▶│  Build Scripts   │───▶│   Next.js App   │
│ (Database)      │    │  (Version Tags)  │    │  (Static Site)  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌──────────────────┐
                       │   File System    │
                       │                  │
                       │ data/posts.ts    │
                       │ data/backups/    │
                       │ ├─ v*.posts.ts   │
                       │ └─ manifests     │
                       └──────────────────┘
```

## File Structure

```
data/
├── posts.ts                    # Current active posts (auto-generated)
├── build-manifest.json         # Current build metadata
├── deployment-summary.json     # Latest deployment info
└── backups/                    # Version history
    ├── v20250802-143022.posts.ts
    ├── v20250802-143022.build-manifest.json
    ├── v20250802-143045.posts.ts
    └── v20250802-143045.build-manifest.json

scripts/
├── build-posts.js              # API sync and version generation
├── pre-build.js                # API health checks
├── deploy.js                   # Complete deployment orchestration
└── versions.js                 # Version management CLI
```

## Commands

### Development Commands

```bash
# Start development servers
npm run dev:site                # Next.js development server
npm run dev:api                 # API server (Lambda functions)

# API health check
npm run build:check             # Check if API is accessible

# Sync posts only
npm run build:posts             # Fetch posts from API and create version
```

### Build Commands

```bash
# Standard build (includes automatic posts sync)
npm run build                   # Next.js build with prebuild posts sync

# Full deployment build
npm run deploy                  # Complete versioned deployment
npm run build:full              # Alias for deploy

# Partial builds
npm run deploy:posts-only       # Only sync posts, no Next.js build
npm run deploy:build-only       # Only Next.js build, no API sync
```

### Version Management

```bash
# List all available versions
npm run versions:list
npm run versions list

# Show current status
npm run versions:status
npm run versions status

# Compare two versions
npm run versions diff v20250802-143022 v20250802-143045

# Restore to a specific version
npm run versions restore v20250802-143022

# Show help
npm run versions help
```

## Version Tag Format

Version tags follow the format: `vYYYYMMDD-HHMMSS`

Examples:
- `v20250802-143022` = August 2, 2025 at 14:30:22
- `v20250815-091545` = August 15, 2025 at 09:15:45

This format ensures:
- **Chronological Sorting**: Natural sorting works correctly
- **Human Readable**: Easy to understand when the version was created
- **Unique**: No collision possibility for builds
- **Git Friendly**: Compatible with Git tag naming

## Environment Variables

### Required for API Sync

```env
# API endpoint (defaults to localhost:3001/dev)
API_BASE_URL=http://localhost:3001/dev

# Skip API health checks (useful for CI/CD)
SKIP_API_CHECK=false

# Build type (affects deployment behavior)
BUILD_TYPE=development  # or 'production'
```

### API Server Variables

```env
# AWS DynamoDB connection (in functions/aws/.env)
AWS_REGION=us-east-1
DYNAMODB_TABLE_NAME=NuraWeb-Posts
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
JWT_SECRET=your_jwt_secret
```

## CI/CD Integration

### GitHub Actions Workflow

The `.github/workflows/versioned-deploy.yml` provides:

1. **Automatic Deployment**: Triggered on push to main
2. **Manual Deployment**: Manual trigger with options
3. **Version Tagging**: Automatic Git tags for deployments
4. **Artifact Upload**: Build artifacts and version backups
5. **GitHub Pages**: Automatic deployment to Pages

#### Manual Deployment Options

- **Deployment Type**: `full`, `posts-only`, `build-only`
- **Skip API Check**: Useful when API is not available in CI

#### Deployment Artifacts

- **Build Artifacts**: Next.js build output (`.next/`)
- **Versioned Posts**: Complete version history with manifests
- **Deployment Summary**: Metadata about each deployment

## API Integration

### Posts API Requirements

The build system expects the API to provide:

```typescript
// GET /posts/list
{
  "success": true,
  "data": Post[],     // Array of Post objects
  "count": number     // Total count
}
```

### Post Object Structure

```typescript
interface Post {
  id: string;
  title: string;
  type: 'project' | 'blog' | 'paper' | 'article' | 'news' | 'link';
  status: 'draft' | 'published';
  featured: boolean;
  createdAt: string;
  updatedAt: string;
  cells: PostCell[];
  thumbnail?: {
    url: string;
    alt: string;
  };
}
```

## Error Handling

### API Connection Issues

1. **Pre-build Check**: Verifies API accessibility
2. **Retry Logic**: Multiple attempts with delays
3. **Graceful Fallback**: Continues with existing posts if API fails
4. **Error Reporting**: Clear error messages and logs

### Build Failures

1. **Backup Protection**: Existing posts.ts is always backed up
2. **Rollback Capability**: Easy restoration to previous versions
3. **Partial Recovery**: Some operations can continue even if others fail
4. **Detailed Logging**: Comprehensive error information

## Version Management

### Automatic Backup

- **On Every Build**: Current posts.ts is backed up before replacement
- **Retention Policy**: Keeps last 10 versions automatically
- **Cleanup Process**: Old backups are automatically removed
- **Manual Backup**: Additional backups created during restores

### Restore Process

1. **Safety Backup**: Current state is backed up before restore
2. **Version Verification**: Confirms target version exists
3. **File Replacement**: Atomic replacement of posts.ts
4. **Manifest Update**: Updates build metadata if available

### Diff Comparison

- **Post Count Changes**: Shows additions/removals
- **File Size Changes**: Indicates content volume changes
- **Timestamp Comparison**: Shows build progression
- **Manifest Metadata**: Detailed build information comparison

## Best Practices

### Development Workflow

1. **API First**: Ensure API is running before building
2. **Version Check**: Use `npm run versions:status` to check current state
3. **Incremental Builds**: Use `npm run build:posts` for quick API sync
4. **Test Locally**: Always test builds locally before deployment

### Production Deployment

1. **Full Deployment**: Use `npm run deploy` for complete builds
2. **Version Tagging**: Each production build creates a Git tag
3. **Artifact Backup**: All builds are backed up for rollback
4. **Health Monitoring**: Monitor API connectivity during builds

### Troubleshooting

1. **API Issues**: Use `npm run build:check` to verify API health
2. **Version Conflicts**: Use `npm run versions:list` to see available versions
3. **Rollback**: Use `npm run versions restore <version>` for quick recovery
4. **Clean Build**: Delete `.next/` and run fresh `npm run deploy`

## Security Considerations

### API Authentication

- JWT tokens are required for protected API endpoints
- Tokens are passed through environment variables
- No sensitive data is stored in version files

### Backup Security

- Backup files contain the same data as the main posts.ts
- No additional sensitive information is stored
- Git ignores sensitive backup files automatically

### Build Process

- Environment variables are not included in generated files
- API credentials are isolated to build environment
- Generated files contain only public post data

## Monitoring and Logging

### Build Logs

Each script provides detailed logging:
- **Progress Indicators**: Clear step-by-step progress
- **Error Details**: Comprehensive error information
- **Success Confirmation**: Verification of completed operations
- **Timing Information**: Build duration and performance metrics

### Deployment Tracking

- **Deployment Summary**: Complete metadata for each deployment
- **Version History**: Full audit trail of all versions
- **Build Manifests**: Detailed information about each build
- **Git Tags**: Permanent deployment markers in Git history

This system ensures reliable, traceable, and recoverable deployments while maintaining the flexibility to work with dynamic content from the API.
