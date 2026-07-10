const AWS = require('aws-sdk');
const jwt = require('jsonwebtoken');

// Configure AWS
const s3 = new AWS.S3({
  region: process.env.AWS_REGION,
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME;

// JWT middleware
const verifyToken = (event) => {
  const authHeader = event.headers.Authorization || event.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No token provided');
  }

  const token = authHeader.substring(7);
  return jwt.verify(token, process.env.JWT_SECRET);
};

exports.handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*',
        'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
      body: '',
    };
  }

  if (event.httpMethod !== 'DELETE') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    // Verify JWT token
    verifyToken(event);

    // Get file ID from path parameters
    const fileId = event.pathParameters?.id;
    
    if (!fileId) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'File ID is required' }),
      };
    }

    // Check if file exists
    const headParams = {
      Bucket: BUCKET_NAME,
      Key: fileId,
    };

    try {
      await s3.headObject(headParams).promise();
    } catch (error) {
      if (error.statusCode === 404) {
        return {
          statusCode: 404,
          headers: {
            'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ error: 'File not found' }),
        };
      }
      throw error;
    }

    // Soft delete: Update metadata to mark as deleted
    const copyParams = {
      Bucket: BUCKET_NAME,
      CopySource: `${BUCKET_NAME}/${fileId}`,
      Key: fileId,
      Metadata: {
        deleted: 'true',
        deletedAt: new Date().toISOString(),
        deletedBy: 'admin',
      },
      MetadataDirective: 'REPLACE',
    };

    await s3.copyObject(copyParams).promise();

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        message: 'File deleted successfully',
        fileId: fileId 
      }),
    };
  } catch (error) {
    console.error('Error deleting file:', error);
    
    if (error.name === 'JsonWebTokenError' || error.message === 'No token provided') {
      return {
        statusCode: 401,
        headers: {
          'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Unauthorized' }),
      };
    }

    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
