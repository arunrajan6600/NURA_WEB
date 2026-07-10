const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand } = require("@aws-sdk/lib-dynamodb");
const { CreateTableCommand, ListTablesCommand, DeleteTableCommand, DescribeTableCommand } = require("@aws-sdk/client-dynamodb");

// AWS DynamoDB configuration
const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'ap-south-1'
});

const docClient = DynamoDBDocumentClient.from(client);

// Main Posts table
const POSTS_TABLE = {
  TableName: process.env.DYNAMODB_TABLE_NAME || 'NuraWeb-Posts',
  KeySchema: [
    { AttributeName: 'PK', KeyType: 'HASH' },  // Partition key
    { AttributeName: 'SK', KeyType: 'RANGE' }  // Sort key
  ],
  AttributeDefinitions: [
    { AttributeName: 'PK', AttributeType: 'S' },
    { AttributeName: 'SK', AttributeType: 'S' },
    { AttributeName: 'created_at', AttributeType: 'S' },
    { AttributeName: 'status', AttributeType: 'S' }
  ],
  GlobalSecondaryIndexes: [
    {
      IndexName: 'CreatedAtIndex',
      KeySchema: [
        { AttributeName: 'status', KeyType: 'HASH' },
        { AttributeName: 'created_at', KeyType: 'RANGE' }
      ],
      Projection: { ProjectionType: 'ALL' },
      ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5
      }
    }
  ],
  ProvisionedThroughput: {
    ReadCapacityUnits: 10,
    WriteCapacityUnits: 10
  }
};

async function createTables() {
  try {
    console.log('🗄️  Creating DynamoDB table in AWS...');
    console.log(`📍 Region: ${process.env.AWS_REGION || 'ap-south-1'}`);
    console.log(`📊 Table: ${POSTS_TABLE.TableName}`);
    
    // Check if table already exists
    try {
      const existingTable = await client.send(new DescribeTableCommand({ 
        TableName: POSTS_TABLE.TableName 
      }));
      
      if (existingTable.Table?.TableStatus === 'ACTIVE') {
        console.log(`✅ Table ${POSTS_TABLE.TableName} already exists and is active`);
        
        // Ask if user wants to add sample data
        console.log('🌱 Adding sample data...');
        await seedSampleData();
        return;
      }
    } catch (err) {
      if (err.name !== 'ResourceNotFoundException') {
        throw err;
      }
      console.log(`📝 Table ${POSTS_TABLE.TableName} does not exist, creating...`);
    }
    
    // Create the table
    const createResult = await client.send(new CreateTableCommand(POSTS_TABLE));
    console.log(`🚀 Creating table ${POSTS_TABLE.TableName}...`);
    
    // Wait for table to be active
    console.log('⏳ Waiting for table to become active...');
    let tableStatus = 'CREATING';
    let attempts = 0;
    const maxAttempts = 30; // 5 minutes max
    
    while (tableStatus !== 'ACTIVE' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
      
      const describeResult = await client.send(new DescribeTableCommand({ 
        TableName: POSTS_TABLE.TableName 
      }));
      
      tableStatus = describeResult.Table?.TableStatus;
      attempts++;
      
      console.log(`   Status: ${tableStatus} (attempt ${attempts}/${maxAttempts})`);
    }
    
    if (tableStatus === 'ACTIVE') {
      console.log(`✅ Table ${POSTS_TABLE.TableName} created successfully`);
      
      // Add sample data
      console.log('🌱 Adding sample data...');
      await seedSampleData();
    } else {
      console.log(`⚠️  Table creation may still be in progress. Status: ${tableStatus}`);
    }
    
  } catch (error) {
    console.error('❌ Error creating table:', error.message);
    
    if (error.name === 'CredentialsProviderError') {
      console.error('   Please configure AWS credentials using: aws configure');
    } else if (error.name === 'UnauthorizedException') {
      console.error('   AWS credentials lack DynamoDB permissions');
    }
    
    throw error;
  }
}

async function seedSampleData() {
  try {
    console.log('Seeding sample data...');
    
    const samplePost = {
      PK: 'POST#01JCRGV1EMYNWQ7SVKGD9EFRC0',
      SK: 'POST',
      id: '01JCRGV1EMYNWQ7SVKGD9EFRC0',
      title: 'Welcome to NuraWeb',
      description: 'A modern web platform built with Next.js and DynamoDB',
      post_type: 'article',
      status: 'published',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      author: 'admin',
      tags: ['welcome', 'introduction']
    };
    
    await docClient.send(new PutCommand({
      TableName: POSTS_TABLE.TableName,
      Item: samplePost
    }));
    
    // Add sample post cells
    const sampleCells = [
      {
        PK: 'POST#01JCRGV1EMYNWQ7SVKGD9EFRC0',
        SK: 'CELL#001',
        id: 'cell-001',
        post_id: '01JCRGV1EMYNWQ7SVKGD9EFRC0',
        cell_type: 'markdown',
        content: '# Welcome to NuraWeb\n\nThis is a sample post to demonstrate our new DynamoDB-powered backend.',
        order_index: 1
      },
      {
        PK: 'POST#01JCRGV1EMYNWQ7SVKGD9EFRC0',
        SK: 'CELL#002',
        id: 'cell-002',
        post_id: '01JCRGV1EMYNWQ7SVKGD9EFRC0',
        cell_type: 'markdown',
        content: 'We\'ve successfully migrated from PostgreSQL to Amazon DynamoDB for better scalability and performance.',
        order_index: 2
      }
    ];
    
    for (const cell of sampleCells) {
      await docClient.send(new PutCommand({
        TableName: POSTS_TABLE.TableName,
        Item: cell
      }));
    }
    
    console.log('Sample data seeded successfully');
    
  } catch (error) {
    console.error('Error seeding data:', error);
  }
}

// Run initialization
if (require.main === module) {
  createTables().then(() => {
    console.log('DynamoDB initialization complete');
    process.exit(0);
  }).catch(err => {
    console.error('Initialization failed:', err);
    process.exit(1);
  });
}

module.exports = { createTables, client, docClient };
