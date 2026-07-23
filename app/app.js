// State Management
let state = {
  apiUrl: window.location.origin,
  token: localStorage.getItem('token') || '',
  person: JSON.parse(localStorage.getItem('person') || 'null'),
  activeSession: null,
  activeTab: 'control', // 'control' or 'report'
  qrcode: null,
  refreshInterval: null,
  countdownInterval: null,
  qrRotationInterval: null,
  searchQuery: '',
  presentsList: [],
  absentsList: []
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
const btnDownloadPdfReport = document.getElementById('btnDownloadPdfReport');
const btnSubmitEvidence = document.getElementById('btnSubmitEvidence');

// Student Dashboard & Excuses Elements
const studentDashboardScreen = document.getElementById('studentDashboardScreen');
const studentFichaName = document.getElementById('studentFichaName');
const studentTotalHours = document.getElementById('studentTotalHours');
const studentHistoryGridBody = document.getElementById('studentHistoryGridBody');
const btnRefreshStudent = document.getElementById('btnRefreshStudent');

const excuseModal = document.getElementById('excuseModal');
const excuseForm = document.getElementById('excuseForm');
const excuseSessionId = document.getElementById('excuseSessionId');
const excuseText = document.getElementById('excuseText');
const excuseFile = document.getElementById('excuseFile');
const btnCancelExcuse = document.getElementById('btnCancelExcuse');

const btnTabExcuses = document.getElementById('btnTabExcuses');
const tabContentExcuses = document.getElementById('tabContentExcuses');
const instructorExcusesGridBody = document.getElementById('instructorExcusesGridBody');

const btnTabLateRequests = document.getElementById('btnTabLateRequests');
const tabContentLateRequests = document.getElementById('tabContentLateRequests');
const lateRequestsLoading = document.getElementById('lateRequestsLoading');

// Coordinator Elements
const coordDashboardScreen = document.getElementById('coordDashboardScreen');
const btnCoordTabInstructors = document.getElementById('btnCoordTabInstructors');
const btnCoordTabFichas = document.getElementById('btnCoordTabFichas');
const btnCoordTabEvidences = document.getElementById('btnCoordTabEvidences');
const tabContentInstructors = document.getElementById('tabContentInstructors');
const tabContentFichas = document.getElementById('tabContentFichas');
const tabContentEvidences = document.getElementById('tabContentEvidences');
const coordInstructorsGridBody = document.getElementById('coordInstructorsGridBody');
const coordFichasGridBody = document.getElementById('coordFichasGridBody');
const coordEvidencesGridBody = document.getElementById('coordEvidencesGridBody');

const btnNewInstructor = document.getElementById('btnNewInstructor');
const btnNewFicha = document.getElementById('btnNewFicha');
const instructorModal = document.getElementById('instructorModal');
const fichaModal = document.getElementById('fichaModal');
const instructorForm = document.getElementById('instructorForm');
const fichaForm = document.getElementById('fichaForm');
const btnCancelInstructor = document.getElementById('btnCancelInstructor');
const btnCancelFicha = document.getElementById('btnCancelFicha');

const instructorModalTitle = document.getElementById('instructorModalTitle');
const instructorEditId = document.getElementById('instructorEditId');
const instNombre = document.getElementById('instNombre');
const instDocumento = document.getElementById('instDocumento');
const instPassword = document.getElementById('instPassword');
const instActiveWrapper = document.getElementById('instActiveWrapper');
const instActive = document.getElementById('instActive');

const fichaModalTitle = document.getElementById('fichaModalTitle');
const fichaEditId = document.getElementById('fichaEditId');
const fichaCode = document.getElementById('fichaCode');
const fichaName = document.getElementById('fichaName');
const fichaActiveWrapper = document.getElementById('fichaActiveWrapper');
const fichaActive = document.getElementById('fichaActive');

// Search & Bulk Elements
const searchStudentInput = document.getElementById('searchStudentInput');
const btnBulkMarkPresent = document.getElementById('btnBulkMarkPresent');

// Initialize API configuration
apiUrlInput.value = localStorage.getItem('apiUrl') || window.location.origin;
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

// HTML5 QR Scanner Instance
let html5QrCode = null;

// App Initialization
document.addEventListener('DOMContentLoaded', () => {
  checkApiHealth();
  
  // Bind Portal Buttons
  document.getElementById('btnGoToScanner').addEventListener('click', startQrScanner);
  document.getElementById('btnGoToLogin').addEventListener('click', showLogin);
  document.getElementById('btnCancelScanner').addEventListener('click', showPortal);

  // Manual code from scanner screen
  document.getElementById('btnScannerManualGo').addEventListener('click', () => {
    const code = document.getElementById('scannerManualCode').value.trim().toUpperCase();
    if (code.length < 6) {
      const fb = document.getElementById('scannerFeedback');
      fb.textContent = 'Ingresa el código completo de 6 caracteres.';
      fb.className = 'p-3 rounded-xl text-center text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20';
      fb.classList.remove('hidden');
      return;
    }
    stopQrScanner();
    window.location.href = `/attendance/${code}`;
  });
  document.getElementById('scannerManualCode').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') document.getElementById('btnScannerManualGo').click();
  });

  // Coordinator Tab bindings
  btnCoordTabInstructors.addEventListener('click', () => {
    btnCoordTabInstructors.className = "px-4 py-2.5 text-sm font-semibold border-b-2 border-[#39A900] text-white transition-all";
    btnCoordTabFichas.className = "px-4 py-2.5 text-sm font-semibold border-b-2 border-transparent text-slate-400 hover:text-white transition-all";
    btnCoordTabEvidences.className = "px-4 py-2.5 text-sm font-semibold border-b-2 border-transparent text-slate-400 hover:text-white transition-all";
    tabContentInstructors.classList.remove('hidden');
    tabContentFichas.classList.add('hidden');
    tabContentEvidences.classList.add('hidden');
    fetchCoordInstructors();
  });

  btnCoordTabFichas.addEventListener('click', () => {
    btnCoordTabFichas.className = "px-4 py-2.5 text-sm font-semibold border-b-2 border-[#39A900] text-white transition-all";
    btnCoordTabInstructors.className = "px-4 py-2.5 text-sm font-semibold border-b-2 border-transparent text-slate-400 hover:text-white transition-all";
    btnCoordTabEvidences.className = "px-4 py-2.5 text-sm font-semibold border-b-2 border-transparent text-slate-400 hover:text-white transition-all";
    tabContentFichas.classList.remove('hidden');
    tabContentInstructors.classList.add('hidden');
    tabContentEvidences.classList.add('hidden');
    fetchCoordFichas();
  });

  btnCoordTabEvidences.addEventListener('click', () => {
    btnCoordTabEvidences.className = "px-4 py-2.5 text-sm font-semibold border-b-2 border-[#39A900] text-white transition-all";
    btnCoordTabInstructors.className = "px-4 py-2.5 text-sm font-semibold border-b-2 border-transparent text-slate-400 hover:text-white transition-all";
    btnCoordTabFichas.className = "px-4 py-2.5 text-sm font-semibold border-b-2 border-transparent text-slate-400 hover:text-white transition-all";
    tabContentEvidences.classList.remove('hidden');
    tabContentInstructors.classList.add('hidden');
    tabContentFichas.classList.add('hidden');
    fetchCoordEvidences();
  });

  // Coordinator Modal openers
  btnNewInstructor.addEventListener('click', () => {
    instructorModalTitle.textContent = "Registrar Nuevo Instructor";
    instructorEditId.value = "";
    instNombre.value = "";
    instDocumento.value = "";
    instDocumento.disabled = false;
    instPassword.value = "";
    instPassword.required = true;
    instActiveWrapper.classList.add('hidden');
    instructorModal.classList.remove('hidden');
  });

  btnNewFicha.addEventListener('click', () => {
    fichaModalTitle.textContent = "Registrar Nueva Ficha";
    fichaEditId.value = "";
    fichaCode.value = "";
    fichaCode.disabled = false;
    fichaName.value = "";
    fichaActiveWrapper.classList.add('hidden');
    fichaModal.classList.remove('hidden');
  });

  btnCancelInstructor.addEventListener('click', () => instructorModal.classList.add('hidden'));
  btnCancelFicha.addEventListener('click', () => fichaModal.classList.add('hidden'));

  // Coordinator form submits
  instructorForm.addEventListener('submit', handleInstructorSubmit);
  fichaForm.addEventListener('submit', handleFichaSubmit);

  if (state.token && state.person) {
    showDashboard();
  } else {
    showPortal();
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
  showPortal();
});

