# Contributing to NuraWeb Portfolio

Thank you for your interest in this project. This is a personal portfolio — contributions are welcome in the form of bug reports, accessibility improvements, and technical fixes.

## Developer Onboarding

### Prerequisites

- Node.js 20+
- npm (preferred over pnpm for CI)
- AWS CLI configured (for API development only)

### Local Development Setup

```bash
# 1. Clone the repository
git clone https://github.com/arunrajan6600/nuraweb.git
cd nuraweb

# 2. Install frontend dependencies
npm install

# 3. Copy and configure environment variables
cp .env.example .env.local
# Edit .env.local with your values

# 4. Start frontend dev server
npm run dev:site
```

For API/backend development:
```bash
# Install Lambda function dependencies
cd functions/aws && npm install

# Start serverless-offline
npm run dev:api
```

### Environment Variables Reference

| Variable | Required | Description |
|:---|:---:|:---|
| `NEXT_PUBLIC_API_BASE_URL` | Yes | Lambda API base URL (production or localhost:3001) |
| `NEXT_PUBLIC_SITE_URL` | Yes | Full site URL for canonical links and OG metadata |
| `NEXT_PUBLIC_DEFAULT_THEME` | No | Default theme: `dark` or `light` |
| `NEXT_PUBLIC_BASE_PATH` | No | GitHub Pages base path (e.g. `/nuraweb`) |
| `JWT_SECRET` | API only | JWT signing secret (must match Lambda env) |
| `ADMIN_USERNAME` | API only | Admin login username |
| `ADMIN_PASSWORD` | API only | Admin login password |
| `AWS_S3_BUCKET_NAME` | API only | S3 bucket for file uploads |
| `DYNAMODB_TABLE_NAME` | API only | DynamoDB table name (default: `NuraWeb-Posts`) |

## Coding Standards

- Language: TypeScript (strict)
- Styling: Tailwind CSS v4, CSS variables in `globals.css`
- Formatting: Follow existing code style; no Prettier is enforced
- Component structure: place new UI in `components/`, page-specific in `app/`
- Do NOT alter the WebGL shader, color palette, or typography
- Do NOT introduce new UI libraries without discussion

## Contribution Process

1. Fork the repository
2. Create a feature branch: `git checkout -b fix/issue-description`
3. Make focused, minimal changes
4. Run lint and build checks:
   ```bash
   npm run lint
   npm run build
   ```
5. Open a Pull Request with a clear description of the change

## Scope of Contributions

**Welcome:**
- Accessibility improvements (WCAG compliance)
- Bug fixes in data processing or rendering
- Performance optimizations
- Documentation improvements
- Security hardening

**Not accepted:**
- UI redesigns or style changes
- New dependencies without clear justification
- Changes to the WebGL shader or artistic identity
- Content edits (managed via admin panel)

## Reporting Issues

Use GitHub Issues with:
- A clear description of the problem
- Steps to reproduce
- Expected vs. actual behavior
- Relevant environment details (OS, browser, Node version)
