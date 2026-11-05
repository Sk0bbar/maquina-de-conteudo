'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { validarEntregaMensal } = require('../src/trava-de-entrega');

const referencia = (n) => ({ titulo: `Referência ${n}`, fonte: `https://exemplo.com/${n}` });

const entregaValida = {
  mes: '2026-11',
  datas: [
    { data: '2026-11-20', nome: 'Dia da Consciência Negra', sugestao: 'Post sobre saúde da população negra.' },
    { data: '2026-11-14', nome: 'Dia Mundial do Diabetes', sugestao: 'Carrossel com sinais de alerta.' },
  ],
  assuntos: [referencia(1), referencia(2)],
  noticias: [referencia(3)],
  videos: [referencia(4)],
};

test('entrega completa é aprovada', () => {
  const r = validarEntregaMensal({ texto: JSON.stringify(entregaValida), stopReason: 'end_turn', mesEsperado: '2026-11' });
  assert.equal(r.aprovado, true);
  assert.deepEqual(r.problemas, []);
});

test('resposta cortada por limite de tokens é bloqueada', () => {
  const cortada = JSON.stringify(entregaValida).slice(0, 120);
  const r = validarEntregaMensal({ texto: cortada, stopReason: 'max_tokens' });
  assert.equal(r.aprovado, false);
  assert.ok(r.problemas.some((p) => p.includes('max_tokens')));
  assert.ok(r.problemas.some((p) => p.includes('JSON')));
});

test('resposta vazia (o incidente de 20/10) é bloqueada', () => {
  const r = validarEntregaMensal({ texto: '{"mes":"2026-11","datas":[],"assuntos":[],"noticias":[],"videos":[]}', stopReason: 'end_turn' });
  assert.equal(r.aprovado, false);
  assert.ok(r.problemas.some((p) => p.includes('"datas" tem 0')));
});

test('referência sem link da fonte é bloqueada', () => {
  const semFonte = { ...entregaValida, assuntos: [{ titulo: 'Sem fonte' }] };
  const r = validarEntregaMensal({ texto: JSON.stringify(semFonte), stopReason: 'end_turn' });
  assert.equal(r.aprovado, false);
});

test('aceita JSON dentro de bloco de código markdown', () => {
  const r = validarEntregaMensal({ texto: '```json\n' + JSON.stringify(entregaValida) + '\n```', stopReason: 'end_turn' });
  assert.equal(r.aprovado, true);
});
