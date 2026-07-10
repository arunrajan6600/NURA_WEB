# External Serverless Functions for Files Feature

This directory contains templates for external serverless functions that should be deployed separately from the main Next.js site.

## Deployment Options

### Option 1: Vercel Functions
Deploy these as a separate Vercel project with the following structure:

```
files-api/
├── api/
│   ├── auth/
│   │   ├── login.js
│   │   └── verify.js
│   └── files/
│       ├── index.js
│       ├── upload.js
│       └── [id].js
├── package.json
└── vercel.json
```

### Option 2: Netlify Functions
Deploy as Netlify functions:

```
netlify-functions/
├── netlify/
│   └── functions/
│       ├── auth-login.js
│       ├── auth-verify.js
│       ├── files-list.js
│       ├── files-upload.js
│       └── files-delete.js
├── package.json
└── netlify.toml
```

### Option 3: AWS Lambda
Deploy as individual Lambda functions with API Gateway.

## Configuration

Set these environment variables in your serverless function environment:

```env
# AWS S3 Configuration
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=nuraweb-files

# Authentication
JWT_SECRET=your-jwt-secret-key
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-secure-password

# File Upload Configuration
MAX_FILE_SIZE=52428800
ALLOWED_FILE_TYPES=image/*,video/*,audio/*,application/pdf,text/*
JWT_EXPIRES_IN=24h
```

## CORS Configuration

Make sure your serverless functions have proper CORS headers:

```javascript
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://your-github-pages-site.github.io',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};
```

## Frontend Integration

Update your frontend environment:

```env
NEXT_PUBLIC_API_BASE_URL=https://your-serverless-api-domain.com/api
```

The frontend will make API calls to your external serverless functions instead of local Next.js API routes.
