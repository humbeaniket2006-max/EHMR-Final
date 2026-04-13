const Alert = require('../models/Alert');

exports.getAll = async (req, res) => {
  try {
    const filter = {};
    if (req.query.acked !== undefined) filter.acked = req.query.acked === 'true';
    if (req.query.sev) filter.sev = req.query.sev;
    const alerts = await Alert.find(filter).sort({ createdAt: -1 }).limit(100);
    res.json(alerts);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.create = async (req, res) => {
  try {
    const alert = await Alert.create(req.body);
    res.status(201).json(alert);
  } catch (err) { res.status(400).json({ error: err.message }); }
};

exports.acknowledge = async (req, res) => {
  try {
    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      { acked: true, ackedBy: req.user.name, ackedAt: new Date() },
      { new: true }
    );
    if (!alert) return res.status(404).json({ error: 'Alert not found' });
    res.json(alert);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.acknowledgeAll = async (req, res) => {
  try {
    await Alert.updateMany(
      { acked: false },
      { acked: true, ackedBy: req.user.name, ackedAt: new Date() }
    );
    res.json({ message: 'All alerts acknowledged' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.remove = async (req, res) => {
  try {
    await Alert.findByIdAndDelete(req.params.id);
    res.json({ message: 'Alert deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};
