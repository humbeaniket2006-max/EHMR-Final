const mongoose = require('mongoose');

const DoseSchema = new mongoose.Schema({
  time:           String,
  status:         { type: String, enum: ['given','pending','overdue','refused'], default: 'pending' },
  administeredBy: String,
  administeredAt: Date,
});

const EMARSchema = new mongoose.Schema({
  resident:     { type: mongoose.Schema.Types.ObjectId, ref: 'Resident', required: true },
  name:         { type: String, required: true },
  route:        String,
  freq:         String,
  indication:   String,
  prescribedBy: String,
  doses:        [DoseSchema],
  active:       { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('EMAREntry', EMARSchema);
