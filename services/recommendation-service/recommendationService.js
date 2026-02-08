const axios = require('axios');
const Suggestion = require('./models/suggestion');

class RecommendationService {
  
  constructor() {
    this.microcontentServiceUrl = process.env.MICROCONTENT_SERVICE_URL || 'http://localhost:3004';
    this.sbertServiceUrl = process.env.SBERT_SERVICE_URL || 'http://localhost:3005';
  }
  
  async getCachedSuggestions(gdtaElementId) {
    try {
      const cached = await Suggestion.findOne({ gdtaElementId });
      return cached ? cached.suggestions : null;
    } catch (error) {
      console.error('Error getting cached suggestions:', error);
      return null;
    }
  }
  
  async saveSuggestions(gdtaElementId, suggestions) {
    try {
      await Suggestion.findOneAndUpdate(
        { gdtaElementId },
        { suggestions, timestamp: new Date() },
        { upsert: true }
      );
      console.log(`Suggestions saved for element: ${gdtaElementId}`);
    } catch (error) {
      console.error('Error saving suggestions:', error);
    }
  }
  
  async calculateGDTAEmbedding(gdtaElement) {
    try {
      const gdtaText = `${gdtaElement.title} ${gdtaElement.description || ''}`.trim();
      const response = await axios.post(`${this.sbertServiceUrl}/embedding`, { text: gdtaText });
      return response.data.embedding;
    } catch (error) {
      console.error('SBERT service error:', error.message);
      throw new Error('Failed to calculate GDTA embedding');
    }
  }
  
  calculateCosineSimilarity(embedding1, embedding2) {
    try {
      let dotProduct = 0;
      let norm1 = 0;
      let norm2 = 0;
      
      for (let i = 0; i < embedding1.length; i++) {
        dotProduct += embedding1[i] * embedding2[i];
        norm1 += embedding1[i] * embedding1[i];
        norm2 += embedding2[i] * embedding2[i];
      }
      
      norm1 = Math.sqrt(norm1);
      norm2 = Math.sqrt(norm2);
      
      if (norm1 === 0 || norm2 === 0) {
        return 0;
      }
      
      const similarity = dotProduct / (norm1 * norm2);
      
      return Math.max(0, Math.min(1, similarity));
      
    } catch (error) {
      console.error('Error calculating cosine similarity:', error);
      return 0;
    }
  }
  
  async getSuggestions(requestData) {
    try {
      // Supporta sia gdtaElement che gdtaNode per compatibilità
      const gdtaElement = requestData.gdtaElement || requestData.gdtaNode;
      
      console.log('Getting suggestions for:', gdtaElement?.title);
      console.log('Full GDTA element:', JSON.stringify(gdtaElement, null, 2));
      
      const response = await axios.get(`${this.microcontentServiceUrl}/api/microcontents/with-embeddings`);
      let microcontents = response.data.microcontents || response.data;
      
      console.log(`Found ${microcontents.length} microcontents with pre-computed embeddings`);
      
      if (!gdtaElement) {
        console.log('No GDTA element provided, returning first 10 microcontents');
        return microcontents.slice(0, 10);
      }
      
      console.log('Calculating embedding for GDTA element...');
      const gdtaEmbedding = await this.calculateGDTAEmbedding(gdtaElement);
      console.log('GDTA embedding calculated');
      
      const isRequirement = gdtaElement.type === 'requirement';
      const scoringMode = isRequirement ? 'HYBRID' : 'SEMANTIC_ONLY';
      
      console.log(`Scoring mode: ${scoringMode} (element type: ${gdtaElement.type})`);
      
      const suggestions = [];
      
      for (const content of microcontents) {
        let finalScore;
        let semanticScore;
        let saScore = null;
        let matchQuality;
        
        if (content.embedding && content.embeddingCalculated) {
          semanticScore = this.calculateCosineSimilarity(gdtaEmbedding, content.embedding);
        } else {
          console.warn(`Content ${content.identifier} missing embedding, using fallback`);
          semanticScore = 0.3;
        }
        
        if (scoringMode === 'HYBRID') {
          saScore = this.calculateSALevelScore(content, gdtaElement);
          finalScore = (semanticScore + saScore) / 2;
          console.log(`${content.identifier}: SBERT=${semanticScore.toFixed(3)}, SA=${saScore.toFixed(3)}, Final=${finalScore.toFixed(3)}`);
        } else {
          finalScore = semanticScore;
          console.log(`${content.identifier}: SBERT-only=${semanticScore.toFixed(3)}`);
        }
        
        matchQuality = this.calculateMatchQuality(finalScore, scoringMode);
        
        suggestions.push({
          _id: content._id,
          identifier: content.identifier,
          title: content.title,
          description: content.description,
          contentType: content.contentType,
          source: content.source,
          duration: content.duration,
          relevanceScore: finalScore,
          matchQuality: matchQuality,
          scoringMode: scoringMode,
          semanticScore: semanticScore,
          saScore: saScore,
          url: content.url,
          learningStyle: content.learningStyle,
          difficulty: content.difficulty,
          semanticKeywords: content.semanticKeywords,
          primaryConcepts: content.primaryConcepts,
          learningOutcomes: content.learningOutcomes,
          primaryLevel: content.primaryLevel,
          secondaryLevels: content.secondaryLevels
        });
      }
      
      suggestions.sort((a, b) => b.relevanceScore - a.relevanceScore);
      
      const limit = requestData.limit || 10;
      const filteredSuggestions = suggestions.slice(0, limit);
      
      // Cache disabilitata per avere sempre suggerimenti freschi
      // await this.saveSuggestions(gdtaElement.id, filteredSuggestions);
      
      console.log(`Returning ${filteredSuggestions.length} suggestions (${scoringMode} mode) - FAST MODE WITH PRE-COMPUTED EMBEDDINGS`);
      console.log('Top 3 scores:', filteredSuggestions.slice(0, 3).map(s => 
        `${s.identifier}: ${s.relevanceScore.toFixed(3)} (${s.matchQuality})`
      ));
      
      return filteredSuggestions;
      
    } catch (error) {
      console.error('Error getting suggestions:', error);
      return [];
    }
  }
  
