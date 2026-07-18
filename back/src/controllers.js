import { run, get, query } from './db.js';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

// Helper to get client IP
const getClientIp = (req) => {
  const xForwardedFor = req.headers['x-forwarded-for'];
  if (xForwardedFor) {
    return xForwardedFor.split(',')[0].trim();
  }
  return req.socket.remoteAddress || req.ip;
};

// QR Token generator based on 15-second blocks
export const generateQrToken = (sessionId, timeOffset = 0) => {
  const blockIndex = Math.floor((Date.now() + timeOffset) / 15000);
  return crypto
    .createHmac('sha256', 'qr-rotation-salt')
    .update(`${sessionId}_${blockIndex}`)
    .digest('hex')
    .substring(0, 12);
};

// Match input token dynamically (full 12-char QR token or 6-char manual code)
export const matchToken = (inputToken, actualToken) => {
  if (!inputToken || !actualToken) return false;
  if (inputToken.length === 6) {
    return actualToken.substring(0, 6).toUpperCase() === inputToken.toUpperCase();
  }
  return actualToken === inputToken;
};

// Check if two IPs are on the same subnet or sharing NAT
const checkSameSubnetOrIp = (ip1, ip2) => {
  if (!ip1 || !ip2) return false;
  
  // Local dev bypass
  const localips = ['127.0.0.1', '::1', '::ffff:127.0.0.1'];
  if (localips.includes(ip1) || localips.includes(ip2)) {
    return true;
  }
  
  const norm1 = ip1.replace('::ffff:', '');
  const norm2 = ip2.replace('::ffff:', '');
  
  if (norm1 === norm2) return true;
  
  // Subnet /24 check
  const parts1 = norm1.split('.');
  const parts2 = norm2.split('.');
  if (parts1.length === 4 && parts2.length === 4) {
    return parts1[0] === parts2[0] && parts1[1] === parts2[1] && parts1[2] === parts2[2];
  }
  
  return false;
};

// Catalog Controllers
export const getInstitutions = async (req, res) => {
  try {
    const rows = await query('SELECT * FROM institutions WHERE active = 1');
    res.json({ data: rows.map(r => ({ ...r, labels: JSON.parse(r.labels), theme: JSON.parse(r.theme) })) });
  } catch (err) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message } });
  }
};

export const getUnits = async (req, res) => {
  try {
    const { institutionId } = req.params;
    const rows = await query('SELECT * FROM academic_units WHERE institution_id = ? AND active = 1', [institutionId]);
    res.json({ data: rows });
  } catch (err) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message } });
  }
};

export const getPeople = async (req, res) => {
  try {
    const { unitId } = req.params;
    const rows = await query(`
      SELECT p.id, p.documento, p.nombre, p.matricula, p.roles
      FROM people p
      JOIN enrollments e ON p.id = e.person_id
      WHERE e.unit_id = ? AND e.active = 1 AND p.active = 1
    `, [unitId]);
    res.json({ data: rows.map(r => ({ ...r, roles: JSON.parse(r.roles) })) });
  } catch (err) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message } });
  }
};

// Room Controllers
export const createRoom = async (req, res) => {
  try {
    const { institutionId, unitId, qrTtlMinutes = 15 } = req.body;
    if (!institutionId || !unitId) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'institutionId y unitId son requeridos.' } });
    }

    // Check if unit belongs to institution and contains people
    const unit = await get('SELECT * FROM academic_units WHERE id = ? AND institution_id = ?', [unitId, institutionId]);
    if (!unit) {
      return res.status(400).json({ error: { code: 'UNIT_INSTITUTION_MISMATCH', message: 'Ficha no pertenece a la institución.' } });
    }

    const countPeople = await get(`
      SELECT COUNT(*) as count FROM enrollments WHERE unit_id = ? AND active = 1
    `, [unitId]);
    if (countPeople.count === 0) {
      return res.status(400).json({ error: { code: 'UNIT_EMPTY', message: 'La ficha no tiene aprendices inscritos.' } });
    }

    const sessionId = `sala_${Date.now()}`;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 15 * 60000); // Strict 15 mins room timer
    const creatorIp = getClientIp(req);

    await run(`
      INSERT INTO attendance_sessions (
        id, institution_id, unit_id, status, qr_token, qr_expires_at, qr_ttl_minutes,
        activated_at, room_created_at, room_expires_at, is_reopened, creator_ip
      ) VALUES (?, ?, ?, 'active', ?, ?, ?, ?, ?, ?, 0, ?)
    `, [
      sessionId, institutionId, unitId,
      generateQrToken(sessionId, 0),
      expiresAt.toISOString(),
      qrTtlMinutes,
      now.toISOString(),
      now.toISOString(),
      expiresAt.toISOString(),
      creatorIp
    ]);

    const createdSession = await get('SELECT * FROM attendance_sessions WHERE id = ?', [sessionId]);
    res.status(201).json({ data: createdSession });
  } catch (err) {
    console.error('Error creating room:', err);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message } });
  }
};

export const createSessionDraft = async (req, res) => {
  // Alias or direct creation
  return createRoom(req, res);
};

export const activateSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await get('SELECT * FROM attendance_sessions WHERE id = ?', [sessionId]);
    if (!session) {
      return res.status(404).json({ error: { code: 'SESSION_NOT_FOUND', message: 'Sesión no encontrada.' } });
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 15 * 60000);
    const creatorIp = getClientIp(req);

    await run(`
      UPDATE attendance_sessions
      SET status = 'active', activated_at = ?, room_created_at = ?, room_expires_at = ?, is_reopened = 0, creator_ip = ?, qr_token = ?
      WHERE id = ?
    `, [
      now.toISOString(),
      now.toISOString(),
      expiresAt.toISOString(),
      creatorIp,
      generateQrToken(sessionId, 0),
      sessionId
    ]);

    const updated = await get('SELECT * FROM attendance_sessions WHERE id = ?', [sessionId]);
    res.json({ data: updated });
  } catch (err) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message } });
  }
};

