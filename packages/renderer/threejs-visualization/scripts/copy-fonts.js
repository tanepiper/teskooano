import { copyFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Get the directory name of the current module
const __dirname = dirname(fileURLToPath(import.meta.url));

// Create public/fonts directory if it doesn't exist
const publicFontsDir = join(__dirname, '..', 'public', 'fonts');
try {
  mkdirSync(publicFontsDir, { recursive: true });
  console.log('Created fonts directory at:', publicFontsDir);
} catch (error) {
  if (error.code !== 'EEXIST') {
    console.error('Failed to create fonts directory:', error);
    process.exit(1);
  }
}

// Copy the font file from Three.js
const sourceFont = join(__dirname, '..', 'node_modules', 'three', 'examples', 'fonts', 'helvetiker_regular.typeface.json');
const targetFont = join(publicFontsDir, 'helvetiker_regular.typeface.json');

if (!existsSync(sourceFont)) {
  console.error('Source font file not found at:', sourceFont);
  process.exit(1);
}

try {
  copyFileSync(sourceFont, targetFont);
  console.log('Font file copied successfully from:', sourceFont);
  console.log('Font file copied to:', targetFont);
} catch (error) {
  console.error('Failed to copy font file:', error);
  process.exit(1);
} 