  async calculateSBERTSimilarity(content, gdtaElement) {
    try {
      const gdtaText = `${gdtaElement.title} ${gdtaElement.description || ''}`.trim();
      const contentText = this.buildContentText(content);
      const similarity = await this.callSBERTService(gdtaText, contentText);
      return similarity;
    } catch (error) {
      console.error('Error calculating SBERT similarity:', error);
      return 0.3;
    }
  }
  
  calculateSALevelScore(content, gdtaElement) {
    if (!gdtaElement.level) {
      return 0.5;
    }
    
    const targetSALevel = this.mapGDTALevelToSA(gdtaElement.level);
    
    if (content.primaryLevel === targetSALevel) {
      return 1.0;
    }
    
    if (content.secondaryLevels && content.secondaryLevels.includes(targetSALevel)) {
      return 0.5;
    }
    
    return 0.1;
  }
  
  calculateMatchQuality(score, scoringMode) {
    if (scoringMode === 'HYBRID') {
      if (score >= 0.8) return 'Perfect Match';
      if (score >= 0.6) return 'Good Match';
      if (score >= 0.4) return 'Fair Match';
      return 'Poor Match';
    } else {
      if (score >= 0.7) return 'Perfect Match';
      if (score >= 0.5) return 'Good Match';
      if (score >= 0.3) return 'Fair Match';
      return 'Poor Match';
    }
  }
  
  mapGDTALevelToSA(gdtaLevel) {
    switch(gdtaLevel) {
      case 1: return 'Acquire';
      case 2: return 'Make Meaning';
      case 3: return 'Transfer';
      default: return 'Acquire';
    }
  }
  
  buildContentText(content) {
    let text = content.title;
    
    if (content.learningOutcomes && content.learningOutcomes.length > 0) {
      text += ' ' + content.learningOutcomes.join(' ');
    }
    
    if (content.semanticKeywords && content.semanticKeywords.length > 0) {
      const topKeywords = content.semanticKeywords.slice(0, 5).join(' ');
      text += ' ' + topKeywords;
    }
    
    return text;
  }
  
  async callSBERTService(text1, text2) {
    try {
      const response = await axios.post(`${this.sbertServiceUrl}/similarity`, { text1, text2 });
      return response.data.similarity;
    } catch (error) {
      console.error('SBERT service error:', error.message);
      throw new Error('Failed to calculate similarity');
    }
  }
  
  async getPopularContent() {
    try {
      const response = await axios.get(`${this.microcontentServiceUrl}/api/microcontents`);
      const microcontents = response.data;
      
      const popularContent = microcontents.slice(0, 5).map((content, index) => ({
        _id: content._id,
        identifier: content.identifier,
        title: content.title,
        views: 1250 - (index * 200),
        rating: 4.8 - (index * 0.1),
        contentType: content.contentType,
        learningStyle: content.learningStyle,
        difficulty: content.difficulty
      }));
      
      return popularContent;
      
    } catch (error) {
      console.error('Error fetching popular content:', error);
      return [];
    }
  }
}

module.exports = RecommendationService;