export const closeSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await get('SELECT * FROM attendance_sessions WHERE id = ?', [sessionId]);
    if (!session) {
      return res.status(404).json({ error: { code: 'SESSION_NOT_FOUND', message: 'Sesión no encontrada.' } });
    }

    const now = new Date();
    await run(`
      UPDATE attendance_sessions
      SET status = 'closed', closed_at = ?
      WHERE id = ?
    `, [now.toISOString(), sessionId]);

    const updated = await get('SELECT * FROM attendance_sessions WHERE id = ?', [sessionId]);
    res.json({ data: updated });
  } catch (err) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message } });
  }
};

export const reopenRoom = async (req, res) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'sessionId es requerido.' } });
    }

    const session = await get('SELECT * FROM attendance_sessions WHERE id = ?', [sessionId]);
    if (!session) {
      return res.status(404).json({ error: { code: 'SESSION_NOT_FOUND', message: 'Sesión no encontrada.' } });
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 15 * 60000); // 15 mins for checkout
    const creatorIp = getClientIp(req);

    await run(`
      UPDATE attendance_sessions
      SET status = 'active', room_expires_at = ?, is_reopened = 1, creator_ip = ?
      WHERE id = ?
    `, [expiresAt.toISOString(), creatorIp, sessionId]);

    const updated = await get('SELECT * FROM attendance_sessions WHERE id = ?', [sessionId]);
    res.json({ data: updated, message: 'Sala reabierta para registrar salida.' });
  } catch (err) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message } });
  }
};

export const getSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await get('SELECT * FROM attendance_sessions WHERE id = ?', [sessionId]);
    if (!session) {
      return res.status(404).json({ error: { code: 'SESSION_NOT_FOUND', message: 'Sesión no encontrada.' } });
    }
    
    // Add current rotation token to check
    session.currentQrToken = generateQrToken(sessionId, 0);
    session.qrRotationSec = 15 - Math.floor((Date.now() % 15000) / 1000);

    res.json({ data: session });
  } catch (err) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message } });
  }
};

export const getSessionQrToken = async (req, res) => {
  try {
    const { sessionId } = req.params;
    res.json({
      qrToken: generateQrToken(sessionId, 0),
      expiresSec: 15 - Math.floor((Date.now() % 15000) / 1000)
    });
  } catch (err) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message } });
  }
};

export const getSessionsHistory = async (req, res) => {
  try {
    const rows = await query('SELECT * FROM attendance_sessions ORDER BY room_created_at DESC LIMIT 50');
    res.json({ data: rows });
  } catch (err) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message } });
  }
};

// Helper to check session state and document existence
export const checkDocument = async (req, res) => {
  try {
    const { documento } = req.body;
    const { token } = req.params;

    if (!documento || !token) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Documento y token QR son requeridos.' } });
    }

    // Find session
    let session = null;
    const activeSessions = await query("SELECT * FROM attendance_sessions WHERE status = 'active'");
    for (const s of activeSessions) {
      for (let i = -1; i <= 20; i++) {
        const tok = generateQrToken(s.id, -i * 15000);
        if (matchToken(token, tok)) { session = s; break; }
      }
      if (session) break;
    }

    if (!session) {
      return res.status(400).json({ error: { code: 'SESSION_NOT_FOUND', message: 'Sesión no encontrada o token QR inválido/vencido.' } });
    }

    if (session.status === 'closed') {
      return res.status(400).json({ error: { code: 'SESSION_CLOSED', message: 'La sala está cerrada por el instructor.' } });
    }

    const now = new Date();
    if (now > new Date(session.room_expires_at)) {
      return res.status(400).json({ error: { code: 'ROOM_EXPIRED', message: 'La ventana de 15 minutos ha cerrado.' } });
    }

    // Check person
    const person = await get('SELECT * FROM people WHERE documento = ? AND active = 1', [documento]);
    return res.json({
      data: {
        exists: !!person,
        documento
      }
    });
  } catch (err) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message } });
  }
};

