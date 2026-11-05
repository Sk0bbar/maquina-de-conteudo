// Calendário de dias úteis usado pelos agendamentos da Máquina.
//
// Exemplo real: o lembrete do relatório mensal roda todo dia útil às 9h, mas só envia a mensagem
// no ANTEPENÚLTIMO dia útil do mês, para dar tempo de exportar os dados antes de o mês virar.
// Dias úteis excluem sábados, domingos e feriados nacionais, estaduais (Ceará) e municipais
// (Fortaleza). Carnaval e Corpus Christi são tratados como dias não úteis.

'use strict';

const DIA_MS = 86_400_000;

const dataUTC = (ano, mes, dia) => new Date(Date.UTC(ano, mes - 1, dia));
const iso = (d) => d.toISOString().slice(0, 10);

// Domingo de Páscoa pelo algoritmo de Meeus/Jones/Butcher (calendário gregoriano).
function pascoa(ano) {
  const a = ano % 19;
  const b = Math.floor(ano / 100);
  const c = ano % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31);
  const dia = ((h + l - 7 * m + 114) % 31) + 1;
  return dataUTC(ano, mes, dia);
}

// Feriados de data fixa: nacionais + Ceará (19/03 São José, 25/03 Data Magna)
// + Fortaleza (13/04 aniversário, 15/08 Nossa Senhora da Assunção).
const FERIADOS_FIXOS = [
  '01-01', '03-19', '03-25', '04-13', '04-21', '05-01', '08-15',
  '09-07', '10-12', '11-02', '11-15', '11-20', '12-25',
];

function feriados(ano) {
  const p = pascoa(ano);
  const deslocamento = (dias) => iso(new Date(p.getTime() + dias * DIA_MS));
  return new Set([
    ...FERIADOS_FIXOS.map((md) => `${ano}-${md}`),
    deslocamento(-48), // segunda de Carnaval
    deslocamento(-47), // terça de Carnaval
    deslocamento(-2), // Sexta-feira Santa
    deslocamento(60), // Corpus Christi
  ]);
}

function ehDiaUtil(data) {
  const semana = data.getUTCDay();
  return semana !== 0 && semana !== 6 && !feriados(data.getUTCFullYear()).has(iso(data));
}

// N-ésimo dia útil contando a partir do fim do mês (1 = último, 3 = antepenúltimo).
function diaUtilDoFim(ano, mes, posicao) {
  const encontrados = [];
  for (let d = dataUTC(ano, mes + 1, 0); d.getUTCMonth() === mes - 1; d = new Date(d.getTime() - DIA_MS)) {
    if (ehDiaUtil(d)) encontrados.push(iso(d));
    if (encontrados.length === posicao) return encontrados[posicao - 1];
  }
  return null;
}

const antepenultimoDiaUtil = (ano, mes) => diaUtilDoFim(ano, mes, 3);

// O n8n roda em UTC; a operação está em Fortaleza (UTC-3, sem horário de verão).
function hojeEmFortaleza(agora = new Date()) {
  return new Date(agora.getTime() - 3 * 3_600_000);
}

function deveEnviarLembrete(agora = new Date()) {
  const local = hojeEmFortaleza(agora);
  return iso(local) === antepenultimoDiaUtil(local.getUTCFullYear(), local.getUTCMonth() + 1);
}

module.exports = { pascoa, feriados, ehDiaUtil, diaUtilDoFim, antepenultimoDiaUtil, deveEnviarLembrete };
