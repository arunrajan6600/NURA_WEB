const { postQueries } = require("./db");
const { requireAuth } = require("./auth-utils");

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": process.env.ALLOWED_ORIGIN,
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;

  try {
    // Handle CORS preflight
    if (event.httpMethod === "OPTIONS") {
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: "",
      };
    }

    // Require authentication for creating posts
    requireAuth(event);

    // Parse request body
    let postData;
    try {
      // Handle base64 encoded body from API Gateway
      let body = event.body;
      if (event.isBase64Encoded) {
        body = Buffer.from(event.body, "base64").toString("utf-8");
      }

      postData = JSON.parse(body);
    } catch (error) {
      console.error("Body parsing error:", error);
      console.error("Raw body:", event.body);
      console.error("Is base64 encoded:", event.isBase64Encoded);

      return {
        statusCode: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          success: false,
          error: "Invalid JSON in request body",
          debug: {
            bodyLength: event.body ? event.body.length : 0,
            isBase64: event.isBase64Encoded || false,
          },
        }),
      };
    }

    // Validate required fields
    if (!postData.title) {
      return {
        statusCode: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          success: false,
          error: "Title is required",
        }),
      };
    }

    // Validate post type
    const validTypes = [
      "project",
      "blog",
      "paper",
      "article",
      "story",
      "general",
    ];
    if (postData.type && !validTypes.includes(postData.type)) {
      return {
        statusCode: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          success: false,
          error: "Invalid post type",
        }),
      };
    }

    // Validate status
    const validStatuses = ["draft", "published"];
    if (postData.status && !validStatuses.includes(postData.status)) {
      return {
        statusCode: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          success: false,
          error: "Invalid post status",
        }),
      };
    }

    // Create post in database
    const newPost = await postQueries.createPost(postData);

    // Transform post to match frontend format
    const transformedPost = {
      id: newPost.id,
      title: newPost.title,
      slug: newPost.slug,
      status: newPost.status,
      featured: newPost.featured,
      type: newPost.type,
      thumbnail: newPost.thumbnail_url
        ? {
            url: newPost.thumbnail_url,
            alt: newPost.thumbnail_alt || "",
          }
        : undefined,
      excerpt: newPost.excerpt,
      createdAt: newPost.created_at,
      updatedAt: newPost.updated_at,
      publishedAt: newPost.published_at,
      viewCount: newPost.view_count,
      likeCount: newPost.like_count,
      cells: postData.cells || [],
    };

    return {
      statusCode: 201,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        success: true,
        data: transformedPost,
        message: "Post created successfully",
      }),
    };
  } catch (error) {
    console.error("Post create error:", error);

    // Handle authentication errors
    if (
      error.message === "Authentication required" ||
      error.message === "Invalid token" ||
      error.message === "No authorization header" ||
      error.message === "No token provided"
    ) {
      return {
        statusCode: 401,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          success: false,
          error: "Authentication required",
        }),
      };
    }

    return {
      statusCode: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        success: false,
        error: "Failed to create post",
        message: error.message,
      }),
    };
  }
};
