import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { get } from './db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-for-dev-only';

export const login = async (req, res) => {
  try {
    const { documento, password } = req.body;
    if (!documento || !password) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Documento y contraseña son requeridos.' }
      });
    }

    const person = await get('SELECT * FROM people WHERE documento = ? AND active = 1', [documento]);
    if (!person) {
      return res.status(401).json({
        error: { code: 'INVALID_CREDENTIALS', message: 'Credenciales inválidas o usuario inactivo.' }
      });
    }

    // Check if roles contains INSTRUCTOR (only formadores can login in the main flow, except public register)
    const roles = JSON.parse(person.roles);
    
    // Check password
    let isMatch = false;
    if (person.password.startsWith('$2b$') || person.password.startsWith('$2a$')) {
      isMatch = await bcrypt.compare(password, person.password);
    } else {
      isMatch = (password === person.password);
    }

    if (!isMatch) {
      return res.status(401).json({
        error: { code: 'INVALID_CREDENTIALS', message: 'Credenciales inválidas.' }
      });
    }

    // Generate JWT (24h)
    const tokenPayload = {
      id: person.id,
      institutionId: person.institution_id,
      documento: person.documento,
      nombre: person.nombre,
      roles
    };
    
    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '24h' });

    return res.status(200).json({
      data: {
        token,
        person: {
          id: person.id,
          institutionId: person.institution_id,
          nombre: person.nombre,
          documento: person.documento,
          roles
        }
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Error interno del servidor.' }
    });
  }
};

// Student Login (Habeas Data & Biometrics flow)
export const studentLogin = async (req, res) => {
  try {
    const { documento, password } = req.body;
    if (!documento || !password) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Documento y contraseña son requeridos.' }
      });
    }

    const person = await get('SELECT * FROM people WHERE documento = ? AND active = 1', [documento]);
    if (!person) {
      return res.status(401).json({
        error: { code: 'INVALID_CREDENTIALS', message: 'Credenciales inválidas o usuario inactivo.' }
      });
    }

    // Verify student role
    const roles = JSON.parse(person.roles);
    if (!roles.includes('APRENDIZ')) {
      return res.status(403).json({
        error: { code: 'FORBIDDEN', message: 'Acceso exclusivo para aprendices.' }
      });
    }

    // Check password
    let isMatch = false;
    if (person.password.startsWith('$2b$') || person.password.startsWith('$2a$')) {
      isMatch = await bcrypt.compare(password, person.password);
    } else {
      isMatch = (password === person.password);
    }

    if (!isMatch) {
      return res.status(401).json({
        error: { code: 'INVALID_CREDENTIALS', message: 'Contraseña incorrecta.' }
      });
    }

    // Generate JWT
    const tokenPayload = {
      id: person.id,
      institutionId: person.institution_id,
      documento: person.documento,
      nombre: person.nombre,
      roles
    };
    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '24h' });

    return res.status(200).json({
      data: {
        token,
        person: {
          id: person.id,
          nombre: person.nombre,
          documento: person.documento,
          photo_reference: person.photo_reference || '',
          terms_accepted: person.terms_accepted || 0
        }
      }
    });
  } catch (err) {
    console.error('Student login error:', err);
    return res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Error interno en el inicio de sesión.' }
    });
  }
};


export const authenticate = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: { code: 'UNAUTHORIZED', message: 'Token de autenticación no proporcionado.' }
    });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      error: { code: 'UNAUTHORIZED', message: 'Token de autenticación inválido o expirado.' }
    });
  }
};

export const requireRole = (...allowedRoles) => (req, res, next) => {
  const userRoles = req.user.roles || [];
  const hasRole = allowedRoles.some(r => userRoles.includes(r));
  if (!hasRole) {
    return res.status(403).json({
      error: { code: 'FORBIDDEN', message: 'No tienes permisos para realizar esta acción.' }
    });
  }
  next();
};
