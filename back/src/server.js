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
  <title>Registrar Asistencia - SENA</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700;800&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Outfit', sans-serif; background: radial-gradient(ellipse at top, #0d2010 0%, #060d0a 100%); min-height: 100vh; }
    .glass { background: rgba(255,255,255,0.03); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid rgba(57,169,0,0.12); }
    .pulse-ring { animation: pulse-ring 2s ease-out infinite; }
    @keyframes pulse-ring {
      0% { box-shadow: 0 0 0 0 rgba(57,169,0,0.4); }
      70% { box-shadow: 0 0 0 20px rgba(57,169,0,0); }
      100% { box-shadow: 0 0 0 0 rgba(57,169,0,0); }
    }
    .slide-up { animation: slideUp 0.4s ease-out; }
    @keyframes slideUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
  </style>
</head>
<body class="flex items-center justify-center p-4 text-slate-100">
  <div class="w-full max-w-sm slide-up">
    
    <!-- Card -->
    <div class="glass rounded-3xl p-8 shadow-2xl relative overflow-hidden">
      <!-- Glows -->
      <div class="absolute -top-12 -right-12 w-40 h-40 bg-[#39A900] opacity-10 rounded-full blur-3xl pointer-events-none"></div>
      <div class="absolute -bottom-12 -left-12 w-40 h-40 bg-[#003049] opacity-20 rounded-full blur-3xl pointer-events-none"></div>

      <!-- Header -->
      <div class="text-center mb-8 relative z-10">
        <div class="inline-flex p-4 bg-[#39A900]/10 border border-[#39A900]/20 rounded-2xl mb-5 pulse-ring">
          <svg class="w-9 h-9 text-[#39A900]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </div>
        <h1 class="text-2xl font-bold tracking-tight text-white">Registrar Asistencia</h1>
        <p class="text-slate-400 text-sm mt-1.5">SENA · Ingresa tu número de documento</p>
      </div>

      <!-- Feedback -->
      <div id="feedback" class="hidden mb-5 p-4 rounded-2xl text-sm font-semibold text-center relative z-10"></div>

      <!-- Form -->
      <form id="checkinForm" class="space-y-5 relative z-10">
        <div>
          <label for="documento" class="block text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wider">
            Número de Documento
          </label>
          <input 
            type="number"
            id="documento"
            name="documento"
            required
            inputmode="numeric"
            autocomplete="off"
            placeholder="Ej: 1077228780"
            class="w-full bg-slate-950/60 border border-slate-700/60 rounded-2xl px-4 py-4 text-lg font-semibold text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-[#39A900] focus:border-transparent transition-all text-center tracking-widest"
          >
        </div>

        <button
          type="submit"
          id="btnSubmit"
          class="w-full bg-[#39A900] hover:bg-[#45c400] active:scale-[0.97] text-white font-bold py-4 px-4 rounded-2xl transition-all shadow-xl shadow-[#39A900]/25 flex items-center justify-center gap-2 text-base"
        >
          <span id="btnText">Confirmar Asistencia</span>
          <svg id="btnSpinner" class="hidden animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </button>
      </form>

      <!-- Footer note -->
      <p class="mt-7 text-center text-[10px] text-slate-600 relative z-10 border-t border-slate-800/50 pt-5">
        🔒 Verificación por Token QR Rotativo · Solo funciona en la red del aula
      </p>
    </div>
  </div>

  <script>
    const form = document.getElementById('checkinForm');
    const feedback = document.getElementById('feedback');
    const btnSubmit = document.getElementById('btnSubmit');
    const btnText = document.getElementById('btnText');
    const btnSpinner = document.getElementById('btnSpinner');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const doc = document.getElementById('documento').value.trim();
      if (!doc) return;

      btnSubmit.disabled = true;
      btnText.textContent = 'Registrando...';
      btnSpinner.classList.remove('hidden');
      feedback.className = 'hidden';

      try {
        const res = await fetch('/public/attendance/${token}/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ documento: doc })
        });

        const result = await res.json();

        if (res.ok) {
          const status = result.data?.status || 'accepted';
          const horas = result.data?.horas_validadas_asistencia ?? '—';
          const tipo = result.data?.tipo_registro ?? '';

          let icon = '✅';
          let msg = '¡Asistencia registrada correctamente!';
          if (status === 'ASISTENCIA_PARCIAL') {
            icon = '⏱️';
            msg = 'Llegaste tarde. Se registraron ' + horas + 'h de asistencia.';
          } else if (tipo === 'SALIDA') {
            icon = '👋';
            msg = 'Salida registrada. ¡Hasta la próxima!';
          }

          showFeedback(icon + ' ' + msg, 'success');
          form.reset();
        } else {
          const errMsg = result.error ? result.error.message : 'Error al procesar asistencia.';
          showFeedback('❌ ' + errMsg, 'error');
        }
      } catch (err) {
        showFeedback('❌ Error de conexión con el servidor.', 'error');
      } finally {
        btnSubmit.disabled = false;
        btnText.textContent = 'Confirmar Asistencia';
        btnSpinner.classList.add('hidden');
      }
    });

    function showFeedback(msg, type) {
      feedback.textContent = msg;
      if (type === 'success') {
        feedback.className = 'p-4 rounded-2xl text-sm font-semibold text-center bg-green-500/10 text-green-400 border border-green-500/20 mb-5';
      } else {
        feedback.className = 'p-4 rounded-2xl text-sm font-semibold text-center bg-red-500/10 text-red-400 border border-red-500/20 mb-5';
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
