const express = require('express');
const router = express.Router();
const CourseService = require('../courseService');

const courseService = new CourseService();

router.post('/', async (req, res) => {
  try {
    const courseData = req.body;
    
    if (!courseData.gdtaStructureId) {
      return res.status(400).json({ 
        message: 'GDTA structure ID required' 
      });
    }
    
    const newCourse = await courseService.createCourse(courseData);
    res.status(201).json(newCourse);
  } catch (error) {
    console.error('Error creating course:', error);
    res.status(500).json({ 
      message: 'Error creating course',
      error: error.message 
    });
  }
});

router.get('/by-gdta/:gdtaId', async (req, res) => {
  try {
    const courses = await courseService.getCoursesByGDTAStructure(req.params.gdtaId);
    
    if (courses.length === 0) {
      return res.status(404).json({ 
        message: 'No course found for this GDTA structure' 
      });
    }
    
    res.json(courses[0]);
  } catch (error) {
    console.error('Error fetching courses for GDTA:', error);
    res.status(500).json({ 
      message: 'Error fetching courses',
      error: error.message 
    });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const course = await courseService.getCourseById(req.params.id);
    res.json(course);
  } catch (error) {
    console.error('Error fetching course:', error);
    
    if (error.message === 'Course not found') {
      return res.status(404).json({ message: error.message });
    }
    
    res.status(500).json({ 
      message: 'Error fetching course',
      error: error.message 
    });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const courseId = req.params.id;
    const updateData = req.body;
    
    const updatedCourse = await courseService.updateCourse(courseId, updateData);
    res.json(updatedCourse);
  } catch (error) {
    console.error('Error updating course:', error);
    
    if (error.message === 'Course not found') {
      return res.status(404).json({ message: error.message });
    }
    
    res.status(500).json({ 
      message: 'Error updating course',
      error: error.message 
    });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await courseService.deleteCourse(req.params.id);
    res.json(result);
  } catch (error) {
    console.error('Error deleting course:', error);
    
    if (error.message === 'Course not found') {
      return res.status(404).json({ message: error.message });
    }
    
    res.status(500).json({ 
      message: 'Error deleting course',
      error: error.message 
    });
  }
});

router.post('/:id/export/pdf', async (req, res) => {
  try {
    const courseId = req.params.id;
    const exportResult = await courseService.exportCourseToPDF(courseId);
    
    res.json(exportResult);
  } catch (error) {
    console.error('Error exporting course to PDF:', error);
    
    if (error.message === 'Course not found') {
      return res.status(404).json({ message: error.message });
    }
    
    if (error.message.includes('at least one section')) {
      return res.status(400).json({ message: error.message });
    }
    
    res.status(500).json({ 
      message: 'Error exporting course to PDF',
      error: error.message 
    });
  }
});

module.exports = router;