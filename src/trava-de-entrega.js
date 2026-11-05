// Trava de qualidade antes de qualquer entrega na pasta do cliente.
//
// Origem: em 20/10/2026 a geração automática do mês saiu vazia. O modelo gastou o teto de tokens
// raciocinando, a resposta veio cortada e Docs vazios foram parar na pasta compartilhada com a
// agência. A correção teve três partes: teto de tokens maior, esforço de raciocínio menor e esta
// trava. Se a resposta não estiver completa e coerente, nada é entregue: o operador é avisado
// e a geração pode ser refeita.
//
// Regra que ficou: "automação sem trava de qualidade entrega o erro com a mesma pontualidade
// que entrega o acerto".

'use strict';

const LIMITES = {
  datas: { min: 1, max: 5 },
  assuntos: { min: 1, max: 10 },
  noticias: { min: 0, max: 4 },
  videos: { min: 0, max: 8 },
};

function extrairJSON(texto) {
  const bruto = String(texto || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/```$/, '').trim();
  try {
    return { ok: true, valor: JSON.parse(bruto) };
  } catch {
    return { ok: false, motivo: 'A resposta não é um JSON válido (provável corte por limite de tokens).' };
  }
}

const textoPreenchido = (v) => typeof v === 'string' && v.trim().length > 0;

// Valida a entrega mensal: datas comemorativas + referências do mês.
// `stopReason` vem da API (ex.: "end_turn" ou "max_tokens").
function validarEntregaMensal({ texto, stopReason, mesEsperado }) {
  const problemas = [];

  if (stopReason && stopReason !== 'end_turn') {
    problemas.push(`Resposta interrompida (stop_reason = ${stopReason}).`);
  }

  const json = extrairJSON(texto);
  if (!json.ok) return { aprovado: false, problemas: [...problemas, json.motivo] };
  const entrega = json.valor || {};

  if (mesEsperado && entrega.mes !== mesEsperado) {
    problemas.push(`Mês da resposta (${entrega.mes}) diferente do pedido (${mesEsperado}).`);
  }

  for (const [campo, { min, max }] of Object.entries(LIMITES)) {
    const lista = entrega[campo];
    if (!Array.isArray(lista)) {
      problemas.push(`Campo "${campo}" ausente.`);
      continue;
    }
    if (lista.length < min) problemas.push(`"${campo}" tem ${lista.length} itens; mínimo ${min}.`);
    if (lista.length > max) problemas.push(`"${campo}" tem ${lista.length} itens; máximo ${max}.`);
  }

  (entrega.datas || []).forEach((d, i) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d?.data || '')) problemas.push(`Data ${i + 1} sem data no formato AAAA-MM-DD.`);
    if (!textoPreenchido(d?.nome)) problemas.push(`Data ${i + 1} sem nome.`);
    if (!textoPreenchido(d?.sugestao)) problemas.push(`Data ${i + 1} sem sugestão de post.`);
  });

  for (const campo of ['assuntos', 'noticias', 'videos']) {
    (entrega[campo] || []).forEach((r, i) => {
      if (!textoPreenchido(r?.titulo)) problemas.push(`${campo}[${i + 1}] sem título.`);
      if (!/^https?:\/\//.test(r?.fonte || '')) problemas.push(`${campo}[${i + 1}] sem link da fonte.`);
    });
  }

  return { aprovado: problemas.length === 0, problemas, entrega: problemas.length ? null : entrega };
}

module.exports = { validarEntregaMensal, extrairJSON, LIMITES };
