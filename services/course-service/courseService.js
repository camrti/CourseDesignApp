const Course = require('./models/course');
const axios = require('axios');
const PDFGenerator = require('./utilities/pdfGenerator');

class CourseService {
  
  async createCourse(courseData) {
    try {
      try {
        await axios.get(`http://gdta-service:3002/api/gdta/${courseData.gdtaStructureId}`);
      } catch (error) {
        throw new Error('GDTA structure not found');
      }
      
      const newCourse = new Course({
        title: courseData.title || 'New Course',
        description: courseData.description || '',
        gdtaStructureId: courseData.gdtaStructureId,
        sections: courseData.sections || [],
        createdBy: courseData.createdBy || 'system'
      });
      
      const savedCourse = await newCourse.save();
      console.log('New course created:', savedCourse._id);
      
      return savedCourse;
    } catch (error) {
      console.error('Error creating course:', error);
      throw error;
    }
  }
  
  async getCourseById(courseId) {
    try {
      const course = await Course.findById(courseId);
        
      if (!course) {
        throw new Error('Course not found');
      }
      
      return course;
    } catch (error) {
      console.error('Error fetching course:', error);
      throw error;
    }
  }
  
  async getCoursesByGDTAStructure(gdtaStructureId) {
    try {
      const courses = await Course.findByGDTAStructure(gdtaStructureId)
        .sort({ updatedAt: -1 });
        
      return courses;
    } catch (error) {
      console.error('Error fetching courses:', error);
      throw error;
    }
  }
  
  async updateCourse(courseId, updateData) {
    try {
      const course = await Course.findById(courseId);
      
      if (!course) {
        throw new Error('Course not found');
      }
      
      if (updateData.title !== undefined) course.title = updateData.title;
      if (updateData.description !== undefined) course.description = updateData.description;
      if (updateData.sections !== undefined) course.sections = updateData.sections;
      if (updateData.status !== undefined) course.status = updateData.status;
      if (updateData.metadata !== undefined) course.metadata = updateData.metadata;
      
      course.lastModifiedBy = updateData.lastModifiedBy || 'system';
      course.updatedAt = new Date();
      
      if (!course.metadata) {
        course.metadata = {};
      }
      course.metadata.estimatedDuration = course.calculateTotalDuration();
      
      const updatedCourse = await course.save();
      console.log('Course updated:', courseId);
      
      return updatedCourse;
    } catch (error) {
      console.error('Error updating course:', error);
      throw error;
    }
  }
  
  async deleteCourse(courseId) {
    try {
      const deletedCourse = await Course.findByIdAndDelete(courseId);
      
      if (!deletedCourse) {
        throw new Error('Course not found');
      }
      
      console.log('Course deleted:', courseId);
      return { message: 'Course deleted successfully' };
    } catch (error) {
      console.error('Error deleting course:', error);
      throw error;
    }
  }
  
  async exportCourseToPDF(courseId) {
    try {
      const course = await Course.findById(courseId);
        
      if (!course) {
        throw new Error('Course not found');
      }
      
      if (!course.isReadyForExport()) {
        throw new Error('The course must have at least one section with content to be exported');
      }
      
      console.log('Exporting course to PDF blueprint:', courseId);
      
      let gdtaStructure = null;
      try {
        const gdtaResponse = await axios.get(`http://gdta-service:3002/api/gdta/${course.gdtaStructureId}`);
        gdtaStructure = gdtaResponse.data;
      } catch (gdtaError) {
        console.error('Error fetching GDTA structure:', gdtaError.message);
        gdtaStructure = {
          _id: course.gdtaStructureId,
          title: 'GDTA Structure',
          description: 'Unable to fetch GDTA details',
          goals: []
        };
      }
      
      const blueprintData = {
        title: course.title,
        description: course.description,
        gdtaTitle: gdtaStructure.title,
        gdtaDescription: gdtaStructure.description,
        totalDuration: course.calculateTotalDuration(),
        totalContents: course.getTotalContentCount(),
        sections: course.sections.map((section, index) => ({
          number: index + 1,
          title: section.title,
          contentCount: section.contents.length,
          gdtaMapping: section.gdtaMapping ? {
            goalId: section.gdtaMapping.goalId,
            subgoalId: section.gdtaMapping.subgoalId,
            displayText: this.getGDTADisplayText(section.gdtaMapping, gdtaStructure)
          } : null,
          contents: section.contents.map((content, contentIndex) => ({
            number: contentIndex + 1,
            title: content.title,
            type: this.getContentTypeLabel(content.contentType),
            difficulty: this.getDifficultyLabel(content.difficulty),
            source: content.source
          }))
        })),
        exportDate: new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      };
      
      const htmlContent = PDFGenerator.generateCourseBlueprint(blueprintData);
      
      course.status = 'exported';
      await course.save();
      
      const courseNameSafe = course.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const filename = `${courseNameSafe}.html`;
      
      return {
        success: true,
        message: 'Course blueprint generated',
        htmlContent: htmlContent,
        filename: filename
      };
      
    } catch (error) {
      console.error('Error exporting course to PDF:', error);
      throw error;
    }
  }
  
  getGDTADisplayText(gdtaMapping, gdtaStructure) {
    if (!gdtaMapping || !gdtaStructure || !gdtaStructure.goals) {
      return null;
    }
    
    const goalIndex = gdtaStructure.goals.findIndex(g => g._id === gdtaMapping.goalId);
    
    if (goalIndex === -1) {
      return null;
    }
    
    if (gdtaMapping.subgoalId) {
      const goal = gdtaStructure.goals[goalIndex];
      const subgoalIndex = goal?.subgoals?.findIndex(s => s._id === gdtaMapping.subgoalId);
      
      if (subgoalIndex !== -1) {
        return `Subgoal ${goalIndex + 1}.${subgoalIndex + 1}`;
      }
    }
    
    return `Goal ${goalIndex + 1}`;
  }
  
  getContentTypeLabel(contentType) {
    const labels = {
      'video': 'Video',
      'audio': 'Audio',
      'pdf': 'PDF Document',
      'infographic': 'Infographic',
      'quiz': 'Quiz',
      'case_study': 'Case Study',
      'scenario': 'Scenario',
      'task': 'Task',
      'tutorial': 'Tutorial'
    };
    return labels[contentType] || contentType;
  }
  
  getDifficultyLabel(difficulty) {
    const labels = {
      'beginner': 'Beginner',
      'intermediate': 'Intermediate',
      'advanced': 'Advanced'
    };
    return labels[difficulty] || difficulty;
  }
}

module.exports = CourseService;