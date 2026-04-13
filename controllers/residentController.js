const Resident = require('../models/Resident');

exports.getAll = async (req, res) => {
  try {
    const filter = { active: true };
    if (req.query.condition) filter.condition = req.query.condition;
    const residents = await Resident.find(filter).sort({ name: 1 });
    res.json(residents);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getOne = async (req, res) => {
  try {
    const r = await Resident.findById(req.params.id);
    if (!r) return res.status(404).json({ error: 'Resident not found' });
    res.json(r);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.create = async (req, res) => {
  try {
    // Auto-generate initials if not provided
    if (!req.body.initials && req.body.name) {
      req.body.initials = req.body.name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    const r = await Resident.create(req.body);
    res.status(201).json(r);
  } catch (err) { res.status(400).json({ error: err.message }); }
};

exports.update = async (req, res) => {
  try {
    const r = await Resident.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!r) return res.status(404).json({ error: 'Resident not found' });
    res.json(r);
  } catch (err) { res.status(400).json({ error: err.message }); }
};

// Soft delete — set active: false
exports.remove = async (req, res) => {
  try {
    await Resident.findByIdAndUpdate(req.params.id, { active: false });
    res.json({ message: 'Resident deactivated' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};
