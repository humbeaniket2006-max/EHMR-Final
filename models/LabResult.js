const mongoose = require('mongoose');

const LabSchema = new mongoose.Schema({
  resident:  { type: mongoose.Schema.Types.ObjectId, ref: 'Resident', required: true },
  test:      { type: String, required: true },
  result:    String,
  unit:      String,
  ref:       String,
  status:    { type: String, enum: ['normal','high','low'], default: 'normal' },
  orderedBy: String,
  date:      { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('LabResult', LabSchema);
