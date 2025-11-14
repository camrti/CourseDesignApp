const fs = require('fs-extra');
const axios = require('axios');
const path = require('path');
const { API_CONFIG } = require('./config');

async function importJsonToDatabase(jsonFile) {
  try {
    console.log(`Importing: ${jsonFile}`);
    
    const content = await fs.readFile(jsonFile, 'utf8');
    const microContent = JSON.parse(content);
    
    const response = await axios.post(
      `${API_CONFIG.baseURL}${API_CONFIG.endpoint}`,
      microContent,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (response.status === 200 || response.status === 201) {
      console.log(`Successfully imported: ${path.basename(jsonFile)}`);
      return response.data;
    } else {
      throw new Error(`API returned status: ${response.status}`);
    }
    
  } catch (error) {
    if (error.response) {
      console.error(`API Error for ${jsonFile}:`, error.response.data);
    } else {
      console.error(`Error importing ${jsonFile}:`, error.message);
    }
    throw error;
  }
}

async function importDirectory(dirPath) {
  try {
    console.log(`\nImporting from directory: ${dirPath}`);
    
    const files = await fs.readdir(dirPath);
    const jsonFiles = files.filter(file => file.endsWith('.json'));
    
    if (jsonFiles.length === 0) {
      console.log(`No JSON files found in ${dirPath}`);
      return;
    }
    
    console.log(`Found ${jsonFiles.length} files to import`);
    
    let successCount = 0;
    let failCount = 0;
    
    for (let i = 0; i < jsonFiles.length; i++) {
      const file = jsonFiles[i];
      const filePath = path.join(dirPath, file);
      
      console.log(`\n[${i + 1}/${jsonFiles.length}] Importing: ${file}`);
      
      try {
        await importJsonToDatabase(filePath);
        successCount++;
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        failCount++;
      }
    }
    
    console.log(`\nImport Summary for ${dirPath}:`);
    console.log(`Successful: ${successCount}`);
    console.log(`Failed: ${failCount}`);
    
  } catch (error) {
    console.error(`Error importing directory ${dirPath}:`, error.message);
    throw error;
  }
}

async function importSingleFile(filePath) {
  try {
    console.log(`\nImporting from single file: ${filePath}`);
    
    const exists = await fs.pathExists(filePath);
    if (!exists) {
      throw new Error(`File not found: ${filePath}`);
    }
    
    const content = await fs.readFile(filePath, 'utf8');
    const jsonData = JSON.parse(content);
    
    let microcontents = [];
    if (jsonData.microcontents && Array.isArray(jsonData.microcontents)) {
      microcontents = jsonData.microcontents;
    } else if (Array.isArray(jsonData)) {
      microcontents = jsonData;
    } else {
      throw new Error('Invalid JSON format. Expected { microcontents: [...] } or array');
    }
    
    console.log(`Found ${microcontents.length} microcontents to import`);
    
    let successCount = 0;
    let failCount = 0;
    
    for (let i = 0; i < microcontents.length; i++) {
      const microcontent = microcontents[i];
      
      console.log(`\n[${i + 1}/${microcontents.length}] Importing: ${microcontent.identifier || microcontent.title}`);
      
      try {
        const response = await axios.post(
          `${API_CONFIG.baseURL}${API_CONFIG.endpoint}`,
          microcontent,
          {
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
        
        if (response.status === 200 || response.status === 201) {
          console.log(`✓ Successfully imported: ${microcontent.title}`);
          successCount++;
        }
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.error(`✗ Failed to import ${microcontent.identifier}:`, error.message);
        failCount++;
      }
    }
    
    console.log(`\n========================================`);
    console.log(`Import Summary:`);
    console.log(`  Total: ${microcontents.length}`);
    console.log(`  Successful: ${successCount}`);
    console.log(`  Failed: ${failCount}`);
    console.log(`========================================\n`);
    
    return { total: microcontents.length, successCount, failCount };
    
  } catch (error) {
    console.error('Error importing single file:', error.message);
    throw error;
  }
}

async function importAll() {
  const outputDir = './output';
  
  try {
    const exists = await fs.pathExists(outputDir);
    if (!exists) {
      console.log('Output directory not found. Run batch annotation first.');
      return;
    }
    
    const subdirs = await fs.readdir(outputDir);
    const validDirs = [];
    
    for (const subdir of subdirs) {
      const fullPath = path.join(outputDir, subdir);
      const stats = await fs.stat(fullPath);
      if (stats.isDirectory()) {
        validDirs.push(subdir);
      }
    }
    
    if (validDirs.length === 0) {
      console.log('No subdirectories found in ./output/');
      return;
    }
    
    console.log(`Found directories: ${validDirs.join(', ')}`);
    
    for (const subdir of validDirs) {
      const dirPath = path.join(outputDir, subdir);
      await importDirectory(dirPath);
    }
    
    console.log('\nAll imports completed!');
    
  } catch (error) {
    console.error('Import process failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length > 0 && args[0].endsWith('.json')) {
    const filePath = args[0];
    
    importSingleFile(filePath)
      .then((result) => {
        console.log('\nImport completed successfully!');
        console.log('Embeddings have been calculated automatically during import.');
        process.exit(0);
      })
      .catch(error => {
        console.error('Import failed:', error.message);
        process.exit(1);
      });
  }
  else if (args.length > 0) {
    const specificDir = args[0];
    const inputDir = path.join('./transcripts', specificDir);
    const outputDir = path.join('./output', specificDir);
    
    importDirectory(outputDir)
      .then(() => console.log('\nDirectory import completed!'))
      .catch(error => {
        console.error('Import failed:', error.message);
        process.exit(1);
      });
  }
  else {
    importAll();
  }
}

module.exports = { importJsonToDatabase, importDirectory, importAll, importSingleFile };