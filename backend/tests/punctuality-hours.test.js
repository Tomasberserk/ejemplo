/**
 * Test Suite: C├ílculo de Horas por Puntualidad y Descuento por Retardo
 * Verifica la funci├│n pura calculateAttendanceBlocks bajo diferentes escenarios temporales.
 */
import assert from 'node:assert/strict';
import { calculateAttendanceBlocks } from '../src/controllers.js';

export async function runPunctualityTests() {
  console.log('\n[TEST SUITE] C├ílculo de Horas y Puntualidad (calculateAttendanceBlocks)');

  const baseDate = new Date('2026-08-22T08:00:00.000Z');
  const activatedAt = baseDate.toISOString();

  // Escenario 1: Llegada puntual (a los 5 minutos, dentro de los 15 min de tolerancia)
  const onTime = new Date(baseDate.getTime() + 5 * 60000).toISOString();
  const resOnTime = calculateAttendanceBlocks(activatedAt, onTime, 6);
  assert.equal(resOnTime.horasAsistidas, 6, 'Puntual debe otorgar 6 horas asistidas');
  assert.equal(resOnTime.horasFalla, 0, 'Puntual debe tener 0 horas de falla');
  assert.equal(resOnTime.tipoRegistro, 'REGULAR', 'Tipo de registro debe ser REGULAR');
  assert.equal(resOnTime.status, 'accepted', 'Estado debe ser accepted');
  console.log('  Ô£ô Escenario 1 (Tolerancia 5 min): 6h asistidas, 0h falla, REGULAR');

  // Escenario 2: L├¡mite exacto de tolerancia (a los 15 minutos)
  const limitTime = new Date(baseDate.getTime() + 15 * 60000).toISOString();
  const resLimit = calculateAttendanceBlocks(activatedAt, limitTime, 6);
  assert.equal(resLimit.horasAsistidas, 6, 'Minuto 15 debe otorgar 6 horas');
  assert.equal(resLimit.horasFalla, 0, 'Minuto 15 debe tener 0 fallas');
  assert.equal(resLimit.tipoRegistro, 'REGULAR');
  console.log('  Ô£ô Escenario 2 (L├¡mite 15 min): 6h asistidas, 0h falla, REGULAR');

  // Escenario 3: Retardo de 1 Bloque (a los 25 minutos -> 1 bloque de 1h descontado)
  const late25 = new Date(baseDate.getTime() + 25 * 60000).toISOString();
  const resLate25 = calculateAttendanceBlocks(activatedAt, late25, 6);
  assert.equal(resLate25.horasAsistidas, 5, 'Retardo de 25 min descuenta 1h -> 5h asistidas');
  assert.equal(resLate25.horasFalla, 1, 'Retardo de 25 min genera 1h de inasistencia');
  assert.equal(resLate25.tipoRegistro, 'RETARDO_BLOQUE_1', 'Tipo debe ser RETARDO_BLOQUE_1');
  assert.equal(resLate25.status, 'ASISTENCIA_PARCIAL', 'Estado debe ser ASISTENCIA_PARCIAL');
  console.log('  Ô£ô Escenario 3 (Retardo 25 min): 5h asistidas, 1h falla, RETARDO_BLOQUE_1');

  // Escenario 4: Retardo de 2 Bloques (a los 70 minutos -> 2 bloques de 1h descontados)
  const late70 = new Date(baseDate.getTime() + 70 * 60000).toISOString();
  const resLate70 = calculateAttendanceBlocks(activatedAt, late70, 6);
  assert.equal(resLate70.horasAsistidas, 4, 'Retardo de 70 min descuenta 2h -> 4h asistidas');
  assert.equal(resLate70.horasFalla, 2, 'Retardo de 70 min genera 2h de inasistencia');
  assert.equal(resLate70.tipoRegistro, 'RETARDO_BLOQUE_2', 'Tipo debe ser RETARDO_BLOQUE_2');
  console.log('  Ô£ô Escenario 4 (Retardo 70 min): 4h asistidas, 2h falla, RETARDO_BLOQUE_2');

  // Escenario 5: Retardo de 3 Bloques (a los 150 minutos -> 3 bloques descontados)
  const late150 = new Date(baseDate.getTime() + 150 * 60000).toISOString();
  const resLate150 = calculateAttendanceBlocks(activatedAt, late150, 6);
  assert.equal(resLate150.horasAsistidas, 3, 'Retardo de 150 min descuenta 3h -> 3h asistidas');
  assert.equal(resLate150.horasFalla, 3, 'Retardo de 150 min genera 3h de inasistencia');
  assert.equal(resLate150.tipoRegistro, 'RETARDO_BLOQUE_3');
  console.log('  Ô£ô Escenario 5 (Retardo 150 min): 3h asistidas, 3h falla, RETARDO_BLOQUE_3');

  // Escenario 6: Retardo Extremo / Inasistencia Total (> 360 minutos)
  const late400 = new Date(baseDate.getTime() + 400 * 60000).toISOString();
  const resLate400 = calculateAttendanceBlocks(activatedAt, late400, 6);
  assert.equal(resLate400.horasAsistidas, 0, 'Retardo > duraci├│n de la clase asigna 0h asistidas');
  assert.equal(resLate400.horasFalla, 6, 'Retardo > duraci├│n genera 6h de inasistencia');
  assert.equal(resLate400.tipoRegistro, 'RETARDO_BLOQUE_6');
  console.log('  Ô£ô Escenario 6 (Retardo > 6h): 0h asistidas, 6h falla, RETARDO_BLOQUE_6');
}

if (process.argv[1] && process.argv[1].endsWith('punctuality-hours.test.js')) {
  runPunctualityTests()
    .then(() => console.log('All punctuality tests passed!'))
    .catch((err) => { console.error('Punctuality test failed:', err); process.exit(1); });
}
