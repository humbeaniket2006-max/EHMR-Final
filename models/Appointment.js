const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema({
  resident: { type: mongoose.Schema.Types.ObjectId, ref: 'Resident', required: true },
  type:     { type: String, required: true },
  with:     String,
  date:     { type: Date, required: true },
  time:     String,
  status:   { type: String, enum: ['upcoming','completed','cancelled'], default: 'upcoming' },
  notes:    String,
}, { timestamps: true });

module.exports = mongoose.model('Appointment', AppointmentSchema);
