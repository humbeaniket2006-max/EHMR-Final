/**
 * carecore-html-patch.js
 * ─────────────────────────────────────────────────────────────────
 * DROP THIS ENTIRE BLOCK into carecore.html immediately AFTER the
 * opening <script> tag, BEFORE any existing function definitions.
 *
 * Then replace the individual functions below where indicated.
 * Search for each function name (e.g. "async function doLogin")
 * and replace the entire function body with the version here.
 * ─────────────────────────────────────────────────────────────────
 */

// ═══════════════════════════════════════════════════════════════════
// SECTION 1 — API LAYER (paste at very top of <script>)
// ═══════════════════════════════════════════════════════════════════

const API_BASE = window.API_BASE || 'https://ehmr-final.vercel.app'; // TODO: set real URL

function getToken() { return localStorage.getItem('cc_api_token'); }

async function api(method, path, body) {
  const opts = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getToken()}`,
    },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${API_BASE}${path}`, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `API error ${res.status}`);
  return data;
}

// ═══════════════════════════════════════════════════════════════════
// SECTION 2 — REPLACE these global data declarations
//
// DELETE these lines from carecore.html:
//   const RESIDENTS = [ ... ];
//   let vitalsData = { ... };
//   let medsData = { ... };
//   let labsData = { ... };
//   let notesData = { ... };
//   let ALERTS = [ ... ];
//
// REPLACE WITH:
// ═══════════════════════════════════════════════════════════════════

let RESIDENTS = []; // populated on loadResidents()
let ALERTS    = []; // populated on loadAlerts()
// vitalsData / medsData / labsData / notesData are no longer needed —
// each load* function fetches directly from the API.

// ═══════════════════════════════════════════════════════════════════
// SECTION 3 — REPLACE individual functions
// (find each function in carecore.html and replace wholesale)
// ═══════════════════════════════════════════════════════════════════

// ── REPLACE: doLogin ──────────────────────────────────────────────
async function doLogin() {
  const email = document.getElementById('lemail').value.trim();
  const pass  = document.getElementById('lpass').value;
  const err   = document.getElementById('lerr');
  const btn   = document.getElementById('lbtn');
  if (!email || !pass) {
    err.style.display = 'block';
    err.textContent = 'Please enter email and password.';
    return;
  }
  err.style.display = 'none';
  btn.disabled = true;
  btn.innerHTML = '<span>Signing in…</span>';
  try {
    const { token, user } = await api('POST', '/api/auth/login', { email, password: pass });
    localStorage.setItem('cc_api_token', token);
    const roleMap = { doctor: 'Doctor', caregiver: 'Caregiver', nurse: 'Nurse', admin: 'Admin', resident: 'Resident', family: 'Family' };
    const appRole = roleMap[user.role] || 'Doctor';
    const cfg = ROLES[appRole] || ROLES.Doctor;
    CURRENT_USER = {
      ...cfg,
      name:     user.name,
      initials: user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
      role:     appRole,
      email,
    };
    initApp();
  } catch (e) {
    err.style.display = 'block';
    err.textContent = e.message || 'Invalid credentials.';
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<span>Sign In to CareCore</span><span>→</span>';
  }
}

