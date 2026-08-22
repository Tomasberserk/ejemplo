/**
 * Test Suite: Endpoints de Salud y Disponibilidad (/health & /ready)
 * Verifica que los endpoints de observabilidad respondan con HTTP 200 y el cuerpo esperado.
 */
import assert from 'node:assert/strict';
import app from '../src/server.js';
import http from 'http';

export async function runHealthTests() {
  console.log('\n[TEST SUITE] Endpoints de Salud (/health, /ready)');
  
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = 'http://127.0.0.1:' + port;

  try {
    // 1. Check /health
    const resHealth = await fetch(baseUrl + '/health');
    const textHealth = await resHealth.text();
    assert.equal(resHealth.status, 200, 'GET /health debe retornar status HTTP 200');
    assert.equal(textHealth, 'ok', 'GET /health debe retornar el texto "ok"');
    console.log('  Ô£ô GET /health retorna status 200 y cuerpo "ok"');

    // 2. Check /ready
    const resReady = await fetch(baseUrl + '/ready');
    const textReady = await resReady.text();
    assert.equal(resReady.status, 200, 'GET /ready debe retornar status HTTP 200');
    assert.equal(textReady, 'ready', 'GET /ready debe retornar el texto "ready"');
    console.log('  Ô£ô GET /ready retorna status 200 y cuerpo "ready"');

  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

if (process.argv[1] && process.argv[1].endsWith('health.test.js')) {
  runHealthTests()
    .then(() => console.log('All health tests passed!'))
    .catch((err) => { console.error('Health test failed:', err); process.exit(1); });
}
