import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

function generateQrTokenHelper(sessionId, timeOffset = 0) {
  const blockIndex = Math.floor((Date.now() + timeOffset) / 15000);
  return crypto
    .createHmac('sha256', 'qr-rotation-salt')
    .update(`${sessionId}_${blockIndex}`)
    .digest('hex')
    .substring(0, 12);
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.resolve(__dirname, 'database.sqlite');

async function runTests() {
  console.log('--- STARTING MVP INTEGRATION TESTS ---');
  const baseUrl = 'http://localhost:4000';

  // 1. Health check
  console.log('\n1. Checking /health...');
  const resHealth = await fetch(`${baseUrl}/health`);
  const textHealth = await resHealth.text();
  console.log('Result:', textHealth === 'ok' ? 'PASS' : 'FAIL');

  // 2. Authentication Login
  console.log('\n2. Testing Login...');
  const resLogin = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ documento: '1079606375', password: '1079606375' })
  });
  const loginData = await resLogin.json();
  const token = loginData.data.token;
  console.log('Login Result:', token ? 'PASS' : 'FAIL');

  // 3. Create Room (Rule 1)
  console.log('\n3. Creating Room...');
  const resRoom = await fetch(`${baseUrl}/room/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      institutionId: 'inst_sena_1',
      unitId: 'unit_ficha_2503399',
      qrTtlMinutes: 15
    })
  });
  const roomData = await resRoom.json();
  const sessionId = roomData.data.id;
  console.log('Create Room Result:', sessionId ? `PASS (ID: ${sessionId})` : 'FAIL');

  // 4. QR Token verification (Rule 2)
  console.log('\n4. Verifying Rotating QR Token...');
  const resQr = await fetch(`${baseUrl}/api/sessions/${sessionId}/qr-token`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const qrData = await resQr.json();
  console.log('QR Token fetched:', qrData.qrToken);
  console.log('QR Token Verification Result:', qrData.qrToken ? 'PASS' : 'FAIL');

  // 4b. Verifying QR Token Leeway (5 minutes)
  console.log('\n4b. Verifying QR Token Leeway (using a token generated 2 minutes ago)...');
  const oldQrToken = generateQrTokenHelper(sessionId, -120000); // 2 minutes ago
  
  const resLeewayCheck = await fetch(`${baseUrl}/attendance/checkin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      documento: '1075508460',
      password: '1075508460',
      qrToken: oldQrToken,
      sessionId
    })
  });
  const leewayCheckData = await resLeewayCheck.json();
  const leewayPass = resLeewayCheck.ok && leewayCheckData.data && leewayCheckData.data.status === 'accepted';
  console.log('Leeway response:', leewayCheckData.error ? leewayCheckData.error.message : 'success');
  console.log('Leeway Test Result:', leewayPass ? 'PASS' : 'FAIL');

  // 5. Check-in within punctuality window (Rule 3)
  console.log('\n5. Performing Punctual Check-in...');
  const resCheckin = await fetch(`${baseUrl}/attendance/checkin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      documento: '1001001001',
      password: '1001001001',
      qrToken: qrData.qrToken,
      sessionId
    })
  });
  const checkinData = await resCheckin.json();
  console.log('Check-in status:', checkinData.data.status);
  console.log('Check-in validadas:', checkinData.data.horas_validadas_asistencia);
  console.log('Check-in Result:', checkinData.data.status === 'accepted' && checkinData.data.horas_validadas_asistencia === 6 ? 'PASS' : 'FAIL');

  // 6. Check-in after 20 minutes (simulated)
  console.log('\n6. Simulating Late Check-in (after 20 mins delay)...');
  const db = new sqlite3.Database(dbPath);
  const shiftTime = new Date(Date.now() - 20 * 60000).toISOString();
  
  await new Promise((resolve) => {
    db.run('UPDATE attendance_sessions SET activated_at = ? WHERE id = ?', [shiftTime, sessionId], () => {
      resolve();
    });
  });

  // Get new qr token
  const resQrLate = await fetch(`${baseUrl}/api/sessions/${sessionId}/qr-token`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const qrDataLate = await resQrLate.json();

  // Register second student (María López)
  const resCheckinLate = await fetch(`${baseUrl}/attendance/checkin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      documento: '1002002002',
      password: '1002002002',
      qrToken: qrDataLate.qrToken,
      sessionId
    })
  });
  const checkinDataLate = await resCheckinLate.json();
  console.log('Late Check-in status:', checkinDataLate.data.status);
  console.log('Late Check-in validadas:', checkinDataLate.data.horas_validadas_asistencia);
  console.log('Late Check-in falladas:', checkinDataLate.data.horas_inasistencia_acumulada);
  console.log('Late Check-in tipo:', checkinDataLate.data.tipo_registro);
  console.log('Late Check-in Result:', 
    checkinDataLate.data.status === 'ASISTENCIA_PARCIAL' && 
    checkinDataLate.data.horas_validadas_asistencia === 5 && 
    checkinDataLate.data.horas_inasistencia_acumulada === 1 && 
    checkinDataLate.data.tipo_registro === 'RETARDO_BLOQUE_1' ? 'PASS' : 'FAIL'
  );

  // 6b. First-time Registration (Password setup)
  console.log('\n6b. Performing First-Time Registration & Password Setup for Carlos Gómez...');
  const resRegister = await fetch(`${baseUrl}/attendance/checkin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      documento: '1003003003',
      registerPassword: 'new-secure-password',
      qrToken: qrDataLate.qrToken,
      sessionId
    })
  });
  const registerData = await resRegister.json();
  console.log('Register status:', registerData.data.status);
  console.log('Register validadas:', registerData.data.horas_validadas_asistencia);
  console.log('Register Result:', registerData.data.status === 'ASISTENCIA_PARCIAL' ? 'PASS' : 'FAIL');

  // 7. Manual Override (Rule 4)
  console.log('\n7. Performing Manual Override for María López...');
  const resOverride = await fetch(`${baseUrl}/attendance/manual-override`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      sessionId,
      documento: '1002002002',
      horas_validadas_asistencia: 6,
      horas_inasistencia_acumulada: 0,
      tipo_registro: 'MANUAL_OVERRIDE'
    })
  });
  const overrideData = await resOverride.json();
  console.log('Override status:', overrideData.data.status);
  console.log('Override hours:', overrideData.data.horas_validadas_asistencia);
  console.log('Override Result:', overrideData.data.status === 'PRESENTE' && overrideData.data.horas_validadas_asistencia === 6 ? 'PASS' : 'FAIL');

  // 8. Reopen Room (Rule 1 Checkout)
  console.log('\n8. Reopening Room for Check-out...');
  const resReopen = await fetch(`${baseUrl}/room/reopen`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ sessionId })
  });
  const reopenData = await resReopen.json();
  console.log('Reopen is_reopened status:', reopenData.data.is_reopened);
  console.log('Reopen Result:', reopenData.data.is_reopened === 1 ? 'PASS' : 'FAIL');

  // 9. Report summary (Rule 3 Report)
  console.log('\n9. Fetching Session Report...');
  const resReport = await fetch(`${baseUrl}/reports/session/${sessionId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const reportList = await resReport.json();
  console.log('Report learners count:', reportList.length);
  const mariaReport = reportList.find(r => r.documento === '1002002002');
  console.log('María López Report hours:', mariaReport.horas_asistidas);
  console.log('María López Report percentage:', mariaReport.porcentaje_asistencia);
  console.log('Report Result:', mariaReport.horas_asistidas === 6 && mariaReport.porcentaje_asistencia === 100 ? 'PASS' : 'FAIL');

  // 10. Student Portal & Excuses Workflow
  console.log('\n10. Testing Student Excuses Workflow...');
  
  // A. Student Login (Carlos Gómez)
  const resStudentLogin = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ documento: '1003003003', password: 'new-secure-password' })
  });
  const studentLoginData = await resStudentLogin.json();
  const studentToken = studentLoginData.data.token;
  console.log('Student Login status:', resStudentLogin.status);
  console.log('Student Login Result:', resStudentLogin.ok && studentToken ? 'PASS' : 'FAIL');

  // B. Fetch student history
  const resStudentHist = await fetch(`${baseUrl}/api/student/history`, {
    headers: { 'Authorization': `Bearer ${studentToken}` }
  });
  const studentHistData = await resStudentHist.json();
  console.log('Student History count:', studentHistData.data.history.length);
  console.log('Student History Result:', studentHistData.data.history.length > 0 ? 'PASS' : 'FAIL');

  // C. Submit excuse
  const resExcuseSub = await fetch(`${baseUrl}/api/student/excuses`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${studentToken}`
    },
    body: JSON.stringify({
      sessionId,
      text: 'Presento excusa médica por incapacidad de la EPS.',
      fileName: 'soporte.png',
      fileData: 'data:image/png;base64,iVBORw0KGgoAAAANS...'
    })
  });
  const excuseSubData = await resExcuseSub.json();
  const excuseId = excuseSubData.data.id;
  console.log('Excuse submission status:', resExcuseSub.status);
  console.log('Excuse Submission Result:', resExcuseSub.status === 201 && excuseId ? 'PASS' : 'FAIL');

  // D. Instructor fetches excuses list
  const resInstExcuses = await fetch(`${baseUrl}/api/instructor/excuses`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const instExcusesData = await resInstExcuses.json();
  const excuseFound = instExcusesData.data.find(e => e.id === excuseId);
  console.log('Excuse found in Instructor List:', excuseFound ? 'YES' : 'NO');
  console.log('Excuse status before approval:', excuseFound ? excuseFound.status : 'N/A');
  console.log('Excuse Fetch Result:', excuseFound && excuseFound.status === 'pending' ? 'PASS' : 'FAIL');

  // E. Instructor approves excuse
  const resResolve = await fetch(`${baseUrl}/api/instructor/excuses/${excuseId}/resolve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ status: 'approved' })
  });
  console.log('Resolve status:', resResolve.status);
  console.log('Resolve Result:', resResolve.ok ? 'PASS' : 'FAIL');

  // F. Verify student attendance record is updated to justified (PRESENTE, 6 hours)
  const resReportPostExcuse = await fetch(`${baseUrl}/reports/session/${sessionId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const reportListPostExcuse = await resReportPostExcuse.json();
  const carlosReport = reportListPostExcuse.find(r => r.documento === '1003003003');
  console.log('Carlos Gómez Report hours (after excuse):', carlosReport.horas_asistidas);
  console.log('Carlos Gómez Report status (after excuse):', carlosReport.tipo_registro);
  console.log('Excuse Integration Result:', carlosReport.horas_asistidas === 6 && carlosReport.tipo_registro === 'EXCUSA_APROBADA' ? 'PASS' : 'FAIL');

  db.close();
  console.log('\n--- TESTS COMPLETED ---');
}

runTests().catch(console.error);
