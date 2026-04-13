const mongoose = require('mongoose');

const AlertSchema = new mongoose.Schema({
  resident: { type: mongoose.Schema.Types.ObjectId, ref: 'Resident' },
  resName:  String,
  room:     String,
  type:     { type: String, enum: ['vital','med','lab','system'], default: 'system' },
  sev:      { type: String, enum: ['critical','warning','info'], default: 'info' },
  msg:      { type: String, required: true },
  acked:    { type: Boolean, default: false },
  ackedBy:  String,
  ackedAt:  Date,
}, { timestamps: true });

module.exports = mongoose.model('Alert', AlertSchema);