// ── REPLACE: doSignup ─────────────────────────────────────────────
async function doSignup() {
  const name  = document.getElementById('sname').value.trim();
  const email = document.getElementById('semail').value.trim();
  const pass  = document.getElementById('spass').value;
  const pass2 = document.getElementById('spass2').value;
  const err   = document.getElementById('serr');
  const suc   = document.getElementById('ssuc');
  const btn   = document.getElementById('sbtn');
  err.style.display = 'none';
  suc.style.display = 'none';
  if (!name || !email || !pass || !pass2) { err.style.display = 'block'; err.textContent = 'Please fill in all fields.'; return; }
  if (pass.length < 8)  { err.style.display = 'block'; err.textContent = 'Password must be at least 8 characters.'; return; }
  if (pass !== pass2)   { err.style.display = 'block'; err.textContent = 'Passwords do not match.'; return; }
  if (!selectedRole)    { err.style.display = 'block'; err.textContent = 'Please select your role above.'; return; }
  btn.disabled = true;
  btn.innerHTML = '<span>Creating account…</span>';
  const dbMap = { Doctor: 'doctor', Caregiver: 'caregiver', Nurse: 'nurse', Admin: 'admin', Resident: 'resident', Family: 'family' };
  try {
    const { token } = await api('POST', '/api/auth/register', { name, email, password: pass, role: dbMap[selectedRole] || 'caregiver' });
    localStorage.setItem('cc_api_token', token);
    suc.style.display = 'block';
    suc.textContent = '✅ Account created! Signing you in…';
    setTimeout(() => {
      document.getElementById('lemail').value = email;
      document.getElementById('lpass').value  = pass;
      showLogin();
      doLogin();
    }, 1200);
  } catch (e) {
    err.style.display = 'block';
    err.textContent = e.message;
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<span>Create Account</span><span>→</span>';
  }
}

// ── REPLACE: loadDash (update unacked dot + resident count from live data) ──
async function loadDash() {
  try {
    // Fetch residents + alerts in parallel for dashboard
    const [residents, alerts] = await Promise.all([
      api('GET', '/api/residents'),
      api('GET', '/api/alerts'),
    ]);
    RESIDENTS = residents;
    ALERTS    = alerts;

    const ua  = alerts.filter(a => !a.acked);
    const dot = document.getElementById('tb-dot');
    if (dot) dot.style.display = ua.length ? '' : 'none';

    // Stat cards
    const statRes  = document.getElementById('stat-res');
    const statAlert= document.getElementById('stat-alert');
    if (statRes)   statRes.textContent   = residents.length;
    if (statAlert) statAlert.textContent = ua.length;

    // Recent alerts widget
    const dashAlerts = document.getElementById('dash-alerts');
    if (dashAlerts) {
      dashAlerts.innerHTML = ua.slice(0, 3).map(a => `
        <div class="alert-item sev-${a.sev}">
          <div style="flex:1">
            <div class="r-name">${a.resName} · Room ${a.room}</div>
            <div class="alert-msg">${a.msg}</div>
          </div>
          <button class="ack-btn" onclick="ackAlert('${a._id}')">Ack</button>
        </div>`).join('') || '<div style="color:var(--g400);font-size:13px;padding:12px 0">No active alerts ✓</div>';
    }

    // Resident list widget
    const dashRes = document.getElementById('dash-residents');
    if (dashRes) {
      dashRes.innerHTML = residents.slice(0, 5).map(r => `
        <div class="r-row" onclick="nav('residents');setTimeout(()=>viewRes('${r._id}'),80)">
          <div class="res-av" style="background:${r.color||'#00897B'}">${r.initials||r.name[0]}</div>
          <div style="flex:1">
            <div class="r-name">${r.name}</div>
            <div class="r-sub">Room ${r.room} · ${r.age} yrs</div>
          </div>
          ${condBadge(r.condition)}
        </div>`).join('');
    }
  } catch (e) {
    toast('Dashboard load failed: ' + e.message, 'error');
  }
}

// ── REPLACE: loadResidents ────────────────────────────────────────
async function loadResidents() {
  try {
    const url = resFilter !== 'All' ? `/api/residents?condition=${resFilter}` : '/api/residents';
    RESIDENTS = await api('GET', url);

    document.getElementById('res-count').textContent = RESIDENTS.length;
    document.getElementById('res-list').innerHTML = RESIDENTS.map(r => `
      <div class="r-row" onclick="viewRes('${r._id}')">
        <div class="res-av" style="background:${r.color||'#00897B'}">${r.initials||r.name[0]}</div>
        <div style="flex:1">
          <div class="r-name">${r.name}</div>
          <div class="r-sub">Room ${r.room} · ${r.age} yrs · ${r.blood||'—'}</div>
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px">
          ${condBadge(r.condition)}
          ${ALERTS.filter(a => !a.acked && a.resName === r.name).length
            ? '<span class="badge badge-critical">⚠ Alert</span>' : ''}
        </div>
      </div>`).join('') || '<div class="empty-state"><span class="empty-ico">👥</span><div class="empty-txt">No residents found</div></div>';
  } catch (e) {
    toast('Failed to load residents: ' + e.message, 'error');
  }
}

