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
  getSessionReport
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
  <title>Registro de Asistencia - SENA</title>
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

    <div class="text-center mb-8 relative z-10">
      <div class="inline-flex p-3 bg-[#39A900]/10 rounded-2xl mb-4">
        <svg class="w-8 h-8 text-[#39A900]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path>
        </svg>
      </div>
      <h1 class="text-2xl font-bold tracking-tight">Registro de Asistencia</h1>
      <p class="text-slate-400 text-sm mt-1">Servicio Nacional de Aprendizaje — SENA</p>
    </div>

    <!-- Feedback alert container -->
    <div id="feedback" class="hidden mb-6 p-4 rounded-xl text-sm font-semibold text-center transition-all duration-300"></div>

    <form id="checkinForm" class="space-y-6 relative z-10">
      <div>
        <label for="documento" class="block text-sm font-medium text-slate-300 mb-2">Documento de Identidad</label>
        <input 
          type="text" 
          id="documento" 
          name="documento" 
          required 
          autocomplete="off"
          placeholder="Ingrese su número de documento"
          class="w-full bg-slate-900/50 border border-slate-700/60 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#39A900] focus:border-transparent transition-all"
        >
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

    <div class="mt-8 text-center text-xs text-slate-500 relative z-10 border-t border-slate-800/60 pt-4">
      Esta sesión está protegida por Geolocalización LAN y Token Rotativo.
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

      // Loading state
      btnSubmit.disabled = true;
      btnText.textContent = 'Registrando...';
      btnSpinner.classList.remove('hidden');
      feedback.className = 'hidden';

      try {
        const res = await fetch('/public/attendance/${token}/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ documento: doc })
        });

        const result = await res.json();

        if (res.ok) {
          feedback.textContent = '¡Asistencia registrada con éxito!';
          feedback.className = 'p-4 rounded-xl text-sm font-semibold text-center bg-green-500/10 text-green-400 border border-green-500/20 mb-6';
          form.reset();
        } else {
          const errMsg = result.error ? result.error.message : 'Error al registrar asistencia.';
          feedback.textContent = errMsg;
          feedback.className = 'p-4 rounded-xl text-sm font-semibold text-center bg-red-500/10 text-red-400 border border-red-500/20 mb-6';
        }
      } catch (err) {
        feedback.textContent = 'Error de conexión con el servidor.';
        feedback.className = 'p-4 rounded-xl text-sm font-semibold text-center bg-red-500/10 text-red-400 border border-red-500/20 mb-6';
      } finally {
        btnSubmit.disabled = false;
        btnText.textContent = 'Registrar Asistencia';
        btnSpinner.classList.add('hidden');
      }
    });
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
