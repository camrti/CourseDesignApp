const express = require('express');
const router = express.Router();
const MicrocontentService = require('../microcontentService');

const microcontentService = new MicrocontentService();

router.get('/', async (req, res) => {
  try {
    const microcontents = await microcontentService.getAllMicrocontents();
    res.json(microcontents);
  } catch (error) {
    console.error('Error fetching microcontents:', error);
    res.status(500).json({ 
      message: 'Error fetching microcontents',
      error: error.message 
    });
  }
});

router.get('/with-embeddings', async (req, res) => {
  try {
    const Microcontent = require('../models/microcontent');
    const microcontents = await Microcontent.findWithEmbedding();
    
    res.json({
      microcontents,
      count: microcontents.length
    });
  } catch (error) {
    console.error('Error fetching microcontents with embeddings:', error);
    res.status(500).json({ 
      message: 'Error fetching microcontents with embeddings',
      error: error.message 
    });
  }
});

router.get('/embeddings/stats', async (req, res) => {
  try {
    const stats = await microcontentService.getEmbeddingStats();
    
    res.json({
      message: 'Embedding statistics retrieved',
      stats: stats
    });
  } catch (error) {
    console.error('Error getting embedding stats:', error);
    res.status(500).json({ 
      message: 'Error getting embedding stats',
      error: error.message 
    });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const microcontent = await microcontentService.getMicrocontentById(req.params.id);
    res.json(microcontent);
  } catch (error) {
    console.error('Error fetching microcontent:', error);
    
    if (error.message === 'Microcontent not found') {
      return res.status(404).json({ message: error.message });
    }
    
    res.status(500).json({ 
      message: 'Error fetching microcontent',
      error: error.message 
    });
  }
});

router.post('/search', async (req, res) => {
  try {
    const filters = req.body;
    const microcontents = await microcontentService.searchMicrocontents(filters);
    
    res.json({
      microcontents,
      filters: filters,
      count: microcontents.length
    });
  } catch (error) {
    console.error('Error searching microcontents:', error);
    res.status(500).json({ 
      message: 'Error searching microcontents',
      error: error.message 
    });
  }
});

router.post('/import', async (req, res) => {
  try {
    const jsonData = req.body;
    
    if (!jsonData) {
      return res.status(400).json({ 
        message: 'JSON data is required' 
      });
    }
    
    const result = await microcontentService.importFromJSON(jsonData);
    
    res.json({
      message: 'Import completed successfully',
      result: result
    });
  } catch (error) {
    console.error('Error importing microcontents:', error);
    res.status(500).json({ 
      message: 'Error importing microcontents',
      error: error.message 
    });
  }
});

router.post('/', async (req, res) => {
  try {
    const microcontentData = req.body;
    
    if (!microcontentData.identifier || !microcontentData.title) {
      return res.status(400).json({ 
        message: 'Identifier and title are required' 
      });
    }
    
    const newMicrocontent = await microcontentService.createMicrocontent(microcontentData);
    res.status(201).json(newMicrocontent);
  } catch (error) {
    console.error('Error creating microcontent:', error);
    
    if (error.message.includes('already exists')) {
      return res.status(409).json({ message: error.message });
    }
    
    res.status(500).json({ 
      message: 'Error creating microcontent',
      error: error.message 
    });
  }
});

router.post('/embeddings/calculate', async (req, res) => {
  try {
    console.log('Starting batch embedding calculation...');
    
    const result = await microcontentService.calculateMissingEmbeddings();
    
    res.json({
      message: 'Embedding calculation completed',
      result: result
    });
  } catch (error) {
    console.error('Error calculating embeddings:', error);
    res.status(500).json({ 
      message: 'Error calculating embeddings',
      error: error.message 
    });
  }
});

module.exports = router;