// ── REPLACE: viewRes ──────────────────────────────────────────────
// NOTE: Only the first line changes — r._id instead of r.id,
// and lookup uses _id. Replace the find() call:
//   OLD: const r = RESIDENTS.find(x => x.id === id);
//   NEW: const r = RESIDENTS.find(x => x._id?.toString() === id?.toString());
// The rest of the render HTML is unchanged.

// ── REPLACE: loadAlerts ───────────────────────────────────────────
async function loadAlerts() {
  try {
    ALERTS = await api('GET', '/api/alerts');
    const ua  = ALERTS.filter(a => !a.acked);
    const dot = document.getElementById('tb-dot');
    if (dot) dot.style.display = ua.length ? '' : 'none';

    document.getElementById('alerts-sub').textContent =
      `${ua.length} active · ${ALERTS.filter(a => a.acked).length} acknowledged`;

    document.getElementById('alerts-list').innerHTML = ALERTS.map(a => `
      <div class="alert-item sev-${a.sev}">
        <div style="flex:1">
          <div class="r-name">${a.resName} · Room ${a.room}</div>
          <div class="alert-msg">${a.msg}</div>
          <div class="r-sub">${fmt(a.createdAt)}</div>
        </div>
        ${!a.acked
          ? `<button class="ack-btn" onclick="ackAlert('${a._id}')">Ack</button>`
          : '<span class="badge badge-stable">✓ Acked</span>'}
      </div>`).join('') ||
      '<div class="empty-state"><span class="empty-ico">🔔</span><div class="empty-txt">No alerts</div></div>';
  } catch (e) {
    toast('Failed to load alerts: ' + e.message, 'error');
  }
}

// ── REPLACE: ackAlert ─────────────────────────────────────────────
async function ackAlert(id) {
  try {
    await api('PATCH', `/api/alerts/${id}/ack`);
    toast('Alert acknowledged');
    loadAlerts();
  } catch (e) {
    toast('Acknowledge failed: ' + e.message, 'error');
  }
}

// ── REPLACE: ackAll ───────────────────────────────────────────────
async function ackAll() {
  try {
    await api('PATCH', '/api/alerts/ack-all');
    toast('All alerts acknowledged');
    loadAlerts();
  } catch (e) {
    toast(e.message, 'error');
  }
}

