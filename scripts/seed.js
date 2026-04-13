/**
 * CareCore seed script
 * Usage: MONGODB_URI=<atlas_uri> JWT_SECRET=<secret> node scripts/seed.js
 *
 * Idempotent — clears existing data and re-seeds. Safe to re-run.
 * Outputs a JSON map of legacy IDs → MongoDB _ids to stdout so you
 * can update any hardcoded references in carecore.html if needed.
 */

require('dotenv').config();
const mongoose = require('mongoose');

const User        = require('../models/User');
const Resident    = require('../models/Resident');
const Vital       = require('../models/Vital');
const Alert       = require('../models/Alert');
const EMAREntry   = require('../models/EMAREntry');
const LabResult   = require('../models/LabResult');
const Note        = require('../models/Note');
const CarePlan    = require('../models/CarePlan');
const Appointment = require('../models/Appointment');

// ─── Source data (verbatim from carecore.html) ───────────────────

const SEED_RESIDENTS = [
  { _legacyId: 'R001', name: 'Ramesh Iyer',      initials: 'RI', age: 78, room: '204-A', blood: 'B+',  condition: 'Stable',   admitted: '15 Jan 2024', doctor: 'Dr. Priya Nair',    caregiver: 'Sunita Rao',  color: '#00897B', diagnoses: ['Type 2 Diabetes (E11.9)', 'Hypertension (I10)', 'Mild Arthritis (M19.9)'], allergies: [{ drug: 'Penicillin', severity: 'severe' }, { drug: 'Aspirin', severity: 'moderate' }], emergency: { name: 'Anand Iyer',    relation: 'Son',      phone: '9876501234' } },
  { _legacyId: 'R002', name: 'Saraswati Menon',   initials: 'SM', age: 82, room: '108-B', blood: 'O+',  condition: 'Monitor',  admitted: '10 Sep 2023', doctor: 'Dr. Rajesh Kumar',  caregiver: 'Deepa Singh', color: '#E53935', diagnoses: ['CHF (I50.9)', 'Atrial Fibrillation (I48.91)', 'CKD Stage 2 (N18.2)'],    allergies: [{ drug: 'Sulfa drugs', severity: 'moderate' }],                                  emergency: { name: 'Meena Menon',   relation: 'Daughter', phone: '9876502345' } },
  { _legacyId: 'R003', name: 'Govind Sharma',     initials: 'GS', age: 71, room: '312-A', blood: 'A+',  condition: 'Stable',   admitted: '01 Mar 2024', doctor: 'Dr. Priya Nair',    caregiver: 'Ravi Kumar',  color: '#388E3C', diagnoses: ['COPD (J44.1)', 'Osteoporosis (M81.0)'],                                        allergies: [{ drug: 'Ibuprofen', severity: 'mild' }],                                        emergency: { name: 'Rekha Sharma',  relation: 'Wife',     phone: '9876503456' } },
  { _legacyId: 'R004', name: 'Lakshmi Pillai',    initials: 'LP', age: 76, room: '201-C', blood: 'AB+', condition: 'Recovery', admitted: '20 Feb 2024', doctor: 'Dr. Amit Shah',     caregiver: 'Sunita Rao',  color: '#5E35B1', diagnoses: ['Post Hip Replacement (Z96.641)', 'Hypertension (I10)'],                       allergies: [{ drug: 'Latex', severity: 'moderate' }],                                        emergency: { name: 'Suresh Pillai', relation: 'Son',      phone: '9876504567' } },
  { _legacyId: 'R005', name: 'Mohan Das',         initials: 'MD', age: 80, room: '106-A', blood: 'O-',  condition: 'Stable',   admitted: '05 Nov 2023', doctor: 'Dr. Rajesh Kumar',  caregiver: 'Deepa Singh', color: '#1565C0', diagnoses: ["Parkinson's Disease (G20)", 'Depression (F32.9)'],                             allergies: [{ drug: 'Codeine', severity: 'severe' }],                                        emergency: { name: 'Priya Das',     relation: 'Daughter', phone: '9876505678' } },
];

