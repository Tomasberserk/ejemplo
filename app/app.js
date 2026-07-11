// State Management
let state = {
  apiUrl: 'http://localhost:4000',
  token: localStorage.getItem('token') || '',
  person: JSON.parse(localStorage.getItem('person') || 'null'),
  activeSession: null,
  activeTab: 'control', // 'control' or 'report'
  qrcode: null,
  refreshInterval: null,
  countdownInterval: null,
  qrRotationInterval: null
};

// DOM Elements
const apiUrlInput = document.getElementById('apiUrlInput');
const apiStatusDot = document.getElementById('apiStatusDot');

const loginScreen = document.getElementById('loginScreen');
const dashboardScreen = document.getElementById('dashboardScreen');
const loginForm = document.getElementById('loginForm');
const loginDoc = document.getElementById('loginDoc');
const loginPassword = document.getElementById('loginPassword');
const loginFeedback = document.getElementById('loginFeedback');

const userInfo = document.getElementById('userInfo');
const userName = document.getElementById('userName');
const btnLogout = document.getElementById('btnLogout');

const activeFichaName = document.getElementById('activeFichaName');
const btnTabControl = document.getElementById('btnTabControl');
const btnTabReport = document.getElementById('btnTabReport');
const tabContentControl = document.getElementById('tabContentControl');
const tabContentReport = document.getElementById('tabContentReport');

const sessionSetupForm = document.getElementById('sessionSetupForm');
const selectFicha = document.getElementById('selectFicha');
const inputQrTtl = document.getElementById('inputQrTtl');
const btnCreateRoom = document.getElementById('btnCreateRoom');

const activeSessionController = document.getElementById('activeSessionController');
const roomCountdown = document.getElementById('roomCountdown');
const roomStatusBadge = document.getElementById('roomStatusBadge');
const btnReopenRoom = document.getElementById('btnReopenRoom');
const btnCloseSession = document.getElementById('btnCloseSession');
const btnNewRoom = document.getElementById('btnNewRoom');

const qrCodeCard = document.getElementById('qrCodeCard');
const qrRotationCount = document.getElementById('qrRotationCount');
const rejectionsCard = document.getElementById('rejectionsCard');
const rejectionsList = document.getElementById('rejectionsList');

const attendanceGridBody = document.getElementById('attendanceGridBody');
const btnRefreshGrid = document.getElementById('btnRefreshGrid');
const reportGridBody = document.getElementById('reportGridBody');
const btnPrintReport = document.getElementById('btnPrintReport');

// Initialize API configuration
apiUrlInput.value = localStorage.getItem('apiUrl') || 'http://localhost:4000';
state.apiUrl = apiUrlInput.value;

apiUrlInput.addEventListener('change', () => {
  state.apiUrl = apiUrlInput.value.trim();
  localStorage.setItem('apiUrl', state.apiUrl);
  checkApiHealth();
});

async function checkApiHealth() {
  try {
    const res = await fetch(`${state.apiUrl}/health`);
    if (res.ok) {
      apiStatusDot.className = 'w-2 h-2 bg-green-500 rounded-full animate-pulse';
      return true;
    }
  } catch (err) {
    apiStatusDot.className = 'w-2 h-2 bg-red-500 rounded-full';
  }
  return false;
}

// App Initialization
document.addEventListener('DOMContentLoaded', () => {
  checkApiHealth();
  if (state.token && state.person) {
    showDashboard();
  } else {
    showLogin();
  }
});

