const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand, DeleteCommand, QueryCommand } = require("@aws-sdk/lib-dynamodb");

// DynamoDB configuration - Always use AWS DynamoDB (no local setup)
const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'ap-south-1'
});

const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || 'NuraWeb-Posts';

// Helper function to generate ULID (URL-safe Lexicographically Sortable ID)
const generateId = () => {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 15);
  return `${timestamp}${randomPart}`.toUpperCase();
};

// Post-related database operations
const postQueries = {
  // Get all posts with optional filters
  getAllPosts: async (filters = {}) => {
    try {
      const status = filters.status || 'published';
      
      // Query for posts using GSI
      const result = await docClient.send(new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: 'CreatedAtIndex',
        KeyConditionExpression: '#status = :status',
        ExpressionAttributeNames: {
          '#status': 'status'
        },
        ExpressionAttributeValues: {
          ':status': status
        },
        ScanIndexForward: false, // Sort by created_at in descending order
        Limit: filters.limit || undefined
      }));
      
      // Group posts and their cells
      const postsMap = new Map();
      
      for (const item of result.Items || []) {
        if (item.SK === 'POST') {
          // This is a post record
          postsMap.set(item.id, {
            ...item,
            cells: []
          });
        }
      }
      
      // Now get cells for each post
      for (const [postId, post] of postsMap.entries()) {
        const cellResult = await docClient.send(new QueryCommand({
          TableName: TABLE_NAME,
          KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
          ExpressionAttributeValues: {
            ':pk': `POST#${postId}`,
            ':sk': 'CELL#'
          }
        }));
        
        if (cellResult.Items) {
          post.cells = cellResult.Items.map(cell => ({
            id: cell.id,
            type: cell.cell_type,
            content: cell.content || '',
            order: cell.order_index
          })).sort((a, b) => a.order - b.order);
        }
      }
      
      return Array.from(postsMap.values());
    } catch (error) {
      console.error('Error getting all posts:', error);
      throw error;
    }
  },

  // Get a single post by ID or slug
  getPost: async (identifier) => {
    try {
      let post = null;
      
      // If identifier looks like an ID (alphanumeric and uppercase), query by ID
      if (/^[0-9A-Z]{10,30}$/i.test(identifier)) {
        const result = await docClient.send(new GetCommand({
          TableName: TABLE_NAME,
          Key: {
            PK: `POST#${identifier}`,
            SK: 'POST'
          }
        }));
        
        if (result.Item) {
          post = result.Item;
        }
      } else {
        // Query by slug using a scan (not optimal, but works for now)
        // In production, you might want to create a GSI for slugs
        const result = await docClient.send(new QueryCommand({
          TableName: TABLE_NAME,
          IndexName: 'CreatedAtIndex',
          KeyConditionExpression: '#status = :status',
          FilterExpression: 'slug = :slug',
          ExpressionAttributeNames: {
            '#status': 'status'
          },
          ExpressionAttributeValues: {
            ':status': 'published',
            ':slug': identifier
          }
        }));
        
        if (result.Items && result.Items.length > 0) {
          post = result.Items[0];
        }
      }
      
      if (!post) {
        return null;
      }
      
      // Get cells for this post
      const cellResult = await docClient.send(new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        ExpressionAttributeValues: {
          ':pk': `POST#${post.id}`,
          ':sk': 'CELL#'
        }
      }));
      
      post.cells = [];
      if (cellResult.Items) {
        post.cells = cellResult.Items.map(cell => ({
          id: cell.id,
          type: cell.cell_type,
          content: cell.content || '',
          order: cell.order_index
        })).sort((a, b) => a.order - b.order);
      }
      
      return post;
    } catch (error) {
      console.error('Error getting post:', error);
      throw error;
    }
  },

  // Create a new post
  createPost: async (postData) => {
    try {
      const postId = postData.id || generateId();
      const now = new Date().toISOString();
      
      // Create post record
      const postItem = {
        PK: `POST#${postId}`,
        SK: 'POST',
        id: postId,
        title: postData.title,
        slug: postData.slug || postData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        status: postData.status || 'draft',
        featured: postData.featured || false,
        type: postData.type || 'blog',
        thumbnail_url: postData.thumbnail?.url || null,
        thumbnail_alt: postData.thumbnail?.alt || null,
        excerpt: postData.excerpt || null,
        author_id: postData.authorId || '00000000-0000-0000-0000-000000000001',
        created_at: now,
        updated_at: now,
        view_count: 0
      };
      
      await docClient.send(new PutCommand({
        TableName: TABLE_NAME,
        Item: postItem
      }));
      
      // Create cell records if provided
      if (postData.cells && postData.cells.length > 0) {
        for (let i = 0; i < postData.cells.length; i++) {
          const cell = postData.cells[i];
          const cellItem = {
            PK: `POST#${postId}`,
            SK: `CELL#${String(i + 1).padStart(3, '0')}`,
            id: generateId(),
            post_id: postId,
            cell_type: cell.type,
            content: JSON.stringify(cell.content),
            order_index: i + 1
          };
          
          await docClient.send(new PutCommand({
            TableName: TABLE_NAME,
            Item: cellItem
          }));
        }
      }
      
      // Return the created post directly
      const result = {
        id: postId,
        title: postData.title,
        slug: postData.slug || postData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        status: postData.status || 'draft',
        featured: postData.featured || false,
        type: postData.type || 'blog',
        thumbnail_url: postData.thumbnail?.url || null,
        thumbnail_alt: postData.thumbnail?.alt || null,
        excerpt: postData.excerpt || null,
        author_id: postData.authorId || '00000000-0000-0000-0000-000000000001',
        created_at: now,
        updated_at: now,
        view_count: 0,
        cells: postData.cells || []
      };
      
      return result;
    } catch (error) {
      console.error('Error creating post:', error);
      throw error;
    }
  },

  // Update a post
  updatePost: async (id, postData) => {
    try {
      const now = new Date().toISOString();
      
      // Build update expression
      const updateExpression = [];
      const expressionAttributeNames = {};
      const expressionAttributeValues = {};
      
      if (postData.title !== undefined) {
        updateExpression.push('#title = :title');
        expressionAttributeNames['#title'] = 'title';
        expressionAttributeValues[':title'] = postData.title;
      }
      
      if (postData.status !== undefined) {
        updateExpression.push('#status = :status');
        expressionAttributeNames['#status'] = 'status';
        expressionAttributeValues[':status'] = postData.status;
      }
      
      if (postData.featured !== undefined) {
        updateExpression.push('featured = :featured');
        expressionAttributeValues[':featured'] = postData.featured;
      }
      
      if (postData.type !== undefined) {
        updateExpression.push('#type = :type');
        expressionAttributeNames['#type'] = 'type';
        expressionAttributeValues[':type'] = postData.type;
      }
      
      if (postData.thumbnail !== undefined) {
        updateExpression.push('thumbnail_url = :thumbnail_url, thumbnail_alt = :thumbnail_alt');
        expressionAttributeValues[':thumbnail_url'] = postData.thumbnail?.url || null;
        expressionAttributeValues[':thumbnail_alt'] = postData.thumbnail?.alt || null;
      }
      
      if (postData.excerpt !== undefined) {
        updateExpression.push('excerpt = :excerpt');
        expressionAttributeValues[':excerpt'] = postData.excerpt;
      }
      
      updateExpression.push('updated_at = :updated_at');
      expressionAttributeValues[':updated_at'] = now;
      
      await docClient.send(new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `POST#${id}`,
          SK: 'POST'
        },
        UpdateExpression: `SET ${updateExpression.join(', ')}`,
        ExpressionAttributeNames: Object.keys(expressionAttributeNames).length > 0 ? expressionAttributeNames : undefined,
        ExpressionAttributeValues: expressionAttributeValues
      }));
      
      // Update cells if provided
      if (postData.cells !== undefined) {
        // Delete existing cells
        const existingCells = await docClient.send(new QueryCommand({
          TableName: TABLE_NAME,
          KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
          ExpressionAttributeValues: {
            ':pk': `POST#${id}`,
            ':sk': 'CELL#'
          }
        }));
        
        if (existingCells.Items) {
          for (const cell of existingCells.Items) {
            await docClient.send(new DeleteCommand({
              TableName: TABLE_NAME,
              Key: {
                PK: cell.PK,
                SK: cell.SK
              }
            }));
          }
        }
        
        // Insert new cells
        for (let i = 0; i < postData.cells.length; i++) {
          const cell = postData.cells[i];
          const cellItem = {
            PK: `POST#${id}`,
            SK: `CELL#${String(i + 1).padStart(3, '0')}`,
            id: generateId(),
            post_id: id,
            cell_type: cell.type,
            content: JSON.stringify(cell.content),
            order_index: i + 1
          };
          
          await docClient.send(new PutCommand({
            TableName: TABLE_NAME,
            Item: cellItem
          }));
        }
      }
      
      // Return a simple success response for update
      return { 
        id: id, 
        message: 'Post updated successfully',
        updated_at: now
      };
    } catch (error) {
      console.error('Error updating post:', error);
      throw error;
    }
  },

  // Delete a post
  deletePost: async (id) => {
    try {
      // Delete all cells first
      const cellResult = await docClient.send(new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        ExpressionAttributeValues: {
          ':pk': `POST#${id}`,
          ':sk': 'CELL#'
        }
      }));
      
      if (cellResult.Items) {
        for (const cell of cellResult.Items) {
          await docClient.send(new DeleteCommand({
            TableName: TABLE_NAME,
            Key: {
              PK: cell.PK,
              SK: cell.SK
            }
          }));
        }
      }
      
      // Delete the post
      await docClient.send(new DeleteCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `POST#${id}`,
          SK: 'POST'
        }
      }));
      
      return { 
        id: id, 
        message: 'Post deleted successfully' 
      };
    } catch (error) {
      console.error('Error deleting post:', error);
      throw error;
    }
  },

  // Increment view count
  incrementViewCount: async (id) => {
    try {
      const result = await docClient.send(new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `POST#${id}`,
          SK: 'POST'
        },
        UpdateExpression: 'ADD view_count :inc',
        ExpressionAttributeValues: {
          ':inc': 1
        },
        ReturnValues: 'UPDATED_NEW'
      }));
      
      return result.Attributes?.view_count;
    } catch (error) {
      console.error('Error incrementing view count:', error);
      throw error;
    }
  }
};

module.exports = {
  client,
  docClient,
  postQueries,
  TABLE_NAME,
  generateId
};
