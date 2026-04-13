const EMAREntry = require('../models/EMAREntry');

exports.getByResident = async (req, res) => {
  try {
    const meds = await EMAREntry.find({ resident: req.params.residentId, active: true });
    res.json(meds);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.create = async (req, res) => {
  try {
    const med = await EMAREntry.create({
      ...req.body,
      resident: req.params.residentId,
      prescribedBy: req.body.prescribedBy || req.user.name,
    });
    res.status(201).json(med);
  } catch (err) { res.status(400).json({ error: err.message }); }
};

// PATCH /api/emar/:medId/doses/:doseId/administer
exports.administerDose = async (req, res) => {
  try {
    const med = await EMAREntry.findById(req.params.medId);
    if (!med) return res.status(404).json({ error: 'Medication not found' });
    const dose = med.doses.id(req.params.doseId);
    if (!dose) return res.status(404).json({ error: 'Dose not found' });
    dose.status = 'given';
    dose.administeredBy = req.user.name;
    dose.administeredAt = new Date();
    await med.save();
    res.json(med);
  } catch (err) { res.status(400).json({ error: err.message }); }
};

exports.update = async (req, res) => {
  try {
    const med = await EMAREntry.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!med) return res.status(404).json({ error: 'Medication not found' });
    res.json(med);
  } catch (err) { res.status(400).json({ error: err.message }); }
};

// Soft delete — discontinue, keep record
exports.remove = async (req, res) => {
  try {
    await EMAREntry.findByIdAndUpdate(req.params.id, { active: false });
    res.json({ message: 'Medication discontinued' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};
