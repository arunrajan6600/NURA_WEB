const { postQueries } = require('./db');

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN,
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, OPTIONS'
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

    // Get post from database
    const post = await postQueries.getPost(postId);

    if (!post) {
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

    // Increment view count if not a draft
    if (post.status === 'published') {
      await postQueries.incrementViewCount(post.id);
      post.view_count = (post.view_count || 0) + 1;
    }

    // Transform post to match frontend format
    const transformedPost = {
      id: post.id,
      title: post.title,
      slug: post.slug,
      status: post.status,
      featured: post.featured,
      type: post.type,
      thumbnail: post.thumbnail_url ? {
        url: post.thumbnail_url,
        alt: post.thumbnail_alt || ''
      } : undefined,
      excerpt: post.excerpt,
      createdAt: post.created_at,
      updatedAt: post.updated_at,
      publishedAt: post.published_at,
      viewCount: post.view_count,
      likeCount: post.like_count,
      cells: post.cells || []
    };

    return {
      statusCode: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        data: transformedPost
      })
    };

  } catch (error) {
    console.error('Post get error:', error);

    return {
      statusCode: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: false,
        error: 'Failed to fetch post',
        message: error.message
      })
    };
  }
};