const SEED_VITALS = {
  R001: [
    { t: '2026-04-01T08:00:00', bp_s: 128, bp_d: 82,  pulse: 74, spo2: 97, temp: 36.8, glucose: 142, weight: 68,   by: 'Sunita Rao', notes: 'Morning check — alert, cooperative' },
    { t: '2026-04-01T12:00:00', bp_s: 132, bp_d: 86,  pulse: 78, spo2: 96, temp: 37.0, glucose: 168, weight: null, by: 'Sunita Rao', notes: 'Post-lunch — glucose elevated' },
    { t: '2026-04-01T16:00:00', bp_s: 126, bp_d: 80,  pulse: 72, spo2: 98, temp: 36.6, glucose: 134, weight: null, by: 'Ravi Kumar', notes: 'Afternoon — stable' },
    { t: '2026-03-31T08:00:00', bp_s: 130, bp_d: 84,  pulse: 76, spo2: 97, temp: 36.7, glucose: 145, weight: 68.2, by: 'Sunita Rao', notes: 'Morning' },
  ],
  R002: [
    { t: '2026-04-01T08:00:00', bp_s: 148, bp_d: 92,  pulse: 88, spo2: 94, temp: 36.9, glucose: null, weight: 54,   by: 'Deepa Singh', notes: 'BP elevated — monitoring' },
    { t: '2026-04-01T12:00:00', bp_s: 144, bp_d: 90,  pulse: 86, spo2: 94, temp: 37.1, glucose: null, weight: null, by: 'Deepa Singh', notes: 'Afternoon check' },
  ],
  R003: [{ t: '2026-04-01T08:00:00', bp_s: 118, bp_d: 76, pulse: 68, spo2: 92, temp: 36.5, glucose: 138, weight: 72, by: 'Ravi Kumar',  notes: 'SpO₂ on lower side — COPD' }],
  R004: [{ t: '2026-04-01T08:00:00', bp_s: 116, bp_d: 74, pulse: 66, spo2: 98, temp: 36.6, glucose: 108, weight: 62, by: 'Sunita Rao',  notes: 'Post-op vitals good' }],
  R005: [{ t: '2026-04-01T08:00:00', bp_s: 122, bp_d: 80, pulse: 72, spo2: 97, temp: 36.7, glucose: 115, weight: 65, by: 'Deepa Singh', notes: 'Stable' }],
};

const SEED_MEDS = {
  R001: [
    { name: 'Metformin 500mg',    route: 'Oral', freq: 'Twice daily', indication: 'Type 2 Diabetes', prescribedBy: 'Dr. Priya Nair',   doses: [{ time: '08:00', status: 'given', administeredBy: 'Sunita Rao' }, { time: '20:00', status: 'pending' }] },
    { name: 'Amlodipine 5mg',     route: 'Oral', freq: 'Once daily',  indication: 'Hypertension',    prescribedBy: 'Dr. Priya Nair',   doses: [{ time: '08:00', status: 'given', administeredBy: 'Sunita Rao' }] },
    { name: 'Pantoprazole 40mg',  route: 'Oral', freq: 'Once daily',  indication: 'Gastric protection', prescribedBy: 'Dr. Priya Nair', doses: [{ time: '08:00', status: 'given', administeredBy: 'Sunita Rao' }] },
    { name: 'Glimepiride 1mg',    route: 'Oral', freq: 'Once daily',  indication: 'Type 2 Diabetes', prescribedBy: 'Dr. Priya Nair',   doses: [{ time: '08:00', status: 'given', administeredBy: 'Sunita Rao' }] },
    { name: 'Calcium + Vit D3',   route: 'Oral', freq: 'Once daily',  indication: 'Bone health',     prescribedBy: 'Dr. Priya Nair',   doses: [{ time: '20:00', status: 'overdue' }] },
  ],
  R002: [
    { name: 'Furosemide 40mg',  route: 'Oral', freq: 'Once daily', indication: 'CHF',                  prescribedBy: 'Dr. Rajesh Kumar', doses: [{ time: '08:00', status: 'given', administeredBy: 'Deepa Singh' }] },
    { name: 'Warfarin 2mg',     route: 'Oral', freq: 'Once daily', indication: 'Atrial Fibrillation',  prescribedBy: 'Dr. Rajesh Kumar', doses: [{ time: '18:00', status: 'pending' }] },
    { name: 'Digoxin 0.125mg',  route: 'Oral', freq: 'Once daily', indication: 'CHF',                  prescribedBy: 'Dr. Rajesh Kumar', doses: [{ time: '08:00', status: 'given', administeredBy: 'Deepa Singh' }] },
  ],
};