// ── REPLACE: loadVitals ───────────────────────────────────────────
async function loadVitals(id) {
  selVitals = id || selVitals;
  document.getElementById('vitals-chips').innerHTML = resChipsHTML(selVitals, 'loadVitals');
  const r = RESIDENTS.find(x => x._id?.toString() === selVitals?.toString());
  try {
    const data = await api('GET', `/api/vitals/${selVitals}`);
    // Allergy banner
    const allergyEl = document.getElementById('vitals-allergy');
    if (allergyEl && r?.allergies?.length) {
      allergyEl.style.display = '';
      allergyEl.querySelector('.alert-msg').textContent =
        r.allergies.map(a => `${a.drug} (${a.severity})`).join(' · ');
    }
    // Latest row for stat cards
    const latest = data[0];
    if (latest) {
      const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val ?? '—'; };
      setEl('v-stat-bp',     latest.bp_s && latest.bp_d ? `${latest.bp_s}/${latest.bp_d}` : '—');
      setEl('v-stat-pulse',  latest.pulse);
      setEl('v-stat-spo2',   latest.spo2  != null ? latest.spo2  + '%' : '—');
      setEl('v-stat-temp',   latest.temp  != null ? latest.temp  + '°C' : '—');
      setEl('v-stat-glucose',latest.glucose != null ? latest.glucose + ' mg/dL' : '—');
      setEl('v-stat-weight', latest.weight != null ? latest.weight + ' kg' : '—');
    }
    // History list
    const listEl = document.getElementById('vitals-history');
    if (listEl) {
      listEl.innerHTML = data.map(v => `
        <div class="r-row">
          <div style="flex:1">
            <div class="r-name" style="font-size:13px">
              BP ${v.bp_s||'—'}/${v.bp_d||'—'} · Pulse ${v.pulse||'—'} · SpO₂ ${v.spo2!=null?v.spo2+'%':'—'} · Temp ${v.temp!=null?v.temp+'°C':'—'}
              ${v.glucose != null ? ` · Glucose ${v.glucose} mg/dL` : ''}
              ${v.weight  != null ? ` · ${v.weight} kg` : ''}
            </div>
            <div class="r-sub">${fmt(v.recordedAt)} · ${v.by}</div>
            ${v.notes ? `<div style="font-size:11px;color:var(--g500);margin-top:2px">${v.notes}</div>` : ''}
          </div>
        </div>`).join('') ||
        '<div class="empty-state"><span class="empty-ico">💓</span><div class="empty-txt">No vitals recorded yet</div></div>';
    }
    addAudit('VIEW', 'vitals', r?.name || selVitals);
  } catch (e) {
    toast('Failed to load vitals: ' + e.message, 'error');
  }
}

// ── REPLACE: saveVitals ───────────────────────────────────────────
async function saveVitals() {
  const bpRaw = document.getElementById('v-bp')?.value?.trim();
  const body  = {
    notes: document.getElementById('v-notes')?.value || '',
    by:    CURRENT_USER.name,
    recordedAt: new Date().toISOString(),
  };
  // Parse "120/80" BP field
  if (bpRaw && bpRaw.includes('/')) {
    const [s, d] = bpRaw.split('/');
    body.bp_s = parseFloat(s);
    body.bp_d = parseFloat(d);
  }
  ['pulse','spo2','temp','glucose','weight'].forEach(k => {
    const el = document.getElementById('v-' + k);
    if (el && el.value) body[k] = parseFloat(el.value);
  });
  if (!bpRaw && !body.pulse) {
    toast('Enter at least BP or pulse', 'error');
    return;
  }
  try {
    await api('POST', `/api/vitals/${selVitals}`, body);
    toast('Vitals saved ✓');
    ['v-bp','v-pulse','v-spo2','v-temp','v-glucose','v-weight','v-notes'].forEach(id => {
      const el = document.getElementById(id); if (el) el.value = '';
    });
    toggleForm('vitals-form');
    loadVitals(selVitals);
    addAudit('CREATE', 'vitals', `Recorded for ${RESIDENTS.find(r => r._id?.toString() === selVitals?.toString())?.name}`);
  } catch (e) {
    toast('Save failed: ' + e.message, 'error');
  }
}

