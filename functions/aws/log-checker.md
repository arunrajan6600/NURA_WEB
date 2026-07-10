# AWS Lambda CloudWatch Log Checker Procedure

This document provides step-by-step instructions for checking AWS Lambda function logs in CloudWatch using the AWS CLI.

## Prerequisites

- AWS CLI installed and configured with appropriate credentials
- Access to the AWS account where the Lambda functions are deployed
- Knowledge of the function names and AWS region

## Step 1: List Available Log Groups

First, find the log group for your Lambda function:

```bash
aws logs describe-log-groups --log-group-name-prefix "/aws/lambda/[FUNCTION-PREFIX]" --region [REGION]
```

**Example for our functions:**
```bash
aws logs describe-log-groups --log-group-name-prefix "/aws/lambda/nuraweb-files-prod-files-presigned-url" --region ap-south-1
```

## Step 2: Get Recent Log Streams

List the most recent log streams (each Lambda execution creates a new stream):

```bash
aws logs describe-log-streams \
  --log-group-name "/aws/lambda/[LOG-GROUP-NAME]" \
  --region [REGION] \
  --order-by LastEventTime \
  --descending \
  --max-items 5
```

**Example:**
```bash
aws logs describe-log-streams \
  --log-group-name "/aws/lambda/nuraweb-files-prod-files-presigned-url" \
  --region ap-south-1 \
  --order-by LastEventTime \
  --descending \
  --max-items 5
```

## Step 3: Get Log Events from a Specific Stream

Get the actual log messages from a specific log stream:

```bash
aws logs get-log-events \
  --log-group-name "/aws/lambda/[LOG-GROUP-NAME]" \
  --log-stream-name "[LOG-STREAM-NAME]" \
  --region [REGION]
```

**Example:**
```bash
aws logs get-log-events \
  --log-group-name "/aws/lambda/nuraweb-files-prod-files-presigned-url" \
  --log-stream-name "2025/07/26/[\$LATEST]5bb44e2de1fd464da0a172231e51db4a" \
  --region ap-south-1
```

**Note:** The `$` in `$LATEST` needs to be escaped as `\$` in bash.

## Step 4: Filter Logs by Time Range

To get logs from a specific time period:

```bash
aws logs get-log-events \
  --log-group-name "/aws/lambda/[LOG-GROUP-NAME]" \
  --log-stream-name "[LOG-STREAM-NAME]" \
  --region [REGION] \
  --start-time [EPOCH-TIMESTAMP] \
  --end-time [EPOCH-TIMESTAMP]
```

## Step 5: Search for Specific Patterns

To search for specific error patterns across all log streams:

```bash
aws logs filter-log-events \
  --log-group-name "/aws/lambda/[LOG-GROUP-NAME]" \
  --region [REGION] \
  --filter-pattern "ERROR" \
  --start-time [EPOCH-TIMESTAMP]
```

**Example to find all errors in the last hour:**
```bash
# Get timestamp for 1 hour ago (on Linux/Mac):
START_TIME=$(date -d '1 hour ago' +%s)000

aws logs filter-log-events \
  --log-group-name "/aws/lambda/nuraweb-files-prod-files-presigned-url" \
  --region ap-south-1 \
  --filter-pattern "ERROR" \
  --start-time $START_TIME
```

## Common Lambda Function Log Groups

For our Nuraweb project, the log groups follow this pattern:
- `/aws/lambda/nuraweb-files-prod-auth-login`
- `/aws/lambda/nuraweb-files-prod-auth-verify`
- `/aws/lambda/nuraweb-files-prod-files-list`
- `/aws/lambda/nuraweb-files-prod-files-upload`
- `/aws/lambda/nuraweb-files-prod-files-presigned-url`
- `/aws/lambda/nuraweb-files-prod-files-delete`

## Log Analysis for Current Issue

### Error Found: Presigned URL Function
**Error:** `SyntaxError: Unexpected token e in JSON at position 0`
**Location:** `/var/task/files-presigned-url.js:77:50` (JSON.parse line)
**Cause:** The `event.body` parameter contains malformed JSON starting with "e"

### Recent Error Log Example:
```
2025-07-27T07:38:48.187Z	6cdae680-6721-4b48-bdd6-d0d37da81f90	ERROR	Pre-signed URL generation error: SyntaxError: Unexpected token e in JSON at position 0
    at JSON.parse (<anonymous>)
    at exports.handler (/var/task/files-presigned-url.js:77:50)
    at Runtime.handleOnceNonStreaming (file:///var/runtime/index.mjs:1205:29)
```

## Troubleshooting Tips

1. **Check environment variables:** Ensure all required env vars are set in the Lambda configuration
2. **Verify CORS settings:** Check if the origin is allowed in CORS configuration
3. **Validate request format:** Ensure the client is sending proper JSON in the request body
4. **Check IAM permissions:** Verify the Lambda execution role has necessary permissions

## Quick Commands Reference

```bash
# Get latest logs for presigned URL function
aws logs get-log-events --log-group-name "/aws/lambda/nuraweb-files-prod-files-presigned-url" --log-stream-name "$(aws logs describe-log-streams --log-group-name "/aws/lambda/nuraweb-files-prod-files-presigned-url" --region ap-south-1 --order-by LastEventTime --descending --max-items 1 --query 'logStreams[0].logStreamName' --output text)" --region ap-south-1

# Search for all errors in the last 24 hours
aws logs filter-log-events --log-group-name "/aws/lambda/nuraweb-files-prod-files-presigned-url" --region ap-south-1 --filter-pattern "ERROR" --start-time $(date -d '24 hours ago' +%s)000
```