const SEED_LABS = {
  R001: [
    { test: 'HbA1c',            result: '7.8',  unit: '%',    ref: '< 7.0',    status: 'high',   date: '2026-03-20', orderedBy: 'Dr. Priya Nair' },
    { test: 'Fasting Glucose',  result: '138',  unit: 'mg/dL',ref: '70–100',   status: 'high',   date: '2026-03-20', orderedBy: 'Dr. Priya Nair' },
    { test: 'Creatinine',       result: '1.1',  unit: 'mg/dL',ref: '0.7–1.2',  status: 'normal', date: '2026-03-20', orderedBy: 'Dr. Priya Nair' },
    { test: 'Haemoglobin',      result: '12.8', unit: 'g/dL', ref: '13.5–17.5',status: 'low',    date: '2026-03-20', orderedBy: 'Dr. Priya Nair' },
    { test: 'Total Cholesterol',result: '212',  unit: 'mg/dL',ref: '< 200',    status: 'high',   date: '2026-03-20', orderedBy: 'Dr. Priya Nair' },
  ],
  R002: [
    { test: 'BNP',        result: '680', unit: 'pg/mL',ref: '< 100',   status: 'high',   date: '2026-03-25', orderedBy: 'Dr. Rajesh Kumar' },
    { test: 'Creatinine', result: '1.6', unit: 'mg/dL',ref: '0.5–1.1', status: 'high',   date: '2026-03-25', orderedBy: 'Dr. Rajesh Kumar' },
    { test: 'INR',        result: '2.4', unit: '',      ref: '2.0–3.0', status: 'normal', date: '2026-03-25', orderedBy: 'Dr. Rajesh Kumar' },
  ],
};

const SEED_NOTES = {
  R001: [
    { shift: 'Evening',   author: 'Sunita Rao',    role: 'Caregiver', note: 'Good day overall. Physiotherapy completed. Glucose 168 post-lunch — Dr. Nair informed. Evening Calcium pending. Mood: Cheerful.', tasks: ['Evening Calcium + Vit D3 at 20:00', 'Morning vitals 08:00'], createdAt: '2026-04-01T21:00:00' },
    { shift: 'Afternoon', author: 'Dr. Priya Nair', role: 'Doctor',   note: 'Reviewed vitals. Glucose 168 mg/dL post-lunch concerning. Dietary modification advised — reduce refined carbs. No medication change at this time.', tasks: [], createdAt: '2026-04-01T13:30:00' },
    { shift: 'Morning',   author: 'Deepa Singh',   role: 'Nurse',     note: 'Morning vitals stable. All medications administered. Breakfast well — 80% eaten. Requested physio session at 10:00.', tasks: [], createdAt: '2026-04-01T09:30:00' },
  ],
};

