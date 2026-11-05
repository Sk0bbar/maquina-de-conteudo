'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { pascoa, feriados, ehDiaUtil, antepenultimoDiaUtil, deveEnviarLembrete } = require('../src/dias-uteis');

const iso = (d) => d.toISOString().slice(0, 10);

test('Páscoa calculada corretamente', () => {
  assert.equal(iso(pascoa(2026)), '2026-04-05');
  assert.equal(iso(pascoa(2027)), '2027-03-28');
});

test('feriados móveis derivam da Páscoa', () => {
  const f = feriados(2026);
  assert.ok(f.has('2026-02-16')); // segunda de Carnaval
  assert.ok(f.has('2026-02-17')); // terça de Carnaval
  assert.ok(f.has('2026-04-03')); // Sexta-feira Santa
  assert.ok(f.has('2026-06-04')); // Corpus Christi
});

test('fim de semana e feriado não são dias úteis', () => {
  assert.equal(ehDiaUtil(new Date('2026-10-31T12:00:00Z')), false); // sábado
  assert.equal(ehDiaUtil(new Date('2026-10-12T12:00:00Z')), false); // N. Sra. Aparecida
  assert.equal(ehDiaUtil(new Date('2026-10-28T12:00:00Z')), true);
});

test('antepenúltimo dia útil pula feriados de fim de mês', () => {
  assert.equal(antepenultimoDiaUtil(2026, 10), '2026-10-28'); // 28, 29, 30
  // Novembro/2026: 30 (seg), 27 (sex), 26 (qui)
  assert.equal(antepenultimoDiaUtil(2026, 11), '2026-11-26');
  // Dezembro/2026: 25 é feriado -> 31, 30, 29
  assert.equal(antepenultimoDiaUtil(2026, 12), '2026-12-29');
});

test('lembrete só dispara no dia certo, no fuso de Fortaleza', () => {
  assert.equal(deveEnviarLembrete(new Date('2026-10-28T12:00:00Z')), true);
  assert.equal(deveEnviarLembrete(new Date('2026-10-27T12:00:00Z')), false);
  // 29/10 às 01:00 UTC ainda é 28/10 em Fortaleza
  assert.equal(deveEnviarLembrete(new Date('2026-10-29T01:00:00Z')), true);
});
