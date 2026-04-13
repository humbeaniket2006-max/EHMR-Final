const Note = require('../models/Note');

exports.getByResident = async (req, res) => {
  try {
    const notes = await Note.find({ resident: req.params.residentId }).sort({ createdAt: -1 }).limit(50);
    res.json(notes);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.create = async (req, res) => {
  try {
    const note = await Note.create({
      ...req.body,
      resident: req.params.residentId,
      author: req.body.author || req.user.name,
      role:   req.body.role   || req.user.role,
    });
    res.status(201).json(note);
  } catch (err) { res.status(400).json({ error: err.message }); }
};

exports.update = async (req, res) => {
  try {
    const note = await Note.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!note) return res.status(404).json({ error: 'Note not found' });
    res.json(note);
  } catch (err) { res.status(400).json({ error: err.message }); }
};

exports.remove = async (req, res) => {
  try {
    await Note.findByIdAndDelete(req.params.id);
    res.json({ message: 'Note deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};