const SEED_ALERTS = [
  { legacyRes: 'R002', resName: 'Saraswati Menon', room: '108-B', type: 'vital', sev: 'critical', msg: 'BP 148/92 — elevated, monitoring required',          acked: false, createdAt: '2026-04-01T08:05:00' },
  { legacyRes: 'R003', resName: 'Govind Sharma',   room: '312-A', type: 'vital', sev: 'warning',  msg: 'SpO₂ 92% — COPD patient, check oxygen therapy',       acked: false, createdAt: '2026-04-01T08:10:00' },
  { legacyRes: 'R001', resName: 'Ramesh Iyer',     room: '204-A', type: 'med',   sev: 'warning',  msg: 'Calcium + Vit D3 — overdue at 20:00',                  acked: false, createdAt: '2026-04-01T20:00:00' },
  { legacyRes: 'R005', resName: 'Mohan Das',       room: '106-A', type: 'lab',   sev: 'info',     msg: 'Lab panel due — last drawn 30 days ago',               acked: true,  createdAt: '2026-04-01T06:00:00' },
];

const SEED_CAREPLAN_R001 = {
  goals: [
    'Reduce HbA1c below 7.0%',
    'Maintain BP below 130/80 mmHg',
    'Continue physiotherapy for arthritis 3× per week',
    'Monitor glucose twice daily',
    'Improve dietary compliance — low-carb, low-salt',
  ],
  dietary:    'Low-carbohydrate diabetic diet. Avoid refined sugar and white rice. 1.5L fluid intake daily. High-fibre breakfast. Low-salt meals for BP management.',
  activity:   'Physiotherapy 3× per week — Mon, Wed, Fri. Daily 15-min walk post-lunch. Range-of-motion exercises for knees. No high-impact activity.',
  nextReview: new Date('2026-04-15'),
  reviewedBy: 'Dr. Priya Nair',
};

const SEED_APPOINTMENTS = {
  R001: [
    { type: 'Doctor Review',  with: 'Dr. Priya Nair',       date: new Date('2026-04-15'), time: '10:00', status: 'upcoming' },
    { type: 'Physiotherapy',  with: 'Mr. Arjun Bhat',       date: new Date('2026-04-09'), time: '09:00', status: 'upcoming' },
    { type: 'Lab Panel',      with: 'CareCore Pathology',   date: new Date('2026-04-12'), time: '08:00', status: 'upcoming' },
    { type: 'Doctor Review',  with: 'Dr. Priya Nair',       date: new Date('2026-03-01'), time: '11:00', status: 'completed' },
    { type: 'Physiotherapy',  with: 'Mr. Arjun Bhat',       date: new Date('2026-03-05'), time: '09:00', status: 'completed' },
  ],
};

const SEED_USERS = [
  { name: 'Dr. Priya Nair',   email: 'priya@carecore.in',   password: 'CareCore@2026', role: 'doctor'    },
  { name: 'Dr. Rajesh Kumar', email: 'rajesh@carecore.in',  password: 'CareCore@2026', role: 'doctor'    },
  { name: 'Sunita Rao',       email: 'sunita@carecore.in',  password: 'CareCore@2026', role: 'caregiver' },
  { name: 'Deepa Singh',      email: 'deepa@carecore.in',   password: 'CareCore@2026', role: 'nurse'     },
  { name: 'Ravi Kumar',       email: 'ravi@carecore.in',    password: 'CareCore@2026', role: 'caregiver' },
  { name: 'Admin',            email: 'admin@carecore.in',   password: 'CareCore@2026', role: 'admin'     },
];

