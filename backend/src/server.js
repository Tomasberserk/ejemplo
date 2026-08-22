process.env.TZ = 'America/Bogota';
import express from 'express';
import cors from 'cors';
import { initDb } from './db.js';
import { login, studentLogin, authenticate, requireRole, changePassword } from './auth.js';
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
  checkDocument,
  getCoordInstructors,
  createInstructor,
  updateInstructor,
  getCoordFichas,
  createFicha,
  updateFicha,
  studentLateCheckin,
  submitSessionEvidence,
  getCoordEvidences,
  deleteStudentAccount,
  acceptStudentTerms,
  getPendingBiometrics,
  resolveBiometricException
} from './controllers.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.resolve(__dirname, '../../frontend')));

// ── Health ────────────────────────────────────────────────────────────────────
app.get('/health', (req, res) => res.status(200).send('ok'));
app.get('/ready',  (req, res) => res.status(200).send('ready'));

// ── Public Auth ───────────────────────────────────────────────────────────────
app.post('/api/auth/login', login);
app.post('/public/student/login', studentLogin);
app.post('/api/auth/change-password', authenticate, changePassword);

// ── Public Check-in endpoints ─────────────────────────────────────────────────
app.post('/attendance/checkin',                      checkin);
app.post('/public/attendance/:token/register',        checkin);
app.post('/public/attendance/:token/self-register',   selfRegisterCheckin);
app.post('/public/attendance/:token/late-request',    submitLateRequest);
app.post('/public/attendance/:token/check-document',  checkDocument);
app.post('/public/attendance/:token/late-checkin',     studentLateCheckin);

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
  <script src="https://cdn.jsdelivr.net/npm/@vladmandic/face-api/dist/face-api.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/html5-qrcode@2.3.8/html5-qrcode.min.js"></script>
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
<div class="w-full max-w-md">
<div class="glass rounded-3xl p-7 shadow-2xl relative overflow-hidden slide-in">
  <!-- Decorative glows -->
  <div style="position:absolute;top:-3rem;right:-3rem;width:8rem;height:8rem;background:#39A900;opacity:.07;border-radius:50%;filter:blur(2rem);pointer-events:none"></div>
  <div style="position:absolute;bottom:-3rem;left:-3rem;width:8rem;height:8rem;background:#003049;opacity:.15;border-radius:50%;filter:blur(2rem);pointer-events:none"></div>

  <!-- SCREEN 1: Persistent Portal Login -->
  <div id="screen-check" class="screen active">
    <div class="text-center mb-7 relative" style="z-index:1">
      <div style="display:inline-flex;padding:1rem;background:rgba(57,169,0,.1);border:1px solid rgba(57,169,0,.2);border-radius:1rem;margin-bottom:1rem" class="pulse-ring">
        <svg width="32" height="32" fill="none" stroke="#39A900" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
      </div>
      <h1 style="font-size:1.4rem;font-weight:800;color:#fff;margin:0">Portal de Asistencia Aprendices</h1>
      <p style="color:#64748b;font-size:.85rem;margin:.3rem 0 0">Identifícate para registrar firmas, ver tu historial o justificar faltas</p>
    </div>
    <div id="feedback-check" class="hidden mb-4"></div>
    <div style="position:relative;z-index:1;display:flex;flex-direction:column;gap:.9rem">
      <div>
        <label class="input-label">Número de Documento</label>
        <input id="inp-doc" type="number" inputmode="numeric" placeholder="Ej: 1077228780" class="input-field" style="text-align:center;font-size:1.1rem;font-weight:700">
      </div>
      <div>
        <label class="input-label">Contraseña</label>
        <div style="position:relative;display:flex;align-items:center">
          <input id="inp-pwd" type="password" placeholder="Ingresa tu contraseña" class="input-field" style="text-align:center;font-size:1.1rem;padding-right:2.8rem">
          <button type="button" onclick="toggleStudentPwd('inp-pwd', 'eye-check-open', 'eye-check-closed')" style="position:absolute;right:.75rem;background:transparent;border:none;color:#94a3b8;cursor:pointer;display:flex;align-items:center;padding:.2rem" title="Ver/Ocultar contraseña">
            <svg id="eye-check-open" width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
            <svg id="eye-check-closed" class="hidden" width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"/></svg>
          </button>
        </div>
      </div>

      <button class="btn-green" id="btn-check" onclick="doCheck()">
        <span id="btn-check-text">Iniciar Sesión</span>
        <svg id="btn-check-spin" class="hidden spin" width="20" height="20" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="white" stroke-width="4" opacity=".25"/><path fill="white" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z"/></svg>
      </button>

      <!-- Explicit register button -->
      <button class="btn-ghost" onclick="showScreen('screen-register', ''); document.getElementById('reg-doc').value = document.getElementById('inp-doc').value; document.getElementById('reg-nombre').value = ''; document.getElementById('reg-pwd').value = '';" style="border-color:#39A900;color:#39A900;margin-top:.25rem">
        🆕 ¿Primera vez? Auto-registro Aprendiz
      </button>
      
      <button class="btn-ghost" onclick="showScreen('screen-late-form','')" style="margin-top:0">
        ⏰ Solicitar Registro Tardío (Excepción)
      </button>
    </div>
    <p style="margin-top:1.5rem;text-align:center;font-size:.65rem;color:#334155;border-top:1px solid rgba(255,255,255,.05);padding-top:1rem">
      🔒 Sistema protegido de acuerdo a la Ley 1581 Habeas Data
    </p>
  </div>

  <!-- SCREEN 2: Student Login (existing student) -->


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
        <input id="reg-doc" type="number" inputmode="numeric" placeholder="Ingresa tu documento" class="input-field">
      </div>
      <div>
        <label class="input-label">Nombre completo</label>
        <input id="reg-nombre" type="text" placeholder="Tu nombre completo" class="input-field" autocomplete="name">
      </div>
      <div>
        <label class="input-label">Crear Contraseña</label>
        <div style="position:relative;display:flex;align-items:center">
          <input id="reg-pwd" type="password" placeholder="Mínimo 6 caracteres" class="input-field" style="padding-right:2.8rem">
          <button type="button" onclick="toggleStudentPwd('reg-pwd', 'eye-reg-open', 'eye-reg-closed')" style="position:absolute;right:.75rem;background:transparent;border:none;color:#94a3b8;cursor:pointer;display:flex;align-items:center;padding:.2rem" title="Ver/Ocultar contraseña">
            <svg id="eye-reg-open" width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
            <svg id="eye-reg-closed" class="hidden" width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"/></svg>
          </button>
        </div>
      </div>

      <!-- Enrolamiento Biométrico Facial (Selfie de Registro) -->
      <div style="background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.05);border-radius:1rem;padding:.75rem;display:flex;flex-direction:column;align-items:center;gap:.5rem">
        <label class="input-label" style="align-self:flex-start;margin:0">Enrolamiento Facial Obligatorio</label>
        
        <div style="position:relative;width:120px;height:120px;background:#1e293b;border-radius:50%;overflow:hidden;border:2px solid #39A900;display:flex;align-items:center;justify-content:center">
          <!-- Video element for live feed -->
          <video id="reg-video" autoplay playsinline style="width:100%;height:100%;object-fit:cover;transform:scaleX(-1)" class="hidden"></video>
          <!-- Canvas for capturing frame -->
          <canvas id="reg-canvas" class="hidden" width="320" height="320"></canvas>
          <!-- Image preview for captured state -->
          <img id="reg-photo-preview" src="" style="width:100%;height:100%;object-fit:cover" class="hidden">
          <!-- Placeholder SVG when camera is off -->
          <svg id="reg-photo-placeholder" width="40" height="40" fill="none" stroke="#64748b" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
        </div>

        <button type="button" id="btn-reg-camera-toggle" onclick="toggleRegCamera()" style="font-size:.7rem;padding:.4rem .75rem;background:#334155;color:#fff;border:none;border-radius:.5rem;cursor:pointer;font-weight:600">
          Iniciar Cámara Frontal
        </button>
        <button type="button" id="btn-reg-capture" onclick="captureRegPhoto()" class="hidden" style="font-size:.7rem;padding:.4rem .75rem;background:#39A900;color:#fff;border:none;border-radius:.5rem;cursor:pointer;font-weight:600">
          Tomar Foto
        </button>
        <input type="hidden" id="reg-photo-data">
      </div>
      
      <!-- Checkbox Ley 1581 Habeas Data -->
      <div style="display:flex;align-items:flex-start;gap:.5rem;margin-top:.25rem;text-align:left">
        <input id="reg-accept-terms" type="checkbox" style="width:1.15rem;height:1.15rem;accent-color:#39A900;margin-top:.15rem;cursor:pointer">
        <label for="reg-accept-terms" style="font-size:.7rem;color:#94a3b8;line-height:1.2;cursor:pointer">
          Acepto la <span style="color:#39A900;text-decoration:underline" onclick="toggleTermsModal(true)">Política de Tratamiento de Datos Personales (Ley 1581 de 2012) y los Términos y Condiciones</span>.
        </label>
      </div>

      <button class="btn-green" id="btn-register" onclick="doRegister()">
        <span id="btn-reg-text">Registrarme y Marcar Asistencia</span>
        <svg id="btn-reg-spin" class="hidden spin" width="20" height="20" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="white" stroke-width="4" opacity=".25"/><path fill="white" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z"/></svg>
      </button>
      <button class="btn-ghost" onclick="showScreen('screen-check','')">← Volver</button>
    </div>
  </div>

  <!-- TERMS AND CONDITIONS MODAL -->
  <div id="terms-modal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.85);z-index:999;align-items:center;justify-content:center;padding:1.25rem;backdrop-filter:blur(4px)">
    <div class="glass" style="max-width:450px;width:100%;margin:auto;max-height:80vh;overflow-y:auto;border-radius:1.5rem;padding:1.5rem;display:flex;flex-direction:column;gap:1rem;color:#cbd5e1">
      <h3 style="font-size:1.1rem;font-weight:800;color:#fff;border-b:1px solid rgba(255,255,255,.05);padding-bottom:.5rem">Tratamiento de Datos Personales SENA</h3>
      <div style="font-size:.75rem;line-height:1.5;display:flex;flex-direction:column;gap:.75rem;max-height:50vh;overflow-y:auto;padding-right:.5rem;text-align:justify">
        <p>De conformidad con la <strong>Ley 1581 de 2012</strong> (Habeas Data) y el Decreto 1377 de 2013, el SENA recolectará y tratará sus datos personales (Nombre completo, Documento de identidad, Ficha académica, Registro de ingreso/salida y Registro fotográfico de validación) con la única finalidad de verificar, auditar y certificar su asistencia a las sesiones de formación académica.</p>
        <p><strong>Uso de Biometría:</strong> El registro fotográfico capturado tiene carácter de dato sensible biométrico y su uso exclusivo es la validación facial automática para evitar la suplantación de identidad entre aprendices. No se compartirá con terceros ni se utilizará para fines comerciales.</p>
        <p><strong>Tiempos de Conservación:</strong> Los registros se conservarán por un período máximo de dos (2) años o hasta la finalización del programa y su respectiva certificación, momento en el cual los datos serán eliminados o anonimizados de forma definitiva.</p>
        <p><strong>Derechos del Titular:</strong> Como titular, usted tiene derecho a conocer, actualizar y suprimir sus datos en cualquier momento. Puede ejercer su derecho a la supresión eliminando de forma directa su cuenta desde la sección "Mi Cuenta" de su portal de aprendiz.</p>
      </div>
      <button class="btn-green" onclick="acceptTermsAndClose()" style="padding:.65rem;font-size:.8rem">Entendido y Cerrar</button>
    </div>
  </div>

  <!-- SCREEN 4: Permanent Student Dashboard -->
  <div id="screen-dashboard" class="screen">
    <!-- Header with user profile and log-out -->
    <div style="display:flex;align-items:center;justify-content:between;border-b:1px solid rgba(255,255,255,.05);padding-bottom:.75rem;margin-bottom:1rem;position:relative;z-index:1">
      <div>
        <span style="font-size:.65rem;color:#64748b;font-weight:700;text-transform:uppercase;letter-spacing:.05em">Portal del Aprendiz</span>
        <h2 id="dash-nombre" style="font-size:1rem;font-weight:800;color:#fff;margin:0">Tomás Berserk</h2>
      </div>
      <button onclick="doStudentLogout()" style="background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.2);color:#f87171;font-size:.65rem;font-weight:700;padding:.4rem .75rem;border-radius:.5rem;cursor:pointer">
        Salir 
      </button>
    </div>

    <!-- Persistent navigation tabs -->
    <div style="display:grid;grid-template-columns:1fr 1.2fr 1fr;gap:.25rem;background:rgba(15,23,42,.6);border:1px solid rgba(255,255,255,.05);border-radius:.75rem;padding:.2rem;margin-bottom:1rem;position:relative;z-index:1">
      <button id="tab-student-asis" onclick="switchStudentTab('asis')" style="font-size:.7rem;font-weight:700;padding:.5rem;border:none;border-radius:.5rem;background:#39A900;color:#fff;cursor:pointer;transition:all .2s">Asistencia</button>
      <button id="tab-student-hist" onclick="switchStudentTab('hist')" style="font-size:.7rem;font-weight:700;padding:.5rem;border:none;border-radius:.5rem;background:transparent;color:#94a3b8;cursor:pointer;transition:all .2s">Mi Historial</button>
      <button id="tab-student-acct" onclick="switchStudentTab('acct')" style="font-size:.7rem;font-weight:700;padding:.5rem;border:none;border-radius:.5rem;background:transparent;color:#94a3b8;cursor:pointer;transition:all .2s">Mi Cuenta</button>
    </div>

    <div id="feedback-dashboard" class="hidden mb-4"></div>

    <!-- SUB-TAB 1: ASISTENCIA (Check-in camera & manual code) -->
    <div id="student-view-asis" class="student-tab-content" style="position:relative;z-index:1">
      <!-- Active Class Status Banner -->
      <div style="background:rgba(57,169,0,.04);border:1px solid rgba(57,169,0,.15);border-radius:1rem;padding:.75rem;margin-bottom:1rem;font-size:.75rem;line-height:1.4">
        <p style="margin:0 0 .25rem;font-weight:700;color:#4ade80">🟢 Sesión Activa Disponible</p>
        <p id="dash-ficha" style="margin:0;color:#94a3b8"></p>
        <p id="dash-hora-ingreso" style="margin:0;color:#94a3b8"></p>
      </div>

      <!-- Biometric Verification Area (face-api.js) -->
      <div style="background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.05);border-radius:1rem;padding:.75rem;margin-bottom:1rem;display:flex;flex-direction:column;align-items:center;gap:.5rem">
        <span style="font-size:.75rem;font-weight:700;color:#fff;align-self:flex-start">Verificación Facial de Identidad (IA)</span>
        
        <div style="position:relative;width:130px;height:130px;background:#1e293b;border-radius:50%;overflow:hidden;border:2px solid #39A900;display:flex;align-items:center;justify-center">
          <video id="asis-video" autoplay playsinline style="width:100%;height:100%;object-fit:cover;transform:scaleX(-1)"></video>
          <canvas id="asis-canvas" class="hidden" width="320" height="320"></canvas>
          <img id="asis-photo-preview" src="" style="width:100%;height:100%;object-fit:cover" class="hidden">
        </div>
        <div id="biometric-status" style="font-size:.65rem;color:#94a3b8;font-weight:600;text-align:center;min-height:1rem">
          Iniciando cámara frontal...
        </div>
      </div>

      <div style="display:flex;flex-direction:column;gap:.75rem">
        <div>
          <label class="input-label">Código QR de la Pantalla del Instructor</label>
          <div style="position:relative;display:flex;align-items:center">
            <input id="asis-token-input" type="text" placeholder="Escanea el QR o escribe el código" class="input-field" style="text-align:center;font-weight:700;letter-spacing:.05em;padding-right:3rem">
            <button type="button" onclick="openQrScannerModal()" style="position:absolute;right:.5rem;background:rgba(57,169,0,.15);border:none;border-radius:.6rem;width:2.2rem;height:2.2rem;display:flex;align-items:center;justify-content:center;cursor:pointer;color:#4ade80;transition:background .2s" title="Escanear QR con cámara trasera">
              <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </div>
        
        <button class="btn-green" id="btn-submit-asis" onclick="doSubmitAttendance()" disabled style="opacity:.6;cursor:not-allowed">
          <span id="btn-submit-asis-text">Esperando validación facial...</span>
          <svg id="btn-submit-asis-spin" class="hidden spin" width="20" height="20" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="white" stroke-width="4" opacity=".25"/><path fill="white" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z"/></svg>
        </button>
      </div>
    </div>

    <!-- SUB-TAB 2: HISTORIAL & SOPORTES (Excusas) -->
    <div id="student-view-hist" class="student-tab-content hidden" style="position:relative;z-index:1">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:.5rem;margin-bottom:1rem">
        <div class="stat-pill">
          <div class="val" id="dash-horas">0h</div>
          <div class="lbl">Asistidas</div>
        </div>
        <div class="stat-pill" style="border-color:rgba(239,68,68,.2);background:rgba(239,68,68,.05)">
          <div class="val" id="dash-fallas" style="color:#f87171">0</div>
          <div class="lbl" style="color:#f87171">Fallas</div>
        </div>
      </div>

      <h4 style="font-size:.8rem;font-weight:700;color:#fff;margin:0 0 .5rem">Historial de Clases</h4>
      <div style="max-height:220px;overflow-y:auto;border:1px solid rgba(255,255,255,.05);border-radius:.75rem;background:rgba(15,23,42,.4)">
        <table style="width:100%;font-size:.65rem;border-collapse:collapse;text-align:left">
          <thead>
            <tr style="border-b:1px solid rgba(255,255,255,.1);color:#64748b;font-weight:700">
              <th style="padding:.5rem">Fecha</th>
              <th style="padding:.5rem">Ficha</th>
              <th style="padding:.5rem">Asistencia</th>
              <th style="padding:.5rem;text-align:right">Soporte (Excusa)</th>
            </tr>
          </thead>
          <tbody id="student-history-rows" style="color:#cbd5e1">
            <tr><td colspan="4" style="text-align:center;padding:1rem;color:#64748b">Cargando historial...</td></tr>
          </tbody>
        </table>
      </div>
      <button type="button" class="btn-ghost" onclick="switchStudentTab('asis')" style="margin-top:.75rem;padding:.65rem;font-size:.75rem">← Volver a Asistencia</button>
    </div>

    <!-- SUB-TAB 3: MI CUENTA (Habeas Data compliance) -->
    <div id="student-view-acct" class="student-tab-content hidden" style="position:relative;z-index:1">
      <div style="background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.05);border-radius:1.2rem;padding:1.2rem;margin-bottom:1.5rem;text-align:center">
        <div id="dash-avatar-wrapper" style="width:70px;height:70px;border-radius:50%;overflow:hidden;border:2px solid #39A900;margin:0 auto .75rem">
          <img id="dash-avatar" src="" style="width:100%;height:100%;object-fit:cover">
        </div>
        <p style="font-size:.9rem;font-weight:700;color:#fff;margin:0 0 .15rem" id="dash-acct-name">—</p>
        <p style="font-size:.7rem;color:#64748b;margin:0" id="dash-acct-doc">—</p>
      </div>

      <div style="border:1px solid rgba(239,68,68,.15);background:rgba(239,68,68,.02);border-radius:1rem;padding:1rem">
        <h4 style="font-size:.8rem;font-weight:700;color:#f87171;margin:0 0 .25rem">Supresión de Datos Personales</h4>
        <p style="font-size:.65rem;color:#64748b;line-height:1.4;margin:0 0 .75rem">De acuerdo con la <strong>Ley 1581 de 2012</strong>, usted tiene derecho a que sus datos personales sean borrados de nuestros sistemas en cualquier momento. Al presionar el botón de abajo, su cuenta y enrolamiento facial serán eliminados permanentemente del sistema.</p>
        <button onclick="confirmDeleteAccount()" style="width:100%;background:#ef4444;color:#fff;font-weight:700;padding:.65rem;border-radius:.75rem;border:none;cursor:pointer;font-size:.75rem;transition:background .2s">
          Eliminar mi Cuenta y Datos
        </button>
      </div>
      <button type="button" class="btn-ghost" onclick="switchStudentTab('asis')" style="margin-top:.75rem;padding:.65rem;font-size:.75rem">← Volver a Asistencia</button>
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

