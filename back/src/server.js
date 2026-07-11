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
  resolveExcuse
} from './controllers.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.resolve(__dirname, '../../app')));

// Health check and Readiness
app.get('/health', (req, res) => {
  res.status(200).send('ok');
});

app.get('/ready', (req, res) => {
  res.status(200).send('ready');
});

// Public Authentication
app.post('/api/auth/login', login);

// Public Check-in (JSON and Path token)
app.post('/attendance/checkin', checkin);
app.post('/public/attendance/:token/register', checkin);

// Public Student checkin page served directly from backend
app.get('/attendance/:token', (req, res) => {
  const { token } = req.params;
  res.send(`
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Asistencia Estudiante - SENA</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&display=swap" rel="stylesheet">
  <style>
    body {
      font-family: 'Outfit', sans-serif;
      background: radial-gradient(circle at top, #1a2f1c 0%, #0d1117 100%);
    }
    .glass {
      background: rgba(255, 255, 255, 0.03);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.08);
    }
  </style>
</head>
<body class="min-h-screen flex items-center justify-center p-4 text-slate-100">
  <div class="w-full max-w-md glass rounded-3xl p-8 shadow-2xl relative overflow-hidden">
    <!-- Decorative glow -->
    <div class="absolute -top-10 -right-10 w-32 h-32 bg-[#39A900] opacity-20 rounded-full blur-2xl"></div>
    <div class="absolute -bottom-10 -left-10 w-32 h-32 bg-[#003049] opacity-30 rounded-full blur-2xl"></div>

    <div class="text-center mb-6 relative z-10">
      <div class="inline-flex p-3 bg-[#39A900]/10 rounded-2xl mb-4">
        <svg class="w-8 h-8 text-[#39A900]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 009 11V5.071c0-3.555 3.84-5.714 7-3.929q1.5.857 3 3.93c.3.614.507 1.282.593 1.986M4.44 18c0-.462.062-.914.18-1.343m11.82 1.343a8 8 0 00-8-8M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
        </svg>
      </div>
      <h1 class="text-2xl font-bold tracking-tight">Portal del Estudiante</h1>
      <p class="text-slate-400 text-sm mt-1">Registre su asistencia a la sesión</p>
    </div>

    <!-- Toggle Tabs -->
    <div class="flex bg-slate-950/60 p-1 rounded-xl border border-slate-800/80 mb-6 relative z-10 text-xs font-semibold">
      <button id="tabLogin" class="flex-1 py-2 text-center rounded-lg bg-[#39A900] text-white transition-all">
        Registrar Ingreso
      </button>
      <button id="tabRegister" class="flex-1 py-2 text-center rounded-lg text-slate-400 hover:text-white transition-all">
        Primer Ingreso (Definir Clave)
      </button>
    </div>

    <!-- Feedback alert container -->
    <div id="feedback" class="hidden mb-6 p-4 rounded-xl text-sm font-semibold text-center transition-all duration-300"></div>

    <form id="checkinForm" class="space-y-5 relative z-10">
      <div>
        <label for="documento" class="block text-xs font-medium text-slate-300 mb-1.5">Documento de Identidad</label>
        <input 
          type="text" 
          id="documento" 
          name="documento" 
          required 
          autocomplete="off"
          placeholder="Ingrese su número de documento"
          class="w-full bg-slate-900/50 border border-slate-700/60 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#39A900] focus:border-transparent transition-all"
        >
      </div>

      <!-- Login Password Section -->
      <div id="loginPassSection">
        <label for="password" class="block text-xs font-medium text-slate-300 mb-1.5">Contraseña</label>
        <input 
          type="password" 
          id="password" 
          name="password"
          placeholder="Ingrese su contraseña"
          class="w-full bg-slate-900/50 border border-slate-700/60 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#39A900] focus:border-transparent transition-all"
        >
      </div>

      <!-- Register Password Section -->
      <div id="registerPassSection" class="hidden space-y-4">
        <div>
          <label for="regPassword" class="block text-xs font-medium text-slate-300 mb-1.5">Definir Nueva Contraseña</label>
          <input 
            type="password" 
            id="regPassword" 
            placeholder="Mínimo 6 caracteres"
            class="w-full bg-slate-900/50 border border-slate-700/60 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#39A900] focus:border-transparent transition-all"
          >
        </div>
        <div>
          <label for="confirmPassword" class="block text-xs font-medium text-slate-300 mb-1.5">Confirmar Contraseña</label>
          <input 
            type="password" 
            id="confirmPassword" 
            placeholder="Confirme su nueva contraseña"
            class="w-full bg-slate-900/50 border border-slate-700/60 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#39A900] focus:border-transparent transition-all"
          >
        </div>
      </div>

      <button 
        type="submit" 
        id="btnSubmit"
        class="w-full bg-[#39A900] hover:bg-[#329200] active:scale-[0.98] text-white font-semibold py-3 px-4 rounded-xl transition-all shadow-lg shadow-[#39A900]/20 flex items-center justify-center gap-2"
      >
        <span id="btnText">Registrar Asistencia</span>
        <svg id="btnSpinner" class="hidden animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </button>
    </form>

    <div class="mt-8 text-center text-[10px] text-slate-500 relative z-10 border-t border-slate-800/60 pt-4">
      Esta sesión está protegida por Token de Rotación Rápida.
    </div>
  </div>

  <script>
    const form = document.getElementById('checkinForm');
    const feedback = document.getElementById('feedback');
    const btnSubmit = document.getElementById('btnSubmit');
    const btnText = document.getElementById('btnText');
    const btnSpinner = document.getElementById('btnSpinner');

    const tabLogin = document.getElementById('tabLogin');
    const tabRegister = document.getElementById('tabRegister');
    const loginPassSection = document.getElementById('loginPassSection');
    const registerPassSection = document.getElementById('registerPassSection');

    let currentMode = 'login'; // 'login' or 'register'

    tabLogin.addEventListener('click', () => {
      currentMode = 'login';
      tabLogin.className = 'flex-1 py-2 text-center rounded-lg bg-[#39A900] text-white transition-all';
      tabRegister.className = 'flex-1 py-2 text-center rounded-lg text-slate-400 hover:text-white transition-all';
      loginPassSection.classList.remove('hidden');
      registerPassSection.classList.add('hidden');
      document.getElementById('password').required = true;
      document.getElementById('regPassword').required = false;
      document.getElementById('confirmPassword').required = false;
    });

    tabRegister.addEventListener('click', () => {
      currentMode = 'register';
      tabRegister.className = 'flex-1 py-2 text-center rounded-lg bg-[#39A900] text-white transition-all';
      tabLogin.className = 'flex-1 py-2 text-center rounded-lg text-slate-400 hover:text-white transition-all';
      loginPassSection.classList.add('hidden');
      registerPassSection.classList.remove('hidden');
      document.getElementById('password').required = false;
      document.getElementById('regPassword').required = true;
      document.getElementById('confirmPassword').required = true;
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const doc = document.getElementById('documento').value.trim();
      if (!doc) return;

      const payload = { documento: doc };

      if (currentMode === 'login') {
        const pass = document.getElementById('password').value;
        payload.password = pass;
      } else {
        const regPass = document.getElementById('regPassword').value;
        const confPass = document.getElementById('confirmPassword').value;

        if (regPass.length < 6) {
          showFeedback('La contraseña debe tener mínimo 6 caracteres.', 'error');
          return;
        }
        if (regPass !== confPass) {
          showFeedback('Las contraseñas no coinciden.', 'error');
          return;
        }
        payload.registerPassword = regPass;
      }

      // Loading state
      btnSubmit.disabled = true;
      btnText.textContent = 'Procesando...';
      btnSpinner.classList.remove('hidden');
      feedback.className = 'hidden';

      try {
        const res = await fetch('/public/attendance/${token}/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        const result = await res.json();

        if (res.ok) {
          showFeedback(currentMode === 'register' ? '¡Contraseña registrada y asistencia marcada!' : '¡Asistencia registrada con éxito!', 'success');
          form.reset();
          if (currentMode === 'register') {
            tabLogin.click();
          }
        } else {
          const errMsg = result.error ? result.error.message : 'Error al procesar asistencia.';
          showFeedback(errMsg, 'error');
        }
      } catch (err) {
        showFeedback('Error de conexión con el servidor.', 'error');
      } finally {
        btnSubmit.disabled = false;
        btnText.textContent = 'Registrar Asistencia';
        btnSpinner.classList.add('hidden');
      }
    });

    function showFeedback(msg, type) {
      feedback.textContent = msg;
      if (type === 'success') {
        feedback.className = 'p-4 rounded-xl text-sm font-semibold text-center bg-green-500/10 text-green-400 border border-green-500/20 mb-6';
      } else {
        feedback.className = 'p-4 rounded-xl text-sm font-semibold text-center bg-red-500/10 text-red-400 border border-red-500/20 mb-6';
      }
    }
  </script>
</body>
</html>
  `);
});

