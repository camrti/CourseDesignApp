const fs = require('fs-extra');
const axios = require('axios');
const path = require('path');
const { TEMPLATE, FSLSM_MAPPING, OLLAMA_CONFIG } = require('./config');

function getMetadataFromPath(filePath) {
  const pathParts = filePath.split(path.sep);
  const directory = pathParts[pathParts.length - 2];
  const filename = pathParts[pathParts.length - 1].replace('.txt', '');
  
  const contentType = directory.slice(0, -1);
  
  return {
    contentType: contentType,
    title: filename.replace(/-/g, ' ').replace(/_/g, ' '),
    learningStyle: FSLSM_MAPPING[contentType] || FSLSM_MAPPING['pdf'],
    identifier: `${contentType}_${filename}_${Date.now()}`
  };
}

async function callOllama(transcript, metadata) {
    const prompt = `You are an educational content annotator. Analyze this ${metadata.contentType} transcript and fill the JSON template with accurate educational metadata.

    CONTENT INFORMATION:
    - Type: ${metadata.contentType}
    - Title: ${metadata.title}
    
    LEARNING STYLE (FSLSM Framework):
    - Dimension: ${metadata.learningStyle.dimension}
    - Category: ${metadata.learningStyle.category}
    
    INSTRUCTIONS:
    - identifier: "${metadata.identifier}"
    - contentType: "${metadata.contentType}"
    - title: "${metadata.title}"
    - description: Write a concise 2-3 sentence description
    - duration: Estimate duration based on content length (e.g., "5min", "10min", "2pages")
    - source: Determine appropriate source category
    - learningStyle.dimension: "${metadata.learningStyle.dimension}"
    - learningStyle.category: "${metadata.learningStyle.category}"
    - primaryConcepts: Extract 3-5 main concepts from the content
    - difficulty: Choose "beginner", "intermediate", or "advanced"
    - learningOutcomes: List 3-4 specific learning outcomes
    - semanticKeywords: Extract 5-8 relevant keywords for search
    - primaryLevel: Choose main SA level "Acquire", "Make Meaning", or "Transfer"
    - secondaryLevels: Array of additional relevant SA levels
    
    SA LEVELS:
    Acquire: Data gathering, recognition, basic awareness, foundational knowledge
    Make Meaning: Analysis, interpretation, connecting information, understanding relationships
    Transfer: Application in new contexts, decision making, generalization, problem solving
    
    Template: ${JSON.stringify(TEMPLATE, null, 2)}
    
    Transcript: ${transcript}
    
    Return ONLY valid JSON without reasoning or explanations:`;

  try {
    const response = await axios.post(`${OLLAMA_CONFIG.baseURL}/api/generate`, {
      model: OLLAMA_CONFIG.model,
      prompt: prompt,
      stream: false,
      options: {
        temperature: OLLAMA_CONFIG.temperature
      }
    });
    
    const jsonStr = response.data.response.trim();
    
    const jsonMatch = jsonStr.match(/```json\n([\s\S]*?)\n```/) || jsonStr.match(/```\n([\s\S]*?)\n```/);
    const cleanJson = jsonMatch ? jsonMatch[1] : jsonStr;
    
    return JSON.parse(cleanJson);
    
  } catch (error) {
    console.error('Error calling Ollama or parsing JSON:', error.message);
    throw error;
  }
}

async function annotateContent(inputFile, outputFile) {
  try {
    console.log(`Processing: ${inputFile}`);
    
    const transcript = await fs.readFile(inputFile, 'utf8');
    
    const metadata = getMetadataFromPath(inputFile);
    
    const annotated = await callOllama(transcript, metadata);
    
    await fs.ensureDir(path.dirname(outputFile));
    
    await fs.writeFile(outputFile, JSON.stringify(annotated, null, 2));
    
    console.log(`Saved: ${outputFile}`);
    return annotated;
    
  } catch (error) {
    console.error(`Error processing ${inputFile}:`, error.message);
    throw error;
  }
}

if (require.main === module) {
  const inputFile = process.argv[2];
  const outputFile = process.argv[3];
  
  if (!inputFile || !outputFile) {
    console.log('Usage: node annotate-content.js <input.txt> <output.json>');
    process.exit(1);
  }
  
  annotateContent(inputFile, outputFile)
    .then(() => console.log('Annotation completed!'))
    .catch(error => {
      console.error('Annotation failed:', error.message);
      process.exit(1);
    });
}

module.exports = { annotateContent };