// Check-in logic
export const checkin = async (req, res) => {
  try {
    const { documento, qrToken, sessionId: bodySessionId } = req.body;
    const pathToken = req.params.token; // From GET/POST /public/attendance/:token/register
    const token = qrToken || pathToken;

    if (!documento || !token) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Documento y token de QR son requeridos.' } });
    }

    // Find the session that has this token active or find by session id if supplied
    let session;
    if (bodySessionId) {
      session = await get('SELECT * FROM attendance_sessions WHERE id = ?', [bodySessionId]);
    } else {
      // Find session by matching rotating token (with 5-minute leeway = 20 blocks of 15s)
      const activeSessions = await query("SELECT * FROM attendance_sessions WHERE status = 'active'");
      for (const s of activeSessions) {
        for (let i = -1; i <= 20; i++) {
          const offset = -i * 15000;
          const tok = generateQrToken(s.id, offset);
          if (matchToken(token, tok)) {
            session = s;
            break;
          }
        }
        if (session) break;
      }
    }

    if (!session) {
      return res.status(400).json({ error: { code: 'SESSION_NOT_FOUND', message: 'Sesión no encontrada o token QR inválido/vencido.' } });
    }

    // Validations: Closed Session
    if (session.status === 'closed') {
      return res.status(400).json({ error: { code: 'SESSION_CLOSED', message: 'La sala está cerrada por el instructor.' } });
    }

    // Validations: Room Expiration (15 minutes)
    const now = new Date();
    const roomExpires = new Date(session.room_expires_at);
    if (now > roomExpires) {
      return res.status(400).json({ error: { code: 'ROOM_EXPIRED', message: 'La ventana de 15 minutos ha cerrado. No se admiten registros.' } });
    }

    // Find person
    const person = await get('SELECT * FROM people WHERE documento = ? AND active = 1', [documento]);
    if (!person) {
      // Record rejected attempt in DB
      await run(`
        INSERT INTO attendance_records (
          id, session_id, institution_id, unit_id, documento, status, reject_reason, message, created_at, client_ip
        ) VALUES (?, ?, ?, ?, ?, 'rejected', 'PERSON_NOT_FOUND', ?, ?, ?)
      `, [`rec_${Date.now()}`, session.id, session.institution_id, session.unit_id, documento, 'Persona no encontrada en el sistema.', now.toISOString(), getClientIp(req)]);

      return res.status(404).json({ error: { code: 'PERSON_NOT_FOUND', message: 'El aprendiz no está registrado.' } });
    }

    // Check if enrolled in this academic unit
    const enrollment = await get('SELECT * FROM enrollments WHERE unit_id = ? AND person_id = ? AND active = 1', [session.unit_id, person.id]);
    if (!enrollment) {
      await run(`
        INSERT INTO attendance_records (
          id, session_id, institution_id, unit_id, person_id, documento, status, reject_reason, message, created_at, client_ip
        ) VALUES (?, ?, ?, ?, ?, ?, 'rejected', 'NOT_ENROLLED', ?, ?, ?)
      `, [`rec_${Date.now()}`, session.id, session.institution_id, session.unit_id, person.id, documento, 'Aprendiz no está inscrito en esta ficha.', now.toISOString(), getClientIp(req)]);

      return res.status(400).json({ error: { code: 'NOT_ENROLLED', message: 'El aprendiz no pertenece a esta ficha.' } });
    }

    // PASSWORD VALIDATION
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ error: { code: 'PASSWORD_REQUIRED', message: 'La contraseña es requerida para identificar al estudiante.' } });
    }

    let isMatch = false;
    if (person.password.startsWith('$2b$') || person.password.startsWith('$2a$')) {
      isMatch = await bcrypt.compare(password, person.password);
    } else {
      isMatch = (password === person.password);
    }

    if (!isMatch) {
      await run(`
        INSERT INTO attendance_records (
          id, session_id, institution_id, unit_id, person_id, documento, status, reject_reason, message, created_at, client_ip
        ) VALUES (?, ?, ?, ?, ?, ?, 'rejected', 'INVALID_PASSWORD', ?, ?, ?)
      `, [`rec_${Date.now()}`, session.id, session.institution_id, session.unit_id, person.id, documento, 'Contraseña incorrecta.', now.toISOString(), getClientIp(req)]);

      return res.status(401).json({ error: { code: 'INVALID_PASSWORD', message: 'Contraseña incorrecta.' } });
    }

    // SECURITY CHECK: Subnet LAN / Client IP match
    // NOTE: QR token rotation IS the authentication. Document just identifies the student.
    const clientIp = getClientIp(req);
    const creatorIp = session.creator_ip;
    const bypassIp = process.env.BYPASS_IP_CHECK === 'true';

    if (!bypassIp && !checkSameSubnetOrIp(clientIp, creatorIp)) {
      await run(`
        INSERT INTO attendance_records (
          id, session_id, institution_id, unit_id, person_id, documento, status, reject_reason, message, created_at, client_ip
        ) VALUES (?, ?, ?, ?, ?, ?, 'rejected', 'OUT_OF_SUBNET', ?, ?, ?)
      `, [`rec_${Date.now()}`, session.id, session.institution_id, session.unit_id, person.id, documento, 'Fuera del rango local / Subred del docente.', now.toISOString(), clientIp]);

      return res.status(400).json({
        error: {
          code: 'OUT_OF_SUBNET',
          message: 'Tu dispositivo no está conectado a la misma subred local que el docente. Por favor conéctate al WiFi del aula.'
        }
      });
    }

    // Check for duplicate entry/exit
    const existingRecord = await get(`
      SELECT * FROM attendance_records 
      WHERE session_id = ? AND person_id = ? AND status != 'rejected'
    `, [session.id, person.id]);

    if (session.is_reopened === 1) {
      // Checkout phase
      if (!existingRecord) {
        return res.status(400).json({ error: { code: 'NO_ENTRY_RECORD', message: 'No se puede registrar salida sin haber registrado entrada primero.' } });
      }

      if (existingRecord.hora_salida_real) {
        return res.status(400).json({ error: { code: 'DUPLICATE_EXIT', message: 'Ya has registrado tu salida para esta clase.' } });
      }

      // Update record with checkout time
      const horaSalida = now.toTimeString().split(' ')[0];
      await run(`
        UPDATE attendance_records
        SET hora_salida_real = ?
        WHERE id = ?
      `, [horaSalida, existingRecord.id]);

      const updatedRecord = await get('SELECT * FROM attendance_records WHERE id = ?', [existingRecord.id]);
      return res.json({ data: updatedRecord, message: 'Salida registrada correctamente.' });

    } else {
      // Entry phase
      if (existingRecord) {
        return res.status(400).json({ error: { code: 'DUPLICATE_ENTRY', message: 'Ya registraste tu ingreso a esta clase.' } });
      }

      // Calculate fractional attendance
      const activatedTime = new Date(session.activated_at);
      const minutesElapsed = Math.floor((now.getTime() - activatedTime.getTime()) / 60000);

      const horasProgramadas = 6;
      let horasAsistidas = 6;
      let horasFalla = 0;
      let tipoRegistro = 'REGULAR';
      let status = 'accepted';

      if (minutesElapsed <= 15) {
        // Punctuality window
        horasAsistidas = 6;
        horasFalla = 0;
        tipoRegistro = 'REGULAR';
        status = 'accepted';
      } else {
        // Late block discount
        const hoursMissed = Math.min(horasProgramadas, Math.ceil(minutesElapsed / 60));
        horasAsistidas = horasProgramadas - hoursMissed;
        horasFalla = hoursMissed;
        tipoRegistro = `RETARDO_BLOQUE_${hoursMissed}`;
        status = 'ASISTENCIA_PARCIAL';
      }

      const recId = `ast_${Date.now().toString().substring(5)}`;
      const horaIngreso = now.toTimeString().split(' ')[0];
      const fecha = now.toISOString().split('T')[0];

      await run(`
        INSERT INTO attendance_records (
          id, session_id, institution_id, unit_id, person_id, documento, status, message,
          hora_ingreso_real, horas_programadas_sesion, horas_validadas_asistencia, horas_inasistencia_acumulada,
          tipo_registro, created_at, client_ip
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        recId, session.id, session.institution_id, session.unit_id, person.id, documento, status,
        horasFalla > 0 ? `Llegada tarde. Se penaliza con ${horasFalla} hora(s) de inasistencia.` : 'Asistencia puntual registrada.',
        horaIngreso, horasProgramadas, horasAsistidas, horasFalla, tipoRegistro, now.toISOString(), clientIp
      ]);

      const savedRecord = await get('SELECT * FROM attendance_records WHERE id = ?', [recId]);
      return res.status(200).json({ data: savedRecord });
    }
  } catch (err) {
    console.error('Check-in error:', err);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message } });
  }
};

// Manual override by Teacher
export const manualOverride = async (req, res) => {
  try {
    const { sessionId, documento, horas_validadas_asistencia = 6, horas_inasistencia_acumulada = 0, tipo_registro = 'MANUAL_OVERRIDE' } = req.body;
    if (!sessionId || !documento) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'sessionId y documento son requeridos.' } });
    }

    const session = await get('SELECT * FROM attendance_sessions WHERE id = ?', [sessionId]);
    if (!session) {
      return res.status(404).json({ error: { code: 'SESSION_NOT_FOUND', message: 'Sesión no encontrada.' } });
    }

    const person = await get('SELECT * FROM people WHERE documento = ? AND active = 1', [documento]);
    if (!person) {
      return res.status(404).json({ error: { code: 'PERSON_NOT_FOUND', message: 'Persona no encontrada.' } });
    }

    const now = new Date();
    const recId = `ast_man_${Date.now().toString().substring(8)}`;
    
    // Check if record exists to update it, or insert new one
    const existing = await get('SELECT * FROM attendance_records WHERE session_id = ? AND person_id = ?', [sessionId, person.id]);
    
    if (existing) {
      await run(`
        UPDATE attendance_records
        SET status = 'PRESENTE',
            horas_validadas_asistencia = ?,
            horas_inasistencia_acumulada = ?,
            tipo_registro = ?,
            message = 'Corregido manualmente por el instructor.'
        WHERE id = ?
      `, [horas_validadas_asistencia, horas_inasistencia_acumulada, tipo_registro, existing.id]);
      
      const updated = await get('SELECT * FROM attendance_records WHERE id = ?', [existing.id]);
      return res.json({ data: updated, message: 'Registro actualizado por corrección manual.' });
    } else {
      const horaIngreso = now.toTimeString().split(' ')[0];
      await run(`
        INSERT INTO attendance_records (
          id, session_id, institution_id, unit_id, person_id, documento, status, message,
          hora_ingreso_real, horas_programadas_sesion, horas_validadas_asistencia, horas_inasistencia_acumulada,
          tipo_registro, created_at, client_ip
        ) VALUES (?, ?, ?, ?, ?, ?, 'PRESENTE', 'Ingreso manual justificado por el instructor.', ?, 6, ?, ?, ?, ?, 'override')
      `, [
        recId, sessionId, session.institution_id, session.unit_id, person.id, documento,
        horaIngreso, horas_validadas_asistencia, horas_inasistencia_acumulada, tipo_registro, now.toISOString()
      ]);
      
      const saved = await get('SELECT * FROM attendance_records WHERE id = ?', [recId]);
      return res.json({ data: saved, message: 'Ingreso manual registrado.' });
    }
  } catch (err) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message } });
  }
};

// Manual Late Check-in (Teacher clicks 'Ingreso Retardado' for student)
export const manualLateCheckin = async (req, res) => {
  try {
    const { sessionId, documento } = req.body;
    if (!sessionId || !documento) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'sessionId y documento son requeridos.' } });
    }

    const session = await get('SELECT * FROM attendance_sessions WHERE id = ?', [sessionId]);
    if (!session) {
      return res.status(404).json({ error: { code: 'SESSION_NOT_FOUND', message: 'Sesión no encontrada.' } });
    }

    const person = await get('SELECT * FROM people WHERE documento = ? AND active = 1', [documento]);
    if (!person) {
      return res.status(404).json({ error: { code: 'PERSON_NOT_FOUND', message: 'Persona no encontrada.' } });
    }

    const now = new Date();
    
    // Check if record already exists
    const existing = await get("SELECT * FROM attendance_records WHERE session_id = ? AND person_id = ? AND status != 'rejected'", [sessionId, person.id]);
    if (existing) {
      return res.status(400).json({ error: { code: 'DUPLICATE_ENTRY', message: 'El aprendiz ya tiene un registro de asistencia válido.' } });
    }

    // Calculate fraction based on current time
    const activatedTime = new Date(session.activated_at);
    const minutesElapsed = Math.floor((now.getTime() - activatedTime.getTime()) / 60000);

    const horasProgramadas = 6;
    let horasAsistidas = 6;
    let horasFalla = 0;
    let tipoRegistro = 'REGULAR';
    let status = 'accepted';

    if (minutesElapsed <= 15) {
      horasAsistidas = 6;
      horasFalla = 0;
      tipoRegistro = 'REGULAR';
      status = 'accepted';
    } else {
      const hoursMissed = Math.min(horasProgramadas, Math.ceil(minutesElapsed / 60));
      horasAsistidas = horasProgramadas - hoursMissed;
      horasFalla = hoursMissed;
      tipoRegistro = `RETARDO_BLOQUE_${hoursMissed}`;
      status = 'ASISTENCIA_PARCIAL';
    }

    const recId = `ast_man_late_${Date.now().toString().substring(8)}`;
    const horaIngreso = now.toTimeString().split(' ')[0];

    await run(`
      INSERT INTO attendance_records (
        id, session_id, institution_id, unit_id, person_id, documento, status, message,
        hora_ingreso_real, horas_programadas_sesion, horas_validadas_asistencia, horas_inasistencia_acumulada,
        tipo_registro, created_at, client_ip
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'override-late')
    `, [
      recId, sessionId, session.institution_id, session.unit_id, person.id, documento, status,
      `Ingreso retardado manual. Horas de falla: ${horasFalla}.`,
      horaIngreso, horasProgramadas, horasAsistidas, horasFalla, tipoRegistro, now.toISOString()
    ]);

    const saved = await get('SELECT * FROM attendance_records WHERE id = ?', [recId]);
    return res.json({ data: saved, message: 'Ingreso retardado manual registrado con éxito.' });
  } catch (err) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message } });
  }
};

// Real-time details
export const getPresent = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const rows = await query(`
      SELECT r.*, p.nombre
      FROM attendance_records r
      JOIN people p ON r.person_id = p.id
      WHERE r.session_id = ? AND r.status IN ('accepted', 'ASISTENCIA_PARCIAL', 'PRESENTE')
    `, [sessionId]);
    res.json({ data: rows });
  } catch (err) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message } });
  }
};

export const getAbsent = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await get('SELECT * FROM attendance_sessions WHERE id = ?', [sessionId]);
    if (!session) {
      return res.status(404).json({ error: { code: 'SESSION_NOT_FOUND', message: 'Sesión no encontrada.' } });
    }

    // Absents are people enrolled in the unit that don't have an accepted record
    const rows = await query(`
      SELECT p.id, p.documento, p.nombre, p.matricula
      FROM people p
      JOIN enrollments e ON p.id = e.person_id
      WHERE e.unit_id = ? AND e.active = 1 AND p.active = 1
      AND p.id NOT IN (
        SELECT person_id FROM attendance_records
        WHERE session_id = ? AND status IN ('accepted', 'ASISTENCIA_PARCIAL', 'PRESENTE')
      )
    `, [session.unit_id, sessionId]);
    
    res.json({ data: rows });
  } catch (err) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message } });
  }
};

export const getRejections = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const rows = await query(`
      SELECT * FROM attendance_records
      WHERE session_id = ? AND status = 'rejected'
      ORDER BY created_at DESC
    `, [sessionId]);
    res.json({ data: rows });
  } catch (err) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message } });
  }
};

// Session report (Rule 3)
export const getSessionReport = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await get('SELECT * FROM attendance_sessions WHERE id = ?', [sessionId]);
    if (!session) {
      return res.status(404).json({ error: { code: 'SESSION_NOT_FOUND', message: 'Sesión no encontrada.' } });
    }

    // Get all enrolled people
    const enrolled = await query(`
      SELECT p.id, p.documento, p.nombre
      FROM people p
      JOIN enrollments e ON p.id = e.person_id
      WHERE e.unit_id = ? AND e.active = 1 AND p.active = 1
    `, [session.unit_id]);

    // Get all records for this session
    const records = await query(`
      SELECT * FROM attendance_records WHERE session_id = ? AND status != 'rejected'
    `, [sessionId]);

    const recordMap = new Map(records.map(r => [r.person_id, r]));
    const horasProgramadas = 6;

    const report = enrolled.map(p => {
      const rec = recordMap.get(p.id);
      
      let horasAsistidas = 0;
      let horasFalla = horasProgramadas;
      let tipoRegistro = 'FALLA_TOTAL';
      let porcentajeAsistencia = 0.0;

      if (rec) {
        horasAsistidas = rec.horas_validadas_asistencia;
        horasFalla = rec.horas_inasistencia_acumulada;
        tipoRegistro = rec.tipo_registro;
        porcentajeAsistencia = parseFloat(((horasAsistidas / horasProgramadas) * 100).toFixed(2));
      }

      return {
        documento: p.documento,
        nombre: p.nombre,
        horas_programadas: horasProgramadas,
        horas_asistidas: horasAsistidas,
        horas_falla: horasFalla,
        porcentaje_asistencia: porcentajeAsistencia,
        tipo_registro: tipoRegistro,
        hora_ingreso: rec ? rec.hora_ingreso_real : '-',
        hora_salida: rec ? (rec.hora_salida_real || '-') : '-'
      };
    });

    res.json(report);
  } catch (err) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message } });
  }
};

// Student History
export const getStudentHistory = async (req, res) => {
  try {
    const studentId = req.user.id;

    // 1. Get Ficha enrollment
    const enrollment = await get('SELECT unit_id FROM enrollments WHERE person_id = ? AND active = 1', [studentId]);
    if (!enrollment) {
      return res.json({ data: { sessions: [], excuses: [] } });
    }

    const unitId = enrollment.unit_id;

    // 2. Get all sessions for this Ficha
    const sessions = await query(`
      SELECT s.*, u.code as unit_code, u.name as unit_name
      FROM attendance_sessions s
      JOIN academic_units u ON s.unit_id = u.id
      WHERE s.unit_id = ?
      ORDER BY s.room_created_at DESC
    `, [unitId]);

    // 3. Get student attendance records
    const records = await query(`
      SELECT * FROM attendance_records 
      WHERE person_id = ? AND status != 'rejected'
    `, [studentId]);

    // 4. Get student submitted excuses
    const excuses = await query('SELECT * FROM excuses WHERE person_id = ?', [studentId]);

    // Merge sessions with records and excuses
    const recordMap = new Map(records.map(r => [r.session_id, r]));
    const excuseMap = new Map(excuses.map(e => [e.session_id, e]));

    const history = sessions.map(s => {
      const rec = recordMap.get(s.id);
      const exc = excuseMap.get(s.id);

      return {
        sessionId: s.id,
        unitCode: s.unit_code,
        unitName: s.unit_name,
        date: s.room_created_at.split('T')[0],
        status: rec ? rec.status : 'FALLA_TOTAL',
        horas_programadas: rec ? rec.horas_programadas_sesion : 6,
        horas_asistidas: rec ? rec.horas_validadas_asistencia : 0,
        horas_falla: rec ? rec.horas_inasistencia_acumulada : 6,
        tipo_registro: rec ? rec.tipo_registro : 'FALLA_TOTAL',
        hora_ingreso: rec ? rec.hora_ingreso_real : '-',
        hora_salida: rec ? (rec.hora_salida_real || '-') : '-',
        excuse: exc ? {
          id: exc.id,
          text: exc.text,
          fileName: exc.file_name,
          status: exc.status
        } : null
      };
    });

    res.json({
      data: {
        history,
        excuses
      }
    });

  } catch (err) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message } });
  }
};

// Submit Student Excuse
export const submitExcuse = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { sessionId, text, fileName, fileData } = req.body;

    if (!sessionId || !text) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'sessionId y texto son obligatorios.' } });
    }

    // Verify session exists
    const session = await get('SELECT * FROM attendance_sessions WHERE id = ?', [sessionId]);
    if (!session) {
      return res.status(404).json({ error: { code: 'SESSION_NOT_FOUND', message: 'Sesión no encontrada.' } });
    }

    // Check if excuse already submitted
    const existing = await get('SELECT * FROM excuses WHERE session_id = ? AND person_id = ?', [sessionId, studentId]);
    if (existing) {
      return res.status(400).json({ error: { code: 'DUPLICATE_EXCUSE', message: 'Ya has enviado una excusa para esta clase.' } });
    }

    const excuseId = `exc_${Date.now()}`;
    const now = new Date();

    await run(`
      INSERT INTO excuses (id, session_id, person_id, text, file_name, file_data, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)
    `, [excuseId, sessionId, studentId, text, fileName || null, fileData || null, now.toISOString()]);

    const created = await get('SELECT * FROM excuses WHERE id = ?', [excuseId]);
    res.status(201).json({ data: created, message: 'Excusa enviada al instructor correctamente.' });

  } catch (err) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message } });
  }
};

// Get Instructor Excuses List
export const getInstructorExcuses = async (req, res) => {
  try {
    const rows = await query(`
      SELECT e.id, e.session_id, e.person_id, e.text, e.file_name, e.file_data, e.status, e.created_at,
             p.nombre as student_name, p.documento as student_doc,
             s.room_created_at, u.code as unit_code, u.name as unit_name
      FROM excuses e
      JOIN people p ON e.person_id = p.id
      JOIN attendance_sessions s ON e.session_id = s.id
      JOIN academic_units u ON s.unit_id = u.id
      ORDER BY e.created_at DESC
    `);
    res.json({ data: rows });
  } catch (err) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message } });
  }
};

// Resolve Excuse (Approve or Reject)
export const resolveExcuse = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'approved' or 'rejected'

    if (!status || !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'El estado debe serapproved o rejected.' } });
    }

    const excuse = await get('SELECT * FROM excuses WHERE id = ?', [id]);
    if (!excuse) {
      return res.status(404).json({ error: { code: 'EXCUSE_NOT_FOUND', message: 'Excusa no encontrada.' } });
    }

    // Update status in excuses
    await run('UPDATE excuses SET status = ? WHERE id = ?', [status, id]);

    if (status === 'approved') {
      // Find or create attendance record and mark it justified
      const person = await get('SELECT * FROM people WHERE id = ?', [excuse.person_id]);
      const session = await get('SELECT * FROM attendance_sessions WHERE id = ?', [excuse.session_id]);

      const now = new Date();
      const existingRecord = await get('SELECT * FROM attendance_records WHERE session_id = ? AND person_id = ?', [excuse.session_id, excuse.person_id]);

      if (existingRecord) {
        await run(`
          UPDATE attendance_records
          SET status = 'PRESENTE',
              horas_validadas_asistencia = 6,
              horas_inasistencia_acumulada = 0,
              tipo_registro = 'EXCUSA_APROBADA',
              message = 'Falla justificada por excusa aprobada.'
          WHERE id = ?
        `, [existingRecord.id]);
      } else {
        const recId = `ast_exc_${Date.now().toString().substring(8)}`;
        const horaIngreso = '-';
        await run(`
          INSERT INTO attendance_records (
            id, session_id, institution_id, unit_id, person_id, documento, status, message,
            hora_ingreso_real, horas_programadas_sesion, horas_validadas_asistencia, horas_inasistencia_acumulada,
            tipo_registro, created_at, client_ip
          ) VALUES (?, ?, ?, ?, ?, ?, 'PRESENTE', 'Falla justificada por excusa aprobada.', ?, 6, 6, 0, 'EXCUSA_APROBADA', ?, 'override-excuse')
        `, [
          recId, excuse.session_id, session.institution_id, session.unit_id, person.id, person.documento,
          horaIngreso, now.toISOString()
        ]);
      }
    }

    res.json({ message: `Excusa procesada como ${status} con éxito.` });

  } catch (err) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message } });
  }
};

// ── SELF-REGISTER + CHECK-IN via QR ──────────────────────────────────────────
// Student not in DB can register themselves while an active session is open.
export const selfRegisterCheckin = async (req, res) => {
  try {
    const { token } = req.params;
    const { documento, nombre, password } = req.body;

    if (!documento || !nombre) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Documento y nombre son requeridos.' } });
    }

    // Find session by token (with 5-minute leeway)
    let session = null;
    const activeSessions = await query("SELECT * FROM attendance_sessions WHERE status = 'active'");
    for (const s of activeSessions) {
      for (let i = -1; i <= 20; i++) {
        const tok = generateQrToken(s.id, -i * 15000);
        if (matchToken(token, tok)) { session = s; break; }
      }
      if (session) break;
    }

    if (!session) {
      return res.status(400).json({ error: { code: 'SESSION_NOT_FOUND', message: 'Sesión no encontrada o token QR inválido/vencido.' } });
    }

    // Check room not expired
    const now = new Date();
    if (now > new Date(session.room_expires_at)) {
      return res.status(400).json({ error: { code: 'ROOM_EXPIRED', message: 'La ventana de 15 minutos ha cerrado.' } });
    }

    // Create or find person
    let person = await get('SELECT * FROM people WHERE documento = ? AND active = 1', [documento]);
    let isNewStudent = false;

    if (!person) {
      isNewStudent = true;
      const personId = `per_${Date.now()}`;
      const hashedPwd = await bcrypt.hash(password || documento, 10);
      await run(`
        INSERT INTO people (id, institution_id, documento, nombre, matricula, active, password, roles)
        VALUES (?, ?, ?, ?, ?, 1, ?, ?)
      `, [personId, session.institution_id, documento, nombre, `MAT-${documento}`, hashedPwd, JSON.stringify(['APRENDIZ'])]);

      await run(`
        INSERT INTO enrollments (id, institution_id, unit_id, person_id, active)
        VALUES (?, ?, ?, ?, 1)
      `, [`enr_${personId}_${session.unit_id}`, session.institution_id, session.unit_id, personId]);

      person = await get('SELECT * FROM people WHERE id = ?', [personId]);
    } else {
      // Enroll in unit if not already
      const enrollment = await get('SELECT * FROM enrollments WHERE unit_id = ? AND person_id = ? AND active = 1', [session.unit_id, person.id]);
      if (!enrollment) {
        await run(`
          INSERT INTO enrollments (id, institution_id, unit_id, person_id, active)
          VALUES (?, ?, ?, ?, 1)
        `, [`enr_${person.id}_${session.unit_id}`, session.institution_id, session.unit_id, person.id]);
      }
    }

    // Check duplicate
    const existingRecord = await get(`SELECT * FROM attendance_records WHERE session_id = ? AND person_id = ? AND status != 'rejected'`, [session.id, person.id]);
    if (existingRecord) {
      const unit = await get('SELECT * FROM academic_units WHERE id = ?', [session.unit_id]);
      return res.status(200).json({
        data: { ...existingRecord, nombre: person.nombre, ficha: unit?.name || '', isNewStudent: false, alreadyRegistered: true }
      });
    }

    // Calculate attendance
    const activatedTime = new Date(session.activated_at);
    const minutesElapsed = Math.floor((now - activatedTime) / 60000);
    const horasProgramadas = 6;
    let horasAsistidas = 6, horasFalla = 0, tipoRegistro = 'REGULAR', status = 'accepted';

    if (minutesElapsed > 15) {
      const hoursMissed = Math.min(horasProgramadas, Math.ceil(minutesElapsed / 60));
      horasAsistidas = horasProgramadas - hoursMissed;
      horasFalla = hoursMissed;
      tipoRegistro = `RETARDO_BLOQUE_${hoursMissed}`;
      status = 'ASISTENCIA_PARCIAL';
    }

    const recId = `ast_sr_${Date.now()}`;
    const horaIngreso = now.toTimeString().split(' ')[0];

    await run(`
      INSERT INTO attendance_records (
        id, session_id, institution_id, unit_id, person_id, documento, status, message,
        hora_ingreso_real, horas_programadas_sesion, horas_validadas_asistencia,
        horas_inasistencia_acumulada, tipo_registro, created_at, client_ip
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      recId, session.id, session.institution_id, session.unit_id, person.id, documento,
      status,
      isNewStudent ? 'Registro nuevo. Asistencia marcada automáticamente.' : (horasFalla > 0 ? `Llegada tarde. ${horasFalla}h de inasistencia.` : 'Asistencia puntual registrada.'),
      horaIngreso, horasProgramadas, horasAsistidas, horasFalla, tipoRegistro, now.toISOString(), getClientIp(req)
    ]);

    const record = await get('SELECT * FROM attendance_records WHERE id = ?', [recId]);
    const unit = await get('SELECT * FROM academic_units WHERE id = ?', [session.unit_id]);

    return res.status(201).json({
      data: { ...record, nombre: person.nombre, ficha: unit?.name || '', isNewStudent }
    });
  } catch (err) {
    console.error('Self-register error:', err);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message } });
  }
};