// Authentication handlers
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  loginFeedback.classList.add('hidden');
  
  const doc = loginDoc.value.trim();
  const pass = loginPassword.value.trim();

  try {
    const res = await fetch(`${state.apiUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ documento: doc, password: pass })
    });

    const result = await res.json();
    if (res.ok) {
      state.token = result.data.token;
      state.person = result.data.person;
      localStorage.setItem('token', state.token);
      localStorage.setItem('person', JSON.stringify(state.person));
      showDashboard();
    } else {
      loginFeedback.textContent = result.error.message || 'Error al iniciar sesión.';
      loginFeedback.classList.remove('hidden');
    }
  } catch (err) {
    loginFeedback.textContent = 'Error de conexión con el servidor.';
    loginFeedback.classList.remove('hidden');
  }
});

btnLogout.addEventListener('click', () => {
  state.token = '';
  state.person = null;
  state.activeSession = null;
  localStorage.removeItem('token');
  localStorage.removeItem('person');
  stopSessionPolling();
  showLogin();
});

function showLogin() {
  loginScreen.classList.remove('hidden');
  dashboardScreen.classList.add('hidden');
  userInfo.classList.add('hidden');
}

function showDashboard() {
  loginScreen.classList.add('hidden');
  dashboardScreen.classList.remove('hidden');
  userInfo.classList.remove('hidden');
  userName.textContent = state.person.nombre;
  loadFichas();
  checkForActiveSession();
}

// Load Fichas into dropdown
async function loadFichas() {
  try {
    // 1. Get SENA institution ID
    const resInst = await fetch(`${state.apiUrl}/api/institutions`, {
      headers: { 'Authorization': `Bearer ${state.token}` }
    });
    const instData = await resInst.json();
    if (!resInst.ok) throw new Error(instData.error.message);

    const sena = instData.data.find(inst => inst.code === 'SENA');
    if (!sena) throw new Error('No se encontró institución SENA.');

    // 2. Load units (Fichas)
    const resUnits = await fetch(`${state.apiUrl}/api/institutions/${sena.id}/units`, {
      headers: { 'Authorization': `Bearer ${state.token}` }
    });
    const unitsData = await resUnits.json();
    if (!resUnits.ok) throw new Error(unitsData.error.message);

    selectFicha.innerHTML = '<option value="">-- Seleccione una Ficha --</option>';
    unitsData.data.forEach(unit => {
      selectFicha.innerHTML += `<option value="${unit.id}">${unit.code} - ${unit.name}</option>`;
    });

  } catch (err) {
    console.error('Error loading Fichas:', err);
    selectFicha.innerHTML = '<option value="">Error al cargar Fichas</option>';
  }
}

// Check if there is an active session running
async function checkForActiveSession() {
  try {
    const res = await fetch(`${state.apiUrl}/api/sessions`, {
      headers: { 'Authorization': `Bearer ${state.token}` }
    });
    const result = await res.json();
    if (res.ok && result.data && result.data.length > 0) {
      // Find the most recent active or draft session
      const latest = result.data[0];
      if (latest.status === 'active') {
        state.activeSession = latest;
        startSessionPolling();
      }
    }
  } catch (err) {
    console.error('Error checking sessions:', err);
  }
}

// Room Creation
btnCreateRoom.addEventListener('click', async () => {
  const unitId = selectFicha.value;
  const qrTtl = parseInt(inputQrTtl.value) || 15;

  if (!unitId) {
    alert('Por favor seleccione una ficha.');
    return;
  }

  try {
    const res = await fetch(`${state.apiUrl}/room/create`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${state.token}` 
      },
      body: JSON.stringify({
        institutionId: state.person.institutionId,
        unitId,
        qrTtlMinutes: qrTtl
      })
    });

    const result = await res.json();
    if (res.ok) {
      state.activeSession = result.data;
      startSessionPolling();
    } else {
      alert(`Error: ${result.error.message}`);
    }
  } catch (err) {
    alert('Error al abrir la sala.');
  }
});

// Reopen Room
btnReopenRoom.addEventListener('click', async () => {
  if (!state.activeSession) return;

  try {
    const res = await fetch(`${state.apiUrl}/room/reopen`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${state.token}`
      },
      body: JSON.stringify({ sessionId: state.activeSession.id })
    });

    const result = await res.json();
    if (res.ok) {
      state.activeSession = result.data;
      alert('Sala reabierta por 15 minutos para registrar salidas.');
      startSessionPolling();
    } else {
      alert(`Error: ${result.error.message}`);
    }
  } catch (err) {
    alert('Error al reabrir la sala.');
  }
});

// Close Session Manual
btnCloseSession.addEventListener('click', async () => {
  if (!state.activeSession) return;
  if (!confirm('¿Está seguro de cerrar la sala? Los aprendices no podrán registrar más asistencia.')) return;

  try {
    const res = await fetch(`${state.apiUrl}/api/sessions/${state.activeSession.id}/close`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${state.token}` }
    });

    const result = await res.json();
    if (res.ok) {
      state.activeSession = result.data;
      alert('Sala cerrada exitosamente.');
      stopSessionPolling();
      updateControllerView();
      fetchRealTimeAttendance();
    } else {
      alert(`Error: ${result.error.message}`);
    }
  } catch (err) {
    alert('Error al cerrar la sala.');
  }
});