function handleAuthError(res) {
  if (res.status === 401) {
    state.token = '';
    state.person = null;
    state.activeSession = null;
    localStorage.removeItem('token');
    localStorage.removeItem('person');
    stopSessionPolling();
    showPortal();
    alert('Tu sesión ha expirado o el servidor fue reiniciado. Por favor, inicia sesión de nuevo.');
    return true;
  }
  return false;
}

function showPortal() {
  document.getElementById('portalScreen').classList.remove('hidden');
  document.getElementById('scannerScreen').classList.add('hidden');
  loginScreen.classList.add('hidden');
  dashboardScreen.classList.add('hidden');
  studentDashboardScreen.classList.add('hidden');
  coordDashboardScreen.classList.add('hidden');
  userInfo.classList.add('hidden');
  stopQrScanner();
}

function startQrScanner() {
  document.getElementById('portalScreen').classList.add('hidden');
  document.getElementById('scannerScreen').classList.remove('hidden');
  const feedback = document.getElementById('scannerFeedback');
  feedback.classList.add('hidden');

  html5QrCode = new Html5Qrcode("reader");
  const config = { fps: 10, qrbox: { width: 250, height: 250 } };

  html5QrCode.start(
    { facingMode: "environment" }, 
    config,
    (decodedText) => {
      stopQrScanner();
      try {
        const url = new URL(decodedText);
        const pathParts = url.pathname.split('/');
        const token = pathParts[pathParts.length - 1];
        if (token && (url.pathname.includes('/attendance/') || url.pathname.includes('/attendance'))) {
          window.location.href = `/attendance/${token}`;
        } else {
          feedback.textContent = "QR escaneado no es un código de asistencia válido.";
          feedback.className = "p-3 rounded-xl text-center text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20";
          feedback.classList.remove('hidden');
        }
      } catch (err) {
        if (decodedText.length > 5) {
          window.location.href = `/attendance/${decodedText}`;
        } else {
          feedback.textContent = "Código QR inválido.";
          feedback.className = "p-3 rounded-xl text-center text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20";
          feedback.classList.remove('hidden');
        }
      }
    },
    (errorMessage) => {}
  ).catch(err => {
    feedback.textContent = "Error al acceder a la cámara: " + err;
    feedback.className = "p-3 rounded-xl text-center text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20";
    feedback.classList.remove('hidden');
  });
}

function stopQrScanner() {
  if (html5QrCode && html5QrCode.isScanning) {
    html5QrCode.stop().then(() => {
      html5QrCode = null;
    }).catch(err => console.error("Error stopping scanner", err));
  }
}

function showLogin() {
  document.getElementById('portalScreen').classList.add('hidden');
  document.getElementById('scannerScreen').classList.add('hidden');
  loginScreen.classList.remove('hidden');
  dashboardScreen.classList.add('hidden');
  studentDashboardScreen.classList.add('hidden');
  coordDashboardScreen.classList.add('hidden');
  userInfo.classList.add('hidden');
  stopQrScanner();
}

function showDashboard() {
  document.getElementById('portalScreen').classList.add('hidden');
  document.getElementById('scannerScreen').classList.add('hidden');
  loginScreen.classList.add('hidden');
  userInfo.classList.remove('hidden');
  userName.textContent = state.person.nombre;
  stopQrScanner();

  const roles = state.person.roles || [];
  const isCoord = roles.includes('COORDINADOR');
  const isInstructor = roles.includes('INSTRUCTOR');

  if (isCoord) {
    coordDashboardScreen.classList.remove('hidden');
    dashboardScreen.classList.add('hidden');
    studentDashboardScreen.classList.add('hidden');
    
    // Set active tab to instructors visually
    btnCoordTabInstructors.className = "px-4 py-2.5 text-sm font-semibold border-b-2 border-[#39A900] text-white transition-all";
    btnCoordTabFichas.className = "px-4 py-2.5 text-sm font-semibold border-b-2 border-transparent text-slate-400 hover:text-white transition-all";
    tabContentInstructors.classList.remove('hidden');
    tabContentFichas.classList.add('hidden');

    fetchCoordInstructors();
  } else if (isInstructor) {
    coordDashboardScreen.classList.add('hidden');
    dashboardScreen.classList.remove('hidden');
    studentDashboardScreen.classList.add('hidden');
    loadFichas();
    checkForActiveSession();
    fetchInstructorExcuses();
  } else {
    coordDashboardScreen.classList.add('hidden');
    dashboardScreen.classList.add('hidden');
    studentDashboardScreen.classList.remove('hidden');
    fetchStudentHistory();
  }
}

// Load Fichas into dropdown
async function loadFichas() {
  try {
    // 1. Get SENA institution ID
    const resInst = await fetch(`${state.apiUrl}/api/institutions`, {
      headers: { 'Authorization': `Bearer ${state.token}` }
    });
    if (handleAuthError(resInst)) return;

    const instData = await resInst.json();
    if (!resInst.ok) throw new Error(instData.error.message);

    const sena = instData.data.find(inst => inst.code === 'SENA');
    if (!sena) throw new Error('No se encontró institución SENA.');

    // 2. Load units (Fichas)
    const resUnits = await fetch(`${state.apiUrl}/api/institutions/${sena.id}/units`, {
      headers: { 'Authorization': `Bearer ${state.token}` }
    });
    if (handleAuthError(resUnits)) return;

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
    if (handleAuthError(res)) return;

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
  const ipCheckEnabled = document.getElementById('inputIpCheckEnabled').checked;

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
        qrTtlMinutes: qrTtl,
        ipCheckEnabled
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
      
      // Update manual code
      const manualCode = data.qrToken.substring(0, 6).toUpperCase();
      document.getElementById('qrManualCode').textContent = manualCode;

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

    // Save lists to state for offline/instant search
    state.presentsList = presents.data || [];
    state.absentsList = absents.data || [];

    renderGridFiltered();
    renderRejections(rejections.data || []);

    if (state.activeTab === 'report') {
      fetchReportData();
    }

  } catch (err) {
    console.error('Error fetching attendance details:', err);
  }
}

