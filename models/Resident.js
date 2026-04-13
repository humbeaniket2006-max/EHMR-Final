const mongoose = require('mongoose');

const ResidentSchema = new mongoose.Schema({
  name:      { type: String, required: true },
  initials:  String,
  age:       Number,
  room:      { type: String, required: true },
  blood:     String,
  condition: { type: String, enum: ['Stable','Monitor','Critical','Recovery'], default: 'Stable' },
  admitted:  String,
  doctor:    String,
  caregiver: String,
  color:     { type: String, default: '#00897B' },
  diagnoses: [String],
  allergies: [{ drug: String, severity: { type: String, enum: ['mild','moderate','severe'] } }],
  emergency: { name: String, relation: String, phone: String },
  active:    { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Resident', ResidentSchema);
