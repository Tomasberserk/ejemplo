import express from 'express';
import cors from 'cors';
import { initDb } from './db.js';
import { login, authenticate } from './auth.js';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  getInstitutions,
  getUnits,
  getPeople,
  createRoom,
  createSessionDraft,
  activateSession,
  closeSession,
  reopenRoom,
  getSession,
  getSessionQrToken,
  getSessionsHistory,
  getPresent,
  getAbsent,
  getRejections,
  checkin,
  manualOverride,
  manualLateCheckin,
  getSessionReport,
  getStudentHistory,
  submitExcuse,
  getInstructorExcuses,
  resolveExcuse,
  selfRegisterCheckin,
  submitLateRequest,
  getInstructorLateRequests,
  resolveLateRequest,
  checkDocument
} from './controllers.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.resolve(__dirname, '../../app')));

// ── Health ────────────────────────────────────────────────────────────────────
app.get('/health', (req, res) => res.status(200).send('ok'));
app.get('/ready',  (req, res) => res.status(200).send('ready'));

// ── Public Auth ───────────────────────────────────────────────────────────────
app.post('/api/auth/login', login);

// ── Public Check-in endpoints ─────────────────────────────────────────────────
app.post('/attendance/checkin',                      checkin);
app.post('/public/attendance/:token/register',        checkin);
app.post('/public/attendance/:token/self-register',   selfRegisterCheckin);
app.post('/public/attendance/:token/late-request',    submitLateRequest);
app.post('/public/attendance/:token/check-document',  checkDocument);