// Filter and render grid dynamically
function renderGridFiltered() {
  const query = state.searchQuery || '';
  
  const filteredPresents = state.presentsList.filter(p => 
    p.nombre.toLowerCase().includes(query) || p.documento.includes(query)
  );
  
  const filteredAbsents = state.absentsList.filter(a => 
    a.nombre.toLowerCase().includes(query) || a.documento.includes(query)
  );

  renderGrid(filteredPresents, filteredAbsents);
}

// Render real-time grid
function renderGrid(presents, absents) {
  attendanceGridBody.innerHTML = '';

  if (presents.length === 0) {
    attendanceGridBody.innerHTML = `
      <tr>
        <td colspan="8" class="text-center py-8 text-slate-500">Ningún aprendiz ha registrado asistencia en esta sesión.</td>
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
// TAB VIEW CONTROLLERS
btnTabControl.addEventListener('click', () => {
  state.activeTab = 'control';
  btnTabControl.className = 'tab-btn px-4 py-2 text-xs font-semibold rounded-lg bg-[#39A900] text-white transition-all';
  btnTabReport.className = 'tab-btn px-4 py-2 text-xs font-semibold rounded-lg text-slate-400 hover:text-white transition-all';
  btnTabExcuses.className = 'tab-btn px-4 py-2 text-xs font-semibold rounded-lg text-slate-400 hover:text-white transition-all';
  btnTabLateRequests.className = 'tab-btn px-4 py-2 text-xs font-semibold rounded-lg text-slate-400 hover:text-white transition-all';
  tabContentControl.classList.remove('hidden');
  tabContentReport.classList.add('hidden');
  tabContentExcuses.classList.add('hidden');
  tabContentLateRequests.classList.add('hidden');
});

btnTabReport.addEventListener('click', () => {
  state.activeTab = 'report';
  btnTabReport.className = 'tab-btn px-4 py-2 text-xs font-semibold rounded-lg bg-[#39A900] text-white transition-all';
  btnTabControl.className = 'tab-btn px-4 py-2 text-xs font-semibold rounded-lg text-slate-400 hover:text-white transition-all';
  btnTabExcuses.className = 'tab-btn px-4 py-2 text-xs font-semibold rounded-lg text-slate-400 hover:text-white transition-all';
  btnTabLateRequests.className = 'tab-btn px-4 py-2 text-xs font-semibold rounded-lg text-slate-400 hover:text-white transition-all';
  tabContentControl.classList.add('hidden');
  tabContentReport.classList.remove('hidden');
  tabContentExcuses.classList.add('hidden');
  tabContentLateRequests.classList.add('hidden');
  fetchReportData();
});

btnTabExcuses.addEventListener('click', () => {
  state.activeTab = 'excuses';
  btnTabExcuses.className = 'tab-btn px-4 py-2 text-xs font-semibold rounded-lg bg-[#39A900] text-white transition-all';
  btnTabControl.className = 'tab-btn px-4 py-2 text-xs font-semibold rounded-lg text-slate-400 hover:text-white transition-all';
  btnTabReport.className = 'tab-btn px-4 py-2 text-xs font-semibold rounded-lg text-slate-400 hover:text-white transition-all';
  btnTabLateRequests.className = 'tab-btn px-4 py-2 text-xs font-semibold rounded-lg text-slate-400 hover:text-white transition-all';
  tabContentControl.classList.add('hidden');
  tabContentReport.classList.add('hidden');
  tabContentExcuses.classList.remove('hidden');
  tabContentLateRequests.classList.add('hidden');
  fetchInstructorExcuses();
});

btnTabLateRequests.addEventListener('click', () => {
  state.activeTab = 'lateRequests';
  btnTabLateRequests.className = 'tab-btn px-4 py-2 text-xs font-semibold rounded-lg bg-[#39A900] text-white transition-all';
  btnTabControl.className = 'tab-btn px-4 py-2 text-xs font-semibold rounded-lg text-slate-400 hover:text-white transition-all';
  btnTabReport.className = 'tab-btn px-4 py-2 text-xs font-semibold rounded-lg text-slate-400 hover:text-white transition-all';
  btnTabExcuses.className = 'tab-btn px-4 py-2 text-xs font-semibold rounded-lg text-slate-400 hover:text-white transition-all';
  tabContentControl.classList.add('hidden');
  tabContentReport.classList.add('hidden');
  tabContentExcuses.classList.add('hidden');
  tabContentLateRequests.classList.remove('hidden');
  fetchLateRequests();
});

// Report View Fetch
async function fetchReportData() {
  if (!state.activeSession) return;

  const btnPrint = document.getElementById('btnPrintReport');
  const btnPdf = document.getElementById('btnDownloadPdfReport');
  const btnEvidence = document.getElementById('btnSubmitEvidence');
  const warning = document.getElementById('reportWarning');

  try {
    const res = await fetch(`${state.apiUrl}/reports/session/${state.activeSession.id}`, {
      headers: { 'Authorization': `Bearer ${state.token}` }
    });
    if (handleAuthError(res)) return;

    const reportData = await res.json();
    if (res.ok) {
      state.lastReportData = reportData;
      renderReportGrid(reportData);

      // Condition: ONLY enable report if session is reopened (meaning both entry and exit rooms created)
      const isReopened = state.activeSession.is_reopened === 1;
      if (isReopened) {
        btnPrint.classList.remove('opacity-50', 'pointer-events-none');
        btnPdf.classList.remove('opacity-50', 'pointer-events-none');
        warning.classList.add('hidden');

        // Check if evidence is already submitted
        if (state.activeSession.evidence_submitted === 1) {
          btnEvidence.classList.add('pointer-events-none');
          btnEvidence.classList.remove('bg-blue-600', 'hover:bg-blue-700', 'opacity-50');
          btnEvidence.classList.add('bg-teal-600');
          btnEvidence.querySelector('span').textContent = 'Evidencia Entregada ✓';
        } else {
          btnEvidence.classList.remove('opacity-50', 'pointer-events-none', 'bg-teal-600');
          btnEvidence.classList.add('bg-blue-600', 'hover:bg-blue-700');
          btnEvidence.querySelector('span').textContent = 'Entregar Evidencia';
        }
      } else {
        btnPrint.classList.add('opacity-50', 'pointer-events-none');
        btnPdf.classList.add('opacity-50', 'pointer-events-none');
        btnEvidence.classList.add('opacity-50', 'pointer-events-none');
        warning.classList.remove('hidden');
      }
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

// Download Excel report
btnPrintReport.addEventListener('click', () => {
  if (!state.lastReportData || state.lastReportData.length === 0) {
    alert('No hay datos disponibles para exportar.');
    return;
  }

  try {
    // Map JSON to Spanish Columns
    const excelRows = state.lastReportData.map(r => ({
      'Aprendiz': r.nombre,
      'Documento': r.documento,
      'Horas Programadas': r.horas_programadas,
      'Horas Asistidas': r.horas_asistidas,
      'Horas Falla': r.horas_falla,
      '% Asistencia': r.porcentaje_asistencia + '%',
      'Tipo de Registro': r.tipo_registro,
      'Hora Ingreso': r.hora_ingreso,
      'Hora Salida': r.hora_salida
    }));

    // Create Excel book and sheet
    const worksheet = XLSX.utils.json_to_sheet(excelRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Asistencia');

    // Auto-adjust column widths
    const maxLens = {};
    excelRows.forEach(row => {
      Object.keys(row).forEach(key => {
        const valStr = String(row[key] || '');
        maxLens[key] = Math.max(maxLens[key] || 10, valStr.length, key.length);
      });
    });
    worksheet['!cols'] = Object.keys(maxLens).map(k => ({ wch: maxLens[k] + 2 }));

    // Download xlsx
    const filename = `Reporte_Asistencia_${state.activeSession.unit_id.replace('unit_ficha_', '')}.xlsx`;
    XLSX.writeFile(workbook, filename);
  } catch (err) {
    alert('Error al generar el archivo Excel: ' + err.message);
  }
});

// Download PDF report (SENA styled)
btnDownloadPdfReport.addEventListener('click', () => {
  if (!state.lastReportData || state.lastReportData.length === 0) {
    alert('No hay datos disponibles para exportar.');
    return;
  }

  try {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    // Logo & Header styling (SENA Green #39A900)
    doc.setFillColor(57, 169, 0); // SENA Green
    doc.rect(0, 0, 210, 35, 'F');

    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('SENA - CONTROL DE ASISTENCIA DIGITAL', 14, 15);

    // Subtitle
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('Centro de Formación · Reporte Consolidado de Asistencia', 14, 22);
    
    // Details Box
    doc.setFillColor(241, 245, 249);
    doc.rect(14, 42, 182, 24, 'F');

    doc.setTextColor(51, 65, 85);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('FICHA / SECCIÓN:', 18, 48);
    doc.text('INSTRUCTOR:', 18, 54);
    doc.text('FECHA DE JORNADA:', 18, 60);

    doc.setFont('helvetica', 'normal');
    doc.text(state.activeSession.unit_id.replace('unit_ficha_', ''), 60, 48);
    doc.text(state.person.nombre, 60, 54);
    
    const dateStr = state.activeSession.activated_at 
      ? new Date(state.activeSession.activated_at).toLocaleDateString('es-CO', { dateStyle: 'long' }) 
      : 'No disponible';
    doc.text(dateStr, 60, 60);

    // Map table rows
    const tableRows = state.lastReportData.map((r, index) => [
      index + 1,
      r.nombre,
      r.documento,
      `${r.horas_programadas}h`,
      `${r.horas_asistidas}h`,
      `${r.horas_falla}h`,
      `${r.porcentaje_asistencia}%`,
      r.tipo_registro,
      r.hora_ingreso && r.hora_ingreso !== '-' ? `${r.hora_ingreso} / ${r.hora_salida || '-'}` : 'FALLA_TOTAL'
    ]);

    // Draw AutoTable
    doc.autoTable({
      startY: 72,
      head: [['#', 'Aprendiz', 'Documento', 'Prog.', 'Asist.', 'Fallas', '% Jornada', 'Estado', 'Entrada / Salida']],
      body: tableRows,
      theme: 'grid',
      headStyles: {
        fillColor: [57, 169, 0],
        textColor: [255, 255, 255],
        fontSize: 8.5,
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [30, 41, 59]
      },
      columnStyles: {
        0: { width: 8 },
        3: { halign: 'center' },
        4: { halign: 'center' },
        5: { halign: 'center' },
        6: { halign: 'center' }
      },
      margin: { left: 14, right: 14 }
    });

    const finalY = doc.lastAutoTable.finalY || 100;
    
    // Signatures layout
    if (finalY + 45 < 297) {
      doc.setDrawColor(203, 213, 225);
      doc.line(20, finalY + 30, 85, finalY + 30);
      doc.line(125, finalY + 30, 190, finalY + 30);

      doc.setTextColor(100, 116, 139);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text('Firma del Instructor', 40, finalY + 34);
      doc.text('Firma del Coordinador', 145, finalY + 34);
    }

    // Save PDF
    const filename = `Reporte_Asistencia_${state.activeSession.unit_id.replace('unit_ficha_', '')}.pdf`;
    doc.save(filename);
  } catch (err) {
    alert('Error al generar el reporte PDF: ' + err.message);
  }
});

// Submit session evidence (Instructor)
btnSubmitEvidence.addEventListener('click', async () => {
  if (!state.activeSession) return;
  if (!confirm('¿Estás seguro de que deseas enviar este reporte de asistencia como evidencia oficial al Coordinador? Esta acción no se puede deshacer.')) return;

  try {
    const res = await fetch(`${state.apiUrl}/api/sessions/${state.activeSession.id}/evidence`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${state.token}`
      }
    });
    if (handleAuthError(res)) return;

    const result = await res.json();
    if (res.ok) {
      alert('¡Evidencia entregada al Coordinador con éxito!');
      state.activeSession.evidence_submitted = 1;
      fetchReportData();
    } else {
      alert(`Error: ${result.error.message}`);
    }
  } catch (err) {
    alert('Error de red al entregar la evidencia.');
  }
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