<!-- Modal de Escáner QR de Cámara Trasera -->
<div id="qr-scanner-modal" style="display:none;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.85);align-items:center;justify-content:center;z-index:99999;padding:1.5rem">
  <div style="background:#0f172a;border:1px solid rgba(57,169,0,.3);border-radius:1.5rem;width:100%;max-width:340px;padding:1.2rem;display:flex;flex-direction:column;gap:1rem;position:relative">
    <button type="button" onclick="closeQrScannerModal()" style="position:absolute;top:1rem;right:1rem;background:transparent;border:none;color:#94a3b8;font-size:1.5rem;cursor:pointer;line-height:1">&times;</button>
    <h3 style="font-size:1rem;font-weight:800;color:#fff;margin:0">Escanear Código QR</h3>
    <p style="color:#64748b;font-size:.7rem;margin:0">Apunta con la cámara trasera al código QR de asistencia.</p>
    <div id="qr-reader-container" style="width:100%;max-width:250px;max-height:250px;margin:0 auto;background:#020617;border-radius:1rem;overflow:hidden;border:1px solid rgba(255,255,255,.05)">
      <div id="qr-reader" style="width:100%"></div>
    </div>
    <button type="button" onclick="closeQrScannerModal()" class="btn-ghost" style="margin:0">Cancelar</button>
  </div>
