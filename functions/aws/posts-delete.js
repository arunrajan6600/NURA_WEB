const { postQueries } = require('./db');
const { requireAuth } = require('./auth-utils');

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN,
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'DELETE, OPTIONS'
};

exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;

  try {
    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: ''
      };
    }

    // Require authentication for deleting posts
    requireAuth(event);

    // Get post ID from path parameters
    const postId = event.pathParameters?.id;
    if (!postId) {
      return {
        statusCode: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: false,
          error: 'Post ID is required'
        })
      };
    }

    // Delete post from database
    const deletedPost = await postQueries.deletePost(postId);

    if (!deletedPost) {
      return {
        statusCode: 404,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: false,
          error: 'Post not found'
        })
      };
    }

    return {
      statusCode: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        message: 'Post deleted successfully',
        data: {
          id: deletedPost.id,
          title: deletedPost.title
        }
      })
    };

  } catch (error) {
    console.error('Post delete error:', error);

    // Handle authentication errors
    if (error.message === 'Authentication required' || 
        error.message === 'Invalid token' ||
        error.message === 'No authorization header' ||
        error.message === 'No token provided') {
      return {
        statusCode: 401,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: false,
          error: 'Authentication required'
        })
      };
    }

    return {
      statusCode: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: false,
        error: 'Failed to delete post',
        message: error.message
      })
    };
  }
};
