#!/usr/bin/env node

const http = require('http');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env files manually if they exist
function loadEnv() {
  const envFiles = [".env.production", ".env.local", ".env"];
  for (const file of envFiles) {
    const envPath = path.join(__dirname, "..", file);
    if (fs.existsSync(envPath)) {
      try {
        const content = fs.readFileSync(envPath, "utf-8");
        content.split("\n").forEach((line) => {
          const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
          if (match) {
            const key = match[1];
            let value = match[2] || "";
            if (value.includes("#")) {
              value = value.split("#")[0].trim();
            }
            if (value.startsWith('"') && value.endsWith('"')) {
              value = value.slice(1, -1);
            }
            if (value.startsWith("'") && value.endsWith("'")) {
              value = value.slice(1, -1);
            }
            if (!process.env[key]) {
              process.env[key] = value.trim();
            }
          }
        });
      } catch (e) {
        // Silently skip
      }
    }
  }
}

loadEnv();

// Configuration
const API_BASE_URL =
  process.env.API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  'http://127.0.0.1:3001';

// Check if API is accessible
function checkApiHealth() {
  return new Promise((resolve) => {
    const url = new URL(API_BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: '/health',
      method: 'GET',
      timeout: 5000
    };

    const req = http.request(options, (res) => {
      resolve(res.statusCode === 200);
    });

    req.on('error', () => {
      resolve(false);
    });

    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });

    req.end();
  });
}

// Wait for API to be ready with fewer retries
async function waitForApi() {
  console.log('🔍 Checking API availability...');
  
  const MAX_QUICK_RETRIES = 3;
  const QUICK_RETRY_DELAY = 1000; // 1 second
  
  for (let i = 0; i < MAX_QUICK_RETRIES; i++) {
    const isHealthy = await checkApiHealth();
    
    if (isHealthy) {
      console.log('✅ API is ready!');
      return true;
    }
    
    if (i < MAX_QUICK_RETRIES - 1) {
      console.log(`⏳ API not ready (attempt ${i + 1}/${MAX_QUICK_RETRIES}), retrying in ${QUICK_RETRY_DELAY/1000}s...`);
      await new Promise(resolve => setTimeout(resolve, QUICK_RETRY_DELAY));
    }
  }
  
  console.error('❌ API is not accessible');
  return false;
}

// Display instructions for starting API server
function showApiStartInstructions() {
  console.log('');
  console.log('� To start the API server manually:');
  console.log('   cd backend && npm run dev');
  console.log('   (listens on port 3001 by default)');
  console.log('');
}

// Main pre-build function
async function preBuild() {
  try {
    console.log('🔧 Running pre-build checks...');
    console.log(`🌐 Checking API at: ${API_BASE_URL}`);
    
    // Check if API is running
    const apiReady = await waitForApi();
    
    if (apiReady) {
      console.log('✅ Pre-build checks completed successfully');
      return true;
    }
    
    // API is not running - show instructions
    console.error('❌ API server is not running');
    showApiStartInstructions();
    console.error('💡 Please start the API server and try again');
    
    return false;
    
  } catch (error) {
    console.error('❌ Pre-build failed:', error.message);
    showApiStartInstructions();
    return false;
  }
}

// Run if this script is executed directly
if (require.main === module) {
  preBuild().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { preBuild, checkApiHealth, showApiStartInstructions };
