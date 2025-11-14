const express = require('express');
const router = express.Router();
const RecommendationService = require('../recommendationService');

const recommendationService = new RecommendationService();

router.post('/suggestions', async (req, res) => {
  try {
    const requestData = req.body;
    const suggestions = await recommendationService.getSuggestions(requestData);
    
    res.json(suggestions);
  } catch (error) {
    console.error('Error getting suggestions:', error);
    res.status(500).json({ 
      message: 'Error getting suggestions',
      error: error.message 
    });
  }
});

router.get('/suggestions/:elementId', async (req, res) => {
  try {
    const { elementId } = req.params;
    const cached = await recommendationService.getCachedSuggestions(elementId);
    
    if (cached) {
      res.json(cached);
    } else {
      res.status(404).json({ message: 'No cached suggestions found' });
    }
  } catch (error) {
    console.error('Error getting cached suggestions:', error);
    res.status(500).json({ 
      message: 'Error getting cached suggestions',
      error: error.message 
    });
  }
});

router.get('/popular', async (req, res) => {
  try {
    const popularContent = await recommendationService.getPopularContent();
    res.json(popularContent);
  } catch (error) {
    console.error('Error getting popular content:', error);
    res.status(500).json({ 
      message: 'Error getting popular content',
      error: error.message 
    });
  }
});

router.get('/types', (req, res) => {
  const contentTypes = [
    { type: 'video', label: 'Video', icon: '🎥' },
    { type: 'text', label: 'Testo', icon: '📄' },
    { type: 'quiz', label: 'Quiz', icon: '❓' },
    { type: 'audio', label: 'Audio', icon: '🎧' },
    { type: 'image', label: 'Immagine', icon: '🖼️' }
  ];
  
  res.json(contentTypes);
});

module.exports = router;