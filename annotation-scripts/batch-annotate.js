const fs = require('fs-extra');
const path = require('path');
const { annotateContent } = require('./annotate-content');

async function processDirectory(inputDir, outputDir) {
  try {
    console.log(`\nProcessing directory: ${inputDir}`);
    
    await fs.ensureDir(inputDir);
    await fs.ensureDir(outputDir);
    
    const files = await fs.readdir(inputDir);
    const txtFiles = files.filter(file => file.endsWith('.txt'));
    
    if (txtFiles.length === 0) {
      console.log(`No .txt files found in ${inputDir}`);
      return;
    }
    
    console.log(`Found ${txtFiles.length} files to process`);
    
    for (let i = 0; i < txtFiles.length; i++) {
      const file = txtFiles[i];
      const inputFile = path.join(inputDir, file);
      const outputFile = path.join(outputDir, file.replace('.txt', '.json'));
      
      console.log(`\n[${i + 1}/${txtFiles.length}] Processing: ${file}`);
      
      try {
        await annotateContent(inputFile, outputFile);
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`Failed to process ${file}:`, error.message);
      }
    }
    
    console.log(`\nCompleted processing ${inputDir}`);
    
  } catch (error) {
    console.error(`Error processing directory ${inputDir}:`, error.message);
    throw error;
  }
}

async function batchProcess() {
  const transcriptsDir = './transcripts';
  const outputDir = './output';
  
  try {
    const subdirs = await fs.readdir(transcriptsDir);
    const validDirs = [];
    
    for (const subdir of subdirs) {
      const fullPath = path.join(transcriptsDir, subdir);
      const stats = await fs.stat(fullPath);
      if (stats.isDirectory()) {
        validDirs.push(subdir);
      }
    }
    
    if (validDirs.length === 0) {
      console.log('No subdirectories found in ./transcripts/');
      return;
    }
    
    console.log(`Found directories: ${validDirs.join(', ')}`);
    
    for (const subdir of validDirs) {
      const inputDir = path.join(transcriptsDir, subdir);
      const outputSubdir = path.join(outputDir, subdir);
      
      await processDirectory(inputDir, outputSubdir);
    }
    
    console.log('\nAll directories processed successfully!');
    
  } catch (error) {
    console.error('Batch processing failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  const specificDir = process.argv[2];
  
  if (specificDir) {
    const inputDir = path.join('./transcripts', specificDir);
    const outputDir = path.join('./output', specificDir);
    
    processDirectory(inputDir, outputDir)
      .then(() => console.log('\nDirectory processing completed!'))
      .catch(error => {
        console.error('Processing failed:', error.message);
        process.exit(1);
      });
  } else {
    batchProcess();
  }
}

module.exports = { processDirectory, batchProcess };