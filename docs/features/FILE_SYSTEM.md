# File Upload System

NuraWeb includes a secure file upload system powered by AWS services. This guide covers the setup and usage of the file upload feature.

## Architecture Overview

The file upload system uses:
- AWS Lambda for serverless functions
- API Gateway for HTTP endpoints
- S3 for file storage
- JWT for authentication

## Setup Process

### 1. AWS Resources Setup

1. **Create S3 Bucket:**
   - Go to AWS S3 Console
   - Set bucket policy
   - Create a new bucket
   - Configure CORS settings
   - Set up lifecycle policies if needed

2. **Create IAM Role:**
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

### 2. Lambda Functions Setup

Deploy these functions:

1. **auth-login.js**
   - Purpose: Admin authentication
   - Method: POST
   - Path: `/auth/login`

2. **auth-verify.js**
   - Purpose: JWT token verification
   - Method: GET
   - Path: `/auth/verify`

3. **files-list.js**
   - Purpose: List all files (admin only)
   - Method: GET
   - Path: `/files`

4. **files-upload.js**
   - Purpose: Upload files (admin only)
   - Method: POST
   - Path: `/files/upload`

5. **files-delete.js**
   - Purpose: Soft delete files (admin only)
   - Method: DELETE
   - Path: `/files/{id}`

### 3. Environment Variables

Set these variables in each Lambda function:

```env
# Common Variables
ALLOWED_ORIGIN=https://your-domain.com
JWT_SECRET=your-jwt-secret

# Auth Functions
ADMIN_USERNAME=your-admin-username
ADMIN_PASSWORD=your-admin-password

# File Functions
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=your-region
AWS_S3_BUCKET_NAME=your-bucket-name
MAX_FILE_SIZE=52428800  # 50MB
ALLOWED_FILE_TYPES=image/jpeg,image/png,application/pdf
```

### 4. API Gateway Setup

1. Create REST API
2. Set up endpoints:
   - POST /auth/login → auth-login
   - GET /auth/verify → auth-verify
   - GET /files → files-list
   - POST /files/upload → files-upload
   - DELETE /files/{id} → files-delete
3. Enable CORS
4. Deploy API

## Local Development

For local development:

1. Use LocalStack for AWS service emulation
2. Follow the [LocalStack Setup Guide](../testing/LOCALSTACK_SETUP.md)
3. Use the provided test cases in [File Feature Tests](../testing/FILES_FEATURE_TEST_CASES.md)

## Frontend Integration

1. Set API URL in your environment:
   ```env
   NEXT_PUBLIC_API_BASE_URL=https://your-api-id.execute-api.region.amazonaws.com/prod
   ```

2. Use the provided React components:
   - `FileBrowser`: Browse and manage files
   - `FileUpload`: Upload new files
   - `FilePreview`: Preview uploaded files

## Security Considerations

- All endpoints require JWT authentication
- File types are restricted by MIME type
- Maximum file size is enforced
- S3 bucket is not publicly accessible
- CORS is properly configured
- Environment variables are securely managed

## Cost Optimization

- Use Lambda's free tier (1M requests/month)
- Set appropriate memory allocation
- Configure reasonable timeouts
- Implement S3 lifecycle policies
- Monitor usage and costs

## Monitoring

1. Enable CloudWatch logs
2. Set up error alarms
3. Monitor API Gateway metrics
4. Track S3 usage

## Troubleshooting

Common issues and solutions:

1. CORS errors:
   - Check API Gateway CORS settings
   - Verify allowed origins

2. Authentication failures:
   - Verify JWT token
   - Check environment variables

3. Upload failures:
   - Check file size limits
   - Verify allowed file types
   - Check S3 permissions

For detailed deployment instructions, see [AWS Services Setup](../deployment/AWS_SETUP.md).
