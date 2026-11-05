'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { parseCSV, numero, normalizarData, gerarRelatorio } = require('../src/relatorio-de-metricas');

const csv = fs.readFileSync(path.join(__dirname, '..', 'exemplos', 'posts-exemplo.csv'), 'utf8');

test('parseCSV respeita aspas e quebra de linha dentro do campo', () => {
  const linhas = parseCSV('a,b\n"x, y","linha 1\nlinha 2"\n');
  assert.deepEqual(linhas[1], ['x, y', 'linha 1\nlinha 2']);
});

test('numero entende o formato brasileiro', () => {
  assert.equal(numero('4.820'), 4820);
  assert.equal(numero('12,5'), 12.5);
  assert.equal(numero(''), 0);
});

test('normalizarData converte MM/DD/AAAA do export para DD/MM/AAAA', () => {
  assert.equal(normalizarData('10/23/2026 18:00'), '23/10/2026');
});

test('relatório separa posts próprios de posts em parceria', () => {
  const r = gerarRelatorio({ cliente: 'Clínica Exemplo', periodo: '01/10 a 31/10/2026', postsCsv: csv });
  assert.equal(r.conta_principal, 'clinica.exemplo');
  assert.equal(r.numeros_dos_posts.total_posts, 5);
  assert.equal(r.numeros_dos_posts.posts_em_parceria, 1);
  assert.equal(r.numeros_dos_posts.alcance_medio_posts_proprios, Math.round((4820 + 2140 + 1380 + 3115) / 4));
});

test('top 3 vem ordenado por alcance e o melhor post próprio ignora parcerias', () => {
  const r = gerarRelatorio({ postsCsv: csv });
  assert.deepEqual(r.top3_posts.map((p) => p.alcance), [6905, 4820, 3115]);
  assert.equal(r.resultado_por_categoria.melhor_post_proprio.valor, 4820);
  assert.equal(r.resultado_por_categoria.salvamentos.valor, 71);
});

test('hashtags são contadas sem diferenciar maiúsculas', () => {
  const r = gerarRelatorio({ postsCsv: csv });
  assert.equal(r.hashtags_mais_usadas[0], '#saude (4)');
});

test('sem o CSV certo, devolve erro explicativo em vez de números', () => {
  const r = gerarRelatorio({ postsCsv: 'qualquer coisa' });
  assert.ok(r.erro);
  assert.equal(r.numeros_dos_posts, undefined);
});