// ── SUBMIT LATE REQUEST ───────────────────────────────────────────────────────
// Student arrives late or session expired; sends a request to the instructor.
export const submitLateRequest = async (req, res) => {
  try {
    const { token } = req.params;
    const { documento, nombre, justification } = req.body;

    if (!documento || !nombre) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Documento y nombre son requeridos.' } });
    }

    // Find session by token (wider window: up to 2 hours back for expired sessions)
    let session = null;
    const sessions = await query("SELECT * FROM attendance_sessions WHERE status != 'draft' ORDER BY created_at DESC");
    for (const s of sessions) {
      for (let i = -1; i <= 480; i++) { // 480 x 15s = 2 hours
        const tok = generateQrToken(s.id, -i * 15000);
        if (matchToken(token, tok)) { session = s; break; }
      }
      if (session) break;
    }

    if (!session) {
      return res.status(400).json({ error: { code: 'SESSION_NOT_FOUND', message: 'No se pudo identificar la sesión de clase con este QR.' } });
    }

    const requestId = `lr_${Date.now()}`;
    const now = new Date();

    await run(`
      INSERT INTO late_requests (id, session_id, institution_id, unit_id, documento, nombre, justification, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?)
    `, [requestId, session.id, session.institution_id, session.unit_id, documento, nombre, justification || '', now.toISOString()]);

    return res.status(201).json({
      data: { id: requestId, message: 'Solicitud enviada al instructor. Te notificarán cuando sea aprobada.' }
    });
  } catch (err) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message } });
  }
};

