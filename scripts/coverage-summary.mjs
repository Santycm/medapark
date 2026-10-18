// Imprime en Markdown la cobertura global (para el resumen del job de CI).
import { readFileSync } from 'node:fs';

const { total } = JSON.parse(readFileSync('coverage/coverage-summary.json', 'utf8'));
const labels = { statements: 'Sentencias', branches: 'Ramas', functions: 'Funciones', lines: 'Líneas' };

console.log('### Cobertura de pruebas (mínimo 70 %)\n');
console.log('| Métrica | Cobertura |\n|---|---|');
for (const [key, label] of Object.entries(labels)) {
  console.log(`| ${label} | ${total[key].pct} % |`);
}