// Polling and timers
function startSessionPolling() {
  updateControllerView();
  fetchRealTimeAttendance();

  // Polling grid and rejections every 10 seconds
  state.refreshInterval = setInterval(() => {
    fetchRealTimeAttendance();
  }, 10000);

  // QR rotation polling every 15 seconds
  rotateQrCode();
  state.qrRotationInterval = setInterval(() => {
    rotateQrCode();
  }, 15000);

  // Room expiration countdown every 1 second
  startRoomCountdown();
}

function stopSessionPolling() {
  if (state.refreshInterval) clearInterval(state.refreshInterval);
  if (state.qrRotationInterval) clearInterval(state.qrRotationInterval);
  if (state.countdownInterval) clearInterval(state.countdownInterval);
  
  state.refreshInterval = null;
  state.qrRotationInterval = null;
  state.countdownInterval = null;
  
  // Clean QR Container
  document.getElementById('qrcode').innerHTML = '';
}

function updateControllerView() {
  if (state.activeSession) {
    sessionSetupForm.classList.add('hidden');
    activeSessionController.classList.remove('hidden');
    rejectionsCard.classList.remove('hidden');

    const selectedOption = selectFicha.querySelector(`option[value="${state.activeSession.unit_id}"]`);
    activeFichaName.textContent = selectedOption ? `Ficha ${selectedOption.textContent}` : `Ficha ${state.activeSession.unit_id}`;

    // Manage status indicators
    if (state.activeSession.status === 'active') {
      qrCodeCard.classList.remove('hidden');
      btnNewRoom.classList.add('hidden');
      btnCloseSession.classList.remove('hidden');
      roomStatusBadge.textContent = state.activeSession.is_reopened ? 'REGISTRO SALIDA' : 'REGISTRO ENTRADA';
      roomStatusBadge.className = state.activeSession.is_reopened 
        ? 'inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20'
        : 'inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-green-500/10 text-green-400 border border-green-500/20';
    } else {
      qrCodeCard.classList.add('hidden');
      btnNewRoom.classList.remove('hidden');
      btnCloseSession.classList.add('hidden');
      btnReopenRoom.classList.add('hidden');
      roomStatusBadge.textContent = 'CERRADA';
      roomStatusBadge.className = 'inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-500/10 text-red-400 border border-red-500/20';
    }
  } else {
    sessionSetupForm.classList.remove('hidden');
    activeSessionController.classList.add('hidden');
    qrCodeCard.classList.add('hidden');
    rejectionsCard.classList.add('hidden');
    btnNewRoom.classList.add('hidden');
    activeFichaName.textContent = 'Seleccione una Ficha para Iniciar';
  }
}

async function rotateQrCode() {
  if (!state.activeSession || state.activeSession.status !== 'active') return;

  try {
    const res = await fetch(`${state.apiUrl}/api/sessions/${state.activeSession.id}/qr-token`, {
      headers: { 'Authorization': `Bearer ${state.token}` }
    });
    const data = await res.json();
    if (res.ok) {
      const qrUrl = `${state.apiUrl}/attendance/${data.qrToken}`;
      
      // Clear container and render QR
      const qrContainer = document.getElementById('qrcode');
      qrContainer.innerHTML = '';
      state.qrcode = new QRCode(qrContainer, {
        text: qrUrl,
        width: 192,
        height: 192,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
      });

      // Start 15s visual countdown
      let remaining = data.expiresSec;
      qrRotationCount.textContent = `${remaining}s`;
      
      if (window.rotationTimer) clearInterval(window.rotationTimer);
      window.rotationTimer = setInterval(() => {
        remaining--;
        if (remaining <= 0) {
          clearInterval(window.rotationTimer);
        }
        qrRotationCount.textContent = `${remaining}s`;
      }, 1000);
    }
  } catch (err) {
    console.error('Error rotating QR token:', err);
  }
}