// ── GET INSTRUCTOR LATE REQUESTS ──────────────────────────────────────────────
export const getInstructorLateRequests = async (req, res) => {
  try {
    const person = req.user;

    // Get all units in this instructor's institution
    const units = await query(`
      SELECT id FROM academic_units WHERE institution_id = ?
    `, [person.institutionId]);

    const unitIds = units.map(u => u.id);

    if (unitIds.length === 0) {
      return res.json({ data: [] });
    }

    const placeholders = unitIds.map(() => '?').join(',');
    const rows = await query(`
      SELECT lr.*, au.name as ficha_name, au.code as ficha_code
      FROM late_requests lr
      JOIN academic_units au ON lr.unit_id = au.id
      WHERE lr.unit_id IN (${placeholders})
      ORDER BY lr.created_at DESC
    `, unitIds);

    res.json({ data: rows });
  } catch (err) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message } });
  }
};

// ── RESOLVE LATE REQUEST ──────────────────────────────────────────────────────
export const resolveLateRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, horasDescontar = 1 } = req.body; // 'approved' or 'rejected'

    const request = await get('SELECT * FROM late_requests WHERE id = ?', [id]);
    if (!request) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Solicitud no encontrada.' } });

    if (status === 'approved') {
      const now = new Date();

      // Find or create person
      let person = await get('SELECT * FROM people WHERE documento = ? AND active = 1', [request.documento]);
      if (!person) {
        const personId = `per_lr_${Date.now()}`;
        await run(`
          INSERT INTO people (id, institution_id, documento, nombre, matricula, active, password, roles)
          VALUES (?, ?, ?, ?, ?, 1, ?, ?)
        `, [personId, request.institution_id, request.documento, request.nombre, `MAT-${request.documento}`, request.documento, JSON.stringify(['APRENDIZ'])]);

        await run(`
          INSERT INTO enrollments (id, institution_id, unit_id, person_id, active)
          VALUES (?, ?, ?, ?, 1)
        `, [`enr_${personId}_${request.unit_id}`, request.institution_id, request.unit_id, personId]);

        person = await get('SELECT * FROM people WHERE id = ?', [personId]);
      }

      const horasAsistidas = Math.max(0, 6 - horasDescontar);
      const horasFalla = Number(horasDescontar);

      const existing = await get(`SELECT * FROM attendance_records WHERE session_id = ? AND person_id = ? AND status != 'rejected'`, [request.session_id, person.id]);

      if (existing) {
        await run(`
          UPDATE attendance_records
          SET horas_validadas_asistencia = ?, horas_inasistencia_acumulada = ?, tipo_registro = 'LATE_VALIDATED', status = 'ASISTENCIA_PARCIAL',
              message = 'Ingreso tardío validado por el instructor.'
          WHERE id = ?
        `, [horasAsistidas, horasFalla, existing.id]);
      } else {
        const recId = `ast_lv_${Date.now()}`;
        const horaIngreso = now.toTimeString().split(' ')[0];
        await run(`
          INSERT INTO attendance_records (
            id, session_id, institution_id, unit_id, person_id, documento, status, message,
            hora_ingreso_real, horas_programadas_sesion, horas_validadas_asistencia,
            horas_inasistencia_acumulada, tipo_registro, created_at, client_ip
          ) VALUES (?, ?, ?, ?, ?, ?, 'ASISTENCIA_PARCIAL', 'Ingreso tardío validado por el instructor.', ?, 6, ?, ?, 'LATE_VALIDATED', ?, 'late-validated')
        `, [recId, request.session_id, request.institution_id, request.unit_id, person.id, request.documento,
            horaIngreso, horasAsistidas, horasFalla, now.toISOString()]);
      }
    }

    await run('UPDATE late_requests SET status = ?, horas_descontar = ? WHERE id = ?', [status, horasDescontar, id]);

    res.json({ data: { id, status, message: status === 'approved' ? 'Ingreso tardío aprobado.' : 'Solicitud rechazada.' } });
  } catch (err) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message } });
  }
};