</div>

<!-- Modal para Subir Excusa / Incapacidad Médica -->
<div id="excuse-modal" style="display:none;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.85);align-items:center;justify-content:center;z-index:99999;padding:1.5rem">
  <div style="background:#0f172a;border:1px solid rgba(57,169,0,.3);border-radius:1.5rem;width:100%;max-width:380px;padding:1.5rem;display:flex;flex-direction:column;gap:1rem;position:relative">
    <button type="button" onclick="closeExcuseModal()" style="position:absolute;top:1rem;right:1rem;background:transparent;border:none;color:#94a3b8;font-size:1.5rem;cursor:pointer;line-height:1">&times;</button>
    <div style="display:flex;align-items:center;gap:.5rem">
      <span style="font-size:1.5rem">📄</span>
      <div>
        <h3 style="font-size:1rem;font-weight:800;color:#fff;margin:0">Radicar Excusa o Incapacidad</h3>
        <p style="color:#64748b;font-size:.7rem;margin:0">Envía tu justificación al instructor para validación.</p>
      </div>
    </div>
    <div id="feedback-excuse" class="hidden mb-2"></div>
    <input type="hidden" id="excuse-session-id">
    
    <div>
      <label class="input-label">Motivo o Justificación</label>
      <textarea id="excuse-text" rows="3" class="input-field" placeholder="Describe el motivo de tu inasistencia o retardo..." style="resize:none;font-size:.8rem"></textarea>
    </div>

    <div>
      <label class="input-label">Soporte o Evidencia (PDF o Imagen Opcional)</label>
      <input type="file" id="excuse-file" accept="image/*,application/pdf" class="input-field" style="font-size:.75rem;padding:.4rem" onchange="handleExcuseFile(event)">
      <input type="hidden" id="excuse-file-data">
      <input type="hidden" id="excuse-file-name">
    </div>

    <button type="button" id="btn-submit-excuse" onclick="doSubmitExcuse()" class="btn-green">
      <span id="btn-excuse-text">Enviar Excusa al Instructor</span>
      <svg id="btn-excuse-spin" class="hidden spin" width="20" height="20" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="white" stroke-width="4" opacity=".25"/><path fill="white" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z"/></svg>
    </button>
    <button type="button" onclick="closeExcuseModal()" class="btn-ghost" style="margin:0">Cancelar</button>
  </div>
