const AWS = require('aws-sdk');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const parser = require('lambda-multipart-parser');

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

// File validation
const validateFile = (file) => {
  const maxSize = parseInt(process.env.MAX_FILE_SIZE) || 50 * 1024 * 1024; // 50MB default
  const allowedTypes = (process.env.ALLOWED_FILE_TYPES || 'image/*,video/*,audio/*,application/pdf,text/*').split(',');
  
  if (file.size > maxSize) {
    throw new Error(`File size exceeds ${maxSize / 1024 / 1024}MB limit`);
  }
  
  const isAllowed = allowedTypes.some(type => {
    const trimmedType = type.trim();
    // Allow both wildcard (image/*) and specific (application/pdf) matches
    if (trimmedType.endsWith('/*')) {
      const baseType = trimmedType.replace('/*', '');
      return file.type.startsWith(baseType);
    }
    return file.type.startsWith(trimmedType);
  });
  
  if (!isAllowed) {
    throw new Error(`File type ${file.type} not allowed`);
  }
};

// Helper function to ensure proper binary handling
const ensureBinaryContent = (content, isBase64Encoded) => {
  if (Buffer.isBuffer(content)) {
    return content;
  }
  
  if (typeof content === 'string') {
    if (isBase64Encoded) {
      return Buffer.from(content, 'base64');
    }
    return Buffer.from(content, 'binary');
  }
  
  // If it's already a Uint8Array or similar, convert to Buffer
  return Buffer.from(content);
};

exports.handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
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
    const decoded = verifyToken(event);

    // Handle binary content properly
    let body = event.body;
    if (event.isBase64Encoded && typeof body === 'string') {
      body = Buffer.from(body, 'base64');
    }

    // Parse multipart form data with proper binary handling
    const parseEvent = {
      ...event,
      body: body
    };
    
    const result = await parser.parse(parseEvent);
    const uploadedFiles = [];

    console.log(`Processing ${result.files.length} files`);

    for (const file of result.files) {
      try {
        // Ensure we have proper binary content
        const fileContent = ensureBinaryContent(file.content, event.isBase64Encoded);
        
        // Create a synthetic file object for validation
        const validationFile = {
          name: file.filename,
          type: file.contentType,
          size: fileContent.length,
        };

        // Validate file
        validateFile(validationFile);

        // Generate unique key
        const fileExtension = file.filename.split('.').pop();
        const uniqueKey = `${uuidv4()}.${fileExtension}`;

        console.log(`Uploading file: ${file.filename}, Size: ${fileContent.length} bytes, Type: ${file.contentType}`);

        // Upload to S3 with proper content handling
        const uploadParams = {
          Bucket: BUCKET_NAME,
          Key: uniqueKey,
          Body: fileContent,
          ContentType: file.contentType,
          ContentLength: fileContent.length,
          Metadata: {
            'original-filename': file.filename,
            'uploaded-by': decoded.username,
            'file-size': fileContent.length.toString(),
            'content-type': file.contentType,
          },
        };

        const s3Response = await s3.upload(uploadParams).promise();

        console.log(`Successfully uploaded ${file.filename} to ${s3Response.Location}`);

        uploadedFiles.push({
          id: uniqueKey,
          filename: file.filename,
          url: s3Response.Location,
          contentType: file.contentType,
          size: fileContent.length,
          uploadedBy: decoded.username,
          createdAt: new Date().toISOString(),
        });
      } catch (fileError) {
        console.error(`Error processing file ${file.filename}:`, fileError);
        // Continue with other files but log the error
      }
    }

    if (uploadedFiles.length === 0) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'No valid files were uploaded' }),
      };
    }

    return {
      statusCode: 201,
      headers: {
        'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Files uploaded successfully',
        files: uploadedFiles,
      }),
    };
  } catch (error) {
    console.error('Upload error:', error);
    return {
      statusCode: error.message.includes('No token provided') ? 401 : 500,
      headers: {
        'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: error.message || 'An unexpected error occurred' }),
    };
  }
};
