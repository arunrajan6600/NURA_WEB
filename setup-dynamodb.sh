#!/bin/bash

echo "🚀 Setting up NuraWeb with AWS DynamoDB..."

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "⚠️  AWS CLI not found. Please install AWS CLI and configure your credentials:"
    echo "   - Install: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
    echo "   - Configure: aws configure"
    exit 1
fi

# Check AWS credentials
echo "� Checking AWS credentials..."
aws sts get-caller-identity > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "❌ AWS credentials not configured. Please run: aws configure"
    exit 1
fi

# Install Lambda dependencies
echo "📦 Installing Lambda dependencies..."
cd functions/aws
npm install

# Go back to project root
cd ../../

# Create DynamoDB table in AWS
echo "🗄️  Creating DynamoDB table in AWS..."
node database/dynamodb-init.js

# Install main project dependencies
echo "📦 Installing main project dependencies..."
npm install

echo "✅ Setup complete!"
echo ""
echo "🎉 Your AWS DynamoDB setup is ready!"
echo ""
echo "Services:"
echo "  - DynamoDB Table: ${DYNAMODB_TABLE_NAME:-NuraWeb-Posts} (AWS)"
echo "  - Region: ${AWS_REGION:-ap-south-1}"
echo ""
echo "Next steps:"
echo "  1. Start the development server: make dev"
echo "  2. Start the Lambda functions: make lambda-dev"
echo ""
echo "Required environment variables:"
echo "  - AWS_REGION=ap-south-1 (or your preferred region)"
echo "  - DYNAMODB_TABLE_NAME=NuraWeb-Posts (default)"
echo "  - AWS credentials configured via 'aws configure'"
