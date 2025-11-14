const GDTAStructure = require('./models/gdtaStructure');

class GDTAService {
  
  async getAllGDTAStructures() {
    try {
      const structures = await GDTAStructure.find().sort({ updatedAt: -1 });
      console.log(`Returning ${structures.length} GDTA structures`);
      return structures;
    } catch (error) {
      console.error('Error fetching GDTA structures:', error);
      throw error;
    }
  }
  
  async getGDTAStructureById(structureId) {
    try {
      const structure = await GDTAStructure.findById(structureId);
      
      if (!structure) {
        throw new Error('GDTA structure not found');
      }
      
      return structure;
    } catch (error) {
      console.error('Error fetching GDTA structure:', error);
      throw error;
    }
  }
  
  async createGDTAStructure(structureData) {
    try {
      if (!structureData.title) {
        throw new Error('Title is required');
      }
      
      const newStructure = new GDTAStructure({
        title: structureData.title,
        description: structureData.description || '',
        overallGoal: structureData.overallGoal || { 
          title: "Overall Goal", 
          description: "" 
        },
        goals: structureData.goals || []
      });
      
      const savedStructure = await newStructure.save();
      console.log(`Created GDTA structure: ${savedStructure._id}`);
      
      return savedStructure;
    } catch (error) {
      console.error('Error creating GDTA structure:', error);
      throw error;
    }
  }
  
  async updateGDTAStructure(structureId, updateData) {
    try {
      const updatedStructure = await GDTAStructure.findByIdAndUpdate(
        structureId,
        { 
          ...updateData,
          updatedAt: Date.now() 
        },
        { new: true }
      );
      
      if (!updatedStructure) {
        throw new Error('GDTA structure not found');
      }
      
      console.log(`Updated GDTA structure: ${structureId}`);
      
      return updatedStructure;
    } catch (error) {
      console.error('Error updating GDTA structure:', error);
      throw error;
    }
  }
  
  async deleteGDTAStructure(structureId) {
    try {
      const deletedStructure = await GDTAStructure.findByIdAndDelete(structureId);
      
      if (!deletedStructure) {
        throw new Error('GDTA structure not found');
      }
      
      console.log(`Deleted GDTA structure: ${structureId}`);
      
      return { message: 'GDTA structure deleted successfully' };
    } catch (error) {
      console.error('Error deleting GDTA structure:', error);
      throw error;
    }
  }
}

module.exports = GDTAService;