// --- STUDENT PORTAL LOGIC ---
async function fetchStudentHistory() {
  try {
    const res = await fetch(`${state.apiUrl}/api/student/history`, {
      headers: { 'Authorization': `Bearer ${state.token}` }
    });
    const result = await res.json();
    if (res.ok) {
      renderStudentHistoryGrid(result.data.history);
    } else {
      console.error('Error fetching student history:', result.error.message);
    }
  } catch (err) {
    console.error('Error in student history fetch:', err);
  }
}

function renderStudentHistoryGrid(history) {
  studentHistoryGridBody.innerHTML = '';
  
  if (!history || history.length === 0) {
    studentFichaName.textContent = 'Sin Ficha Matriculada';
    studentTotalHours.textContent = '0 / 0h';
    studentHistoryGridBody.innerHTML = `
      <tr>
        <td colspan="8" class="text-center py-8 text-slate-500">No hay clases registradas en tu ficha académica.</td>
      </tr>
    `;
    return;
  }

  // Update header info
  const first = history[0];
  studentFichaName.textContent = `Ficha ${first.unitCode} - ${first.unitName}`;

  let totalProg = 0;
  let totalAsis = 0;

  history.forEach(h => {
    totalProg += h.horas_programadas;
    totalAsis += h.horas_asistidas;

    // Badges based on status
    let badgeClass = 'bg-red-500/10 text-red-400 border border-red-500/20';
    if (h.status === 'PRESENTE') {
      badgeClass = h.tipo_registro === 'EXCUSA_APROBADA'
        ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
        : 'bg-green-500/10 text-green-400 border border-green-500/20';
    } else if (h.status === 'ASISTENCIA_PARCIAL') {
      badgeClass = 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20';
    }

    // Excuse button or state
    let excuseCol = '-';
    if (h.horas_falla > 0) {
      if (h.excuse) {
        if (h.excuse.status === 'pending') {
          excuseCol = `<span class="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">Excusa Pendiente</span>`;
        } else if (h.excuse.status === 'approved') {
          excuseCol = `<span class="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-500/10 text-green-400 border border-green-500/20">Excusa Aprobada</span>`;
        } else {
          excuseCol = `<span class="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-500/10 text-red-400 border border-red-500/20">Excusa Rechazada</span>`;
        }
      } else {
        excuseCol = `
          <button onclick="openExcuseModal('${h.sessionId}')" class="text-xs bg-blue-950/20 hover:bg-blue-950/40 border border-blue-500/20 text-blue-400 px-2 py-1 rounded-md transition-all">
            Subir Excusa
          </button>
        `;
      }
    }

    studentHistoryGridBody.innerHTML += `
      <tr class="hover:bg-slate-900/20 border-b border-slate-800/40">
        <td class="py-3 px-4 font-mono text-xs">${h.date}</td>
        <td class="py-3 px-4 text-xs font-semibold text-slate-400">${h.unitCode}</td>
        <td class="py-3 px-4 font-mono text-xs">${h.hora_ingreso}</td>
        <td class="py-3 px-4 font-mono text-xs">${h.hora_salida}</td>
        <td class="py-3 px-4 text-center font-mono text-green-400">${h.horas_asistidas}h</td>
        <td class="py-3 px-4 text-center font-mono text-red-400">${h.horas_falla}h</td>
        <td class="py-3 px-4">
          <span class="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${badgeClass}">${h.tipo_registro}</span>
        </td>
        <td class="py-3 px-4 text-center">${excuseCol}</td>
      </tr>
    `;
  });

  studentTotalHours.textContent = `${totalAsis} / ${totalProg}h`;
}

