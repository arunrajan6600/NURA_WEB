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

    // Parse query parameters for filtering
    const queryParams = event.queryStringParameters || {};
    const filters = {};

    // Add filters based on query parameters
    if (queryParams.status) {
      filters.status = queryParams.status;
    }

    if (queryParams.type) {
      filters.type = queryParams.type;
    }

    if (queryParams.featured !== undefined) {
      filters.featured = queryParams.featured === 'true';
    }

    if (queryParams.limit) {
      filters.limit = parseInt(queryParams.limit, 10);
    }

    // Get posts from database
    const posts = await postQueries.getAllPosts(filters);

    // Transform posts to match frontend format
    const transformedPosts = posts.map(post => ({
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
    }));

    return {
      statusCode: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        data: transformedPosts,
        count: transformedPosts.length
      })
    };

  } catch (error) {
    console.error('Posts list error:', error);

    return {
      statusCode: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: false,
        error: 'Failed to fetch posts',
        message: error.message
      })
    };
  }
};
