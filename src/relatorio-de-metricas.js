// Relatório mensal de métricas do Instagram a partir do CSV exportado no Meta Business Suite.
//
// Em produção, esta lógica roda dentro de uma ferramenta (tool) de um conector MCP criado no n8n:
// quem pede o relatório é o próprio Claude, no claude.ai, e a ferramenta devolve só números
// calculados por código. A regra do projeto é "números só por script": o modelo de linguagem
// escreve a leitura, mas nunca calcula nem estima um número.

'use strict';

// Parser de CSV que respeita aspas, aspas escapadas ("") e quebras de linha dentro de campos.
function parseCSV(texto) {
  const linhas = [];
  let linha = [];
  let campo = '';
  let dentroDeAspas = false;
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (dentroDeAspas) {
      if (c === '"') {
        if (texto[i + 1] === '"') { campo += '"'; i++; } else dentroDeAspas = false;
      } else campo += c;
    } else if (c === '"') dentroDeAspas = true;
    else if (c === ',') { linha.push(campo); campo = ''; }
    else if (c === '\n') { linha.push(campo); linhas.push(linha); linha = []; campo = ''; }
    else if (c !== '\r') campo += c;
  }
  if (campo || linha.length) { linha.push(campo); linhas.push(linha); }
  return linhas;
}

// "1.234" -> 1234 e "12,5" -> 12.5 (formato brasileiro do export do Meta).
const numero = (v) => Number(String(v || '0').replace(/\./g, '').replace(',', '.')) || 0;

// "25/10/2026 18:30" (export em formato MM/DD/AAAA) -> "10/25/2026" vira "25/10/2026".
function normalizarData(valor) {
  const d = String(valor || '');
  const m = d.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  return m ? `${m[2]}/${m[1]}/${m[3]}` : d;
}

const COLUNAS = {
  conta: 'Nome de usuário da conta',
  data: 'Horário de publicação',
  formato: 'Tipo de post',
  descricao: 'Descrição',
  link: 'Link permanente',
};

const METRICAS = {
  alcance: 'Alcance',
  visualizacoes: 'Visualizações',
  curtidas: 'Curtidas',
  comentarios: 'Comentários',
  compartilhamentos: 'Compartilhamentos',
  salvamentos: 'Salvamentos',
  seguimentos: 'Seguimentos',
};

function lerPosts(csv) {
  const linhas = parseCSV(String(csv).replace(/^﻿/, ''));
  const cabecalho = linhas[0].map((x) => x.trim());
  const registros = linhas
    .slice(1)
    .filter((l) => l.length >= cabecalho.length - 1)
    .map((l) => Object.fromEntries(cabecalho.map((k, i) => [k, l[i]])));

  // A conta principal é a que mais aparece; as outras são posts em parceria (collab).
  const contagem = {};
  registros.forEach((r) => { contagem[r[COLUNAS.conta]] = (contagem[r[COLUNAS.conta]] || 0) + 1; });
  const contaPrincipal = Object.entries(contagem).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  const posts = registros.map((r) => {
    const post = {
      data: normalizarData(r[COLUNAS.data]),
      conta: r[COLUNAS.conta],
      parceria: r[COLUNAS.conta] !== contaPrincipal,
      formato: r[COLUNAS.formato],
      tema: String(r[COLUNAS.descricao] || '').split('\n')[0].slice(0, 90),
      link: r[COLUNAS.link],
      hashtags: String(r[COLUNAS.descricao] || '').match(/#[\p{L}\p{N}_]+/gu) || [],
    };
    for (const [chave, coluna] of Object.entries(METRICAS)) post[chave] = numero(r[coluna]);
    return post;
  });

  posts.sort((a, b) => b.alcance - a.alcance);
  return { contaPrincipal, posts };
}

const soma = (lista, chave) => lista.reduce((total, p) => total + p[chave], 0);

function melhor(chave, lista) {
  const p = [...lista].sort((a, b) => b[chave] - a[chave])[0];
  return p ? { data: p.data, tema: p.tema, valor: p[chave], link: p.link, parceria: p.parceria } : null;
}

function gerarRelatorio({ cliente, periodo, postsCsv, visaoGeral = '' }) {
  if (!String(postsCsv || '').includes('Alcance')) {
    return {
      erro: 'Não recebi o CSV de posts exportado do Meta Business Suite '
        + '(Insights > Conteúdo > Posts > Exportar). Anexe o arquivo e tente de novo.',
    };
  }

  const { contaPrincipal, posts } = lerPosts(postsCsv);
  const proprios = posts.filter((p) => !p.parceria);

  const hashtags = {};
  posts.forEach((p) => p.hashtags.forEach((t) => {
    const k = t.toLowerCase();
    hashtags[k] = (hashtags[k] || 0) + 1;
  }));

  return {
    cliente: String(cliente || '').trim() || 'cliente',
    periodo: String(periodo || '').trim() || 'o período do arquivo exportado',
    conta_principal: contaPrincipal,
    regras_para_o_relatorio: [
      'Use SOMENTE os números abaixo e os da visão geral enviada; nunca estime nem invente números.',
      'Escreva o período exatamente como o do arquivo exportado.',
      'Preencha o modelo de relatório página a página, na ordem do campo mapa_do_modelo.',
    ],
    numeros_dos_posts: {
      total_posts: posts.length,
      posts_proprios: proprios.length,
      posts_em_parceria: posts.length - proprios.length,
      alcance_medio_posts_proprios: proprios.length ? Math.round(soma(proprios, 'alcance') / proprios.length) : 0,
      curtidas_total: soma(posts, 'curtidas'),
      comentarios_total: soma(posts, 'comentarios'),
      compartilhamentos_total: soma(posts, 'compartilhamentos'),
      salvamentos_total: soma(posts, 'salvamentos'),
    },
    top3_posts: posts.slice(0, 3).map(({ data, tema, alcance, curtidas, link, parceria }) => (
      { data, tema, alcance, curtidas, link, parceria })),
    resultado_por_categoria: {
      curtidas: melhor('curtidas', posts),
      salvamentos: melhor('salvamentos', posts),
      compartilhamentos: melhor('compartilhamentos', posts),
      comentarios: melhor('comentarios', posts),
      melhor_post_proprio: melhor('alcance', proprios),
    },
    hashtags_mais_usadas: Object.entries(hashtags)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([tag, vezes]) => `${tag} (${vezes})`),
    visao_geral_recebida: visaoGeral,
    posts,
    mapa_do_modelo: [
      '1 Capa: "Relatório mensal" + mês/ano do período.',
      '2 Quantidade de posts + "Assuntos desse mês" (8 a 10 etiquetas a partir dos temas e hashtags).',
      '3 Visão geral da conta: novos seguidores, contas alcançadas, visitas ao perfil, cliques no link.',
      '4 Mês anterior x mês atual: os mesmos 4 números lado a lado (variações % da visão geral).',
      '5 Funil: visualizações, interações, visitas ao perfil, cliques no link.',
      '6 Top 3 posts do mês.',
      '7 Resultado por categoria: curtidas, salvamentos, compartilhamentos, comentários.',
      '8 Comentários positivos: o usuário escolhe; se não houver, pule a página.',
      '9 Fechamento: "Até o próximo mês!".',
    ],
  };
}

module.exports = { parseCSV, numero, normalizarData, lerPosts, gerarRelatorio };
