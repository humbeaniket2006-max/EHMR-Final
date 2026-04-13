const mongoose = require('mongoose');

const NoteSchema = new mongoose.Schema({
  resident: { type: mongoose.Schema.Types.ObjectId, ref: 'Resident', required: true },
  shift:    { type: String, enum: ['Morning','Afternoon','Evening','Night'] },
  author:   String,
  role:     String,
  note:     { type: String, required: true },
  tasks:    [String],
}, { timestamps: true });

module.exports = mongoose.model('Note', NoteSchema);
