const LabResult = require('../models/LabResult');
const Alert = require('../models/Alert');
const Resident = require('../models/Resident');

exports.getByResident = async (req, res) => {
  try {
    const labs = await LabResult.find({ resident: req.params.residentId }).sort({ date: -1 });
    res.json(labs);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.create = async (req, res) => {
  try {
    const lab = await LabResult.create({
      ...req.body,
      resident: req.params.residentId,
      orderedBy: req.body.orderedBy || req.user.name,
    });

    // Auto-alert on abnormal result
    if (lab.status !== 'normal') {
      const r = await Resident.findById(req.params.residentId);
      await Alert.create({
        resident: r._id,
        resName:  r.name,
        room:     r.room,
        type:     'lab',
        sev:      'warning',
        msg:      `Lab: ${lab.test} ${lab.result}${lab.unit ? ' ' + lab.unit : ''} — ${lab.status}`,
      });
    }

    res.status(201).json(lab);
  } catch (err) { res.status(400).json({ error: err.message }); }
};

exports.update = async (req, res) => {
  try {
    const lab = await LabResult.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!lab) return res.status(404).json({ error: 'Lab result not found' });
    res.json(lab);
  } catch (err) { res.status(400).json({ error: err.message }); }
};

exports.remove = async (req, res) => {
  try {
    await LabResult.findByIdAndDelete(req.params.id);
    res.json({ message: 'Lab result deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};