// Protected routes (Instructor catalog & control)
app.get('/api/institutions', authenticate, getInstitutions);
app.get('/api/institutions/:institutionId/units', authenticate, getUnits);
app.get('/api/units/:unitId/people', authenticate, getPeople);

app.post('/api/sessions', authenticate, createSessionDraft);
app.post('/api/sessions/:sessionId/activate', authenticate, activateSession);
app.post('/api/sessions/:sessionId/close', authenticate, closeSession);
app.get('/api/sessions/:sessionId', authenticate, getSession);
app.get('/api/sessions/:sessionId/qr-token', authenticate, getSessionQrToken);
app.get('/api/sessions', authenticate, getSessionsHistory);

app.get('/api/sessions/:sessionId/present', authenticate, getPresent);
app.get('/api/sessions/:sessionId/absent', authenticate, getAbsent);
app.get('/api/sessions/:sessionId/rejections', authenticate, getRejections);

// Room & Manual Override routes
app.post('/room/create', createRoom); // public entry point to create
app.post('/room/reopen', reopenRoom); // public entry point to reopen
app.post('/attendance/manual-override', authenticate, manualOverride);
app.post('/attendance/manual-checkin', authenticate, manualLateCheckin);
app.get('/reports/session/:sessionId', authenticate, getSessionReport);

// Student Portal Routes
app.get('/api/student/history', authenticate, getStudentHistory);
app.post('/api/student/excuses', authenticate, submitExcuse);

// Instructor Excuses Routes
app.get('/api/instructor/excuses', authenticate, getInstructorExcuses);
app.post('/api/instructor/excuses/:id/resolve', authenticate, resolveExcuse);

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err);
  res.status(500).json({
    error: {
      code: 'SERVER_ERROR',
      message: 'Ocurrió un error inesperado en el servidor.'
    }
  });
});

// Start Server and Initialize DB
await initDb();

if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`Backend server running at http://localhost:${PORT}`);
  });
}

export default app;