</div>

<script>
  const TOKEN = '${token}';
  let activeToken = TOKEN;
  let html5QrScanner = null;

  function toggleStudentPwd(inpId, openId, closedId) {
    const inp = document.getElementById(inpId);
    const open = document.getElementById(openId);
    const closed = document.getElementById(closedId);
    if (!inp) return;
    const isPass = inp.type === 'password';
    inp.type = isPass ? 'text' : 'password';
    if (open && closed) {
      open.classList.toggle('hidden', isPass);
      closed.classList.toggle('hidden', !isPass);
    }
  }

  function openQrScannerModal() {
    stopAsisCamera();
    document.getElementById('qr-scanner-modal').style.display = 'flex';
    html5QrScanner = new Html5Qrcode("qr-reader");
    html5QrScanner.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      (qrMessage) => {
        let token = qrMessage.trim();
        try {
          if (token.includes('/attendance/')) {
            const parts = token.split('/attendance/');
            token = parts[parts.length - 1];
          } else if (token.includes('/')) {
            const parts = token.split('/');
            token = parts[parts.length - 1];
          }
        } catch(e) {}
        document.getElementById('asis-token-input').value = token;
        activeToken = token;
        closeQrScannerModal();
      },
      (errorMessage) => {}
    ).catch(err => {
      console.error("Error iniciando scanner QR:", err);
      alert("No se pudo acceder a la cámara trasera para escanear.");
      closeQrScannerModal();
    });
  }

  function closeQrScannerModal() {
    document.getElementById('qr-scanner-modal').style.display = 'none';
    if (html5QrScanner) {
      html5QrScanner.stop().then(() => {
        html5QrScanner = null;
        startAsisCamera();
      }).catch(err => {
        console.warn("Error apagando scanner:", err);
        html5QrScanner = null;
        startAsisCamera();
      });
    } else {
      startAsisCamera();
    }
  }

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
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function setLoading(btnId, spinId, textId, loading, label) {
    document.getElementById(btnId).disabled = loading;
    document.getElementById(spinId).classList.toggle('hidden', !loading);
    if (label) document.getElementById(textId).textContent = loading ? 'Procesando...' : label;
  }

  let studentToken = '';
  let studentProfile = null;
  try {
    studentToken = localStorage.getItem('student_token') || '';
    studentProfile = JSON.parse(localStorage.getItem('student_profile') || 'null');
  } catch (e) {
    console.warn('localStorage is restricted or unavailable:', e);
  }

  // On page load, if token exists, auto-login
  document.addEventListener('DOMContentLoaded', () => {
    if (studentToken && studentProfile) {
      showStudentPortal(studentProfile);
    }
  });

  // ── STEP 1: Persistent Student Login ────────────────────────────────────────
  async function doCheck() {
    const doc = document.getElementById('inp-doc').value.trim();
    const pwd = document.getElementById('inp-pwd').value;
    const fb = document.getElementById('feedback-check');

    if (!doc || !pwd) {
      showFeedback(fb, '❌ El documento y la contraseña son requeridos.', 'error');
      return;
    }

    setLoading('btn-check','btn-check-spin','btn-check-text', true, 'Iniciar Sesión');
    fb.className = 'hidden mb-4';

    try {
      const res = await fetch('/public/student/login', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ documento: doc, password: pwd })
      });
      const result = await res.json();

      if (res.ok) {
        studentToken = result.data.token;
        studentProfile = result.data.person;
        try {
          localStorage.setItem('student_token', studentToken);
          localStorage.setItem('student_profile', JSON.stringify(studentProfile));
        } catch (e) {
          console.warn('localStorage save failed:', e);
        }
        
        showStudentPortal(studentProfile);
      } else {
        showFeedback(fb, '❌ ' + (result.error?.message || 'Error al iniciar sesión.'), 'error');
      }
    } catch(e) {
      showFeedback(fb, '❌ Error de conexión.', 'error');
    } finally {
      setLoading('btn-check','btn-check-spin','btn-check-text', false, 'Iniciar Sesión');
    }
  }

  function toggleTermsModal(show) {
    const modal = document.getElementById('terms-modal');
    if (show) {
      modal.style.display = 'flex';
    } else {
      modal.style.display = 'none';
    }
  }

  async function acceptTermsAndClose() {
    if (studentToken && studentProfile && !studentProfile.terms_accepted) {
      try {
        const res = await fetch('/api/student/accept-terms', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + studentToken
          }
        });
        if (res.ok) {
          studentProfile.terms_accepted = 1;
          try {
            localStorage.setItem('student_profile', JSON.stringify(studentProfile));
          } catch (e) {
            console.warn('localStorage save failed:', e);
          }
        }
      } catch (e) {
        console.error('Error accepting terms:', e);
      }
    }
    toggleTermsModal(false);
  }

  let regStream = null;

  async function toggleRegCamera() {
    const video = document.getElementById('reg-video');
    const preview = document.getElementById('reg-photo-preview');
    const placeholder = document.getElementById('reg-photo-placeholder');
    const btnToggle = document.getElementById('btn-reg-camera-toggle');
    const btnCapture = document.getElementById('btn-reg-capture');

    if (regStream) {
      // Turn off camera
      regStream.getTracks().forEach(track => track.stop());
      regStream = null;
      video.classList.add('hidden');
      if (!preview.src) placeholder.classList.remove('hidden');
      btnToggle.textContent = 'Iniciar Cámara Frontal';
      btnCapture.classList.add('hidden');
    } else {
      // Turn on camera
      try {
        regStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: 320, height: 320 }
        });
        video.srcObject = regStream;
        video.classList.remove('hidden');
        placeholder.classList.add('hidden');
        preview.classList.add('hidden');
        btnToggle.textContent = 'Apagar Cámara';
        btnCapture.classList.remove('hidden');
      } catch (err) {
        alert('No se pudo acceder a la cámara frontal. Asegúrate de dar permisos de cámara.');
      }
    }
  }

  function captureRegPhoto() {
    const video = document.getElementById('reg-video');
    const canvas = document.getElementById('reg-canvas');
    const preview = document.getElementById('reg-photo-preview');
    const photoData = document.getElementById('reg-photo-data');
    const btnCapture = document.getElementById('btn-reg-capture');

    const ctx = canvas.getContext('2d');
    // Mirror image for natural selfie preview
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    // Reset transformation matrix
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    const base64 = canvas.toDataURL('image/jpeg', 0.85);
    photoData.value = base64;
    preview.src = base64;
    preview.classList.remove('hidden');

    // Turn off camera stream
    toggleRegCamera();
  }

  // ── STEP 3: Self Register (new student check-in) ──────────────────────────
  async function doRegister() {
    const doc    = document.getElementById('reg-doc').value.trim();
    const nombre = document.getElementById('reg-nombre').value.trim();
    const pwd    = document.getElementById('reg-pwd').value;
    const fb     = document.getElementById('feedback-register');
    const photo  = document.getElementById('reg-photo-data').value;

    const acceptTerms = document.getElementById('reg-accept-terms').checked;
    if (!acceptTerms) {
      showFeedback(fb, '❌ Debes aceptar la política de protección de datos para registrarte.', 'error');
      return;
    }

    if (!photo) {
      showFeedback(fb, '❌ El enrolamiento facial es obligatorio. Tómate una foto de referencia.', 'error');
      return;
    }

    if (!nombre) { showFeedback(fb, '❌ El nombre es requerido.', 'error'); return; }
    if (!pwd || pwd.length < 6) { showFeedback(fb, '❌ La contraseña debe tener mínimo 6 caracteres.', 'error'); return; }

    setLoading('btn-register','btn-reg-spin','btn-reg-text', true, 'Validando rostro con IA...');
    fb.className = 'hidden mb-4';

    try {
      // 1. Asegurar modelos de face-api cargados
      await loadFaceApiModels();

      // 2. Detectar rostro con SSD en confianza muy permisiva (0.2) — hasta 3 intentos
      const regImg = new Image();
      regImg.crossOrigin = 'anonymous';
      regImg.src = photo;
      await new Promise(resolve => { regImg.onload = resolve; regImg.onerror = resolve; });

      let detection = null;
      // Intentar con confianzas progresivamente más bajas
      for (const minConf of [0.3, 0.2, 0.1]) {
        detection = await faceapi
          .detectSingleFace(regImg, new faceapi.SsdMobilenetv1Options({ minConfidence: minConf }));
        if (detection) break;
        await new Promise(r => setTimeout(r, 200));
      }

      if (!detection) {
        // Advertencia suave — no bloqueamos el registro, el alumno claramente está presente
        console.warn('Face not detected in registration photo — allowing with warning');
        showFeedback(fb, '⚠️ La foto no pudo validarse con IA, pero tu registro continuará. Asegúrate de tener buena iluminación en futuras sesiones.', 'warning');
        await new Promise(r => setTimeout(r, 1500));
      }

      setLoading('btn-register','btn-reg-spin','btn-reg-text', true, 'Registrando cuenta...');
      const res = await fetch('/public/attendance/' + activeToken + '/self-register', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ documento: doc, nombre, password: pwd, photo_reference: photo })
      });
      const result = await res.json();

      if (res.ok || res.status === 201) {
        studentToken = result.data.token;
        studentProfile = result.data.person;
        
        try {
          localStorage.setItem('student_token', studentToken);
          localStorage.setItem('student_profile', JSON.stringify(studentProfile));
        } catch (e) {
          console.warn('localStorage save failed:', e);
        }

        if (studentProfile.alreadyRegistered) {
          alert('Ya estabas registrado. Redirigiendo a tu portal...');
        } else {
          alert('¡Cuenta creada y asistencia marcada con éxito!');
        }

        // Clean fields
        document.getElementById('reg-doc').value = '';
        document.getElementById('reg-nombre').value = '';
        document.getElementById('reg-pwd').value = '';
        document.getElementById('reg-photo-data').value = '';
        const preview = document.getElementById('reg-photo-preview');
        preview.src = '';
        preview.classList.add('hidden');
        document.getElementById('reg-photo-placeholder').classList.remove('hidden');

        showStudentPortal(studentProfile);
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

  let asisStream = null;
  let faceapiLoaded = false;
  let modelsLoadingPromise = null;

  function doStudentLogout() {
    // Stop camera if running
    stopAsisCamera();
    studentToken = '';
    studentProfile = null;
    try {
      localStorage.removeItem('student_token');
      localStorage.removeItem('student_profile');
    } catch (e) {
      console.warn('localStorage clean failed:', e);
    }
    document.getElementById('inp-doc').value = '';
    document.getElementById('inp-pwd').value = '';
    showScreen('screen-check', '');
  }

  async function confirmDeleteAccount() {
    if (!confirm('⚠️ ¿Estás COMPLETAMENTE seguro de que deseas eliminar tu cuenta del sistema?\\nEsta acción es irreversible y suprimirá de forma definitiva tu enrolamiento facial y registro personal según la Ley 1581.')) return;
    const confirmPwd = prompt('Para confirmar la supresión de datos, ingresa tu contraseña de acceso:');
    if (!confirmPwd) return;

    try {
      const res = await fetch('/api/student/delete-account', {
        method: 'DELETE',
        headers: {
          'Authorization': 'Bearer ' + studentToken,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password: confirmPwd })
      });
      const result = await res.json();
      if (res.ok) {
        alert('Tus datos han sido eliminados del sistema correctamente.');
        doStudentLogout();
      } else {
        alert('Error: ' + (result.error?.message || 'No se pudo eliminar la cuenta.'));
      }
    } catch(e) {
      alert('Error de conexión al eliminar la cuenta.');
    }
  }

  function switchStudentTab(tab) {
    document.querySelectorAll('.student-tab-content').forEach(el => el.classList.add('hidden'));
    document.getElementById('student-view-' + tab).classList.remove('hidden');

    // Tab buttons styling
    const tabs = ['asis', 'hist', 'acct'];
    tabs.forEach(t => {
      const btn = document.getElementById('tab-student-' + t);
      if (t === tab) {
        btn.style.background = '#39A900';
        btn.style.color = '#fff';
      } else {
        btn.style.background = 'transparent';
        btn.style.color = '#94a3b8';
      }
    });

    if (tab === 'asis') {
      startAsisCamera();
    } else {
      stopAsisCamera();
    }

    if (tab === 'hist') {
      fetchStudentHistory();
    }
  }

  // Cargar modelos de face-api.js
  async function loadFaceApiModels() {
    if (modelsLoadingPromise) return modelsLoadingPromise;
    
    const status = document.getElementById('biometric-status');
    status.innerHTML = '🤖 Cargando modelos de Inteligencia Facial...';
    
    modelsLoadingPromise = (async () => {
      try {
        // Load weights from a public CDN hosted models
        const MODEL_URL = 'https://justadudewhohacks.github.io/face-api.js/models';
        await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);
        await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
        await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
        faceapiLoaded = true;
        status.innerHTML = '📹 Cámara activa. Enfoca tu rostro...';
      } catch (err) {
        console.error('Error loading face-api models:', err);
        status.innerHTML = '❌ Error al cargar modelos. Recarga la página.';
        throw err;
      }
    })();
    
    return modelsLoadingPromise;
  }

  async function startAsisCamera() {
    if (asisStream) return;
    const video = document.getElementById('asis-video');
    const preview = document.getElementById('asis-photo-preview');
    const status = document.getElementById('biometric-status');
    const btnSubmit = document.getElementById('btn-submit-asis');

    btnSubmit.disabled = true;
    btnSubmit.style.opacity = '0.6';
    btnSubmit.querySelector('span').textContent = 'Esperando validación facial...';
    preview.classList.add('hidden');
    video.classList.remove('hidden');

    try {
      asisStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 320, height: 320 }
      });
      video.srcObject = asisStream;
      
      // Load models
      await loadFaceApiModels();
      
      // Start processing loop
      processFaceMatching();

      // ── Plan B fallback: if biometrics haven't verified after 15s, unlock manual button ──
      setTimeout(() => {
        const btn = document.getElementById('btn-submit-asis');
        if (btn && btn.disabled) {
          btn.disabled = false;
          btn.style.opacity = '1';
          btn.querySelector('span').textContent = 'Confirmar Asistencia (Manual)';
          document.getElementById('biometric-status').innerHTML =
            '⚠️ Verificación facial no completada. Puedes continuar con tu código.';
          lastVerificationMethod = 'manual';
        }
      }, 15000);
    } catch (err) {
      console.error(err);
      status.innerHTML = '❌ Cámara no disponible. Ingresa el código manualmente.';
      const btn = document.getElementById('btn-submit-asis');
      if (btn) {
        btn.disabled = false;
        btn.style.opacity = '1';
        btn.querySelector('span').textContent = 'Confirmar Asistencia (Manual)';
      }
      lastVerificationMethod = 'manual';
    }
  }

  function stopAsisCamera() {
    if (asisStream) {
      asisStream.getTracks().forEach(track => track.stop());
      asisStream = null;
    }
  }

  let matchingActive = false;
  let lastBiometricMatchScore = null;
  let lastVerificationMethod = 'manual';

  async function processFaceMatching() {
    if (matchingActive) return;
    matchingActive = true;
    
    // Reset values on start matching
    lastBiometricMatchScore = null;
    lastVerificationMethod = 'manual';
    
    const video = document.getElementById('asis-video');
    const status = document.getElementById('biometric-status');
    const btnSubmit = document.getElementById('btn-submit-asis');
    
    // Check if we have student photo_reference
    const refPhotoUrl = studentProfile.photo_reference;
    if (!refPhotoUrl) {
      status.innerHTML = '⚠️ Sin enrolamiento facial base. Se requiere validación manual.';
      btnSubmit.disabled = false;
      btnSubmit.style.opacity = '1';
      btnSubmit.querySelector('span').textContent = 'Confirmar Asistencia (Manual)';
      matchingActive = false;
      lastVerificationMethod = 'manual';
      return;
    }

    try {
      // Create reference image descriptor
      const refImg = new Image();
      refImg.src = refPhotoUrl;
      await new Promise(resolve => refImg.onload = resolve);
      
      const refDetection = await faceapi.detectSingleFace(refImg)
        .withFaceLandmarks().withFaceDescriptor();

      if (!refDetection) {
        status.innerHTML = '⚠️ Foto de registro defectuosa. Se requiere validación manual.';
        btnSubmit.disabled = false;
        btnSubmit.style.opacity = '1';
        btnSubmit.querySelector('span').textContent = 'Confirmar Asistencia (Manual)';
        matchingActive = false;
        return;
      }

      const faceMatcher = new faceapi.FaceMatcher(refDetection);

      // Loop for current camera frame matching
      while (asisStream) {
        if (!video.videoWidth) {
          await new Promise(resolve => setTimeout(resolve, 100));
          continue;
        }

        const currentDetection = await faceapi.detectSingleFace(video)
          .withFaceLandmarks().withFaceDescriptor();

        if (currentDetection) {
          const bestMatch = faceMatcher.findBestMatch(currentDetection.descriptor);
          const distance = bestMatch.distance; // Lower is better (0 = identical)
          const similarity = Math.max(0, Math.min(100, Math.round((1 - distance) * 100)));
          
          lastBiometricMatchScore = distance;

          if (similarity >= 45) {
            status.innerHTML = "✅ Rostro Verificado (" + similarity + "% de coincidencia)";
            btnSubmit.disabled = false;
            btnSubmit.style.opacity = '1';
            btnSubmit.querySelector('span').textContent = 'Registrar Mi Asistencia Ahora';
            lastVerificationMethod = 'biometric';
            break;
          } else {
            status.innerHTML = "🔍 Ajusta tu rostro (Coincidencia: " + similarity + "% - Mínimo: 45%)";
            lastVerificationMethod = 'manual';
          }
        } else {
          status.innerHTML = '👤 Rostro no detectado. Enfoca la cámara de frente...';
        }
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } catch (e) {
      console.error('Error in face matching loop:', e);
      status.innerHTML = '⚠️ Fallo del motor de reconocimiento. Validación manual.';
      btnSubmit.disabled = false;
      btnSubmit.style.opacity = '1';
      btnSubmit.querySelector('span').textContent = 'Confirmar Asistencia (Manual)';
      lastVerificationMethod = 'manual';
    } finally {
      matchingActive = false;
    }
  }

  // ── Dashboard renderer ────────────────────────────────────────────────────
  function showStudentPortal(person) {
    document.getElementById('dash-nombre').textContent = person.nombre;
    document.getElementById('dash-acct-name').textContent = person.nombre;
    document.getElementById('dash-acct-doc').textContent = 'Documento: ' + person.documento;
    
    const avatar = document.getElementById('dash-avatar');
    if (person.photo_reference) {
      avatar.src = person.photo_reference;
    } else {
      avatar.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%2364748b"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>';
    }

    // Set Ficha Code if available
    const fichaText = TOKEN !== 'manual' && TOKEN !== '' ? 'Ficha: ' + TOKEN : 'Clase Local';
    document.getElementById('dash-ficha').textContent = fichaText;

    showScreen('screen-dashboard', '');
    switchStudentTab('asis');

    if (!person.terms_accepted) {
      toggleTermsModal(true);
    }
  }

  // Registrar asistencia desde el portal del estudiante
  async function doSubmitAttendance() {
    const tokenInput = document.getElementById('asis-token-input').value.trim() || TOKEN;
    const btnSubmit = document.getElementById('btn-submit-asis');
    const spin = document.getElementById('btn-submit-asis-spin');
    const text = document.getElementById('btn-submit-asis-text');
    const fb = document.getElementById('feedback-dashboard');

    if (!tokenInput || tokenInput === 'manual') {
      showFeedback(fb, '❌ Por favor ingresa el código QR o código manual de la clase.', 'error');
      return;
    }

    setLoading('btn-submit-asis', 'btn-submit-asis-spin', 'btn-submit-asis-text', true, 'Registrar Mi Asistencia Ahora');
    fb.className = 'hidden mb-4';

    // Capture current selfie from video stream if active
    let photoEvidence = '';
    const video = document.getElementById('asis-video');
    if (asisStream && video.videoWidth) {
      const canvas = document.getElementById('asis-canvas');
      const ctx = canvas.getContext('2d');
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      photoEvidence = canvas.toDataURL('image/jpeg', 0.8);
    }

    try {
      const res = await fetch('/public/attendance/' + tokenInput + '/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + studentToken
        },
        body: JSON.stringify({
          documento: studentProfile.documento,
          photo_evidence: photoEvidence,
          verification_method: lastVerificationMethod,
          biometric_match_score: lastBiometricMatchScore
        })
      });
      const result = await res.json();

      if (res.ok) {
        showFeedback(fb, '✅ Asistencia marcada con éxito para esta clase.', 'success');
        stopAsisCamera();
        // Show photo preview
        if (photoEvidence) {
          const preview = document.getElementById('asis-photo-preview');
          preview.src = photoEvidence;
          preview.classList.remove('hidden');
          video.classList.add('hidden');
        }
      } else {
        showFeedback(fb, '❌ ' + (result.error?.message || 'Error al registrar asistencia.'), 'error');
      }
    } catch (e) {
      showFeedback(fb, '❌ Error de conexión al procesar la asistencia.', 'error');
    } finally {
      setLoading('btn-submit-asis', 'btn-submit-asis-spin', 'btn-submit-asis-text', false, 'Registrar Mi Asistencia Ahora');
    }
  }

  // Obtener historial de asistencia
  async function fetchStudentHistory() {
    const container = document.getElementById('student-history-rows');
    container.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:1rem;color:#64748b">Cargando historial...</td></tr>';

    try {
      const res = await fetch('/api/student/history', {
        headers: { 'Authorization': 'Bearer ' + studentToken }
      });
      const result = await res.json();

      if (res.ok) {
        container.innerHTML = '';
        const history = result.data || [];
        
        let totalHrs = 0;
        let totalFallas = 0;

        if (history.length === 0) {
          container.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:1rem;color:#64748b">No registras asistencias en el sistema.</td></tr>';
          return;
        }

        history.forEach(h => {
          const dateStr = new Date(h.date).toLocaleDateString('es-CO', { dateStyle: 'short' });
          const hoursValid = h.horas_validadas_asistencia || 0;
          totalHrs += hoursValid;

          let statusBadge = '';
          if (h.horas_validadas_asistencia === 6) {
            statusBadge = '<span style="color:#4ade80;font-weight:700">Puntual</span>';
          } else if (h.horas_validadas_asistencia > 0) {
            statusBadge = '<span style="color:#fbbf24;font-weight:700">Retardo (-' + (6 - h.horas_validadas_asistencia) + 'h)</span>';
          } else {
            statusBadge = '<span style="color:#f87171;font-weight:700">Falla</span>';
            totalFallas++;
          }

          // Check if excuse upload is disabled (over 3 business days)
          const sessionDate = new Date(h.date);
          const daysDiff = Math.floor((Date.now() - sessionDate.getTime()) / (1000 * 60 * 60 * 24));
          const isExpired = daysDiff > 3;

          let excuseCol = '';
          if (h.horas_validadas_asistencia === 6) {
            excuseCol = '<span style="color:#64748b">—</span>';
          } else if (h.excuse_status) {
            const badgeColor = h.excuse_status === 'approved' ? '#4ade80' : (h.excuse_status === 'rejected' ? '#f87171' : '#fbbf24');
            const statusText = h.excuse_status === 'approved' ? 'Aprobada ✓' : (h.excuse_status === 'rejected' ? 'Rechazada ❌' : 'Pendiente ⏳');
            excuseCol = '<span style="color:' + badgeColor + ';font-weight:700">' + statusText + '</span>';
          } else if (isExpired) {
            excuseCol = '<span style="color:#475569;font-weight:600">Vencido (excedió 3 días)</span>';
          } else {
            excuseCol = '<button onclick="openExcuseModal(\'' + h.sessionId + '\')" style="background:#1e3a8a;color:#93c5fd;font-size:.6rem;padding:.3rem .5rem;border:none;border-radius:.4rem;cursor:pointer;font-weight:600">Subir Excusa</button>';
          }

          container.innerHTML += '<tr style="border-bottom:1px solid rgba(255,255,255,.03)">' +
            '<td style="padding:.6rem .5rem;font-weight:600">' + dateStr + '</td>' +
            '<td style="padding:.6rem .5rem;color:#94a3b8">' + h.unitCode.replace('unit_ficha_','') + '</td>' +
            '<td style="padding:.6rem .5rem">' + statusBadge + '</td>' +
            '<td style="padding:.6rem .5rem;text-align:right">' + excuseCol + '</td>' +
            '</tr>';
        });

        document.getElementById('dash-horas').textContent = totalHrs + 'h';
        document.getElementById('dash-fallas').textContent = totalFallas;

      } else {
        container.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:1rem;color:#f87171">Error al cargar historial.</td></tr>';
      }
    } catch (e) {
      container.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:1rem;color:#f87171">Error de conexión.</td></tr>';
    }
  }

  function openExcuseModal(sessionId) {
    document.getElementById('excuse-session-id').value = sessionId || '';
    document.getElementById('excuse-text').value = '';
    document.getElementById('excuse-file').value = '';
    document.getElementById('excuse-file-data').value = '';
    document.getElementById('excuse-file-name').value = '';
    document.getElementById('feedback-excuse').className = 'hidden mb-2';
    document.getElementById('excuse-modal').style.display = 'flex';
  }

  function closeExcuseModal() {
    document.getElementById('excuse-modal').style.display = 'none';
  }

  function handleExcuseFile(event) {
    const file = event.target.files[0];
    if (!file) return;
    document.getElementById('excuse-file-name').value = file.name;
    const reader = new FileReader();
    reader.onload = function(e) {
      document.getElementById('excuse-file-data').value = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  async function doSubmitExcuse() {
    const sessionId = document.getElementById('excuse-session-id').value;
    const text = document.getElementById('excuse-text').value.trim();
    const fileName = document.getElementById('excuse-file-name').value;
    const fileData = document.getElementById('excuse-file-data').value;
    const fb = document.getElementById('feedback-excuse');

    if (!sessionId) {
      showFeedback(fb, '❌ No se especificó la sesión a justificar.', 'error');
      return;
    }
    if (!text) {
      showFeedback(fb, '❌ Por favor ingresa el motivo o justificación.', 'error');
      return;
    }

    setLoading('btn-submit-excuse','btn-excuse-spin','btn-excuse-text', true, 'Enviando...');
    fb.className = 'hidden mb-2';

    try {
      const res = await fetch('/api/excuses/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + studentToken
        },
        body: JSON.stringify({ sessionId, text, fileName, fileData })
      });
      const result = await res.json();
      if (res.ok) {
        alert('¡Excusa enviada al instructor correctamente!');
        closeExcuseModal();
        fetchStudentHistory();
      } else {
        showFeedback(fb, '❌ ' + (result.error?.message || 'Error al enviar excusa.'), 'error');
      }
    } catch(err) {
      showFeedback(fb, '❌ Error de conexión con el servidor.', 'error');
    } finally {
      setLoading('btn-submit-excuse','btn-excuse-spin','btn-excuse-text', false, 'Enviar Excusa al Instructor');
    }
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
app.post('/api/excuses/submit',                        authenticate, submitExcuse);
app.delete('/api/student/delete-account',              authenticate, deleteStudentAccount);
app.post('/api/student/accept-terms',                  authenticate, acceptStudentTerms);

// Instructor Excuses
app.get('/api/instructor/excuses',                     authenticate, getInstructorExcuses);
app.post('/api/instructor/excuses/:id/resolve',        authenticate, resolveExcuse);

// Instructor Late Requests
app.get('/api/instructor/late-requests',               authenticate, getInstructorLateRequests);
app.post('/api/instructor/late-requests/:id/resolve',  authenticate, resolveLateRequest);
app.post('/api/sessions/:sessionId/evidence',          authenticate, submitSessionEvidence);

// Biometric Exceptions
app.get('/api/sessions/:sessionId/pending-biometrics', authenticate, getPendingBiometrics);
app.post('/api/attendance/resolve-biometric/:recordId', authenticate, resolveBiometricException);

// ── Coordinator Endpoints ──────────────────────────────────────────────────────
app.get('/api/coord/instructors',                      authenticate, requireRole('COORDINADOR'), getCoordInstructors);
app.post('/api/coord/instructors',                     authenticate, requireRole('COORDINADOR'), createInstructor);
app.put('/api/coord/instructors/:id',                  authenticate, requireRole('COORDINADOR'), updateInstructor);
app.get('/api/coord/fichas',                           authenticate, requireRole('COORDINADOR'), getCoordFichas);
app.post('/api/coord/fichas',                          authenticate, requireRole('COORDINADOR'), createFicha);
app.put('/api/coord/fichas/:id',                       authenticate, requireRole('COORDINADOR'), updateFicha);
app.get('/api/coord/evidences',                        authenticate, requireRole('COORDINADOR'), getCoordEvidences);

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
