# NuraWeb Portfolio

Personal portfolio of **Arun Nura**, a multidisciplinary art practitioner based in Kerala, India.

Built with **Next.js 15 (App Router)**, **TypeScript**, **Tailwind CSS v4**, **DynamoDB** (content), and **AWS Lambda** (serverless API). Deployed as a fully static site to **GitHub Pages**.

---

## Features

- Cell-based post system (markdown, image, video, file cells)
- Visual content editor with drag-and-drop at `/admin`
- DynamoDB-powered backend via AWS Lambda
- Works, Blog, Papers, Stories, and General categories
- Related works & related writings discovery
- Academic citation blocks (BibTeX, APA, MLA, Chicago)
- JSON-LD structured data (Person, Article, CreativeWork)
- Dynamic sitemap.xml generation at build time
- Static export compatible with GitHub Pages
- WebGL matrix grid shader background
- Dark / Light theme support

---

## Quick Start

### Prerequisites

- Node.js 20+
- npm
- AWS CLI (for API development only)

### 1. Clone & Install

```bash
git clone https://github.com/arunrajan6600/nuraweb.git
cd nuraweb
npm install
```

### 2. Configure Environment Variables

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
# Site configuration
NEXT_PUBLIC_SITE_URL=https://arunrajan6600.github.io/nuraweb
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
NEXT_PUBLIC_DEFAULT_THEME=dark
NEXT_PUBLIC_BASE_PATH=/nuraweb

# Admin API credentials (for prebuild posts fetch)
API_BASE_URL=http://localhost:3001
API_STAGE=dev
ADMIN_USERNAME=your-admin-username
ADMIN_PASSWORD=your-admin-password
```

### 3. Start Development

**Frontend only** (uses existing `data/posts.ts`):
```bash
npm run dev:site
```

**Frontend + API** (requires AWS credentials):
```bash
# Terminal 1: API server
npm run dev:api

# Terminal 2: Frontend
npm run dev:site
```

---

## Environment Variables

### Frontend (`.env.local`)

| Variable | Description | Default |
|:---|:---|:---|
| `NEXT_PUBLIC_SITE_URL` | Full public URL (no trailing slash) | `https://arunrajan6600.github.io/nuraweb` |
| `NEXT_PUBLIC_API_BASE_URL` | API base URL | `http://localhost:3001` |
| `NEXT_PUBLIC_DEFAULT_THEME` | Site theme: `dark` or `light` | `dark` |
| `NEXT_PUBLIC_BASE_PATH` | GitHub Pages base path | `/nuraweb` |

### Build (CI / GitHub Actions)

| Variable | Description |
|:---|:---|
| `API_BASE_URL` | API URL for prebuild posts fetch |
| `API_STAGE` | API stage: `dev` or `prod` |
| `ADMIN_USERNAME` | Admin credentials for posts fetch |
| `ADMIN_PASSWORD` | Admin credentials for posts fetch |

### Lambda API (`.env` in `functions/aws/`)

| Variable | Description |
|:---|:---|
| `JWT_SECRET` | JWT signing secret |
| `ADMIN_USERNAME` | Admin username for auth |
| `ADMIN_PASSWORD` | Admin password for auth |
| `AWS_S3_BUCKET_NAME` | S3 bucket for file uploads |
| `DYNAMODB_TABLE_NAME` | DynamoDB table (default: `NuraWeb-Posts`) |
| `ALLOWED_ORIGIN` | CORS allowed origin |
| `MAX_FILE_SIZE` | Max upload size in bytes |
| `ALLOWED_FILE_TYPES` | Comma-separated MIME types |

---

## Content Management

All content is managed via the admin panel at `/admin`.

### Post Types

| Type | Route | Description |
|:---|:---|:---|
| `project` | `/works` | Artworks, installations, films |
| `blog` | `/posts/blog` | Notes, field logs |
| `paper` | `/posts/papers` | Academic papers |
| `article` | `/posts/papers` | Articles and essays |
| `story` | `/posts/stories` | Fiction and narratives |
| `general` | `/posts/general` | Miscellaneous writings |

