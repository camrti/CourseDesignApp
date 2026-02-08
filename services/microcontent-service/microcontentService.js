const Microcontent = require('./models/microcontent');
const axios = require('axios');

class MicrocontentService {
  
  constructor() {
    this.sbertServiceUrl = process.env.SBERT_SERVICE_URL || 'http://sbert-service:3005';
  }
  
  async calculateEmbedding(text) {
    try {
      const response = await axios.post(`${this.sbertServiceUrl}/embedding`, { text });
      return response.data.embedding;
    } catch (error) {
      console.error('SBERT service error:', error.message);
      throw new Error('Failed to calculate embedding');
    }
  }
  
  async getAllMicrocontents() {
    try {
      const microcontents = await Microcontent.find({ isActive: true })
        .sort({ updatedAt: -1 });
      
      console.log(`Retrieved ${microcontents.length} microcontents`);
      return microcontents;
    } catch (error) {
      console.error('Error fetching microcontents:', error);
      throw error;
    }
  }
  
  async getMicrocontentById(id) {
    try {
      const microcontent = await Microcontent.findById(id);
      
      if (!microcontent || !microcontent.isActive) {
        throw new Error('Microcontent not found');
      }
      
      return microcontent;
    } catch (error) {
      console.error('Error fetching microcontent:', error);
      throw error;
    }
  }
  
  async getMicrocontentByIdentifier(identifier) {
    try {
      console.log(`Looking for microcontent with identifier: ${identifier}`);
      
      const microcontent = await Microcontent.findOne({ 
        identifier: identifier, 
        isActive: true 
      });
      
      if (!microcontent) {
        console.log(`Microcontent not found with identifier: ${identifier}`);
        throw new Error('Microcontent not found');
      }
      
      console.log(`Found microcontent: ${microcontent.title}`);
      return microcontent;
    } catch (error) {
      console.error('Error fetching microcontent by identifier:', error);
      throw error;
    }
  }
  
  async searchMicrocontents(filters = {}) {
    try {
      const query = { isActive: true };
      
      if (filters.dimension) {
        query['learningStyle.dimension'] = filters.dimension;
      }
      if (filters.category) {
        query['learningStyle.category'] = filters.category;
      }
      
      if (filters.contentType) {
        query.contentType = filters.contentType;
      }
      if (filters.difficulty) {
        query.difficulty = filters.difficulty;
      }
      
      if (filters.searchText) {
        const searchRegex = new RegExp(filters.searchText, 'i');
        query.$or = [
          { title: searchRegex },
          { description: searchRegex }
        ];
      }
      
      const microcontents = await Microcontent.find(query)
        .sort({ updatedAt: -1 });
      
      console.log(`Search found ${microcontents.length} microcontents`);
      return microcontents;
    } catch (error) {
      console.error('Error searching microcontents:', error);
      throw error;
    }
  }
  
  async createMicrocontent(microcontentData) {
    try {
      const microcontent = new Microcontent(microcontentData);
      
      console.log(`Calculating embedding for: ${microcontent.identifier}`);
      try {
        const embeddingText = microcontent.buildEmbeddingText();
        const embedding = await this.calculateEmbedding(embeddingText);
        
        microcontent.embedding = embedding;
        microcontent.embeddingCalculated = true;
        
        console.log(`Embedding calculated for: ${microcontent.identifier}`);
      } catch (embeddingError) {
        console.error(`Failed to calculate embedding for ${microcontent.identifier}:`, embeddingError.message);
        microcontent.embeddingCalculated = false;
      }
      
      const savedMicrocontent = await microcontent.save();
      console.log(`Created microcontent: ${savedMicrocontent.identifier}`);
      
      return savedMicrocontent;
    } catch (error) {
      console.error('Error creating microcontent:', error);
      throw error;
    }
  }
  
  async importFromJSON(jsonData) {
    try {
      let microcontents = [];
      
      if (jsonData.microcontents && Array.isArray(jsonData.microcontents)) {
        microcontents = jsonData.microcontents;
      } else if (Array.isArray(jsonData)) {
        microcontents = jsonData;
      } else {
        throw new Error('Invalid JSON format');
      }
      
      console.log(`Importing ${microcontents.length} microcontents with embeddings...`);
      
      let imported = 0;
      let errors = 0;
      
      for (const microcontentData of microcontents) {
        try {
          await this.createMicrocontent(microcontentData);
          imported++;
          
          if (imported % 5 === 0) {
            console.log(`Progress: ${imported}/${microcontents.length} imported`);
          }
        } catch (error) {
          console.error(`Error importing ${microcontentData.identifier}:`, error.message);
          errors++;
        }
      }
      
      console.log(`Import completed: ${imported} imported, ${errors} errors`);
      
      return {
        imported,
        errors,
        total: microcontents.length
      };
    } catch (error) {
      console.error('Error importing from JSON:', error);
      throw error;
    }
  }
  
  async calculateMissingEmbeddings() {
    try {
      const contentsWithoutEmbedding = await Microcontent.findWithoutEmbedding();
      
      console.log(`Found ${contentsWithoutEmbedding.length} contents without embeddings`);
      
      if (contentsWithoutEmbedding.length === 0) {
        return { updated: 0, errors: 0 };
      }
      
      let updated = 0;
      let errors = 0;
      
      for (const content of contentsWithoutEmbedding) {
        try {
          console.log(`Calculating embedding for: ${content.identifier}`);
          
          const embeddingText = content.buildEmbeddingText();
          const embedding = await this.calculateEmbedding(embeddingText);
          
          content.embedding = embedding;
          content.embeddingCalculated = true;
          
          await content.save();
          updated++;
          
          console.log(`Updated embedding for: ${content.identifier} (${updated}/${contentsWithoutEmbedding.length})`);
          
        } catch (error) {
          console.error(`Failed to calculate embedding for ${content.identifier}:`, error.message);
          errors++;
        }
      }
      
      console.log(`Embedding calculation completed: ${updated} updated, ${errors} errors`);
      
      return { updated, errors, total: contentsWithoutEmbedding.length };
      
    } catch (error) {
      console.error('Error calculating missing embeddings:', error);
      throw error;
    }
  }
  
  async getEmbeddingStats() {
    try {
      const total = await Microcontent.countDocuments({ isActive: true });
      const withEmbedding = await Microcontent.countDocuments({ 
        isActive: true, 
        embeddingCalculated: true 
      });
      const withoutEmbedding = total - withEmbedding;
      
      return {
        total,
        withEmbedding,
        withoutEmbedding,
        completionPercentage: total > 0 ? Math.round((withEmbedding / total) * 100) : 0
      };
    } catch (error) {
      console.error('Error getting embedding stats:', error);
      throw error;
    }
  }
}

module.exports = MicrocontentService;