// Excuse upload modal helpers
window.openExcuseModal = (sessionId) => {
  excuseSessionId.value = sessionId;
  excuseText.value = '';
  excuseFile.value = '';
  excuseModal.classList.remove('hidden');
};

btnCancelExcuse.addEventListener('click', () => {
  excuseModal.classList.add('hidden');
});

btnRefreshStudent.addEventListener('click', () => {
  fetchStudentHistory();
});

excuseForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const sessionId = excuseSessionId.value;
  const text = excuseText.value.trim();
  const file = excuseFile.files[0];

  let fileName = null;
  let fileData = null;

  if (file) {
    fileName = file.name;
    const reader = new FileReader();
    reader.onload = async () => {
      fileData = reader.result;
      await sendExcuse(sessionId, text, fileName, fileData);
    };
    reader.readAsDataURL(file);
  } else {
    await sendExcuse(sessionId, text, null, null);
  }
});

async function sendExcuse(sessionId, text, fileName, fileData) {
  try {
    const res = await fetch(`${state.apiUrl}/api/student/excuses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${state.token}`
      },
      body: JSON.stringify({ sessionId, text, fileName, fileData })
    });
    const result = await res.json();
    if (res.ok) {
      alert('Excusa presentada con éxito.');
      excuseModal.classList.add('hidden');
      fetchStudentHistory();
    } else {
      alert(`Error: ${result.error.message}`);
    }
  } catch (err) {
    alert('Error de red al presentar la excusa.');
  }
}

// --- INSTRUCTOR EXCUSES LOGIC ---
async function fetchInstructorExcuses() {
  try {
    const res = await fetch(`${state.apiUrl}/api/instructor/excuses`, {
      headers: { 'Authorization': `Bearer ${state.token}` }
    });
    if (handleAuthError(res)) return;

    const result = await res.json();
    if (res.ok) {
      renderInstructorExcusesGrid(result.data);
    }
  } catch (err) {
    console.error('Error fetching instructor excuses:', err);
  }
}

