const mongoose = require('mongoose');

const CarePlanSchema = new mongoose.Schema({
  resident:   { type: mongoose.Schema.Types.ObjectId, ref: 'Resident', required: true },
  goals:      [String],
  dietary:    String,
  activity:   String,
  nextReview: Date,
  reviewedBy: String,
  active:     { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('CarePlan', CarePlanSchema);
