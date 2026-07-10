# NuraWeb Portfolio

A modern, content-driven portfolio and blog site built with Next.js 13+, TypeScript, Tailwind CSS, and Shadcn UI. Features a cell-based content system, visual editor, automated GitHub Pages deployment, and DynamoDB-powered backend.

## 📚 Documentation

Please visit our [Documentation](./docs/README.md) for:

- 🚀 [Getting Started Guide](./docs/getting-started/QUICK_START.md)
- 📁 [File Upload System](./docs/features/FILE_SYSTEM.md)

## Quick Start

1. Clone the repository:

   ```bash
   git clone <your-repository-url>
   cd nuraweb
   ```

2. Set up AWS DynamoDB and install dependencies:

   ```bash
   make db-setup
   ```

   Or manually:

   ```bash
   ./setup-dynamodb.sh
   ```

3. Start the development server:

   ```bash
   make dev
   # or
   npm run dev
   ```

4. Start the Lambda functions (in a new terminal):
   ```bash
   make lambda-dev
   # or
   cd functions/aws && npm run dev
   ```

For detailed setup instructions and documentation, please visit our [Getting Started Guide](./docs/getting-started/QUICK_START.md).

Your site will be available at [http://localhost:3000](http://localhost:3000)

## Database Configuration

This project uses **Amazon DynamoDB** directly in AWS (no local setup required).

### Prerequisites

- AWS CLI installed and configured
- AWS credentials with DynamoDB permissions
- Internet connection for AWS API calls

### Database Commands

```bash
# Setup AWS DynamoDB (first time)
make db-setup

# Create DynamoDB table in AWS
make db-create-table

# Check table status
make db-status
```

### Environment Variables

```bash
# DynamoDB Configuration
DYNAMODB_TABLE_NAME=NuraWeb-Posts
AWS_REGION=ap-south-1

# AWS Credentials (configured via aws configure)
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
```

## Content Management

### Managing Posts

Posts are now stored in **DynamoDB** with automatic API synchronization. The system supports:

- **Single Table Design**: Posts and post cells are stored in one DynamoDB table
- **API-First**: All content management happens through REST API endpoints
- **Admin Interface**: Built-in admin panel for managing posts (`/admin`)
- **Versioned Deployments**: Automatic API sync during build process

### Post Structure

Each post in DynamoDB has:

- `id`: Unique ULID identifier
- `type`: Post type ("project", "blog", "paper", "article", "story", "general")
- `title`: Post title
- `slug`: URL-friendly identifier
- `status`: "draft" or "published"
- `featured`: Boolean to show on home page
- `thumbnail`: Optional image with URL and alt text
- `excerpt`: Brief description
- `cells`: Array of content cells with different types (markdown, image, video, etc.)
- `created_at` / `updated_at`: ISO timestamps
- `view_count`: Automatic view tracking

### Using the Visual Editor

1. **Admin Login**: Navigate to `/admin` and log in
2. **Manage Posts**: View all posts with CRUD operations
3. **Visual Editor**: Click the eye icon to open the visual editor
4. **Content Editing**:
   - Add/edit markdown content
   - Add images via URL
   - Rearrange cells using drag-and-drop
   - Preview content in real-time
5. **Save Changes**: Changes are automatically saved to DynamoDB

### API Endpoints

- `GET /posts` - List published posts
- `GET /posts/{id}` - Get specific post
- `POST /posts` - Create new post (auth required)
- `PUT /posts/{id}` - Update post (auth required)
- `DELETE /posts/{id}` - Delete post (auth required)

### Content Update SOP

1. **Create/Edit Content:**

   - Use the admin interface at `/admin`
   - Click "Visual Editor" for rich content editing
   - Save directly through the interface

2. **Review Changes:**

   - Content is immediately available for preview
   - Check all pages: home, blog, projects
   - Verify responsive layouts and themes

3. **Deploy Changes:**
   - Build system automatically syncs with API
   - No manual `data/posts.ts` updates needed
   - Versioned deployments track content changes

## Deployment

The site uses GitHub Actions for automated deployment to GitHub Pages.

### First-Time Setup

1. In your GitHub repository:

   - Go to Settings > Pages
   - Set Source to "GitHub Actions"

2. Update environment variables:
   - Set `NEXT_PUBLIC_BASE_PATH` in `.env`:
     - For username.github.io: leave empty
     - For other repos: set to "/repository-name"

### Deployment Process

1. **Automatic Deployment:**

   - Push to main branch
   - GitHub Actions will:
     - Build the site
     - Deploy to GitHub Pages
     - Provide the URL in action output

2. **Manual Deployment:**
   ```bash
   npm run build
   ```
   - Check `out` directory for built files

### Checking Deployment

1. Wait for GitHub Actions to complete
2. Access your site at:
   - `https://username.github.io` (for username.github.io)
   - `https://username.github.io/repository-name` (for other repos)

## Environment Variables

```env
# Theme (light/dark)
NEXT_PUBLIC_DEFAULT_THEME="light"

# Base path for GitHub Pages
NEXT_PUBLIC_BASE_PATH="/repository-name"
```

## Development Notes

- Site uses environment-controlled theming
- All images must use remote URLs (e.g., Unsplash)
- Content is statically generated
- Base path is required for correct asset loading

## 🚀 Deployment

### Production Deployment

The site automatically deploys to GitHub Pages when you push to the `main` branch.

#### Serverless API Functions

The backend API functions are deployed to AWS Lambda:

**Production API Base URL:** `https://lynzm5kprh.execute-api.ap-south-1.amazonaws.com/prod`

**Available Endpoints:**

- `POST /auth/login` - Admin authentication
- `GET /auth/verify` - JWT token verification
- `GET /files` - List uploaded files
- `POST /files/upload` - Upload new files
- `DELETE /files/{id}` - Delete files

#### Frontend Deployment

1. **Automatic Deployment (Recommended):**

   - Push to `main` branch
   - GitHub Actions will automatically build and deploy

2. **Manual Deployment:**

   ```bash
   # Build for production
   npm run build

   # Deploy to GitHub Pages (if configured)
   npm run deploy
   ```

#### Environment Configuration

- **Production:** Environment variables are set in GitHub Actions workflow
- **Development:** Copy `.env.example` to `.env.local` and configure

### Local Development with Production API

To test the frontend with production APIs locally:

1. Update `.env.local`:

   ```bash
   NEXT_PUBLIC_API_BASE_URL=https://lynzm5kprh.execute-api.ap-south-1.amazonaws.com/prod
   ```

2. Start development server:
   ```bash
   npm run dev
   ```

## 🔧 Troubleshooting

1. **Images not loading:**

   - Verify image URLs are HTTPS
   - Check base path configuration

2. **Styles not applying:**

   - Clear browser cache
   - Rebuild the project

3. **Deployment issues:**
   - Check GitHub Actions logs
   - Verify repository settings
   - Ensure base path is correct

## Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## License

MIT License - See LICENSE file for details
