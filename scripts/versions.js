#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Configuration
const DATA_DIR = path.join(__dirname, '..', 'data');
const BACKUP_DIR = path.join(DATA_DIR, 'backups');

// List all versions
function listVersions() {
  if (!fs.existsSync(BACKUP_DIR)) {
    console.log('No backup directory found.');
    return [];
  }
  
  const versions = fs.readdirSync(BACKUP_DIR)
    .filter(file => file.endsWith('.posts.ts'))
    .map(file => {
      const version = file.replace('.posts.ts', '');
      const filePath = path.join(BACKUP_DIR, file);
      const stat = fs.statSync(filePath);
      
      // Try to read manifest for more info
      let manifest = null;
      const manifestPath = path.join(BACKUP_DIR, `${version}.build-manifest.json`);
      if (fs.existsSync(manifestPath)) {
        try {
          manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        } catch (e) {
          // Ignore manifest read errors
        }
      }
      
      return {
        version,
        file: filePath,
        created: stat.mtime,
        size: stat.size,
        manifest
      };
    })
    .sort((a, b) => b.created - a.created);
  
  return versions;
}

// Display version information
function displayVersions() {
  const versions = listVersions();
  
  if (versions.length === 0) {
    console.log('No versioned posts found.');
    return;
  }
  
  console.log('\n📦 Available Post Versions:');
  console.log('=' .repeat(80));
  
  versions.forEach((version, index) => {
    const isActive = index === 0;
    const marker = isActive ? '🟢' : '⚪';
    
    console.log(`${marker} ${version.version}`);
    console.log(`   Created: ${version.created.toLocaleString()}`);
    console.log(`   Size: ${(version.size / 1024).toFixed(1)} KB`);
    
    if (version.manifest) {
      console.log(`   Posts Count: ${version.manifest.postsCount}`);
      console.log(`   Build Type: ${version.manifest.buildType}`);
    }
    
    if (isActive) {
      console.log('   Status: 🟢 ACTIVE');
    }
    
    console.log('');
  });
}

// Show version diff
function showVersionDiff(version1, version2) {
  const versions = listVersions();
  
  const v1 = versions.find(v => v.version === version1);
  const v2 = versions.find(v => v.version === version2);
  
  if (!v1 || !v2) {
    console.error('One or both versions not found.');
    return;
  }
  
  console.log(`\n📊 Comparing ${version1} → ${version2}:`);
  console.log('=' .repeat(50));
  
  if (v1.manifest && v2.manifest) {
    console.log(`Posts Count: ${v1.manifest.postsCount} → ${v2.manifest.postsCount}`);
    
    const countDiff = v2.manifest.postsCount - v1.manifest.postsCount;
    if (countDiff > 0) {
      console.log(`✅ Added ${countDiff} posts`);
    } else if (countDiff < 0) {
      console.log(`❌ Removed ${Math.abs(countDiff)} posts`);
    } else {
      console.log('📝 Same number of posts (content may have changed)');
    }
  }
  
  const sizeDiff = v2.size - v1.size;
  console.log(`File Size: ${(v1.size / 1024).toFixed(1)} KB → ${(v2.size / 1024).toFixed(1)} KB`);
  
  if (sizeDiff > 0) {
    console.log(`📈 Increased by ${(sizeDiff / 1024).toFixed(1)} KB`);
  } else if (sizeDiff < 0) {
    console.log(`📉 Decreased by ${(Math.abs(sizeDiff) / 1024).toFixed(1)} KB`);
  }
}

// Restore a specific version
function restoreVersion(targetVersion) {
  const versions = listVersions();
  const version = versions.find(v => v.version === targetVersion);
  
  if (!version) {
    console.error(`Version ${targetVersion} not found.`);
    return false;
  }
  
  // Backup current posts.ts
  const currentPostsFile = path.join(DATA_DIR, 'posts.ts');
  if (fs.existsSync(currentPostsFile)) {
    const backupName = `backup-${new Date().toISOString().replace(/[:.]/g, '-')}.posts.ts`;
    const backupPath = path.join(BACKUP_DIR, backupName);
    fs.copyFileSync(currentPostsFile, backupPath);
    console.log(`📦 Current posts.ts backed up as ${backupName}`);
  }
  
  // Restore the target version
  fs.copyFileSync(version.file, currentPostsFile);
  console.log(`✅ Restored posts.ts to version ${targetVersion}`);
  
  return true;
}

// Show current status
function showStatus() {
  console.log('\n📋 Current Posts Status:');
  console.log('=' .repeat(40));
  
  const postsFile = path.join(DATA_DIR, 'posts.ts');
  if (fs.existsSync(postsFile)) {
    const stat = fs.statSync(postsFile);
    console.log(`File: ${postsFile}`);
    console.log(`Size: ${(stat.size / 1024).toFixed(1)} KB`);
    console.log(`Modified: ${stat.mtime.toLocaleString()}`);
    
    // Try to read version from file content
    try {
      const content = fs.readFileSync(postsFile, 'utf8');
      const versionMatch = content.match(/Version: (v\d+-\d+)/);
      if (versionMatch) {
        console.log(`Version: ${versionMatch[1]}`);
      }
    } catch (e) {
      // Ignore read errors
    }
  } else {
    console.log('❌ No posts.ts file found');
  }
  
  // Show manifest if available
  const manifestFile = path.join(DATA_DIR, 'build-manifest.json');
  if (fs.existsSync(manifestFile)) {
    try {
      const manifest = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
      console.log(`\n📋 Build Manifest:`);
      console.log(`   Version: ${manifest.version}`);
      console.log(`   Posts Count: ${manifest.postsCount}`);
      console.log(`   Build Type: ${manifest.buildType}`);
      console.log(`   Generated: ${new Date(manifest.timestamp).toLocaleString()}`);
    } catch (e) {
      // Ignore manifest read errors
    }
  }
}

// Main CLI handler
function handleCommand() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  switch (command) {
    case 'list':
    case 'ls':
      displayVersions();
      break;
      
    case 'status':
      showStatus();
      break;
      
    case 'diff':
      if (args.length < 3) {
        console.error('Usage: node versions.js diff <version1> <version2>');
        process.exit(1);
      }
      showVersionDiff(args[1], args[2]);
      break;
      
    case 'restore':
      if (args.length < 2) {
        console.error('Usage: node versions.js restore <version>');
        process.exit(1);
      }
      restoreVersion(args[1]);
      break;
      
    case 'help':
    default:
      console.log('\n📚 Posts Version Manager');
      console.log('=' .repeat(30));
      console.log('Commands:');
      console.log('  list, ls          List all available versions');
      console.log('  status            Show current posts status');
      console.log('  diff <v1> <v2>    Compare two versions');
      console.log('  restore <version> Restore to a specific version');
      console.log('  help              Show this help message');
      console.log('');
      console.log('Examples:');
      console.log('  node scripts/versions.js list');
      console.log('  node scripts/versions.js status');
      console.log('  node scripts/versions.js diff v20250802-143022 v20250802-143045');
      console.log('  node scripts/versions.js restore v20250802-143022');
      break;
  }
}

// Run if this script is executed directly
if (require.main === module) {
  handleCommand();
}

module.exports = { 
  listVersions, 
  displayVersions, 
  showVersionDiff, 
  restoreVersion, 
  showStatus 
};
