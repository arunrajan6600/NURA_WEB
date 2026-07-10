# GitHub Copilot Instructions

This is a Next.js 13+ project using the App Router, TypeScript, Tailwind CSS, and Shadcn UI components. It's a content-driven portfolio/blog site with a cell-based content system and visual editor.

## Project Overview

### Key Technologies
- Next.js with App Router for routing and server components
- TypeScript for type safety
- Tailwind CSS for styling
- Shadcn UI for pre-built, customizable components
- Environment-controlled theme (light/dark)
- Static site generation for GitHub Pages deployment

### Core Features
- Cell-based content system for posts and projects
- Visual post editor with live preview
- Responsive layout with mobile navigation
- Environment-controlled theme system
- Static deployment to GitHub Pages
- Newsletter subscription form
- Social media integration

### Project Structure
```
app/
  layout.tsx             # Root layout with theme provider
  page.tsx              # Home page with featured content
  (pages)/
    blog/               # Blog posts listing
    edit/[id]/         # Visual post editor
    info/              # About/Info page
    post/[id]/         # Individual post view
    projects/          # Projects listing
components/
  editor/              # Post editing components
  layout/              # Layout components (header, footer, nav)
  post/               # Post-related components
  ui/                 # Shadcn UI components
  theme-provider.tsx  # Theme provider with env control
```

### Environment Variables
```env
# Theme setting (light/dark)
NEXT_PUBLIC_DEFAULT_THEME="light"

# Base path for GitHub Pages
NEXT_PUBLIC_BASE_PATH="/repository-name"
```

## Development Guidelines

### Code Standards
- Use TypeScript with proper type definitions
- Follow Next.js 13+ App Router patterns
- Implement proper error boundaries
- Handle loading and error states
- Follow accessibility standards
- Keep components modular and reusable

### Styling Guidelines
- Use Tailwind CSS for styling
- Follow responsive design principles
- Maintain consistent spacing using Tailwind's spacing scale
- Use semantic color tokens (background, foreground, muted, etc.)
- Follow the established vertical layout pattern

### Content Management
- Posts are stored in `data/posts.ts`
- Each post has a type (blog/project), status, and cells array
- Cells support markdown and image content
- Thumbnails are handled at the post level
- Featured posts are marked with `featured: true`

### Deployment
- GitHub Actions workflow for automated deployment
- Static site generation with `next export`
- Proper base path handling for GitHub Pages
- Image optimization settings for static deployment
- Automated build and deployment on main branch pushes

## Available Components

### Shadcn UI Components
All components are available under `@/components/ui/`:

#### Layout Components:
- Card - Content containers
- Sheet - Side panels
- Drawer - Mobile-friendly panels
- Navigation Menu - Main navigation
- Menubar - Application menus

#### Form Components:
- Button - Actions
- Input - Text input
- Textarea - Multiline input
- Select - Dropdown selection
- Radio Group - Exclusive selection
- Switch - Boolean toggles
- Toggle - Togglable options
- Form - Form validation

#### Display Components:
- Alert - Important messages
- Badge - Status indicators
- Progress - Progress indicators
- Table - Tabular data
- Avatar - User avatars

#### Overlay Components:
- Dialog - Modal dialogs
- Popover - Floating content
- Dropdown Menu - Context menus
- Hover Card - Hover tooltips
- Sonner - Toast notifications

#### Navigation Components:
- Tabs - Tabbed interfaces
- Accordion - Collapsible content

### Custom Components

#### Post Components:
- PostCard - Display post previews
- PostCell - Render different cell types
- MarkdownCell - Render markdown content
- ImageCell - Handle image display
- ThumbnailCell - Post thumbnail display

#### Editor Components:
- EditPost - Main post editor
- VisualEditor - WYSIWYG editor interface

#### Layout Components:
- Header - Site header with navigation
- Footer - Site footer with newsletter
- MainNav - Desktop navigation
- MobileNav - Responsive mobile menu

## Usage Guidelines

### Component Usage
- Import from `@/components/ui` using the configured alias
- Follow Shadcn UI's composition patterns
- Use built-in variants and className props
- Consider server/client component boundaries
- Use Lucide icons from `lucide-react`

### Post Management
- Create posts in `data/posts.ts`
- Use the visual editor at `/edit/[id]`
- Set post status to "published" for visibility
- Add thumbnails for better visual appeal
- Mark posts as featured to show on home page

### Theme Handling
- Theme is controlled via `NEXT_PUBLIC_DEFAULT_THEME`
- No user toggle available - environment controlled
- Use semantic color tokens for consistency
