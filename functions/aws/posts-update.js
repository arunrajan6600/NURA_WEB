const { postQueries } = require("./db");
const { requireAuth } = require("./auth-utils");

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": process.env.ALLOWED_ORIGIN,
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "PUT, OPTIONS",
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

    // Require authentication for updating posts
    requireAuth(event);

    // Get post ID from path parameters
    const postId = event.pathParameters?.id;
    if (!postId) {
      return {
        statusCode: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          success: false,
          error: "Post ID is required",
        }),
      };
    }

    // Parse request body
    let updateData;
    try {
      // Handle base64 encoded body from API Gateway
      let body = event.body;
      if (event.isBase64Encoded) {
        body = Buffer.from(event.body, "base64").toString("utf-8");
      }

      updateData = JSON.parse(body);
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

    // Validate post type if provided
    if (updateData.type) {
      const validTypes = [
        "project",
        "blog",
        "paper",
        "article",
        "story",
        "general",
      ];
      if (!validTypes.includes(updateData.type)) {
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
    }

    // Validate status if provided
    if (updateData.status) {
      const validStatuses = ["draft", "published"];
      if (!validStatuses.includes(updateData.status)) {
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
    }

    // Update post in database
    const updatedPost = await postQueries.updatePost(postId, updateData);

    if (!updatedPost) {
      return {
        statusCode: 404,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          success: false,
          error: "Post not found",
        }),
      };
    }

    // Transform post to match frontend format
    const transformedPost = {
      id: updatedPost.id,
      title: updatedPost.title,
      slug: updatedPost.slug,
      status: updatedPost.status,
      featured: updatedPost.featured,
      type: updatedPost.type,
      thumbnail: updatedPost.thumbnail_url
        ? {
            url: updatedPost.thumbnail_url,
            alt: updatedPost.thumbnail_alt || "",
          }
        : undefined,
      excerpt: updatedPost.excerpt,
      createdAt: updatedPost.created_at,
      updatedAt: updatedPost.updated_at,
      publishedAt: updatedPost.published_at,
      viewCount: updatedPost.view_count,
      likeCount: updatedPost.like_count,
      cells: updateData.cells || [],
    };

    return {
      statusCode: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        success: true,
        data: transformedPost,
        message: "Post updated successfully",
      }),
    };
  } catch (error) {
    console.error("Post update error:", error);

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

    // Handle not found errors
    if (error.message === "Post not found") {
      return {
        statusCode: 404,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          success: false,
          error: "Post not found",
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
        error: "Failed to update post",
        message: error.message,
      }),
    };
  }
};
