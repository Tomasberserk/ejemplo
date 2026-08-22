/**
 * SENA ATTENDANCE SYSTEM - Automated Test Runner
 * Ejecuta todas las suites de pruebas unitarias y de integración.
 */
import { runHealthTests } from './health.test.js';
import { runTokenRotationTests } from './token-rotation.test.js';
import { runPunctualityTests } from './punctuality-hours.test.js';

async function main() {
  console.log('====================================================');
  console.log('  SENA ATTENDANCE SYSTEM - SUITE DE PRUEBAS QA');
  console.log('  Desarrollador 3: Database, Governance & Testing');
  console.log('====================================================');

  const startTime = Date.now();

  try {
    await runHealthTests();
    await runTokenRotationTests();
    await runPunctualityTests();

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log('\n====================================================');
    console.log('  ✓ TODAS LAS PRUEBAS PASARON EXITOSAMENTE (' + duration + 's)');
    console.log('====================================================\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ FALLO EN LA EJECUCIÓN DE PRUEBAS:');
    console.error(error);
    process.exit(1);
  }
}

main();