// ── REPLACE: loadEmar ─────────────────────────────────────────────
async function loadEmar(id) {
  selEmar = id || selEmar;
  document.getElementById('emar-chips').innerHTML = resChipsHTML(selEmar, 'loadEmar');
  const r = RESIDENTS.find(x => x._id?.toString() === selEmar?.toString());
  try {
    const meds = await api('GET', `/api/emar/${selEmar}`);
    // Allergy banner
    const allergyEl = document.getElementById('emar-allergy');
    if (allergyEl && r?.allergies?.length) {
      allergyEl.style.display = '';
      allergyEl.querySelector('.alert-msg').textContent =
        r.allergies.map(a => `${a.drug} (${a.severity})`).join(' · ');
    }
    const listEl = document.getElementById('emar-list');
    if (!listEl) return;
    listEl.innerHTML = meds.map(med => `
      <div class="card" style="margin-bottom:12px">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px">
          <div>
            <div class="r-name">${med.name}</div>
            <div class="r-sub">${med.route||''} · ${med.freq||''} · ${med.indication||''}</div>
            ${med.prescribedBy ? `<div style="font-size:11px;color:var(--g400)">Rx: ${med.prescribedBy}</div>` : ''}
          </div>
        </div>
        <div style="border-top:1px solid var(--g100);margin-top:8px;padding-top:8px">
          ${(med.doses || []).map(d => `
            <div class="r-row" style="padding:6px 0;border-bottom:1px solid var(--g100)">
              <div style="flex:1">
                <span style="font-weight:700;font-size:13px">${d.time}</span>
                <span class="badge ${d.status==='given'?'badge-stable':d.status==='overdue'?'badge-critical':'badge-gray'}" style="margin-left:8px">${d.status}</span>
                ${d.administeredBy ? `<div style="font-size:11px;color:var(--g400);margin-top:2px">by ${d.administeredBy}</div>` : ''}
              </div>
              ${d.status === 'pending' || d.status === 'overdue'
                ? `<button class="btn btn-sm" onclick="adminMed('${med._id}','${d._id}')">Mark Given</button>`
                : ''}
            </div>`).join('')}
        </div>
      </div>`).join('') ||
      '<div class="empty-state"><span class="empty-ico">💊</span><div class="empty-txt">No medications on record</div></div>';
    addAudit('VIEW', 'emar', r?.name || selEmar);
  } catch (e) {
    toast('Failed to load EMAR: ' + e.message, 'error');
  }
}

// ── REPLACE: adminMed ─────────────────────────────────────────────
async function adminMed(medId, doseId) {
  try {
    await api('PATCH', `/api/emar/${medId}/doses/${doseId}/administer`);
    toast('Medication marked as given ✓');
    loadEmar(selEmar);
    addAudit('UPDATE', 'emar', `Dose administered`);
  } catch (e) {
    toast('Failed: ' + e.message, 'error');
  }
}

// ── REPLACE: loadNotes ────────────────────────────────────────────
async function loadNotes() {
  // Notes are per-resident; use selVitals as the active resident selector
  const resId = selVitals;
  try {
    const data = await api('GET', `/api/notes/${resId}`);
    document.getElementById('notes-list').innerHTML = data.map(n => `
      <div class="card" style="margin-bottom:12px">
        <div style="display:flex;justify-content:space-between;margin-bottom:6px">
          <span class="badge badge-teal">${n.shift||'General'} Shift</span>
          <span style="font-size:11px;color:var(--g500)">${fmt(n.createdAt)}</span>
        </div>
        <div style="font-size:14px;font-weight:700;color:var(--g800);margin-bottom:4px">${n.author} · <span style="font-weight:400;color:var(--g500)">${n.role}</span></div>
        <div style="font-size:13px;color:var(--g700);line-height:1.7">${n.note}</div>
        ${n.tasks?.length
          ? `<div class="note-tasks" style="margin-top:8px">⏰ ${n.tasks.map(t => `<span class="task-chip">${t}</span>`).join('')}</div>`
          : ''}
      </div>`).join('') ||
      '<div class="empty-state"><span class="empty-ico">📝</span><div class="empty-txt">No notes yet</div></div>';
  } catch (e) {
    toast('Failed to load notes: ' + e.message, 'error');
  }
}

// ── REPLACE: saveNote ─────────────────────────────────────────────
async function saveNote() {
  const shift = document.getElementById('note-shift')?.value;
  const text  = document.getElementById('note-text')?.value?.trim();
  const tasks = (document.getElementById('note-tasks')?.value || '')
    .split('\n')
    .map(t => t.trim())
    .filter(Boolean);
  if (!text) { toast('Note text is required', 'error'); return; }
  try {
    await api('POST', `/api/notes/${selVitals}`, {
      shift,
      note:   text,
      tasks,
      author: CURRENT_USER.name,
      role:   CURRENT_USER.role,
    });
    toast('Note saved ✓');
    document.getElementById('note-text').value  = '';
    if (document.getElementById('note-tasks')) document.getElementById('note-tasks').value = '';
    toggleForm('note-form');
    loadNotes();
    addAudit('CREATE', 'notes', `${shift} note for ${RESIDENTS.find(r => r._id?.toString() === selVitals?.toString())?.name}`);
  } catch (e) {
    toast('Save failed: ' + e.message, 'error');
  }
}

