const Vital = require('../models/Vital');
const Alert = require('../models/Alert');
const Resident = require('../models/Resident');

exports.getByResident = async (req, res) => {
  try {
    const vitals = await Vital.find({ resident: req.params.residentId })
      .sort({ recordedAt: -1 })
      .limit(50);
    res.json(vitals);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.create = async (req, res) => {
  try {
    const vital = await Vital.create({
      ...req.body,
      resident: req.params.residentId,
      by: req.body.by || req.user.name,
    });

    // Auto-generate threshold alerts
    const r = await Resident.findById(req.params.residentId);
    const alerts = [];
    if (vital.bp_s > 160 || vital.bp_d > 100)
      alerts.push({ resident: r._id, resName: r.name, room: r.room, type: 'vital', sev: 'critical', msg: `BP ${vital.bp_s}/${vital.bp_d} — critically elevated` });
    else if (vital.bp_s > 140 || vital.bp_d > 90)
      alerts.push({ resident: r._id, resName: r.name, room: r.room, type: 'vital', sev: 'warning', msg: `BP ${vital.bp_s}/${vital.bp_d} — elevated, monitoring required` });
    if (vital.spo2 != null && vital.spo2 < 92)
      alerts.push({ resident: r._id, resName: r.name, room: r.room, type: 'vital', sev: 'critical', msg: `SpO₂ ${vital.spo2}% — critically low` });
    else if (vital.spo2 != null && vital.spo2 < 95)
      alerts.push({ resident: r._id, resName: r.name, room: r.room, type: 'vital', sev: 'warning', msg: `SpO₂ ${vital.spo2}% — below threshold` });
    if (vital.glucose != null && vital.glucose > 250)
      alerts.push({ resident: r._id, resName: r.name, room: r.room, type: 'vital', sev: 'warning', msg: `Glucose ${vital.glucose} mg/dL — elevated` });
    if (alerts.length) await Alert.insertMany(alerts);

    res.status(201).json(vital);
  } catch (err) { res.status(400).json({ error: err.message }); }
};

exports.remove = async (req, res) => {
  try {
    await Vital.findByIdAndDelete(req.params.id);
    res.json({ message: 'Vital record deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};
