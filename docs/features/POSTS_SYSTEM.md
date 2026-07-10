# Posts Feature Documentation

NuraWeb Posts is a comprehensive content management system built with AWS DynamoDB and serverless AWS Lambda functions. This feature allows you to create, manage, and display various types of content including blog posts, projects, articles, news, papers, and links.

## Architecture Overview

The Posts system uses:
- **AWS DynamoDB** for data persistence and scalability
- **AWS Lambda** for serverless API functions
- **API Gateway** for HTTP endpoints
- **Next.js** frontend with TypeScript
- **JWT** for authentication

## Quick Start

### 1. DynamoDB Setup

The Posts system uses AWS DynamoDB for data storage. Initialize the database:

```bash
# Initialize DynamoDB table (one-time setup)
cd database
node dynamodb-init.js
```

This creates the `NuraWeb-Posts` table with:
- Primary key structure for efficient queries
- Global Secondary Index for filtering by status and type
- Sample data for testing

### 2. Install Dependencies

```bash
cd functions/aws
npm install
```

### 3. Configure Environment

Create your AWS credentials and configure environment variables:

```bash
cp .env.example .env.dev
```

Update the configuration in `.env.dev`:

```env
# AWS Configuration
AWS_REGION=us-east-1
DYNAMODB_TABLE_NAME=NuraWeb-Posts
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key

# Authentication
JWT_SECRET=your-jwt-secret
```

### 4. Deploy Serverless Functions

```bash
# Deploy to AWS (dev environment)
npm run deploy:dev

# Or run locally for development
npm run dev
```

### 5. Frontend Integration

The Posts API is automatically available in your Next.js app. Navigate to:
- `/posts` - View all published posts
- `/admin/posts` - Manage posts (requires authentication)

## DynamoDB Schema

### Posts Table Structure
The `NuraWeb-Posts` table uses a composite key structure:

```javascript
{
  PK: 'POST#' + postId,              // Partition Key
  SK: 'POST#' + postId,              // Sort Key
  id: UUID,                          // Post ID
  title: String,                     // Post title
  slug: String,                      // URL-friendly slug
  status: 'draft' | 'published',     // Post status
  featured: Boolean,                 // Featured flag
  type: 'blog' | 'project' | 'article' | 'news' | 'paper' | 'link',
  thumbnail: String,                 // Thumbnail URL
  thumbnailAlt: String,              // Thumbnail alt text
  excerpt: String,                   // Post excerpt
  authorId: String,                  // Author identifier
  createdAt: String (ISO),           // Creation timestamp
  updatedAt: String (ISO),           // Last update timestamp
  publishedAt: String (ISO),         // Publication timestamp
  viewCount: Number,                 // View counter
  likeCount: Number,                 // Like counter
  tags: Array[String],               // Post tags
  cells: Array[Object]               // Post content cells
}
```

### Global Secondary Index (StatusTypeIndex)
For efficient filtering:
- **Partition Key**: status (draft/published)
- **Sort Key**: type (blog/project/etc.)
- **Projection**: ALL attributes

### Cell Structure
Embedded within posts as an array:
```javascript
{
  id: UUID,                          // Cell ID
  type: 'markdown' | 'image' | 'video' | 'file',
  content: Object,                   // Cell-specific content
  order: Number                      // Display order
}
```

## API Endpoints

### Public Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/posts` | List published posts with filtering |
| GET | `/posts/{id}` | Get a single post (increments view count) |

### Authenticated Endpoints (Admin Only)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/posts` | Create a new post |
| PUT | `/posts/{id}` | Update an existing post |
| DELETE | `/posts/{id}` | Delete a post |

### Query Parameters for GET /posts

- `status` - Filter by status ('draft' | 'published')
- `type` - Filter by type ('project' | 'blog' | 'paper' | 'article' | 'news' | 'link')
- `featured` - Filter by featured status (true | false)
- `limit` - Limit number of results

## Frontend Components

### PostsManager
Complete admin interface for managing posts:
```tsx
import { PostsManager } from '@/components/post/posts-manager';

<PostsManager authToken={token} isAdmin={true} />
```

### Posts API Client
```tsx
import { postsApi } from '@/lib/posts-api';

// Set authentication token
postsApi.setAuthToken(token);

// List posts
const posts = await postsApi.getPublishedPosts();

// Get single post
const post = await postsApi.getPost('post-id');

// Create post (requires auth)
const newPost = await postsApi.createPost({
  title: 'My New Post',
  type: 'blog',
  status: 'draft'
});
```

## Post Types

The system supports different content types:

- **blog** - Traditional blog posts
- **project** - Project showcases
- **article** - Long-form articles
- **news** - News and announcements
- **paper** - Academic papers
- **link** - Link posts with external URLs