// ── REPLACE: loadLabs ─────────────────────────────────────────────
async function loadLabs(id) {
  selLabs = id || selLabs;
  document.getElementById('labs-chips').innerHTML = resChipsHTML(selLabs, 'loadLabs');
  try {
    const data = await api('GET', `/api/labs/${selLabs}`);
    const abnormal = data.filter(l => l.status !== 'normal');
    const alertEl  = document.getElementById('labs-alert');
    if (alertEl) {
      alertEl.style.display = abnormal.length ? '' : 'none';
      const msgEl = alertEl.querySelector('.alert-msg');
      if (msgEl) msgEl.textContent = abnormal.map(l => `${l.test}: ${l.result} ${l.unit}`).join(' · ');
    }
    document.getElementById('labs-list').innerHTML = data.map(l => `
      <div class="lab-row" style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--g100)">
        <span style="font-weight:700;flex:2;font-size:13px">${l.test}</span>
        <span style="flex:1;font-size:13px">${l.result} ${l.unit||''}</span>
        <span style="flex:1;font-size:11px;color:var(--g500)">${l.ref||''}</span>
        ${labBadge(l.status)}
        <span style="font-size:11px;color:var(--g400)">${fmt(l.date)}</span>
      </div>`).join('') ||
      '<div class="empty-state"><span class="empty-ico">🔬</span><div class="empty-txt">No lab results</div></div>';
    addAudit('VIEW', 'labs', RESIDENTS.find(r => r._id?.toString() === selLabs?.toString())?.name);
  } catch (e) {
    toast('Failed to load labs: ' + e.message, 'error');
  }
}

// ── REPLACE: saveLabResult ────────────────────────────────────────
async function saveLabResult() {
  const test   = document.getElementById('lab-test')?.value?.trim();
  const result = document.getElementById('lab-result')?.value?.trim();
  const unit   = document.getElementById('lab-unit')?.value?.trim()   || '';
  const ref    = document.getElementById('lab-ref')?.value?.trim()    || '';
  const status = document.getElementById('lab-status')?.value         || 'normal';
  if (!test || !result) { toast('Test name and result are required', 'error'); return; }
  try {
    await api('POST', `/api/labs/${selLabs}`, { test, result, unit, ref, status, orderedBy: CURRENT_USER.name });
    toast('Lab result saved ✓');
    ['lab-test','lab-result','lab-unit','lab-ref'].forEach(id => {
      const el = document.getElementById(id); if (el) el.value = '';
    });
    toggleForm('lab-form');
    loadLabs(selLabs);
    addAudit('CREATE', 'labs', `${test} for ${RESIDENTS.find(r => r._id?.toString() === selLabs?.toString())?.name}`);
  } catch (e) {
    toast('Save failed: ' + e.message, 'error');
  }
}