### Editing Workflow

1. Navigate to `/admin` and log in
2. Click a post to open the **Visual Editor**
3. Add, edit, or reorder content cells
4. Click **Save** — changes sync to DynamoDB
5. Trigger a GitHub Actions deployment to publish

### Admin Features

- Create, edit, delete posts
- Publish / draft toggle
- Featured, pinned, archived flags
- Research metadata (for academic posts)
- Project metadata (exhibition, credits, tools)
- File manager at `/admin/files`

---

## Build & Deploy

### Local Production Build

```bash
# Full build (fetches posts from API, generates sitemap, builds)
npm run build

# Build only (skip API fetch)
npm run build:posts  # skip posts
npm run build
```

### GitHub Pages (Automatic)

Push to `main` → GitHub Actions builds and deploys automatically.

**Manual deploy:**
1. Go to Actions → Deploy to GitHub Pages
2. Click **Run workflow**
3. Select environment (`prod`/`dev`) and theme

### AWS Lambda API Deploy

```bash
# Deploy to production
npm run deploy:api:prod

# Deploy to dev
npm run deploy:api:dev
```

**Production API:** `https://lynzm5kprh.execute-api.ap-south-1.amazonaws.com/prod`

---

## Project Structure

```
├── app/                    # Next.js App Router pages
│   ├── layout.tsx          # Root layout, metadata, fonts
│   ├── globals.css         # CSS variables & base styles
│   └── (pages)/            # Route group
│       ├── info/           # About page
│       ├── works/          # Works/Projects index
│       ├── posts/          # Posts category pages
│       └── post/[id]/      # Individual post page
├── components/
│   ├── layout/             # Header, Footer, Nav
│   ├── post/               # Post cards, cells, citation block
│   ├── files/              # Admin file manager
│   ├── auth/               # Authentication provider
│   └── ui/                 # Shadcn + custom UI, WebGL shader
├── data/
│   └── posts.ts            # Auto-generated at build time
├── functions/aws/          # Serverless Lambda functions
│   ├── serverless.yml      # Infrastructure config
│   ├── posts-*.js          # Post CRUD handlers
│   ├── auth-*.js           # Authentication handlers
│   └── files-*.js          # File management handlers
├── scripts/
│   ├── build-posts.js      # Posts API sync + sitemap generator
│   └── deploy.js           # Deployment orchestrator
├── types/
│   └── post.ts             # TypeScript type definitions
└── public/
    ├── robots.txt
    └── sitemap.xml         # Auto-generated at build time
```

---

## Infrastructure

### AWS Services

| Service | Purpose |
|:---|:---|
| **DynamoDB** | Posts database (single-table design) |
| **Lambda** | Serverless API handlers |
| **API Gateway** | REST API routing |
| **S3** | File/media storage |

### Database Table: `NuraWeb-Posts`

Primary key: `id` (ULID string)

Key attributes: `title`, `type`, `status`, `featured`, `cells`, `created_at`, `updated_at`

---

## Development Notes

- `data/posts.ts` is **auto-generated** — do not edit it manually
- `public/sitemap.xml` is regenerated on every build
- The WebGL shader in `components/ui/matrix-grid-background.tsx` is an artistic element — do not modify
- Use `NEXT_PUBLIC_SITE_URL` for all absolute URL generation
- JWT tokens are stored in `localStorage` (known technical debt — requires backend httpOnly cookie migration)

---

## Troubleshooting

**API server not starting:**
```bash
cd functions/aws
cat .env  # Check env vars exist
npm install
npm run dev
```

**Posts not updating after API edit:**
```bash
npm run build:posts  # Re-sync posts from API
```

**Build fails with missing posts:**
- The build falls back to the existing `data/posts.ts` if API is unreachable
- This is expected behavior in offline mode

---

## License

MIT License — see [LICENSE](./LICENSE) for details.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development guidelines.