// ── COORDINATOR CONTROLLERS ───────────────────────────────────────────────────

export const getCoordInstructors = async (req, res) => {
  try {
    const institutionId = req.user.institutionId;
    const rows = await query(
      `SELECT id, documento, nombre, active, roles FROM people 
       WHERE institution_id = ? AND roles LIKE '%INSTRUCTOR%'
       ORDER BY nombre ASC`,
      [institutionId]
    );
    res.json({ data: rows });
  } catch (err) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message } });
  }
};

export const createInstructor = async (req, res) => {
  try {
    const { documento, nombre, password } = req.body;
    const institutionId = req.user.institutionId;

    if (!documento || !nombre || !password) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Documento, nombre y contraseña son requeridos.' } });
    }

    const existing = await get(
      'SELECT id FROM people WHERE documento = ? AND institution_id = ?',
      [documento, institutionId]
    );
    if (existing) {
      return res.status(409).json({ error: { code: 'DUPLICATE_ERROR', message: 'Ya existe un usuario con ese documento.' } });
    }

    const hashedPwd = await bcrypt.hash(password, 10);
    const id = `per_inst_${Date.now()}`;
    await run(
      `INSERT INTO people (id, institution_id, documento, nombre, matricula, active, password, roles)
       VALUES (?, ?, ?, ?, ?, 1, ?, ?)`,
      [id, institutionId, documento, nombre, `MAT-${documento}`, hashedPwd, JSON.stringify(['INSTRUCTOR'])]
    );

    res.status(201).json({ data: { id, documento, nombre, active: 1, roles: ['INSTRUCTOR'] } });
  } catch (err) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message } });
  }
};

