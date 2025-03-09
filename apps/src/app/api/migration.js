#!/usr/bin/env node

/**
 * Migration Script for API Restructuring (Simplified)
 * 
 * This script helps migrate from the old API structure to the new one:
 * - Creates essential route groups with parentheses
 * - Moves files to the new structure
 * - Updates imports
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration - include only the essential route groups
const apiRoot = path.resolve(__dirname);
const routeGroups = ['auth', 'changelog', 'repository'];
const migrationMapping = {
    'analyze-repository/route.ts': '(repository)/analyze/route.ts',
    'changelog/list/route.ts': '(changelog)/list/route.ts',
    'changelog/generate/route.ts': '(changelog)/generate/route.ts',
    'changelog/process/route.ts': '(changelog)/process/route.ts',
    'changelog/[id]/route.ts': '(changelog)/[id]/route.ts',
    'auth/[...nextauth]/route.ts': '(auth)/[...nextauth]/route.ts',
};

// Create route group directories
console.log('Creating route group directories...');
routeGroups.forEach(group => {
    const groupDir = path.join(apiRoot, `(${group})`);
    if (!fs.existsSync(groupDir)) {
        fs.mkdirSync(groupDir, { recursive: true });
        console.log(`Created directory: ${groupDir}`);
    }
});

// Migrate files
console.log('\nMigrating files...');
Object.entries(migrationMapping).forEach(([source, target]) => {
    const sourcePath = path.join(apiRoot, source);
    const targetPath = path.join(apiRoot, target);

    // Create target directory if it doesn't exist
    const targetDir = path.dirname(targetPath);
    if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
    }

    // Check if source exists
    if (fs.existsSync(sourcePath)) {
        // Read the file
        let content = fs.readFileSync(sourcePath, 'utf8');

        // Update imports (adjust as needed for your specific files)
        content = content.replace(
            /from ['"]\.\.\/\.\.\/lib\//g,
            'from \'../../../lib/'
        );
        content = content.replace(
            /from ['"]\.\.\/\.\.\/actions\//g,
            'from \'../../../actions/'
        );

        // Write to the new location
        fs.writeFileSync(targetPath, content);
        console.log(`Migrated: ${source} -> ${target}`);
    } else {
        console.log(`Source file not found: ${source}`);
    }
});

// Create server actions directory if it doesn't exist
const actionsDir = path.join(apiRoot, '../actions');
if (!fs.existsSync(actionsDir)) {
    fs.mkdirSync(actionsDir, { recursive: true });
    console.log(`Created directory: ${actionsDir}`);
}

console.log('\nMigration completed!');
console.log('Run the following command to check for differences:');
console.log('  git status');
console.log('\nTest the new routes before removing the old ones.');
console.log('Remember to update client code to use server actions where possible.');
console.log('If everything works correctly, you can remove the old files.'); 