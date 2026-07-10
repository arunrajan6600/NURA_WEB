# Quick Start Guide

This guide will help you get NuraWeb up and running on your local machine.

## Prerequisites

- Node.js 18.x or later
- npm or pnpm
- Git

## Installation Steps

1. Clone the repository:
   ```bash
   git clone <your-repository-url>
   cd nuraweb
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```

4. Configure your environment variables:
   ```env
   # Theme setting (light/dark)
   NEXT_PUBLIC_DEFAULT_THEME="light"

   # Base path for GitHub Pages
   NEXT_PUBLIC_BASE_PATH="/repository-name"

   # API Configuration (if using file upload feature)
   NEXT_PUBLIC_API_BASE_URL=http://localhost:4566  # For LocalStack testing
   # NEXT_PUBLIC_API_BASE_URL=https://your-api-id.execute-api.region.amazonaws.com/prod  # For production
   ```

5. Start the development server:
   ```bash
   pnpm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Next Steps

- Review the [Project Overview](./PROJECT_OVERVIEW.md) to understand the project structure
- Check out the [Local Development Guide](./LOCAL_DEVELOPMENT.md) for development workflow
- Set up the [File Upload System](../features/FILE_SYSTEM.md) if needed
