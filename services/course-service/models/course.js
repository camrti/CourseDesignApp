const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ContentSchema = new Schema({
  id: {
    type: String,
    required: true
  },
  microcontentId: {
    type: Schema.Types.ObjectId,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  contentType: {
    type: String,
    enum: ['video', 'audio', 'pdf', 'infographic', 'quiz', 'case_study', 'scenario', 'task', 'tutorial'],
    required: true
  },
  duration: {
    type: String,
    default: '5 min'
  },
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'intermediate'
  },
  source: {
    type: String,
    default: 'internal'
  }
}, { _id: false });

const SectionSchema = new Schema({
  id: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  gdtaMapping: {
    goalId: String,
    goalTitle: String,
    subgoalId: String, 
    subgoalTitle: String
  },
  contents: [ContentSchema]
}, { _id: false });

const CourseSchema = new Schema({
  title: {
    type: String,
    required: true,
    default: 'Nuovo Corso'
  },
  description: {
    type: String,
    default: ''
  },
  gdtaStructureId: {
    type: Schema.Types.ObjectId,
    ref: 'GDTAStructure',
    required: true
  },
  sections: [SectionSchema],
  status: {
    type: String,
    enum: ['draft', 'published', 'exported'],
    default: 'draft'
  },
  moodleExport: {
    exported: {
      type: Boolean,
      default: false
    },
    exportDate: Date,
    moodleCourseId: String
  },
  metadata: {
    estimatedDuration: String,
    targetAudience: String,
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced']
    },
    keywords: [String]
  },
  createdBy: {
    type: String,
    default: 'system'
  },
  lastModifiedBy: {
    type: String,
    default: 'system'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

CourseSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

CourseSchema.methods = {
  calculateTotalDuration: function() {
    let totalMinutes = 0;
    
    this.sections.forEach(section => {
      section.contents.forEach(content => {
        const minutes = parseInt(content.duration) || 5;
        totalMinutes += minutes;
      });
    });
    
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}min`;
    }
    return `${minutes}min`;
  },
  
  getTotalContentCount: function() {
    return this.sections.reduce((total, section) => {
      return total + section.contents.length;
    }, 0);
  },
  
  isReadyForExport: function() {
    return this.sections.some(section => section.contents.length > 0);
  }
};

CourseSchema.statics = {
  findByGDTAStructure: function(gdtaStructureId) {
    return this.find({ gdtaStructureId });
  },
  
  findLatestByGDTAStructure: function(gdtaStructureId) {
    return this.findOne({ gdtaStructureId })
      .sort({ updatedAt: -1 });
  }
};

CourseSchema.index({ gdtaStructureId: 1 });
CourseSchema.index({ status: 1 });
CourseSchema.index({ createdAt: -1 });
CourseSchema.index({ updatedAt: -1 });

module.exports = mongoose.model('Course', CourseSchema);