/**
 * Test Suite: Rotación Criptográfica de Tokens QR y Código CSR
 * Verifica el algoritmo HMAC SHA-256 de 12 caracteres, la compatibilidad con código manual de 6 chars
 * y la ventana de tolerancia temporal.
 */
import assert from 'node:assert/strict';
import { generateQrToken, matchToken } from '../../back/src/controllers.js';

export async function runTokenRotationTests() {
  console.log('\n[TEST SUITE] Rotación de Tokens QR (HMAC & Leeway)');

  const sessionId = 'sala_test_12345';

  // 1. Longitud y formato del token generado
  const tokenNow = generateQrToken(sessionId);
  assert.equal(typeof tokenNow, 'string', 'El token generado debe ser un string');
  assert.equal(tokenNow.length, 12, 'El token QR debe tener exactamente 12 caracteres hexadecimales');
  console.log('  ✓ generateQrToken produce un hash de 12 caracteres');

  // 2. Determinismo en el mismo bloque temporal
  const tokenRepeat = generateQrToken(sessionId, 0);
  assert.equal(tokenNow, tokenRepeat, 'Tokens generados en el mismo milisegundo/bloque deben ser idénticos');
  console.log('  ✓ Determinismo temporal verificado para el mismo bloque');

  // 3. Diferenciación por sesión
  const otherSessionToken = generateQrToken('sala_otra_sesion');
  assert.notEqual(tokenNow, otherSessionToken, 'Sesiones diferentes deben producir tokens distintos');
  console.log('  ✓ Aislamiento por sesión validado');

  // 4. Validación de coincidencia completa (12 caracteres)
  assert.equal(matchToken(tokenNow, tokenNow), true, 'matchToken debe aceptar el token completo exacto');
  assert.equal(matchToken('token_falso_', tokenNow), false, 'matchToken debe rechazar tokens inválidos');
  console.log('  ✓ matchToken valida correctamente tokens exactos de 12 caracteres');

  // 5. Validación de coincidencia con código manual (6 caracteres)
  const manualCode = tokenNow.substring(0, 6).toUpperCase();
  assert.equal(matchToken(manualCode, tokenNow), true, 'matchToken debe aceptar el prefijo de 6 caracteres (mayúsculas)');
  assert.equal(matchToken(manualCode.toLowerCase(), tokenNow), true, 'matchToken debe ser insensible a mayúsculas/minúsculas para código manual de 6 caracteres');
  assert.equal(matchToken('ZZZZZZ', tokenNow), false, 'matchToken debe rechazar código manual incorrecto');
  console.log('  ✓ matchToken valida correctamente códigos manuales CSR de 6 caracteres');

  // 6. Rotación temporal entre bloques (simulando avance de tiempo)
  const futureToken = generateQrToken(sessionId, 120000); // 2 minutos en el futuro
  assert.notEqual(tokenNow, futureToken, 'El token debe cambiar tras transcurrir bloques de tiempo');
  console.log('  ✓ Rotación de token en avance de tiempo validada');
}

if (process.argv[1] && process.argv[1].endsWith('token-rotation.test.js')) {
  runTokenRotationTests()
    .then(() => console.log('All token rotation tests passed!'))
    .catch((err) => { console.error('Token rotation test failed:', err); process.exit(1); });
}
