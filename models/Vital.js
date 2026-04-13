const mongoose = require('mongoose');

const VitalSchema = new mongoose.Schema({
  resident:   { type: mongoose.Schema.Types.ObjectId, ref: 'Resident', required: true },
  bp_s:       Number,
  bp_d:       Number,
  pulse:      Number,
  spo2:       Number,
  temp:       Number,
  glucose:    Number,
  weight:     Number,
  by:         String,
  notes:      String,
  recordedAt: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('Vital', VitalSchema);