function renderInstructorExcusesGrid(excuses) {
  instructorExcusesGridBody.innerHTML = '';
  
  if (!excuses || excuses.length === 0) {
    instructorExcusesGridBody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center py-8 text-slate-500">No hay excusas registradas.</td>
      </tr>
    `;
    return;
  }

  excuses.forEach(e => {
    let supportCol = '<span class="text-slate-600">Sin soporte</span>';
    if (e.file_data) {
      supportCol = `
        <a href="${e.file_data}" download="${e.file_name}" class="inline-flex items-center gap-1 text-xs text-[#39A900] hover:underline font-semibold">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
          <span>Descargar</span>
        </a>
      `;
    }

    let statusBadge = '<span class="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">PENDIENTE</span>';
    if (e.status === 'approved') {
      statusBadge = '<span class="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-green-500/10 text-green-400 border border-green-500/20">APROBADA</span>';
    } else if (e.status === 'rejected') {
      statusBadge = '<span class="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-500/10 text-red-400 border border-red-500/20">RECHAZADA</span>';
    }

    let actionsCol = '-';
    if (e.status === 'pending') {
      actionsCol = `
        <div class="flex items-center justify-center gap-1.5">
          <button onclick="resolveExcuse('${e.id}', 'approved')" class="text-xs bg-[#39A900]/15 hover:bg-[#39A900]/25 border border-[#39A900]/20 text-[#39A900] px-2 py-1 rounded-md transition-all font-semibold">
            Aprobar
          </button>
          <button onclick="resolveExcuse('${e.id}', 'rejected')" class="text-xs bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 px-2 py-1 rounded-md transition-all font-semibold">
            Rechazar
          </button>
        </div>
      `;
    }

    instructorExcusesGridBody.innerHTML += `
      <tr class="hover:bg-slate-900/20 border-b border-slate-800/40">
        <td class="py-3 px-4">
          <div class="font-medium text-slate-200">${e.student_name}</div>
          <div class="text-[10px] text-slate-500 font-mono">${e.student_doc}</div>
        </td>
        <td class="py-3 px-4 text-xs font-semibold text-slate-400">${e.unit_code}</td>
        <td class="py-3 px-4 font-mono text-xs">${e.room_created_at.split('T')[0]}</td>
        <td class="py-3 px-4 text-xs max-w-xs truncate" title="${e.text}">${e.text}</td>
        <td class="py-3 px-4">${supportCol}</td>
        <td class="py-3 px-4">${statusBadge}</td>
        <td class="py-3 px-4 text-center">${actionsCol}</td>
      </tr>
    `;
  });
}

window.resolveExcuse = async (id, status) => {
  const confirmMsg = status === 'approved' 
    ? '¿Aprobar esta excusa? Esto marcará al estudiante como PRESENTE (6 horas asistidas) de forma retroactiva.'
    : '¿Rechazar esta excusa? La inasistencia permanecerá en el sistema.';
    
  if (!confirm(confirmMsg)) return;

  try {
    const res = await fetch(`${state.apiUrl}/api/instructor/excuses/${id}/resolve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${state.token}`
      },
      body: JSON.stringify({ status })
    });
    const result = await res.json();
    if (res.ok) {
      alert(`Excusa procesada correctamente.`);
      fetchInstructorExcuses();
    } else {
      alert(`Error: ${result.error.message}`);
    }
  } catch (err) {
    alert('Error al resolver excusa.');
  }
};

// --- LATE REQUESTS LOGIC ---
async function fetchLateRequests() {
  lateRequestsLoading.classList.remove('hidden');
  lateRequestsGridBody.innerHTML = '';
  try {
    const res = await fetch(`${state.apiUrl}/api/instructor/late-requests`, {
      headers: { 'Authorization': `Bearer ${state.token}` }
    });
    if (handleAuthError(res)) return;

    const result = await res.json();
    if (res.ok) {
      renderLateRequests(result.data);
    } else {
      console.error('Error fetching late requests:', result.error.message);
      lateRequestsGridBody.innerHTML = `<tr><td colspan="7" class="text-center py-8 text-red-400">Error al cargar solicitudes.</td></tr>`;
    }
  } catch (err) {
    console.error('Error fetching late requests:', err);
    lateRequestsGridBody.innerHTML = `<tr><td colspan="7" class="text-center py-8 text-red-400">Error de conexión.</td></tr>`;
  } finally {
    lateRequestsLoading.classList.add('hidden');
  }
}

function renderLateRequests(requests) {
  lateRequestsGridBody.innerHTML = '';

  if (!requests || requests.length === 0) {
    lateRequestsGridBody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center py-8 text-slate-500">No hay solicitudes tardías pendientes.</td>
      </tr>
    `;
    return;
  }

  requests.forEach(r => {
    let statusBadge = '<span class="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">PENDIENTE</span>';
    if (r.status === 'approved') {
      statusBadge = '<span class="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-green-500/10 text-green-400 border border-green-500/20">APROBADA</span>';
    } else if (r.status === 'rejected') {
      statusBadge = '<span class="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-500/10 text-red-400 border border-red-500/20">RECHAZADA</span>';
    }

    let actionsCol = '-';
    if (r.status === 'pending') {
      actionsCol = `
        <div class="flex items-center justify-center gap-1.5">
          <select id="lateHoras_${r.id}" class="bg-slate-900 border border-slate-800 rounded-md px-2 py-1 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#39A900]">
            <option value="1">1h</option>
            <option value="2">2h</option>
            <option value="3">3h</option>
            <option value="4">4h</option>
            <option value="5">5h</option>
          </select>
          <button onclick="resolveLateRequest('${r.id}', 'approved')" class="text-xs bg-[#39A900]/15 hover:bg-[#39A900]/25 border border-[#39A900]/20 text-[#39A900] px-2 py-1 rounded-md transition-all font-semibold">
            Aprobar
          </button>
          <button onclick="resolveLateRequest('${r.id}', 'rejected')" class="text-xs bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 px-2 py-1 rounded-md transition-all font-semibold">
            Rechazar
          </button>
        </div>
      `;
    }

    const sentAt = r.created_at ? new Date(r.created_at).toLocaleString('es-CO') : '-';

    lateRequestsGridBody.innerHTML += `
      <tr class="hover:bg-slate-900/20 border-b border-slate-800/40">
        <td class="py-3 px-4 font-medium text-slate-200">${r.student_name || '-'}</td>
        <td class="py-3 px-4 text-slate-400 font-mono">${r.student_doc || '-'}</td>
        <td class="py-3 px-4 text-xs font-semibold text-slate-400">${r.unit_code || '-'}</td>
        <td class="py-3 px-4 font-mono text-xs">${sentAt}</td>
        <td class="py-3 px-4 text-xs max-w-xs truncate" title="${r.justification || ''}">${r.justification || '-'}</td>
        <td class="py-3 px-4">${statusBadge}</td>
        <td class="py-3 px-4 text-center">${actionsCol}</td>
      </tr>
    `;
  });
}

window.resolveLateRequest = async (id, status) => {
  const horasSelect = document.getElementById(`lateHoras_${id}`);
  const horasDescontar = horasSelect ? parseInt(horasSelect.value) : 1;

  const confirmMsg = status === 'approved'
    ? `¿Aprobar solicitud tardía descontando ${horasDescontar} hora(s)?`
    : '¿Rechazar esta solicitud tardía? La inasistencia permanecerá en el sistema.';

  if (!confirm(confirmMsg)) return;

  try {
    const res = await fetch(`${state.apiUrl}/api/instructor/late-requests/${id}/resolve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${state.token}`
      },
      body: JSON.stringify({ status, horasDescontar })
    });
    const result = await res.json();
    if (res.ok) {
      alert('Solicitud tardía procesada correctamente.');
      fetchLateRequests();
    } else {
      alert(`Error: ${result.error.message}`);
    }
  } catch (err) {
    alert('Error al resolver la solicitud tardía.');
  }
};

// Search Filter Listener
searchStudentInput.addEventListener('input', (e) => {
  state.searchQuery = e.target.value.toLowerCase().trim();
  renderGridFiltered();
});