function startRoomCountdown() {
  if (state.countdownInterval) clearInterval(state.countdownInterval);

  state.countdownInterval = setInterval(() => {
    if (!state.activeSession) return;

    const expiresAt = new Date(state.activeSession.room_expires_at).getTime();
    const now = Date.now();
    const diff = expiresAt - now;

    if (diff <= 0 || state.activeSession.status === 'closed') {
      clearInterval(state.countdownInterval);
      roomCountdown.textContent = '00:00';
      qrCodeCard.classList.add('hidden');
      btnNewRoom.classList.remove('hidden');
      btnCloseSession.classList.add('hidden');
      
      // Update badge dynamically
      roomStatusBadge.textContent = 'TIEMPO EXPIRADO';
      roomStatusBadge.className = 'inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-orange-500/10 text-orange-400 border border-orange-500/20';

      // Show reopen room button if it hasn't been closed manually
      if (state.activeSession.status === 'active') {
        btnReopenRoom.classList.remove('hidden');
      }
      return;
    }

    btnReopenRoom.classList.add('hidden'); // Hide reopen if time remains
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    roomCountdown.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, 1000);
}

// Fetch Real-time present, absent and rejections
async function fetchRealTimeAttendance() {
  if (!state.activeSession) return;

  try {
    // 1. Fetch Present
    const resP = await fetch(`${state.apiUrl}/api/sessions/${state.activeSession.id}/present`, {
      headers: { 'Authorization': `Bearer ${state.token}` }
    });
    const presents = await resP.json();

    // 2. Fetch Absent
    const resA = await fetch(`${state.apiUrl}/api/sessions/${state.activeSession.id}/absent`, {
      headers: { 'Authorization': `Bearer ${state.token}` }
    });
    const absents = await resA.json();

    // 3. Fetch Rejections
    const resR = await fetch(`${state.apiUrl}/api/sessions/${state.activeSession.id}/rejections`, {
      headers: { 'Authorization': `Bearer ${state.token}` }
    });
    const rejections = await resR.json();

    renderGrid(presents.data || [], absents.data || []);
    renderRejections(rejections.data || []);

    if (state.activeTab === 'report') {
      fetchReportData();
    }

  } catch (err) {
    console.error('Error fetching attendance details:', err);
  }
}

// Render real-time grid
function renderGrid(presents, absents) {
  attendanceGridBody.innerHTML = '';

  if (presents.length === 0 && absents.length === 0) {
    attendanceGridBody.innerHTML = `
      <tr>
        <td colspan="8" class="text-center py-8 text-slate-500">No hay aprendices inscritos en esta ficha.</td>
      </tr>
    `;
    return;
  }

  // Render Presents
  presents.forEach(p => {
    let badgeClass = 'bg-green-500/10 text-green-400 border border-green-500/20';
    if (p.status === 'ASISTENCIA_PARCIAL') badgeClass = 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20';
    if (p.status === 'PRESENTE') badgeClass = 'bg-[#39A900]/20 text-[#39A900] border border-[#39A900]/30';

    attendanceGridBody.innerHTML += `
      <tr class="hover:bg-slate-900/20 border-b border-slate-800/40">
        <td class="py-3 px-4 font-medium text-slate-200">${p.nombre}</td>
        <td class="py-3 px-4 text-slate-400 font-mono">${p.documento}</td>
        <td class="py-3 px-4 text-slate-300 font-mono">${p.hora_ingreso_real || '-'}</td>
        <td class="py-3 px-4 text-slate-300 font-mono">${p.hora_salida_real || '-'}</td>
        <td class="py-3 px-4 text-center text-slate-300">${p.horas_validadas_asistencia} / ${p.horas_programadas_sesion}h</td>
        <td class="py-3 px-4 text-center text-xs font-mono text-slate-400">${p.tipo_registro}</td>
        <td class="py-3 px-4">
          <span class="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${badgeClass}">${p.status}</span>
        </td>
        <td class="py-3 px-4 text-center">
          <div class="flex items-center justify-center gap-1.5">
            <button onclick="triggerManualOverride('${p.documento}', 6, 0, 'MANUAL_OVERRIDE')" class="text-xs bg-slate-800 hover:bg-slate-700 text-[#39A900] border border-[#39A900]/20 px-2 py-1 rounded-md transition-all">
              Quitar Falla
            </button>
          </div>
        </td>
      </tr>
    `;
  });

  // Render Absents
  absents.forEach(a => {
    attendanceGridBody.innerHTML += `
      <tr class="hover:bg-slate-900/20 border-b border-slate-800/40">
        <td class="py-3 px-4 font-medium text-slate-300">${a.nombre}</td>
        <td class="py-3 px-4 text-slate-400 font-mono">${a.documento}</td>
        <td class="py-3 px-4 text-slate-600 font-mono">-</td>
        <td class="py-3 px-4 text-slate-600 font-mono">-</td>
        <td class="py-3 px-4 text-center text-red-400">0 / 6h</td>
        <td class="py-3 px-4 text-center text-xs text-slate-600">-</td>
        <td class="py-3 px-4">
          <span class="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-500/10 text-red-400 border border-red-500/20">FALLA_TOTAL</span>
        </td>
        <td class="py-3 px-4 text-center">
          <div class="flex items-center justify-center gap-1.5">
            <button onclick="triggerManualLateCheckin('${a.documento}')" class="text-xs bg-orange-950/20 hover:bg-orange-950/40 border border-orange-500/20 text-orange-400 px-2 py-1 rounded-md transition-all">
              Ingreso Retardado
            </button>
            <button onclick="triggerManualOverride('${a.documento}', 6, 0, 'MANUAL_OVERRIDE')" class="text-xs bg-slate-800 hover:bg-slate-700 text-[#39A900] border border-[#39A900]/20 px-2 py-1 rounded-md transition-all">
              Forzar Presente
            </button>
          </div>
        </td>
      </tr>
    `;
  });
}

function renderRejections(rejections) {
  rejectionsList.innerHTML = '';
  if (rejections.length === 0) {
    rejectionsList.innerHTML = '<div class="p-2.5 bg-slate-950/40 rounded-xl border border-slate-800/40">Sin rechazos recientes.</div>';
    return;
  }

  rejections.slice(0, 5).forEach(r => {
    const time = new Date(r.created_at).toLocaleTimeString();
    rejectionsList.innerHTML += `
      <div class="p-2.5 bg-red-950/15 rounded-xl border border-red-500/10 flex flex-col gap-0.5">
        <div class="flex justify-between font-semibold">
          <span class="text-red-400 font-mono">${r.documento}</span>
          <span class="text-[10px] text-slate-500 font-mono">${time}</span>
        </div>
        <div class="text-[11px] text-slate-300 font-medium">Motivo: <span class="font-bold text-red-300">${r.reject_reason}</span></div>
        <div class="text-[10px] text-slate-500">IP: ${r.client_ip}</div>
      </div>
    `;
  });
}

// Action triggers bound to window for onclick in HTML template
window.triggerManualOverride = async (documento, validadas, falladas, tipo) => {
  if (!state.activeSession) return;
  
  try {
    const res = await fetch(`${state.apiUrl}/attendance/manual-override`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${state.token}`
      },
      body: JSON.stringify({
        sessionId: state.activeSession.id,
        documento,
        horas_validadas_asistencia: validadas,
        horas_inasistencia_acumulada: falladas,
        tipo_registro: tipo
      })
    });

    if (res.ok) {
      fetchRealTimeAttendance();
    } else {
      const err = await res.json();
      alert(`Error: ${err.error.message}`);
    }
  } catch (err) {
    alert('Error al realizar override manual.');
  }
};

window.triggerManualLateCheckin = async (documento) => {
  if (!state.activeSession) return;

  try {
    const res = await fetch(`${state.apiUrl}/attendance/manual-checkin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${state.token}`
      },
      body: JSON.stringify({
        sessionId: state.activeSession.id,
        documento
      })
    });

    if (res.ok) {
      fetchRealTimeAttendance();
    } else {
      const err = await res.json();
      alert(`Error: ${err.error.message}`);
    }
  } catch (err) {
    alert('Error al registrar ingreso retardado.');
  }
};

btnRefreshGrid.addEventListener('click', () => {
  fetchRealTimeAttendance();
});

// TAB VIEW CONTROLLERS
btnTabControl.addEventListener('click', () => {
  state.activeTab = 'control';
  btnTabControl.className = 'tab-btn px-4 py-2 text-xs font-semibold rounded-lg bg-[#39A900] text-white transition-all';
  btnTabReport.className = 'tab-btn px-4 py-2 text-xs font-semibold rounded-lg text-slate-400 hover:text-white transition-all';
  tabContentControl.classList.remove('hidden');
  tabContentReport.classList.add('hidden');
});

btnTabReport.addEventListener('click', () => {
  state.activeTab = 'report';
  btnTabReport.className = 'tab-btn px-4 py-2 text-xs font-semibold rounded-lg bg-[#39A900] text-white transition-all';
  btnTabControl.className = 'tab-btn px-4 py-2 text-xs font-semibold rounded-lg text-slate-400 hover:text-white transition-all';
  tabContentControl.classList.add('hidden');
  tabContentReport.classList.remove('hidden');
  fetchReportData();
});

// Report View Fetch
async function fetchReportData() {
  if (!state.activeSession) return;

  try {
    const res = await fetch(`${state.apiUrl}/reports/session/${state.activeSession.id}`, {
      headers: { 'Authorization': `Bearer ${state.token}` }
    });
    const reportData = await res.json();
    if (res.ok) {
      renderReportGrid(reportData);
    }
  } catch (err) {
    console.error('Error fetching report data:', err);
  }
}

function renderReportGrid(data) {
  reportGridBody.innerHTML = '';
  if (data.length === 0) {
    reportGridBody.innerHTML = '<tr><td colspan="8" class="text-center py-8 text-slate-500">Ningún dato disponible.</td></tr>';
    return;
  }

  data.forEach(r => {
    let pctBadge = 'bg-red-500/10 text-red-400 border border-red-500/20';
    if (r.porcentaje_asistencia >= 80) pctBadge = 'bg-green-500/10 text-green-400 border border-green-500/20';
    else if (r.porcentaje_asistencia > 0) pctBadge = 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20';

    reportGridBody.innerHTML += `
      <tr class="hover:bg-slate-900/20 border-b border-slate-800/40">
        <td class="py-3.5 px-4 font-medium text-slate-200">${r.nombre}</td>
        <td class="py-3.5 px-4 text-slate-400 font-mono">${r.documento}</td>
        <td class="py-3.5 px-4 text-center font-mono">${r.horas_programadas}h</td>
        <td class="py-3.5 px-4 text-center font-mono text-green-400">${r.horas_asistidas}h</td>
        <td class="py-3.5 px-4 text-center font-mono text-red-400">${r.horas_falla}h</td>
        <td class="py-3.5 px-4 text-center">
          <span class="inline-flex px-2 py-0.5 rounded-full text-xs font-bold font-mono ${pctBadge}">${r.porcentaje_asistencia}%</span>
        </td>
        <td class="py-3.5 px-4 text-slate-400 font-mono text-xs">${r.tipo_registro}</td>
        <td class="py-3.5 px-4 text-slate-400 font-mono text-xs">${r.hora_ingreso} / ${r.hora_salida}</td>
      </tr>
    `;
  });
}

// Print report
btnPrintReport.addEventListener('click', () => {
  window.print();
});

// Create new session flow
btnNewRoom.addEventListener('click', () => {
  state.activeSession = null;
  stopSessionPolling();
  updateControllerView();
  
  // Reset grids
  attendanceGridBody.innerHTML = `
    <tr>
      <td colspan="8" class="text-center py-8 text-slate-500">Seleccione una Ficha e inicie la sesión de clase.</td>
    </tr>
  `;
  reportGridBody.innerHTML = `
    <tr>
      <td colspan="8" class="text-center py-8 text-slate-500">Inicie la sesión para consolidar el reporte.</td>
    </tr>
  `;
});