## Cell Types

Posts are composed of cells that can contain different types of content:

- **markdown** - Rich text content
- **image** - Image with caption and alt text
- **video** - Embedded videos (YouTube, Vimeo, direct)
- **file** - File attachments from S3

## Security Features

- JWT-based authentication for admin functions
- Input validation and sanitization
- SQL injection protection with parameterized queries
- CORS protection
- Environment-based configuration

## Performance Optimizations

### DynamoDB Design
- Composite key structure for efficient queries
- Global Secondary Index for filtering operations
- Single-table design reduces API calls
- Embedded cells eliminate need for joins

### Lambda Optimizations
- AWS SDK v3 for improved performance
- Efficient JSON serialization
- Proper error handling and logging
- Connection reuse across invocations

## Monitoring and Debugging

### DynamoDB Metrics
Monitor your table performance in AWS Console:
- Read/Write capacity units
- Item count and size
- Global Secondary Index metrics

### Lambda Logs
```bash
# View serverless logs
serverless logs -f posts-list

# Follow logs in real-time
serverless logs -f posts-create --tail
```

### DynamoDB Local Development
For local development, you can use DynamoDB Local:
```bash
# Download and run DynamoDB Local
java -Djava.library.path=./DynamoDBLocal_lib -jar DynamoDBLocal.jar -sharedDb
```

## Development Workflow

### Local Development
1. Initialize DynamoDB table: `cd database && node dynamodb-init.js`
2. Run serverless offline: `npm run dev`
3. Start Next.js: `npm run dev` (in root directory)

### Schema Changes
For DynamoDB schema changes:
1. Update the table structure in `database/dynamodb-init.js`
2. Delete and recreate the table (development only)
3. Re-run the initialization script

### Testing
```bash
# Test API endpoints
curl http://localhost:3001/posts

# Test with authentication
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"title":"Test Post","type":"blog"}' \
     http://localhost:3001/posts
```

## Deployment

### Environment Configuration
- **Development**: `.env.dev` - Local DynamoDB or AWS DynamoDB
- **Staging**: `.env.staging` - Staging DynamoDB table
- **Production**: `.env.prod` - Production DynamoDB table

### AWS Deployment
```bash
# Deploy to specific stage
serverless deploy --stage prod

# Deploy single function
serverless deploy function -f posts-create --stage prod
```

### DynamoDB Deployment
DynamoDB tables can be created through:
- AWS Console
- AWS CLI
- CloudFormation/CDK
- The initialization script

For production, ensure proper:
- IAM permissions
- Backup configuration
- Point-in-time recovery
- Auto-scaling settings

## Troubleshooting

### Common Issues

1. **DynamoDB Access Denied**
   - Verify IAM permissions in AWS Console
   - Check AWS credentials configuration
   - Ensure table exists in correct region

2. **Slug Conflicts**
   - Slugs are auto-generated from titles
   - Manual slug assignment supported
   - Unique constraint prevents duplicates

3. **Authentication Errors**
   - Verify JWT token in Authorization header
   - Check token expiration
   - Ensure correct JWT secret

### Performance Issues
- Monitor DynamoDB capacity units
- Check Lambda function duration
- Optimize data access patterns
- Consider caching strategies

## Cost Optimization

### DynamoDB
- Use on-demand billing for variable workloads
- Monitor read/write capacity usage
- Implement efficient query patterns
- Archive old data if needed

### Lambda
- Use appropriate memory allocation (512MB recommended)
- Optimize function timeout (30s default)
- Monitor invocation count and duration

## Security Best Practices

1. **DynamoDB Security**
   - Use IAM roles with minimal permissions
   - Enable point-in-time recovery
   - Monitor access with CloudTrail
   - Encrypt data at rest

2. **API Security**
   - JWT token expiration
   - Rate limiting (implement in API Gateway)
   - Input validation
   - CORS configuration

3. **AWS Security**
   - IAM roles with minimal permissions
   - VPC endpoints for DynamoDB (if needed)
   - CloudWatch monitoring
   - Regular security audits

## Future Enhancements

Planned features:
- DynamoDB Streams for real-time updates
- ElasticSearch integration for full-text search
- Comment system with DynamoDB
- Category and tag management
- Post scheduling with EventBridge
- Multi-author support
- Rich media handling with S3
- SEO optimizations
- Analytics integration with DynamoDB

## Support

For issues and questions:
1. Check Lambda logs for detailed error messages
2. Verify AWS credentials and permissions
3. Test DynamoDB connectivity
4. Review API responses for error details

This Posts feature provides a robust, scalable foundation for content management in NuraWeb, leveraging AWS serverless technologies for optimal performance and cost efficiency.