// ── QR Student Page (multi-step: check → login/register → dashboard → late) ──
app.get('/attendance/:token', (req, res) => {
  const { token } = req.params;
  res.send(`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Asistencia SENA</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700;800&display=swap" rel="stylesheet">
  <style>
    *{box-sizing:border-box}
    body{font-family:'Outfit',sans-serif;background:radial-gradient(ellipse at top,#0b1f0d 0%,#05080a 100%);min-height:100vh;display:flex;align-items:center;justify-content:center;padding:1rem}
    .glass{background:rgba(255,255,255,0.03);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);border:1px solid rgba(57,169,0,0.15)}
    .screen{display:none}.screen.active{display:block}
    .btn-green{width:100%;background:#39A900;color:#fff;font-weight:700;padding:.9rem 1.2rem;border-radius:1rem;border:none;cursor:pointer;font-size:1rem;font-family:'Outfit',sans-serif;transition:all .2s;display:flex;align-items:center;justify-content:center;gap:.5rem}
    .btn-green:hover{background:#45c400;transform:translateY(-1px)}
    .btn-green:active{transform:scale(.97)}
    .btn-ghost{width:100%;background:transparent;color:#94a3b8;font-weight:600;padding:.75rem;border-radius:1rem;border:1px solid rgba(255,255,255,0.08);cursor:pointer;font-size:.875rem;font-family:'Outfit',sans-serif;transition:all .2s;margin-top:.5rem}
    .btn-ghost:hover{background:rgba(255,255,255,0.05);color:#e2e8f0}
    .input-field{width:100%;background:rgba(15,23,42,.6);border:1px solid rgba(100,116,139,.4);border-radius:1rem;padding:.85rem 1rem;color:#f1f5f9;font-size:.95rem;font-family:'Outfit',sans-serif;outline:none;transition:border-color .2s}
    .input-field:focus{border-color:#39A900;box-shadow:0 0 0 3px rgba(57,169,0,.15)}
    .input-label{display:block;font-size:.7rem;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.08em;margin-bottom:.4rem}
    .alert-success{background:rgba(34,197,94,.08);border:1px solid rgba(34,197,94,.2);color:#4ade80;border-radius:1rem;padding:1rem;font-size:.85rem;font-weight:600;text-align:center}
    .alert-error{background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.2);color:#f87171;border-radius:1rem;padding:1rem;font-size:.85rem;font-weight:600;text-align:center}
    .alert-warning{background:rgba(245,158,11,.08);border:1px solid rgba(245,158,11,.2);color:#fbbf24;border-radius:1rem;padding:1rem;font-size:.85rem;font-weight:600;text-align:center}
    .stat-pill{background:rgba(57,169,0,.1);border:1px solid rgba(57,169,0,.2);border-radius:.75rem;padding:.5rem 1rem;text-align:center}
    .stat-pill .val{font-size:1.4rem;font-weight:800;color:#4ade80}
    .stat-pill .lbl{font-size:.65rem;color:#64748b;text-transform:uppercase;letter-spacing:.05em}
    .spin{animation:spin 1s linear infinite}
    @keyframes spin{to{transform:rotate(360deg)}}
    .slide-in{animation:slideIn .35s ease-out}
    @keyframes slideIn{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
    .pulse-ring{animation:pulseRing 2s ease-out infinite}
    @keyframes pulseRing{0%{box-shadow:0 0 0 0 rgba(57,169,0,.4)}70%{box-shadow:0 0 0 18px rgba(57,169,0,0)}100%{box-shadow:0 0 0 0 rgba(57,169,0,0)}}
    input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none}
  </style>
</head>
<body>
<div class="w-full max-w-sm">
<div class="glass rounded-3xl p-7 shadow-2xl relative overflow-hidden slide-in">
  <!-- Decorative glows -->
  <div style="position:absolute;top:-3rem;right:-3rem;width:8rem;height:8rem;background:#39A900;opacity:.07;border-radius:50%;filter:blur(2rem);pointer-events:none"></div>
  <div style="position:absolute;bottom:-3rem;left:-3rem;width:8rem;height:8rem;background:#003049;opacity:.15;border-radius:50%;filter:blur(2rem);pointer-events:none"></div>

  <!-- SCREEN 1: Document Check -->
  <div id="screen-check" class="screen active">
    <div class="text-center mb-7 relative" style="z-index:1">
      <div style="display:inline-flex;padding:1rem;background:rgba(57,169,0,.1);border:1px solid rgba(57,169,0,.2);border-radius:1rem;margin-bottom:1rem" class="pulse-ring">
        <svg width="32" height="32" fill="none" stroke="#39A900" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
      </div>
      <h1 style="font-size:1.4rem;font-weight:800;color:#fff;margin:0">Registrar Asistencia</h1>
      <p style="color:#64748b;font-size:.85rem;margin:.3rem 0 0">SENA · Ingresa tu documento de identidad</p>
    </div>
    <div id="feedback-check" class="hidden mb-4"></div>
    <div style="position:relative;z-index:1">
      <label class="input-label">Número de Documento</label>
      <input id="inp-doc" type="number" inputmode="numeric" autocomplete="off"
        placeholder="Ej: 1077228780"
        class="input-field mb-3"
        style="text-align:center;font-size:1.2rem;font-weight:700;letter-spacing:.05em">
      
      <!-- Input code manual fallback -->
      <div id="manual-code-wrapper" class="mb-4">
        <label class="input-label">Código Manual (Si falló la cámara)</label>
        <input id="inp-manual-code" type="text" placeholder="Ej: A1B2C3" maxlength="6"
          class="input-field"
          style="text-align:center;font-size:1.1rem;font-weight:800;letter-spacing:.25em;text-transform:uppercase">
      </div>

      <button class="btn-green" id="btn-check" onclick="doCheck()">
        <span id="btn-check-text">Continuar</span>
        <svg id="btn-check-spin" class="hidden spin" width="20" height="20" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="white" stroke-width="4" opacity=".25"/><path fill="white" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z"/></svg>
      </button>
      <button class="btn-ghost" onclick="showScreen('screen-late-form','')">
        ⏰ Llegué tarde / Solicitar validación
      </button>
    </div>
    <p style="margin-top:1.5rem;text-align:center;font-size:.65rem;color:#334155;border-top:1px solid rgba(255,255,255,.05);padding-top:1rem">
      🔒 Sesión protegida por Token QR Rotativo
    </p>
  </div>

  <!-- SCREEN 2: Student Login (existing student) -->
  <div id="screen-student-login" class="screen">
    <div class="text-center mb-6" style="position:relative;z-index:1">
      <div style="display:inline-flex;padding:.85rem;background:rgba(57,169,0,.1);border:1px solid rgba(57,169,0,.2);border-radius:1rem;margin-bottom:.75rem">
        <svg width="28" height="28" fill="none" stroke="#39A900" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
      </div>
      <h2 style="font-size:1.2rem;font-weight:800;color:#fff;margin:0">Iniciar Sesión Estudiante</h2>
      <p style="color:#64748b;font-size:.8rem;margin:.25rem 0 0">Identifícate con tu contraseña para registrar asistencia.</p>
    </div>
    <div id="feedback-student-login" class="hidden mb-4"></div>
    <div style="position:relative;z-index:1;display:flex;flex-direction:column;gap:.9rem">
      <div>
        <label class="input-label">Documento</label>
        <input id="login-student-doc" type="text" readonly class="input-field" style="opacity:.6;cursor:not-allowed">
      </div>
      <div>
        <label class="input-label">Contraseña</label>
        <input id="login-student-pwd" type="password" placeholder="Ingresa tu contraseña" class="input-field">
      </div>
      <button class="btn-green" id="btn-student-login" onclick="doStudentLogin()">
        <span id="btn-student-login-text">Confirmar Asistencia</span>
        <svg id="btn-student-login-spin" class="hidden spin" width="20" height="20" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="white" stroke-width="4" opacity=".25"/><path fill="white" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z"/></svg>
      </button>
      <button class="btn-ghost" onclick="showScreen('screen-check','')">← Volver</button>
    </div>
  </div>

  <!-- SCREEN 3: Self Register (new student) -->
  <div id="screen-register" class="screen">
    <div class="text-center mb-6" style="position:relative;z-index:1">
      <div style="display:inline-flex;padding:.85rem;background:rgba(99,102,241,.1);border:1px solid rgba(99,102,241,.2);border-radius:1rem;margin-bottom:.75rem">
        <svg width="28" height="28" fill="none" stroke="#818cf8" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
      </div>
      <h2 style="font-size:1.2rem;font-weight:800;color:#fff;margin:0">Crear tu cuenta</h2>
      <p style="color:#64748b;font-size:.8rem;margin:.25rem 0 0">Eres nuevo en el sistema. Completa tus datos.</p>
    </div>
    <div id="feedback-register" class="hidden mb-4"></div>
    <div style="position:relative;z-index:1;display:flex;flex-direction:column;gap:.9rem">
      <div>
        <label class="input-label">Documento</label>
        <input id="reg-doc" type="text" readonly class="input-field" style="opacity:.6;cursor:not-allowed">
      </div>
      <div>
        <label class="input-label">Nombre completo</label>
        <input id="reg-nombre" type="text" placeholder="Tu nombre completo" class="input-field" autocomplete="name">
      </div>
      <div>
        <label class="input-label">Crear Contraseña</label>
        <input id="reg-pwd" type="password" placeholder="Mínimo 6 caracteres" class="input-field">
      </div>
      <button class="btn-green" id="btn-register" onclick="doRegister()">
        <span id="btn-reg-text">Registrarme y Marcar Asistencia</span>
        <svg id="btn-reg-spin" class="hidden spin" width="20" height="20" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="white" stroke-width="4" opacity=".25"/><path fill="white" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z"/></svg>
      </button>
      <button class="btn-ghost" onclick="showScreen('screen-check','')">← Volver</button>
    </div>
  </div>

  <!-- SCREEN 4: Dashboard (success) -->
  <div id="screen-dashboard" class="screen">
    <div class="text-center mb-6" style="position:relative;z-index:1">
      <div id="dash-icon" style="font-size:3rem;margin-bottom:.5rem">✅</div>
      <h2 id="dash-title" style="font-size:1.3rem;font-weight:800;color:#fff;margin:0">¡Asistencia Registrada!</h2>
      <p id="dash-subtitle" style="color:#64748b;font-size:.82rem;margin:.3rem 0 0"></p>
    </div>
    <div style="position:relative;z-index:1">
      <!-- Student info card -->
      <div style="background:rgba(57,169,0,.06);border:1px solid rgba(57,169,0,.15);border-radius:1.2rem;padding:1.2rem;margin-bottom:1rem">
        <p id="dash-nombre" style="font-size:1.1rem;font-weight:700;color:#fff;margin:0 0 .2rem"></p>
        <p id="dash-doc" style="font-size:.8rem;color:#64748b;margin:0 0 .6rem"></p>
        <p id="dash-ficha" style="font-size:.75rem;color:#94a3b8;margin:0"></p>
      </div>
      <!-- Stats row -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:.6rem;margin-bottom:1rem">
        <div class="stat-pill">
          <div class="val" id="dash-horas">—</div>
          <div class="lbl">Horas válidas</div>
        </div>
        <div class="stat-pill">
          <div class="val" id="dash-hora-ingreso" style="font-size:1rem">—</div>
          <div class="lbl">Hora ingreso</div>
        </div>
      </div>
      <div id="dash-late-alert" class="hidden alert-warning mb-3"></div>
      <div id="dash-new-badge" class="hidden mb-3" style="background:rgba(99,102,241,.1);border:1px solid rgba(99,102,241,.2);border-radius:.75rem;padding:.6rem;text-align:center;font-size:.8rem;color:#a5b4fc">
        🎉 ¡Bienvenido(a) al sistema! Tu cuenta ha sido creada.
      </div>
      <button class="btn-green" onclick="showScreen('screen-check','')">Listo ✓</button>
    </div>
  </div>

  <!-- SCREEN 5: Late Request -->
  <div id="screen-late-form" class="screen">
    <div class="text-center mb-6" style="position:relative;z-index:1">
      <div style="display:inline-flex;padding:.85rem;background:rgba(245,158,11,.1);border:1px solid rgba(245,158,11,.2);border-radius:1rem;margin-bottom:.75rem">
        <svg width="28" height="28" fill="none" stroke="#fbbf24" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
      </div>
      <h2 style="font-size:1.2rem;font-weight:800;color:#fff;margin:0">Solicitar Validación Tardía</h2>
      <p style="color:#64748b;font-size:.8rem;margin:.25rem 0 0">El instructor revisará tu solicitud y descontará el tiempo.</p>
    </div>
    <div id="feedback-late" class="hidden mb-4"></div>
    <div style="position:relative;z-index:1;display:flex;flex-direction:column;gap:.9rem">
      <div>
        <label class="input-label">Documento</label>
        <input id="late-doc" type="number" inputmode="numeric" placeholder="Tu número de documento" class="input-field">
      </div>
      <div>
        <label class="input-label">Nombre completo</label>
        <input id="late-nombre" type="text" placeholder="Tu nombre completo" class="input-field">
      </div>
      <div>
        <label class="input-label">Motivo (opcional)</label>
        <textarea id="late-justif" placeholder="Ej: Tráfico, cita médica..." class="input-field" style="min-height:4rem;resize:none"></textarea>
      </div>
      <div class="alert-warning" style="font-size:.78rem">
        ⚠️ El instructor descontará las horas correspondientes según el tiempo de llegada.
      </div>
      <button class="btn-green" id="btn-late" onclick="doLateRequest()">
        <span id="btn-late-text">Enviar Solicitud</span>
        <svg id="btn-late-spin" class="hidden spin" width="20" height="20" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="white" stroke-width="4" opacity=".25"/><path fill="white" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z"/></svg>
      </button>
      <button class="btn-ghost" onclick="showScreen('screen-check','')">← Volver</button>
    </div>
  </div>

</div><!-- /glass -->
</div><!-- /wrapper -->

<script>
  let activeToken = TOKEN;

  // Show/hide manual code field dynamically
  document.addEventListener('DOMContentLoaded', () => {
    if (TOKEN === 'manual' || TOKEN === '') {
      document.getElementById('manual-code-wrapper').classList.remove('hidden');
    }
  });

  function showScreen(id, feedbackMsg, feedbackType) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    if (feedbackMsg) {
      const screenName = id.replace('screen-','').replace('-form','');
      const fb = document.getElementById('feedback-' + screenName);
      if (fb) showFeedback(fb, feedbackMsg, feedbackType || 'error');
    }
  }

  function showFeedback(el, msg, type) {
    el.textContent = msg;
    el.className = type === 'success' ? 'alert-success mb-4' : (type === 'warning' ? 'alert-warning mb-4' : 'alert-error mb-4');
    el.classList.remove('hidden');
  }

  function setLoading(btnId, spinId, textId, loading, label) {
    document.getElementById(btnId).disabled = loading;
    document.getElementById(spinId).classList.toggle('hidden', !loading);
    if (label) document.getElementById(textId).textContent = loading ? 'Procesando...' : label;
  }

  // ── STEP 1: Check document ────────────────────────────────────────────────
  async function doCheck() {
    const doc = document.getElementById('inp-doc').value.trim();
    const manualVal = document.getElementById('inp-manual-code').value.trim();

    if (!doc) return;

    // Determine active token to use
    if (manualVal) {
      if (manualVal.length !== 6) {
        showFeedback(document.getElementById('feedback-check'), '❌ El código manual debe tener exactamente 6 caracteres.', 'error');
        return;
      }
      activeToken = manualVal;
    } else if (TOKEN === 'manual' || TOKEN === '') {
      showFeedback(document.getElementById('feedback-check'), '❌ Por favor ingresa el código manual del instructor.', 'error');
      return;
    } else {
      activeToken = TOKEN;
    }

    setLoading('btn-check','btn-check-spin','btn-check-text', true, 'Continuar');
    document.getElementById('feedback-check').className = 'hidden mb-4';

    try {
      const res = await fetch('/public/attendance/' + activeToken + '/check-document', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ documento: doc })
      });
      const result = await res.json();

      if (res.ok) {
        if (result.data.exists) {
          // Student exists → Show login screen
          document.getElementById('login-student-doc').value = doc;
          document.getElementById('login-student-pwd').value = '';
          document.getElementById('feedback-student-login').className = 'hidden mb-4';
          showScreen('screen-student-login', '');
        } else {
          // New student → Show registration screen
          document.getElementById('reg-doc').value = doc;
          document.getElementById('reg-nombre').value = '';
          document.getElementById('reg-pwd').value = '';
          document.getElementById('feedback-register').className = 'hidden mb-4';
          showScreen('screen-register', '');
        }
      } else {
        if (['ROOM_EXPIRED','SESSION_CLOSED','SESSION_NOT_FOUND'].includes(result.error?.code)) {
          document.getElementById('late-doc').value = doc;
          showScreen('screen-late-form', '⏰ ' + result.error.message, 'warning');
        } else {
          showFeedback(document.getElementById('feedback-check'), '❌ ' + (result.error?.message || 'Error'), 'error');
        }
      }
    } catch(e) {
      showFeedback(document.getElementById('feedback-check'), '❌ Error de conexión con el servidor.', 'error');
    } finally {
      setLoading('btn-check','btn-check-spin','btn-check-text', false, 'Continuar');
    }
  }

  // ── STEP 2: Student Login (existing student check-in) ──────────────────────
  async function doStudentLogin() {
    const doc  = document.getElementById('login-student-doc').value.trim();
    const pwd  = document.getElementById('login-student-pwd').value;
    const fb   = document.getElementById('feedback-student-login');

    if (!pwd) { showFeedback(fb, '❌ La contraseña es requerida.', 'error'); return; }

    setLoading('btn-student-login','btn-student-login-spin','btn-student-login-text', true, 'Confirmar Asistencia');
    fb.className = 'hidden mb-4';

    try {
      const res = await fetch('/public/attendance/' + activeToken + '/register', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ documento: doc, password: pwd })
      });
      const result = await res.json();

      if (res.ok) {
        showDashboard(result.data);
      } else {
        showFeedback(fb, '❌ ' + (result.error?.message || 'Error al autenticar.'), 'error');
      }
    } catch(e) {
      showFeedback(fb, '❌ Error de conexión.', 'error');
    } finally {
      setLoading('btn-student-login','btn-student-login-spin','btn-student-login-text', false, 'Confirmar Asistencia');
    }
  }

  // ── STEP 3: Self Register (new student check-in) ──────────────────────────
  async function doRegister() {
    const doc    = document.getElementById('reg-doc').value.trim();
    const nombre = document.getElementById('reg-nombre').value.trim();
    const pwd    = document.getElementById('reg-pwd').value;
    const fb     = document.getElementById('feedback-register');

    if (!nombre) { showFeedback(fb, '❌ El nombre es requerido.', 'error'); return; }
    if (!pwd || pwd.length < 6) { showFeedback(fb, '❌ La contraseña debe tener mínimo 6 caracteres.', 'error'); return; }

    setLoading('btn-register','btn-reg-spin','btn-reg-text', true, 'Registrarme y Marcar Asistencia');
    fb.className = 'hidden mb-4';

    try {
      const res = await fetch('/public/attendance/' + activeToken + '/self-register', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ documento: doc, nombre, password: pwd })
      });
      const result = await res.json();

      if (res.ok || res.status === 201) {
        showDashboard({ ...result.data, isNewStudent: true });
      } else {
        showFeedback(fb, '❌ ' + (result.error?.message || 'Error al registrar.'), 'error');
      }
    } catch(e) {
      showFeedback(fb, '❌ Error de conexión.', 'error');
    } finally {
      setLoading('btn-register','btn-reg-spin','btn-reg-text', false, 'Registrarme y Marcar Asistencia');
    }
  }

  // ── Dashboard renderer ────────────────────────────────────────────────────
  function showDashboard(data) {
    const isParcial = data.status === 'ASISTENCIA_PARCIAL';
    const isAlready = data.alreadyRegistered;
    const isNew     = data.isNewStudent;

    document.getElementById('dash-icon').textContent     = isParcial ? '⏱️' : '✅';
    document.getElementById('dash-title').textContent    = isAlready ? '¡Ya estás registrado!' : '¡Asistencia Confirmada!';
    document.getElementById('dash-subtitle').textContent = isParcial ? 'Llegaste tarde. Se descontaron horas.' : 'Tu asistencia fue marcada exitosamente.';
    document.getElementById('dash-nombre').textContent   = data.nombre || '—';
    document.getElementById('dash-doc').textContent      = 'Doc: ' + (data.documento || '');
    document.getElementById('dash-ficha').textContent    = data.ficha ? '📚 ' + data.ficha : '';
    document.getElementById('dash-horas').textContent    = (data.horas_validadas_asistencia ?? '6') + ' / 6h';
    document.getElementById('dash-hora-ingreso').textContent = data.hora_ingreso_real || '—';

    const lateAlert = document.getElementById('dash-late-alert');
    if (isParcial && data.horas_inasistencia_acumulada > 0) {
      lateAlert.textContent = '⏰ Se registraron ' + data.horas_inasistencia_acumulada + 'h de inasistencia por llegada tarde.';
      lateAlert.classList.remove('hidden');
    } else {
      lateAlert.classList.add('hidden');
    }

    const newBadge = document.getElementById('dash-new-badge');
    if (isNew) newBadge.classList.remove('hidden');
    else newBadge.classList.add('hidden');

    showScreen('screen-dashboard', '');
  }

  // ── STEP 5: Late Request ──────────────────────────────────────────────────
  async function doLateRequest() {
    const doc     = document.getElementById('late-doc').value.trim();
    const nombre  = document.getElementById('late-nombre').value.trim();
    const justif  = document.getElementById('late-justif').value.trim();
    const fb      = document.getElementById('feedback-late');

    if (!doc || !nombre) { showFeedback(fb, '❌ Documento y nombre son requeridos.', 'error'); return; }

    setLoading('btn-late','btn-late-spin','btn-late-text', true, 'Enviar Solicitud');
    fb.className = 'hidden mb-4';

    try {
      const res = await fetch('/public/attendance/' + TOKEN + '/late-request', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ documento: doc, nombre, justification: justif })
      });
      const result = await res.json();

      if (res.ok || res.status === 201) {
        showFeedback(fb,
          '✅ Solicitud enviada. El instructor la revisará y validará tu asistencia con el descuento correspondiente.',
          'success');
        document.getElementById('late-doc').value = '';
        document.getElementById('late-nombre').value = '';
        document.getElementById('late-justif').value = '';
      } else {
        showFeedback(fb, '❌ ' + (result.error?.message || 'Error al enviar solicitud.'), 'error');
      }
    } catch(e) {
      showFeedback(fb, '❌ Error de conexión.', 'error');
    } finally {
      setLoading('btn-late','btn-late-spin','btn-late-text', false, 'Enviar Solicitud');
    }
  }

  // Enter key support
  document.addEventListener('keydown', e => {
    if (e.key !== 'Enter') return;
    const active = document.querySelector('.screen.active');
    if (!active) return;
    if (active.id === 'screen-check') doCheck();
    if (active.id === 'screen-student-login') doStudentLogin();
    if (active.id === 'screen-register') doRegister();
    if (active.id === 'screen-late-form') doLateRequest();
  });
</script>
</body>
</html>`);
});
// ── Protected routes (Instructor catalog & control) ───────────────────────────
app.get('/api/institutions',                           authenticate, getInstitutions);
app.get('/api/institutions/:institutionId/units',      authenticate, getUnits);
app.get('/api/units/:unitId/people',                   authenticate, getPeople);