export const updateInstructor = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, password, active } = req.body;
    const institutionId = req.user.institutionId;

    const instructor = await get('SELECT * FROM people WHERE id = ? AND institution_id = ?', [id, institutionId]);
    if (!instructor) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Instructor no encontrado.' } });
    }

    let queryStr = 'UPDATE people SET nombre = ?, active = ?';
    let params = [nombre !== undefined ? nombre : instructor.nombre, active !== undefined ? Number(active) : instructor.active];

    if (password) {
      const hashedPwd = await bcrypt.hash(password, 10);
      queryStr += ', password = ?';
      params.push(hashedPwd);
    }

    queryStr += ' WHERE id = ?';
    params.push(id);

    await run(queryStr, params);

    res.json({ data: { id, message: 'Instructor actualizado con éxito.' } });
  } catch (err) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message } });
  }
};

export const getCoordFichas = async (req, res) => {
  try {
    const institutionId = req.user.institutionId;
    const rows = await query(
      `SELECT au.id, au.code, au.name, au.active, COUNT(e.id) as learners_count
       FROM academic_units au
       LEFT JOIN enrollments e ON au.id = e.unit_id AND e.active = 1
       WHERE au.institution_id = ? AND au.type = 'ficha'
       GROUP BY au.id
       ORDER BY au.code ASC`,
      [institutionId]
    );
    res.json({ data: rows });
  } catch (err) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message } });
  }
};

