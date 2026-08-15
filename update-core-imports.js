const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath, callback);
    } else {
      callback(fullPath);
    }
  });
}

walkDir('app', (filePath) => {
  if (!filePath.endsWith('.js') && !filePath.endsWith('.jsx') && !filePath.endsWith('.ts') && !filePath.endsWith('.tsx')) {
    return;
  }
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace relative paths containing core with @core/
  // e.g. ../../core/use-cases/create-shipment -> @core/use-cases/create-shipment
  // e.g. ../../../core/entities/hs-code -> @core/entities/hs-code
  // e.g. ../../../../core/entities/hs-code -> @core/entities/hs-code
  
  let updated = content.replace(/(['"])(?:\.\.\/)+core\/(.*?)\1/g, (match, quote, subpath) => {
    return `${quote}@core/${subpath}${quote}`;
  });

  if (updated !== content) {
    fs.writeFileSync(filePath, updated, 'utf8');
    console.log(`Updated core imports in: ${filePath}`);
  }
});