// ── REPLACE: loadTimeline ─────────────────────────────────────────
async function loadTimeline(id) {
  selTl = id || selTl;
  document.getElementById('tl-chips').innerHTML = resChipsHTML(selTl, 'loadTimeline');
  const r = RESIDENTS.find(x => x._id?.toString() === selTl?.toString());
  try {
    // Parallel fetch all event sources
    const [vitals, notes, labs] = await Promise.all([
      api('GET', `/api/vitals/${selTl}`),
      api('GET', `/api/notes/${selTl}`),
      api('GET', `/api/labs/${selTl}`),
    ]);
    const events = [];
    vitals.forEach(v => events.push({ icon: '💓', t: v.recordedAt, title: 'Vitals Recorded',            color: '#00897B', by: v.by,    body: `BP ${v.bp_s||'—'}/${v.bp_d||'—'} · Pulse ${v.pulse||'—'} · SpO₂ ${v.spo2!=null?v.spo2+'%':'—'}${v.glucose?' · Glucose '+v.glucose+' mg/dL':''}` }));
    notes.forEach(n  => events.push({ icon: n.role==='Doctor'?'👨‍⚕️':'📝', t: n.createdAt, title: `${n.role} Note — ${n.shift||''} Shift`, color: n.role==='Doctor'?'#2E7D32':'#00897B', by: n.author, body: n.note }));
    labs.forEach(l   => events.push({ icon: '🔬', t: l.date,       title: `Lab: ${l.test}`,             color: l.status==='normal'?'#2E7D32':'#E53935', by: l.orderedBy||'', body: `${l.result} ${l.unit||''} (Ref: ${l.ref||'—'}) — ${l.status}` }));
    events.sort((a, b) => new Date(b.t) - new Date(a.t));

    document.getElementById('tl-content').innerHTML = `<div class="card">
      <div class="card-hdr">
        <div class="card-ttl">📈 Clinical Timeline · ${r?.name||''}</div>
        <span style="font-size:12px;color:var(--g400)">${events.length} events</span>
      </div>
      ${events.slice(0, 20).map((e, i) => `
        <div class="tl-item">
          <div class="tl-left">
            <div class="tl-dot" style="background:${e.color}"></div>
            ${i < events.length - 1 ? '<div class="tl-line"></div>' : ''}
          </div>
          <div class="tl-card">
            <div class="tl-hdr">
              <div class="tl-icon">${e.icon}</div>
              <div><div class="tl-title">${e.title}</div><div class="tl-time">${fmt(e.t)} · ${e.by}</div></div>
            </div>
            <div class="tl-body">${e.body}</div>
          </div>
        </div>`).join('')}
      ${!events.length ? '<div class="empty-state"><span class="empty-ico">📈</span><div class="empty-txt">No events recorded</div></div>' : ''}
    </div>`;
    addAudit('VIEW', 'timeline', r?.name || selTl);
  } catch (e) {
    toast('Failed to load timeline: ' + e.message, 'error');
  }
}

// ── REPLACE: loadCarePlan ─────────────────────────────────────────
async function loadCarePlan() {
  const resId = selVitals; // or expose a dedicated selector
  try {
    const plan = await api('GET', `/api/careplans/${resId}`);
    const r    = RESIDENTS.find(x => x._id?.toString() === resId?.toString());
    if (!plan || !plan._id) {
      document.getElementById('careplan-content').innerHTML =
        '<div class="empty-state"><span class="empty-ico">🎯</span><div class="empty-txt">No care plan on file</div></div>';
      return;
    }
    document.getElementById('careplan-content').innerHTML = `
      <div class="card">
        <div class="card-ttl" style="margin-bottom:12px">🎯 Treatment Goals</div>
        ${(plan.goals || []).map(g => `
          <div class="goal-item">
            <div class="goal-check">✓</div>
            <span style="font-size:13px;color:var(--g700)">${g}</span>
          </div>`).join('')}
      </div>
      <div class="grid-2">
        <div class="card">
          <div class="card-ttl" style="margin-bottom:10px">🥗 Dietary Orders</div>
          <div style="font-size:13px;line-height:1.8;color:var(--g700)">${plan.dietary||'—'}</div>
        </div>
        <div class="card">
          <div class="card-ttl" style="margin-bottom:10px">🏃 Activity Orders</div>
          <div style="font-size:13px;line-height:1.8;color:var(--g700)">${plan.activity||'—'}</div>
        </div>
      </div>
      ${r ? `<div class="card">
        <div class="card-ttl" style="margin-bottom:12px">🏥 Diagnoses &amp; Allergies</div>
        <div style="font-size:11px;font-weight:700;color:var(--g500);text-transform:uppercase;letter-spacing:0.3px;margin-bottom:6px">Diagnoses</div>
        <div class="pill-wrap" style="margin-bottom:12px">${(r.diagnoses||[]).map(d=>`<span class="pill">${d}</span>`).join('')}</div>
        <div style="font-size:11px;font-weight:700;color:var(--g500);text-transform:uppercase;letter-spacing:0.3px;margin-bottom:6px">Allergies</div>
        <div class="pill-wrap">${(r.allergies||[]).map(a=>`<span class="pill pill-allergy">⚠ ${a.drug} (${a.severity})</span>`).join('')}</div>
      </div>` : ''}
      ${plan.nextReview ? `
      <div class="card" style="background:linear-gradient(135deg,var(--teal-d),var(--teal));color:#fff;border:none">
        <div style="font-size:12px;font-weight:700;color:rgba(255,255,255,0.7);margin-bottom:4px">NEXT REVIEW</div>
        <div style="font-size:22px;font-weight:900">📅 ${new Date(plan.nextReview).toLocaleDateString('en-IN',{day:'2-digit',month:'long',year:'numeric'})}</div>
        <div style="font-size:13px;color:rgba(255,255,255,0.75);margin-top:4px">Attending: ${plan.reviewedBy||'—'}</div>
      </div>` : ''}`;
    addAudit('VIEW', 'careplan', r?.name || resId);
  } catch (e) {
    toast('Failed to load care plan: ' + e.message, 'error');
  }
}