// Bulk Attendance Trigger
btnBulkMarkPresent.addEventListener('click', async () => {
  if (!state.activeSession) {
    alert('No hay ninguna sesión activa para marcar asistencia.');
    return;
  }
  const absents = state.absentsList || [];
  if (absents.length === 0) {
    alert('No hay aprendices ausentes por marcar en la grilla.');
    return;
  }

  const confirmMsg = `¿Desea registrar asistencia manual rápida (PRESENTE - 6h) para los ${absents.length} aprendices ausentes?`;
  if (!confirm(confirmMsg)) return;

  btnBulkMarkPresent.disabled = true;
  const originalText = btnBulkMarkPresent.textContent;
  btnBulkMarkPresent.textContent = 'Procesando...';

  try {
    const promises = absents.map(a => 
      fetch(`${state.apiUrl}/attendance/manual-override`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${state.token}`
        },
        body: JSON.stringify({
          sessionId: state.activeSession.id,
          documento: a.documento,
          horas_validadas_asistencia: 6,
          horas_inasistencia_acumulada: 0,
          tipo_registro: 'MANUAL_OVERRIDE'
        })
      })
    );

    await Promise.all(promises);
    alert('Se marcó asistencia completa para todos los aprendices ausentes.');
    fetchRealTimeAttendance();
  } catch (err) {
    alert('Error al realizar el marcado masivo de asistencia.');
    console.error(err);
  } finally {
    btnBulkMarkPresent.disabled = false;
    btnBulkMarkPresent.textContent = originalText;
  }
});

// ── COORDINATOR FUNCTIONS ─────────────────────────────────────────────────────

async function fetchCoordInstructors() {
  coordInstructorsGridBody.innerHTML = '<tr><td colspan="4" class="text-center py-8 text-slate-500">Cargando instructores...</td></tr>';
  try {
    const res = await fetch(`${state.apiUrl}/api/coord/instructors`, {
      headers: { 'Authorization': `Bearer ${state.token}` }
    });
    if (handleAuthError(res)) return;

    const result = await res.json();
    if (res.ok) {
      renderCoordInstructors(result.data);
    } else {
      coordInstructorsGridBody.innerHTML = `<tr><td colspan="4" class="text-center py-8 text-red-400">Error: ${result.error.message}</td></tr>`;
    }
  } catch (err) {
    coordInstructorsGridBody.innerHTML = '<tr><td colspan="4" class="text-center py-8 text-red-400">Error de conexión.</td></tr>';
  }
}

function renderCoordInstructors(instructors) {
  coordInstructorsGridBody.innerHTML = '';
  if (!instructors || instructors.length === 0) {
    coordInstructorsGridBody.innerHTML = '<tr><td colspan="4" class="text-center py-8 text-slate-500">No hay instructores registrados.</td></tr>';
    return;
  }

  instructors.forEach(inst => {
    const statusText = inst.active 
      ? '<span class="inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider bg-green-500/10 text-green-400 border border-green-500/20">ACTIVO</span>'
      : '<span class="inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider bg-red-500/10 text-red-400 border border-red-500/20">INACTIVO</span>';

    const toggleText = inst.active ? 'Desactivar' : 'Activar';

    coordInstructorsGridBody.innerHTML += `
      <tr class="hover:bg-slate-900/20 border-b border-slate-800/40">
        <td class="py-3 px-4 font-semibold text-slate-200">${inst.nombre}</td>
        <td class="py-3 px-4 font-mono text-slate-400">${inst.documento}</td>
        <td class="py-3 px-4">${statusText}</td>
        <td class="py-3 px-4 text-right">
          <div class="flex justify-end gap-2">
            <button onclick="editInstructor('${inst.id}', '${inst.nombre}', '${inst.documento}', ${inst.active})" class="text-xs bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 px-2.5 py-1 rounded-md transition-all">
              Editar
            </button>
            <button onclick="toggleInstructorActive('${inst.id}', '${inst.nombre}', ${inst.active})" class="text-xs bg-slate-900 border border-slate-800 hover:bg-slate-800 text-red-400 px-2.5 py-1 rounded-md transition-all">
              ${toggleText}
            </button>
          </div>
        </td>
      </tr>
    `;
  });
}

async function handleInstructorSubmit(e) {
  e.preventDefault();
  const id = instructorEditId.value;
  const nombre = instNombre.value.trim();
  const documento = instDocumento.value.trim();
  const password = instPassword.value.trim();
  const active = instActive.checked;

  const url = id 
    ? `${state.apiUrl}/api/coord/instructors/${id}`
    : `${state.apiUrl}/api/coord/instructors`;

  const method = id ? 'PUT' : 'POST';
  const bodyData = { nombre, documento };
  if (password) bodyData.password = password;
  if (id) bodyData.active = active;

  try {
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${state.token}`
      },
      body: JSON.stringify(bodyData)
    });
    const result = await res.json();
    if (res.ok) {
      alert(id ? 'Instructor actualizado correctamente.' : 'Instructor creado correctamente.');
      instructorModal.classList.add('hidden');
      fetchCoordInstructors();
    } else {
      alert(`Error: ${result.error.message}`);
    }
  } catch (err) {
    alert('Error al guardar el instructor.');
  }
}

window.editInstructor = (id, nombre, documento, active) => {
  instructorModalTitle.textContent = "Editar Instructor";
  instructorEditId.value = id;
  instNombre.value = nombre;
  instDocumento.value = documento;
  instDocumento.disabled = true; // No permitir cambiar documento en edición
  instPassword.value = "";
  instPassword.required = false; // No obligatorio en edición
  instActive.checked = active === 1 || active === true;
  instActiveWrapper.classList.remove('hidden');
  instructorModal.classList.remove('hidden');
};

window.toggleInstructorActive = async (id, nombre, currentActive) => {
  const nextActive = currentActive ? 0 : 1;
  const verb = currentActive ? 'desactivar' : 'activar';
  if (!confirm(`¿Estás seguro de que deseas ${verb} al instructor ${nombre}?`)) return;

  try {
    const res = await fetch(`${state.apiUrl}/api/coord/instructors/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${state.token}`
      },
      body: JSON.stringify({ active: nextActive })
    });
    const result = await res.json();
    if (res.ok) {
      alert('Estado actualizado correctamente.');
      fetchCoordInstructors();
    } else {
      alert(`Error: ${result.error.message}`);
    }
  } catch (err) {
    alert('Error al actualizar el estado del instructor.');
  }
};

async function fetchCoordFichas() {
  coordFichasGridBody.innerHTML = '<tr><td colspan="5" class="text-center py-8 text-slate-500">Cargando fichas...</td></tr>';
  try {
    const res = await fetch(`${state.apiUrl}/api/coord/fichas`, {
      headers: { 'Authorization': `Bearer ${state.token}` }
    });
    if (handleAuthError(res)) return;

    const result = await res.json();
    if (res.ok) {
      renderCoordFichas(result.data);
    } else {
      coordFichasGridBody.innerHTML = `<tr><td colspan="5" class="text-center py-8 text-red-400">Error: ${result.error.message}</td></tr>`;
    }
  } catch (err) {
    coordFichasGridBody.innerHTML = '<tr><td colspan="5" class="text-center py-8 text-red-400">Error de conexión.</td></tr>';
  }
}

function renderCoordFichas(fichas) {
  coordFichasGridBody.innerHTML = '';
  if (!fichas || fichas.length === 0) {
    coordFichasGridBody.innerHTML = '<tr><td colspan="5" class="text-center py-8 text-slate-500">No hay fichas registradas.</td></tr>';
    return;
  }

  fichas.forEach(f => {
    const statusText = f.active 
      ? '<span class="inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider bg-green-500/10 text-green-400 border border-green-500/20">ACTIVA</span>'
      : '<span class="inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider bg-red-500/10 text-red-400 border border-red-500/20">INACTIVA</span>';

    const toggleText = f.active ? 'Desactivar' : 'Activar';

    coordFichasGridBody.innerHTML += `
      <tr class="hover:bg-slate-900/20 border-b border-slate-800/40">
        <td class="py-3 px-4 font-mono font-semibold text-[#39A900]">${f.code}</td>
        <td class="py-3 px-4 text-slate-200">${f.name}</td>
        <td class="py-3 px-4 text-center font-semibold text-slate-400">${f.learners_count || 0}</td>
        <td class="py-3 px-4">${statusText}</td>
        <td class="py-3 px-4 text-right">
          <div class="flex justify-end gap-2">
            <button onclick="editFicha('${f.id}', '${f.code}', '${f.name}', ${f.active})" class="text-xs bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 px-2.5 py-1 rounded-md transition-all">
              Editar
            </button>
            <button onclick="toggleFichaActive('${f.id}', '${f.name}', ${f.active})" class="text-xs bg-slate-900 border border-slate-800 hover:bg-slate-800 text-red-400 px-2.5 py-1 rounded-md transition-all">
              ${toggleText}
            </button>
          </div>
        </td>
      </tr>
    `;
  });
}

