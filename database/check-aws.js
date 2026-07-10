const { DynamoDBClient, ListTablesCommand } = require("@aws-sdk/client-dynamodb");

async function checkAWSCredentials() {
  try {
    const client = new DynamoDBClient({
      region: process.env.AWS_REGION || 'ap-south-1'
    });
    
    console.log('🔐 Checking AWS credentials and DynamoDB access...');
    
    // Try to list tables to verify credentials and permissions
    const result = await client.send(new ListTablesCommand({}));
    
    console.log('✅ AWS credentials are valid and DynamoDB is accessible');
    console.log(`📍 Region: ${process.env.AWS_REGION || 'ap-south-1'}`);
    console.log(`📊 Existing tables: ${result.TableNames?.length || 0}`);
    
    if (result.TableNames && result.TableNames.length > 0) {
      console.log(`   - ${result.TableNames.join(', ')}`);
    }
    
    return true;
  } catch (error) {
    console.error('❌ AWS credentials check failed:');
    
    if (error.name === 'CredentialsProviderError') {
      console.error('   Please configure AWS credentials using: aws configure');
    } else if (error.name === 'UnauthorizedException') {
      console.error('   AWS credentials are configured but lack DynamoDB permissions');
    } else {
      console.error(`   ${error.message}`);
    }
    
    console.error('\n🔧 Setup instructions:');
    console.error('   1. Install AWS CLI: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html');
    console.error('   2. Configure credentials: aws configure');
    console.error('   3. Ensure your user has DynamoDB permissions');
    
    return false;
  }
}

if (require.main === module) {
  checkAWSCredentials().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { checkAWSCredentials };