// ── REPLACE: loadAppts ────────────────────────────────────────────
async function loadAppts() {
  const resId = selVitals;
  try {
    const apts = await api('GET', `/api/appointments/${resId}`);
    document.getElementById('appt-content').innerHTML = `<div class="card">
      ${apts.map(a => `
        <div class="r-row">
          <div style="width:44px;height:44px;border-radius:12px;background:${a.status==='upcoming'?'var(--teal-xl)':'var(--g100)'};display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0">
            ${a.type.includes('Lab')?'🔬':a.type.includes('Physio')?'🏃':'👨‍⚕️'}
          </div>
          <div style="flex:1">
            <div style="font-size:14px;font-weight:800;color:var(--g800)">${a.type}</div>
            <div style="font-size:12px;color:var(--g500);margin-top:2px">${a.with||''} · ${new Date(a.date).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}${a.time?' at '+a.time:''}</div>
          </div>
          <span class="badge ${a.status==='upcoming'?'badge-teal':'badge-stable'}">${a.status==='upcoming'?'Upcoming':'✓ Done'}</span>
        </div>`).join('') || '<div class="empty-state"><span class="empty-ico">📅</span><div class="empty-txt">No appointments</div></div>'}
    </div>`;
  } catch (e) {
    toast('Failed to load appointments: ' + e.message, 'error');
  }
}

// ── REPLACE: resChipsHTML ─────────────────────────────────────────
// Only change: x.id → x._id
function resChipsHTML(selId, callback) {
  return RESIDENTS.map(r => `
    <div class="res-chip ${r._id?.toString()===selId?.toString()?'selected':''}" onclick="${callback}('${r._id}')">
      <div class="res-chip-av" style="background:${r.color||'#00897B'}">${r.initials||r.name[0]}</div>
      ${r.name.split(' ')[0]}
    </div>`).join('');
}

// ═══════════════════════════════════════════════════════════════════
// SECTION 4 — initApp() bootstrap change
//
// Inside initApp(), the first data fetch should now load residents
// so RESIDENTS is populated before any page renders.
// Find the line that calls loadDash() and prepend a residents fetch:
//
//   OLD: loadDash();
//   NEW: loadDash(); // loadDash() now fetches both residents + alerts
//
// No other change needed — loadDash() populates RESIDENTS and ALERTS.
// ═══════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════
// SECTION 5 — REMOVE these functions entirely (no longer needed):
//   getLocalUsers()
//   saveLocalUsers()
//   findUser()
//   registerUser()
//   getResetToken()
//   setResetToken()
//   clearResetToken()
//
// Auth is now fully server-side. The Resend password reset email
// (RESEND_API_KEY) can stay as-is — it's a separate concern and
// doesn't touch domain data.
// ═══════════════════════════════════════════════════════════════════