async function handleFichaSubmit(e) {
  e.preventDefault();
  const id = fichaEditId.value;
  const code = fichaCode.value.trim();
  const name = fichaName.value.trim();
  const active = fichaActive.checked;

  const url = id 
    ? `${state.apiUrl}/api/coord/fichas/${id}`
    : `${state.apiUrl}/api/coord/fichas`;

  const method = id ? 'PUT' : 'POST';
  const bodyData = { code, name };
  if (id) bodyData.active = active;

  try {
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${state.token}`
      },
      body: JSON.stringify(bodyData)
    });
    const result = await res.json();
    if (res.ok) {
      alert(id ? 'Ficha actualizada correctamente.' : 'Ficha creada correctamente.');
      fichaModal.classList.add('hidden');
      fetchCoordFichas();
    } else {
      alert(`Error: ${result.error.message}`);
    }
  } catch (err) {
    alert('Error al guardar la ficha.');
  }
}

window.editFicha = (id, code, name, active) => {
  fichaModalTitle.textContent = "Editar Ficha";
  fichaEditId.value = id;
  fichaCode.value = code;
  fichaCode.disabled = false; // Permitir cambiar el código en edición
  fichaName.value = name;
  fichaActive.checked = active === 1 || active === true;
  fichaActiveWrapper.classList.remove('hidden');
  fichaModal.classList.remove('hidden');
};

window.toggleFichaActive = async (id, nombre, currentActive) => {
  const nextActive = currentActive ? 0 : 1;
  const verb = currentActive ? 'desactivar' : 'activar';
  if (!confirm(`¿Estás seguro de que deseas ${verb} la ficha ${nombre}?`)) return;

  try {
    const res = await fetch(`${state.apiUrl}/api/coord/fichas/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${state.token}`
      },
      body: JSON.stringify({ active: nextActive })
    });
    const result = await res.json();
    if (res.ok) {
      alert('Estado actualizado correctamente.');
      fetchCoordFichas();
    } else {
      alert(`Error: ${result.error.message}`);
    }
  } catch (err) {
    alert('Error al actualizar el estado de la ficha.');
  }
};

// --- COORDINATOR EVIDENCES FUNCTIONS ---

async function fetchCoordEvidences() {
  coordEvidencesGridBody.innerHTML = '<tr><td colspan="6" class="text-center py-8 text-slate-500">Cargando histórico de jornadas...</td></tr>';
  try {
    const res = await fetch(`${state.apiUrl}/api/coord/evidences`, {
      headers: { 'Authorization': `Bearer ${state.token}` }
    });
    if (handleAuthError(res)) return;

    const result = await res.json();
    if (res.ok) {
      renderCoordEvidences(result.data);
    } else {
      coordEvidencesGridBody.innerHTML = `<tr><td colspan="6" class="text-center py-8 text-red-400">Error: ${result.error.message}</td></tr>`;
    }
  } catch (err) {
    coordEvidencesGridBody.innerHTML = '<tr><td colspan="6" class="text-center py-8 text-red-400">Error de conexión.</td></tr>';
  }
}

function renderCoordEvidences(evidences) {
  coordEvidencesGridBody.innerHTML = '';
  if (!evidences || evidences.length === 0) {
    coordEvidencesGridBody.innerHTML = '<tr><td colspan="6" class="text-center py-8 text-slate-500">No se encontraron jornadas registradas en el sistema.</td></tr>';
    return;
  }

  evidences.forEach(ev => {
    const dateStr = ev.activated_at 
      ? new Date(ev.activated_at).toLocaleDateString('es-CO', { dateStyle: 'short', timeStyle: 'short' }) 
      : 'No iniciada';

    // Status Badges
    const statusText = ev.status === 'closed' ? 'Cerrada' : (ev.status === 'active' ? 'Activa' : 'Borrador');
    const statusClass = ev.status === 'closed' ? 'bg-slate-500/10 text-slate-400 border border-slate-500/20' : 'bg-green-500/10 text-green-400 border border-green-500/20';

    // Evidence Badges
    const evText = ev.evidence_submitted === 1 ? 'Entregada ✓' : 'Pendiente';
    const evClass = ev.evidence_submitted === 1 ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20 font-bold' : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20';

    // Download button is only active if session is closed/has records
    const downloadBtn = `
      <button 
        onclick="window.downloadCoordExcelReport('${ev.id}', '${ev.ficha_code}')"
        class="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 active:scale-95 text-xs font-bold rounded-lg text-slate-200 hover:text-white transition-all inline-flex items-center gap-1 border border-slate-700/60"
      >
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
        <span>Reporte Excel</span>
      </button>
    `;

    coordEvidencesGridBody.innerHTML += `
      <tr class="hover:bg-slate-900/20 border-b border-slate-800/40">
        <td class="py-3.5 px-4 font-bold text-white font-mono">${ev.ficha_code} - ${ev.ficha_name}</td>
        <td class="py-3.5 px-4 text-slate-300 font-medium">${ev.instructor_name || 'Sin asignar'}</td>
        <td class="py-3.5 px-4 text-slate-400 font-mono text-xs">${dateStr}</td>
        <td class="py-3.5 px-4">
          <span class="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${statusClass}">${statusText}</span>
        </td>
        <td class="py-3.5 px-4 text-center">
          <span class="inline-flex px-2 py-0.5 rounded-full text-xs ${evClass}">${evText}</span>
        </td>
        <td class="py-3.5 px-4 text-right">
          ${downloadBtn}
        </td>
      </tr>
    `;
  });
}

// Download Excel report on Coordinator click
window.downloadCoordExcelReport = async (sessionId, fichaCode) => {
  try {
    const res = await fetch(`${state.apiUrl}/reports/session/${sessionId}`, {
      headers: { 'Authorization': `Bearer ${state.token}` }
    });
    if (handleAuthError(res)) return;

    const reportData = await res.json();
    if (!res.ok) {
      alert(`Error al obtener los datos del reporte: ${reportData.error?.message || 'Error desconocido'}`);
      return;
    }

    if (reportData.length === 0) {
      alert('No hay registros de asistencia para esta jornada.');
      return;
    }

    // Map to Spanish columns
    const excelRows = reportData.map(r => ({
      'Aprendiz': r.nombre,
      'Documento': r.documento,
      'Horas Programadas': r.horas_programadas,
      'Horas Asistidas': r.horas_asistidas,
      'Horas Falla': r.horas_falla,
      '% Asistencia': r.porcentaje_asistencia + '%',
      'Tipo de Registro': r.tipo_registro,
      'Hora Ingreso': r.hora_ingreso,
      'Hora Salida': r.hora_salida
    }));

    // Generate Excel
    const worksheet = XLSX.utils.json_to_sheet(excelRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Asistencia');

    // Widths auto-adjust
    const maxLens = {};
    excelRows.forEach(row => {
      Object.keys(row).forEach(key => {
        const valStr = String(row[key] || '');
        maxLens[key] = Math.max(maxLens[key] || 10, valStr.length, key.length);
      });
    });
    worksheet['!cols'] = Object.keys(maxLens).map(k => ({ wch: maxLens[k] + 2 }));

    XLSX.writeFile(workbook, `Reporte_Jornada_${fichaCode}_${sessionId.substring(0, 8)}.xlsx`);
  } catch (err) {
    alert('Error al descargar el archivo Excel: ' + err.message);
  }
};