export const createFicha = async (req, res) => {
  try {
    const { code, name } = req.body;
    const institutionId = req.user.institutionId;

    if (!code || !name) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Código y nombre son requeridos.' } });
    }

    const existing = await get(
      'SELECT id FROM academic_units WHERE code = ? AND institution_id = ?',
      [code, institutionId]
    );
    if (existing) {
      return res.status(409).json({ error: { code: 'DUPLICATE_ERROR', message: 'Ya existe una ficha con ese código.' } });
    }

    const id = `unit_ficha_${code}`;
    await run(
      `INSERT INTO academic_units (id, institution_id, code, name, type, active)
       VALUES (?, ?, ?, ?, 'ficha', 1)`,
      [id, institutionId, code, name]
    );

    res.status(201).json({ data: { id, code, name, active: 1, learners_count: 0 } });
  } catch (err) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message } });
  }
};

export const updateFicha = async (req, res) => {
  try {
    const { id } = req.params;
    const { code, name, active } = req.body;
    const institutionId = req.user.institutionId;

    const unit = await get('SELECT * FROM academic_units WHERE id = ? AND institution_id = ?', [id, institutionId]);
    if (!unit) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Ficha no encontrada.' } });
    }

    const queryStr = 'UPDATE academic_units SET code = ?, name = ?, active = ? WHERE id = ?';
    const params = [
      code !== undefined ? code : unit.code,
      name !== undefined ? name : unit.name,
      active !== undefined ? Number(active) : unit.active,
      id
    ];

    await run(queryStr, params);

    res.json({ data: { id, message: 'Ficha actualizada con éxito.' } });
  } catch (err) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message } });
  }
};

