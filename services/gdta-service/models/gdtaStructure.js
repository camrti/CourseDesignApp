const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const InformationRequirementSchema = new Schema({
  _id: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  level: {
    type: Number,
    enum: [1, 2, 3],
    required: true
  }
}, { _id: false });

const SubGoalSchema = new Schema({
  _id: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  informationRequirements: [InformationRequirementSchema]
}, { _id: false });

const GoalSchema = new Schema({
  _id: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  subgoals: [SubGoalSchema]
}, { _id: false });

const GDTAStructureSchema = new Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  overallGoal: {
    title: {
      type: String,
      required: true
    },
    description: {
      type: String,
      default: ''
    }
  },
  goals: [GoalSchema],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('GDTAStructure', GDTAStructureSchema);