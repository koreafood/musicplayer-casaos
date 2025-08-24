const fs = require('fs').promises;
const path = require('path');

/**
 * Recursively scan directory for music files
 * @param {string} dirPath - Directory path to scan
 * @param {Array} allowedExtensions - Array of allowed file extensions
 * @returns {Promise<Array>} Array of music file paths
 */
async function scanMusicFiles(dirPath, allowedExtensions = ['.mp3', '.wav', '.flac', '.m4a']) {
  const musicFiles = [];
  
  try {
    const items = await fs.readdir(dirPath, { withFileTypes: true });
    
    for (const item of items) {
      const fullPath = path.join(dirPath, item.name);
      
      if (item.isDirectory()) {
        // Recursively scan subdirectories
        const subFiles = await scanMusicFiles(fullPath, allowedExtensions);
        musicFiles.push(...subFiles);
      } else if (item.isFile()) {
        const ext = path.extname(item.name).toLowerCase();
        if (allowedExtensions.includes(ext)) {
          musicFiles.push(fullPath);
        }
      }
    }
  } catch (error) {
    console.error(`Error scanning directory ${dirPath}:`, error.message);
    // Continue scanning other directories even if one fails
  }
  
  return musicFiles.sort(); // Sort alphabetically
}

/**
 * Get basic metadata for a music file
 * @param {string} filePath - Path to the music file
 * @returns {Promise<Object>} Metadata object
 */
async function getMusicMetadata(filePath) {
  try {
    const stats = await fs.stat(filePath);
    const filename = path.basename(filePath);
    const extension = path.extname(filePath);
    
    // Basic metadata (can be extended with music-metadata library for ID3 tags)
    const metadata = {
      filename: filename,
      title: path.basename(filePath, extension),
      extension: extension,
      size: stats.size,
      sizeFormatted: formatFileSize(stats.size),
      created: stats.birthtime,
      modified: stats.mtime,
      // Placeholder for additional metadata
      artist: 'Unknown Artist',
      album: 'Unknown Album',
      duration: null, // Would need audio analysis library
      bitrate: null,
      sampleRate: null
    };
    
    return metadata;
  } catch (error) {
    console.error(`Error getting metadata for ${filePath}:`, error.message);
    throw new Error(`Failed to get metadata: ${error.message}`);
  }
}

/**
 * Validate file path to prevent directory traversal attacks
 * @param {string} filename - Filename to validate
 * @returns {boolean} True if path is safe
 */
function validateFilePath(filename) {
  // Check for directory traversal patterns
  const dangerousPatterns = [
    '../',
    '..\\',
    '//',
    '\\\\',
    '%2e%2e%2f',
    '%2e%2e%5c',
    '..%2f',
    '..%5c'
  ];
  
  const lowerFilename = filename.toLowerCase();
  
  for (const pattern of dangerousPatterns) {
    if (lowerFilename.includes(pattern)) {
      console.warn(`Dangerous path detected: ${filename}`);
      return false;
    }
  }
  
  // Check for absolute paths
  if (path.isAbsolute(filename)) {
    console.warn(`Absolute path not allowed: ${filename}`);
    return false;
  }
  
  // Check for null bytes
  if (filename.includes('\0')) {
    console.warn(`Null byte detected in path: ${filename}`);
    return false;
  }
  
  return true;
}

/**
 * Format file size in human readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 */
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Get directory structure for music folder
 * @param {string} dirPath - Directory path
 * @param {number} maxDepth - Maximum depth to scan
 * @returns {Promise<Object>} Directory structure
 */
async function getDirectoryStructure(dirPath, maxDepth = 3) {
  const structure = {
    name: path.basename(dirPath),
    path: dirPath,
    type: 'directory',
    children: []
  };
  
  if (maxDepth <= 0) {
    return structure;
  }
  
  try {
    const items = await fs.readdir(dirPath, { withFileTypes: true });
    
    for (const item of items) {
      const fullPath = path.join(dirPath, item.name);
      
      if (item.isDirectory()) {
        const subStructure = await getDirectoryStructure(fullPath, maxDepth - 1);
        structure.children.push(subStructure);
      } else if (item.isFile()) {
        const ext = path.extname(item.name).toLowerCase();
        if (['.mp3', '.wav', '.flac', '.m4a'].includes(ext)) {
          structure.children.push({
            name: item.name,
            path: fullPath,
            type: 'file',
            extension: ext
          });
        }
      }
    }
  } catch (error) {
    console.error(`Error reading directory structure ${dirPath}:`, error.message);
  }
  
  return structure;
}

module.exports = {
  scanMusicFiles,
  getMusicMetadata,
  validateFilePath,
  formatFileSize,
  getDirectoryStructure
};