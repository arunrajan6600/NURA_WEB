# AWS Lambda Deployment Guide

This directory contains AWS Lambda functions for the NuraWeb Files feature.

## Lambda Functions

### 1. auth-login.js
- **Purpose**: Admin authentication
- **Method**: POST
- **Path**: `/auth/login`
- **Environment Variables**: `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `JWT_SECRET`

### 2. auth-verify.js
- **Purpose**: JWT token verification
- **Method**: GET
- **Path**: `/auth/verify`
- **Environment Variables**: `JWT_SECRET`

### 3. files-list.js
- **Purpose**: List all files (admin only)
- **Method**: GET
- **Path**: `/files`
- **Environment Variables**: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `AWS_S3_BUCKET_NAME`, `JWT_SECRET`

### 4. files-upload.js
- **Purpose**: Upload files (admin only)
- **Method**: POST
- **Path**: `/files/upload`
- **Environment Variables**: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `AWS_S3_BUCKET_NAME`, `JWT_SECRET`, `MAX_FILE_SIZE`, `ALLOWED_FILE_TYPES`

### 5. files-delete.js
- **Purpose**: Soft delete files (admin only)
- **Method**: DELETE
- **Path**: `/files/{id}`
- **Environment Variables**: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `AWS_S3_BUCKET_NAME`, `JWT_SECRET`

## Deployment Steps

### 1. Install Dependencies
```bash
npm install
```

### 2. Create Lambda Functions
For each function file, create a Lambda function in AWS Console:

1. Go to AWS Lambda Console
2. Click "Create function"
3. Choose "Author from scratch"
4. Set function name (e.g., `nuraweb-auth-login`)
5. Choose Node.js 18.x runtime
6. Create function

### 3. Upload Code
For each function:
1. Copy the function code
2. Paste into the Lambda function editor
3. Install dependencies (upload as zip or use Lambda layers)

### 4. Configure Environment Variables
In each Lambda function, add these environment variables:

**Common Variables:**
- `ALLOWED_ORIGIN`: Your frontend URL (e.g., `https://username.github.io`)
- `JWT_SECRET`: Your JWT secret key

**Auth Functions:**
- `ADMIN_USERNAME`: Admin username
- `ADMIN_PASSWORD`: Admin password

**File Functions:**
- `AWS_ACCESS_KEY_ID`: S3 access key
- `AWS_SECRET_ACCESS_KEY`: S3 secret key
- `AWS_REGION`: S3 region (e.g., `us-east-1`)
- `AWS_S3_BUCKET_NAME`: Your S3 bucket name
- `MAX_FILE_SIZE`: Maximum file size in bytes (default: 52428800 = 50MB)
- `ALLOWED_FILE_TYPES`: Comma-separated list of allowed MIME types

### 5. Set Up API Gateway
1. Go to API Gateway Console
2. Create new REST API
3. Create resources and methods:
   - `POST /auth/login` → `nuraweb-auth-login`
   - `GET /auth/verify` → `nuraweb-auth-verify`
   - `GET /files` → `nuraweb-files-list`
   - `POST /files/upload` → `nuraweb-files-upload`
   - `DELETE /files/{id}` → `nuraweb-files-delete`

### 6. Enable CORS
For each method in API Gateway:
1. Select the method
2. Click "Actions" → "Enable CORS"
3. Configure allowed origins, methods, and headers
4. Deploy API

### 7. Deploy API
1. Click "Actions" → "Deploy API"
2. Create new deployment stage (e.g., "prod")
3. Note the API Gateway URL

## Frontend Configuration

Update your frontend environment variables:

```env
NEXT_PUBLIC_API_BASE_URL=https://your-api-id.execute-api.region.amazonaws.com/prod
```

## IAM Permissions

Your Lambda functions need these IAM permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:ListBucket",
        "s3:HeadObject"
      ],
      "Resource": [
        "arn:aws:s3:::your-bucket-name",
        "arn:aws:s3:::your-bucket-name/*"
      ]
    }
  ]
}
```

## Testing

Test each endpoint using curl or Postman:

```bash
# Login
curl -X POST https://your-api-url/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"your-password"}'

# List files (with token)
curl -X GET https://your-api-url/files \
  -H "Authorization: Bearer your-jwt-token"
```

## Cost Optimization

- Use Lambda's free tier (1M requests/month)
- Set appropriate memory allocation (128MB is usually sufficient)
- Configure timeout (30 seconds max for API Gateway)
- Use S3 lifecycle policies for old files

## Monitoring

- Enable CloudWatch logs for debugging
- Set up CloudWatch alarms for errors
- Monitor API Gateway metrics
- Track S3 usage and costs
