const fs = require('fs');
const path = require('path');

// Define the directory to process
const distDir = path.join(__dirname, 'dist');

// Process all HTML files in the directory recursively
function processDirectory(directory) {
  const files = fs.readdirSync(directory);
  
  files.forEach(file => {
    const filePath = path.join(directory, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // If it's a directory, process it recursively
      processDirectory(filePath);
    } else if (file.endsWith('.html')) {
      // If it's an HTML file, replace the paths
      replacePathsInFile(filePath);
    } else if (file.endsWith('.js') || file.endsWith('.css')) {
      // Also process JS and CSS files for potential absolute path references
      replacePathsInFile(filePath);
    }
  });
}

// Replace paths in the file
function replacePathsInFile(filePath) {
  console.log(`Processing file: ${filePath}`);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace all paths starting with /_next/ to ./_next/
  content = content.replace(/(['"]|\s|=|:|\()\/?_next\//g, '$1./_next/');
  
  // Also replace other possible absolute paths, like /images/
  content = content.replace(/(['"]|\s|=|:|\()\/?images\//g, '$1./images/');
  
  // Save the modified file
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Updated paths in: ${filePath}`);
}

// Start processing
console.log('Starting path modifications...');
processDirectory(distDir);
console.log('Path modifications completed!');