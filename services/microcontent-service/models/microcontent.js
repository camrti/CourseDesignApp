const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const LearningStyleSchema = new Schema({
  dimension: {
    type: String,
    enum: ['Processing', 'Perception', 'Input', 'Understanding'],
    required: true
  },
  category: {
    type: String,
    enum: ['Active', 'Reflective', 'Sensing', 'Intuitive', 'Visual', 'Verbal', 'Sequential', 'Global'],
    required: true,
    validate: {
      validator: function(category) {
        const validCombinations = {
          'Processing': ['Active', 'Reflective'],
          'Perception': ['Sensing', 'Intuitive'], 
          'Input': ['Visual', 'Verbal'],
          'Understanding': ['Sequential', 'Global']
        };
        return validCombinations[this.dimension]?.includes(category);
      },
      message: 'Category must match the dimension (Processing: Active/Reflective, Perception: Sensing/Intuitive, Input: Visual/Verbal, Understanding: Sequential/Global)'
    }
  }
}, { _id: false });

const MicrocontentSchema = new Schema({
  identifier: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    index: true
  },
  description: {
    type: String,
    required: true
  },
  contentType: {
    type: String,
    enum: ['video', 'audio', 'pdf', 'infographic', 'quiz', 'case_study', 'scenario', 'task', 'tutorial'],
    required: true,
    index: true
  },
  url: {
    type: String,
    required: true
  },
  source: {
    type: String,
    required: true,
    index: true
  },
  duration: {
    type: String,
    default: ''
  },
  language: {
    type: String,
    required: true,
    default: 'en'
  },
  learningStyle: {
    type: LearningStyleSchema,
    required: true,
    index: true
  },
  primaryConcepts: [{
    type: String,
    index: true
  }],
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'intermediate',
    index: true
  },
  learningOutcomes: [String],
  semanticKeywords: [{
    type: String,
    index: true
  }],
  primaryLevel: {
    type: String,
    enum: ['Acquire', 'Make Meaning', 'Transfer'],
    required: true,
    index: true
  },
  secondaryLevels: [{
    type: String,
    enum: ['Acquire', 'Make Meaning', 'Transfer'],
    index: true
  }],
  embedding: {
    type: [Number],
    default: null,
    index: false
  },
  embeddingCalculated: {
    type: Boolean,
    default: false,
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  }
});

MicrocontentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

MicrocontentSchema.methods = {
  isLocalContent: function() {
    return this.url.startsWith('/') || this.url.startsWith('file://');
  },
  
  getLocalFilePath: function() {
    if (!this.isLocalContent()) {
      return null;
    }
    
    const path = require('path');
    
    if (this.url.startsWith('/')) {
      const relativePath = this.url.substring(1);
      return path.join(__dirname, '..', relativePath);
    }
    
    if (this.url.startsWith('file://')) {
      return this.url.replace('file://', '');
    }
    
    return null;
  },
  
  buildEmbeddingText: function() {
    let text = this.title;
    
    if (this.learningOutcomes && this.learningOutcomes.length > 0) {
      text += ' ' + this.learningOutcomes.join(' ');
    }
    
    if (this.semanticKeywords && this.semanticKeywords.length > 0) {
      const topKeywords = this.semanticKeywords.slice(0, 5).join(' ');
      text += ' ' + topKeywords;
    }
    
    return text;
  }
};

MicrocontentSchema.statics = {
  findByLearningStyle: function(dimension, category = null) {
    const query = { 'learningStyle.dimension': dimension, isActive: true };
    if (category) {
      query['learningStyle.category'] = category;
    }
    return this.find(query);
  },
  
  findByDifficulty: function(difficulty) {
    return this.find({ difficulty, isActive: true });
  },
  
  searchByKeywords: function(keywords) {
    if (!keywords || keywords.length === 0) return this.find({ isActive: true });
    
    return this.find({
      $and: [
        { isActive: true },
        {
          $or: [
            { semanticKeywords: { $in: keywords } },
            { primaryConcepts: { $in: keywords } },
            { title: { $regex: keywords.join('|'), $options: 'i' } },
            { description: { $regex: keywords.join('|'), $options: 'i' } }
          ]
        }
      ]
    }).sort({ updatedAt: -1 });
  },
  
  findWithoutEmbedding: function() {
    return this.find({ 
      $and: [
        { isActive: true },
        { embeddingCalculated: { $ne: true } }
      ]
    });
  },
  
  findWithEmbedding: function() {
    return this.find({ 
      embeddingCalculated: true, 
      isActive: true 
    });
  }
};

MicrocontentSchema.index({ 'learningStyle.dimension': 1, 'learningStyle.category': 1 });
MicrocontentSchema.index({ semanticKeywords: 1 });
MicrocontentSchema.index({ primaryConcepts: 1 });
MicrocontentSchema.index({ difficulty: 1, 'learningStyle.dimension': 1 });
MicrocontentSchema.index({ primaryLevel: 1 });
MicrocontentSchema.index({ secondaryLevels: 1 });
MicrocontentSchema.index({ embeddingCalculated: 1 });
MicrocontentSchema.index({ createdAt: -1 });
MicrocontentSchema.index({ updatedAt: -1 });

module.exports = mongoose.model('Microcontent', MicrocontentSchema);