app.post('/api/sessions',                              authenticate, createSessionDraft);
app.post('/api/sessions/:sessionId/activate',          authenticate, activateSession);
app.post('/api/sessions/:sessionId/close',             authenticate, closeSession);
app.get('/api/sessions/:sessionId',                    authenticate, getSession);
app.get('/api/sessions/:sessionId/qr-token',           authenticate, getSessionQrToken);
app.get('/api/sessions',                               authenticate, getSessionsHistory);

app.get('/api/sessions/:sessionId/present',            authenticate, getPresent);
app.get('/api/sessions/:sessionId/absent',             authenticate, getAbsent);
app.get('/api/sessions/:sessionId/rejections',         authenticate, getRejections);

// Room & Manual Override
app.post('/room/create',                               createRoom);
app.post('/room/reopen',                               reopenRoom);
app.post('/attendance/manual-override',                authenticate, manualOverride);
app.post('/attendance/manual-checkin',                 authenticate, manualLateCheckin);
app.get('/reports/session/:sessionId',                 authenticate, getSessionReport);

// Student Portal
app.get('/api/student/history',                        authenticate, getStudentHistory);
app.post('/api/student/excuses',                       authenticate, submitExcuse);

// Instructor Excuses
app.get('/api/instructor/excuses',                     authenticate, getInstructorExcuses);
app.post('/api/instructor/excuses/:id/resolve',        authenticate, resolveExcuse);

// Instructor Late Requests
app.get('/api/instructor/late-requests',               authenticate, getInstructorLateRequests);
app.post('/api/instructor/late-requests/:id/resolve',  authenticate, resolveLateRequest);

// ── Error Handling ────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err);
  res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Ocurrió un error inesperado en el servidor.' } });
});

// ── Start ─────────────────────────────────────────────────────────────────────
await initDb();

if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`Backend server running at http://localhost:${PORT}`);
  });
}

export default app;
