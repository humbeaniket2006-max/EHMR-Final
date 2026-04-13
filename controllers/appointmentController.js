const Appointment = require('../models/Appointment');

exports.getByResident = async (req, res) => {
  try {
    const apts = await Appointment.find({ resident: req.params.residentId }).sort({ date: 1 });
    res.json(apts);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.create = async (req, res) => {
  try {
    const apt = await Appointment.create({ ...req.body, resident: req.params.residentId });
    res.status(201).json(apt);
  } catch (err) { res.status(400).json({ error: err.message }); }
};

exports.update = async (req, res) => {
  try {
    const apt = await Appointment.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!apt) return res.status(404).json({ error: 'Appointment not found' });
    res.json(apt);
  } catch (err) { res.status(400).json({ error: err.message }); }
};

exports.remove = async (req, res) => {
  try {
    await Appointment.findByIdAndDelete(req.params.id);
    res.json({ message: 'Appointment deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};
