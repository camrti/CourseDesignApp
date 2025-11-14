const TEMPLATE = {
    "identifier": "",
    "title": "",
    "description": "",
    "contentType": "",
    "url": "",
    "source": "",
    "duration": "",
    "language": "en",
    "learningStyle": {
      "dimension": "",
      "category": ""
    },
    "primaryConcepts": [],
    "difficulty": "",
    "learningOutcomes": [],
    "semanticKeywords": [],
    "primaryLevel": "",
    "secondaryLevels": []
  };
  
  const FSLSM_MAPPING = {
    'video': {
      dimension: 'Input',
      category: 'Visual',
      description: 'Visual learners - information through images, diagrams and videos'
    },
    'audio': {
      dimension: 'Input', 
      category: 'Verbal',
      description: 'Verbal learners - information through written or spoken words'
    },
    'pdf': {
      dimension: 'Input',
      category: 'Verbal', 
      description: 'Reading/writing learners - texts and documents'
    },
    'quiz': {
      dimension: 'Processing',
      category: 'Active',
      description: 'Active learners - active participation, interactive quizzes'
    },
    'interactive': {
      dimension: 'Processing',
      category: 'Active',
      description: 'Active learners - workshops, interactive simulations'
    }
  };
  
  const OLLAMA_CONFIG = {
    baseURL: 'http://localhost:11434',
    model: 'deepseek-r1:1.5b',
    temperature: 0.3
  };
  
  const API_CONFIG = {
    baseURL: 'http://localhost:8080',
    endpoint: '/api/microcontents'
  };
  
  module.exports = {
    TEMPLATE,
    FSLSM_MAPPING,
    OLLAMA_CONFIG,
    API_CONFIG
  };