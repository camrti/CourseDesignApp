const mongoose = require('mongoose');

const SuggestionSchema = new mongoose.Schema({
  gdtaElementId: {
    type: String,
    required: true,
    index: true
  },
  suggestions: [{
    _id: String,
    identifier: String,
    title: String,
    description: String,
    contentType: String,
    source: String,
    duration: String,
    relevanceScore: Number,
    matchQuality: String,
    scoringMode: String,
    semanticScore: Number,
    saScore: Number,
    url: String,
    learningStyle: Object,
    difficulty: String,
    semanticKeywords: [String],
    primaryConcepts: [String],
    learningOutcomes: [String],
    primaryLevel: String,
    secondaryLevels: [String]
  }],
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Suggestion', SuggestionSchema);