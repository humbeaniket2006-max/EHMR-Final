const CarePlan = require('../models/CarePlan');

exports.getByResident = async (req, res) => {
  try {
    const plan = await CarePlan.findOne({ resident: req.params.residentId, active: true });
    res.json(plan || {});
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// PUT upserts — create if missing, update if exists
exports.upsert = async (req, res) => {
  try {
    const plan = await CarePlan.findOneAndUpdate(
      { resident: req.params.residentId, active: true },
      { ...req.body, resident: req.params.residentId },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );
    res.json(plan);
  } catch (err) { res.status(400).json({ error: err.message }); }
};
