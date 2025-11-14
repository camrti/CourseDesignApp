const express = require('express');
const router = express.Router();
const GDTAService = require('../gdtaService');

const gdtaService = new GDTAService();

router.get('/', async (req, res) => {
  try {
    const gdtaStructures = await gdtaService.getAllGDTAStructures();
    res.json(gdtaStructures);
  } catch (error) {
    console.error('Error fetching GDTA structures:', error);
    res.status(500).json({ 
      message: 'Error fetching GDTA structures',
      error: error.message 
    });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const gdtaStructure = await gdtaService.getGDTAStructureById(req.params.id);
    res.json(gdtaStructure);
  } catch (error) {
    console.error('Error fetching GDTA structure:', error);
    
    if (error.message === 'GDTA structure not found') {
      return res.status(404).json({ message: error.message });
    }
    
    res.status(500).json({ 
      message: 'Error fetching GDTA structure',
      error: error.message 
    });
  }
});

router.post('/', async (req, res) => {
  try {
    const newGDTAStructure = await gdtaService.createGDTAStructure(req.body);
    res.status(201).json(newGDTAStructure);
  } catch (error) {
    console.error('Error creating GDTA structure:', error);
    
    if (error.message.includes('required')) {
      return res.status(400).json({ message: error.message });
    }
    
    res.status(500).json({ 
      message: 'Error creating GDTA structure',
      error: error.message 
    });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const updatedStructure = await gdtaService.updateGDTAStructure(req.params.id, req.body);
    res.json(updatedStructure);
  } catch (error) {
    console.error('Error updating GDTA structure:', error);
    
    if (error.message === 'GDTA structure not found') {
      return res.status(404).json({ message: error.message });
    }
    
    res.status(500).json({ 
      message: 'Error updating GDTA structure',
      error: error.message 
    });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await gdtaService.deleteGDTAStructure(req.params.id);
    res.json(result);
  } catch (error) {
    console.error('Error deleting GDTA structure:', error);
    
    if (error.message === 'GDTA structure not found') {
      return res.status(404).json({ message: error.message });
    }
    
    res.status(500).json({ 
      message: 'Error deleting GDTA structure',
      error: error.message 
    });
  }
});

module.exports = router;