const express = require('express');
const fs = require('fs');
const path = require('path');
const { scanMusicFiles, getMusicMetadata, validateFilePath } = require('../utils/fileScanner');

const router = express.Router();
const MUSIC_PATH = process.env.MUSIC_PATH || '/DATA/Media/Music/';
const ALLOWED_EXTENSIONS = (process.env.ALLOWED_EXTENSIONS || '.mp3,.wav,.flac,.m4a').split(',');

// Get playlist (all music files)
router.get('/playlist', async (req, res) => {
  try {
    console.log('📂 Scanning music directory:', MUSIC_PATH);
    
    if (!fs.existsSync(MUSIC_PATH)) {
      return res.status(404).json({
        error: 'Music directory not found',
        path: MUSIC_PATH
      });
    }

    const musicFiles = await scanMusicFiles(MUSIC_PATH, ALLOWED_EXTENSIONS);
    
    const playlist = musicFiles.map((file, index) => ({
      id: index,
      filename: path.basename(file),
      path: file.replace(MUSIC_PATH, ''),
      title: path.basename(file, path.extname(file)),
      extension: path.extname(file)
    }));

    console.log(`🎵 Found ${playlist.length} music files`);
    
    res.json({
      success: true,
      count: playlist.length,
      playlist: playlist
    });
  } catch (error) {
    console.error('Error scanning playlist:', error);
    res.status(500).json({
      error: 'Failed to scan music directory',
      message: error.message
    });
  }
});

// Stream music file
router.get('/stream/:filename', (req, res) => {
  try {
    const filename = decodeURIComponent(req.params.filename);
    
    // Validate file path to prevent directory traversal
    if (!validateFilePath(filename)) {
      return res.status(400).json({
        error: 'Invalid file path'
      });
    }

    const filePath = path.join(MUSIC_PATH, filename);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        error: 'Music file not found',
        filename: filename
      });
    }

    // Check file extension
    const ext = path.extname(filename).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return res.status(400).json({
        error: 'File type not supported',
        extension: ext
      });
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    // Set content type based on file extension
    const contentType = {
      '.mp3': 'audio/mpeg',
      '.wav': 'audio/wav',
      '.flac': 'audio/flac',
      '.m4a': 'audio/mp4'
    }[ext] || 'audio/mpeg';

    if (range) {
      // Handle range requests for audio streaming
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;
      
      const file = fs.createReadStream(filePath, { start, end });
      
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': contentType,
        'Cache-Control': `max-age=${process.env.CACHE_CONTROL_MAX_AGE || 3600}`
      });
      
      file.pipe(res);
    } else {
      // Send entire file
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': contentType,
        'Cache-Control': `max-age=${process.env.CACHE_CONTROL_MAX_AGE || 3600}`
      });
      
      fs.createReadStream(filePath).pipe(res);
    }

    console.log(`🎵 Streaming: ${filename}`);
  } catch (error) {
    console.error('Error streaming file:', error);
    res.status(500).json({
      error: 'Failed to stream music file',
      message: error.message
    });
  }
});

// Get music metadata
router.get('/metadata/:filename', async (req, res) => {
  try {
    const filename = decodeURIComponent(req.params.filename);
    
    if (!validateFilePath(filename)) {
      return res.status(400).json({
        error: 'Invalid file path'
      });
    }

    const filePath = path.join(MUSIC_PATH, filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        error: 'Music file not found'
      });
    }

    const metadata = await getMusicMetadata(filePath);
    
    res.json({
      success: true,
      filename: filename,
      metadata: metadata
    });
  } catch (error) {
    console.error('Error getting metadata:', error);
    res.status(500).json({
      error: 'Failed to get music metadata',
      message: error.message
    });
  }
});

module.exports = router;