// ─── Seed runner ─────────────────────────────────────────────────

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB Atlas');

  // Clear all collections
  await Promise.all([
    User.deleteMany({}), Resident.deleteMany({}), Vital.deleteMany({}),
    Alert.deleteMany({}), EMAREntry.deleteMany({}), LabResult.deleteMany({}),
    Note.deleteMany({}), CarePlan.deleteMany({}), Appointment.deleteMany({}),
  ]);
  console.log('Collections cleared');

  // ── Users ──
  await User.insertMany(SEED_USERS);
  console.log(`Seeded ${SEED_USERS.length} users`);

  // ── Residents ──
  const idMap = {}; // legacyId → MongoDB _id
  for (const { _legacyId, ...data } of SEED_RESIDENTS) {
    const r = await Resident.create(data);
    idMap[_legacyId] = r._id;
  }
  console.log(`Seeded ${SEED_RESIDENTS.length} residents`);
  console.log('\nResident ID map (legacy → MongoDB):');
  for (const [k, v] of Object.entries(idMap)) console.log(`  ${k} → ${v}`);

  // ── Vitals ──
  let vCount = 0;
  for (const [legacyId, records] of Object.entries(SEED_VITALS)) {
    const resId = idMap[legacyId];
    if (!resId) continue;
    for (const v of records) {
      await Vital.create({ resident: resId, bp_s: v.bp_s, bp_d: v.bp_d, pulse: v.pulse,
        spo2: v.spo2, temp: v.temp, glucose: v.glucose, weight: v.weight,
        by: v.by, notes: v.notes, recordedAt: new Date(v.t) });
      vCount++;
    }
  }
  console.log(`Seeded ${vCount} vitals`);

  // ── EMAR ──
  let mCount = 0;
  for (const [legacyId, meds] of Object.entries(SEED_MEDS)) {
    const resId = idMap[legacyId];
    if (!resId) continue;
    for (const med of meds) {
      await EMAREntry.create({ ...med, resident: resId });
      mCount++;
    }
  }
  console.log(`Seeded ${mCount} EMAR entries`);

  // ── Labs ──
  let lCount = 0;
  for (const [legacyId, labs] of Object.entries(SEED_LABS)) {
    const resId = idMap[legacyId];
    if (!resId) continue;
    for (const lab of labs) {
      await LabResult.create({ ...lab, resident: resId, date: new Date(lab.date) });
      lCount++;
    }
  }
  console.log(`Seeded ${lCount} lab results`);

  // ── Notes ──
  let nCount = 0;
  for (const [legacyId, notes] of Object.entries(SEED_NOTES)) {
    const resId = idMap[legacyId];
    if (!resId) continue;
    for (const note of notes) {
      const { createdAt, ...rest } = note;
      const doc = await Note.create({ ...rest, resident: resId });
      // Backdate the createdAt since Mongoose sets it on insert
      await Note.findByIdAndUpdate(doc._id, { $set: { createdAt: new Date(createdAt) } });
      nCount++;
    }
  }
  console.log(`Seeded ${nCount} notes`);

  // ── Alerts ──
  for (const alert of SEED_ALERTS) {
    const { legacyRes, createdAt, ...rest } = alert;
    const resId = idMap[legacyRes];
    const doc = await Alert.create({ ...rest, resident: resId });
    await Alert.findByIdAndUpdate(doc._id, { $set: { createdAt: new Date(createdAt) } });
  }
  console.log(`Seeded ${SEED_ALERTS.length} alerts`);

  // ── Care Plan (R001 only in seed data) ──
  await CarePlan.create({ ...SEED_CAREPLAN_R001, resident: idMap['R001'] });
  console.log('Seeded 1 care plan (R001)');

  // ── Appointments ──
  let aCount = 0;
  for (const [legacyId, apts] of Object.entries(SEED_APPOINTMENTS)) {
    const resId = idMap[legacyId];
    if (!resId) continue;
    for (const apt of apts) {
      await Appointment.create({ ...apt, resident: resId });
      aCount++;
    }
  }
  console.log(`Seeded ${aCount} appointments`);

  console.log('\n✅ Seed complete.');
  console.log('\nDefault login credentials (all roles use same password):');
  console.log('  admin@carecore.in / CareCore@2026');
  console.log('  priya@carecore.in / CareCore@2026  (Doctor)');
  console.log('  sunita@carecore.in / CareCore@2026 (Caregiver)');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => { console.error('Seed failed:', err); process.exit(1); });
