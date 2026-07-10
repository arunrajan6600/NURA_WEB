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
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
      body: '',
    };
  }

  if (event.httpMethod !== 'GET') {
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

    // List objects in S3 bucket
    const params = {
      Bucket: BUCKET_NAME,
      MaxKeys: 1000,
    };

    const data = await s3.listObjectsV2(params).promise();
    
    if (!data.Contents) {
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([]),
      };
    }

    // Get metadata for each file
    const files = await Promise.all(
      data.Contents
        .filter(item => !item.Key.endsWith('/')) // Filter out folders
        .map(async (item) => {
          try {
            const headParams = {
              Bucket: BUCKET_NAME,
              Key: item.Key,
            };

            const headData = await s3.headObject(headParams).promise();
            const metadata = headData.Metadata || {};

            // Skip deleted files
            if (metadata.deleted === 'true') {
              return null;
            }

            // Generate public URL instead of signed URL
            const publicUrl = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${encodeURIComponent(item.Key)}`;

            return {
              id: item.Key,
              key: item.Key,
              originalName: metadata['original-filename'] || item.Key,
              size: item.Size,
              mimeType: headData.ContentType || 'unknown',
              uploadedAt: item.LastModified,
              s3Url: publicUrl,
              metadata: metadata,
            };
          } catch (error) {
            console.error(`Error getting metadata for ${item.Key}:`, error);
            return null;
          }
        })
    );

    // Filter out null values (deleted files or errors)
    const validFiles = files.filter(file => file !== null);

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(validFiles),
    };
  } catch (error) {
    console.error('Error listing files:', error);
    
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
