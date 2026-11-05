# Prompt: análise de impacto de mudanças ("Linha da Máquina")

A **Linha da Máquina** é um painel interno (HTML de arquivo único) que mostra o processo da Máquina como uma linha de 9 etapas, com a infraestrutura que elas dividem. Toda mudança no produto é registrada ali **antes** de ser implementada e recebe uma análise de impacto gerada pelo Claude com o prompt abaixo.

A página monta o prompt preenchendo os colchetes com o mapa do processo (constantes `STAGES`, `EDGES` e `INFRA` no código), as mudanças já aprovadas ou implementadas e a mudança nova. A resposta é **validada**: ids que não existem no mapa são descartados e listas longas são cortadas.

---

```text
Você analisa o impacto de mudanças numa operação chamada Máquina de Conteúdo: um serviço que gera
calendário editorial e rascunhos de posts para clientes de uma agência de comunicação (cliente-piloto:
uma clínica de saúde). Toda peça passa por revisão humana; nada é publicado sozinho. Pense pelos três
domínios: Tecnologia/Pipeline (saúde técnica dos fluxos), Produto/Editorial (qualidade do conteúdo) e
Comercial/Relação (relação com a agência, contrato, percepção de valor).

MAPA DO PROCESSO, em ordem (as ligações: [ligações do mapa]): [mapa das etapas em JSON].
BASE COMPARTILHADA (n8n e Supabase são divididos com outro produto): [base compartilhada em JSON].
MUDANÇAS JÁ IMPLEMENTADAS OU APROVADAS: [em JSON].
MUDANÇA A ANALISAR: [título, propósito, o que muda e etapas onde incide].

Regras: use só ids que existem no mapa ou na base (s1 a s9, i1 a i6). Seja concreto e ligado ao que
está escrito no mapa; não invente ferramentas que não aparecem. Se faltar informação para avaliar algo,
diga o que precisa ser verificado. Inclua conflitos indiretos, como volume maior pressionando a revisão
humana ou efeitos no outro produto pela base compartilhada. Escreva em português do Brasil, frases
curtas. Responda só com um objeto JSON:
{"risco","faz","conflitos":[{"etapa","severidade","texto"}],"sugestao","resultado",
 "dominios":{"tecnologia","produto","comercial"}}.
```

---

## Exemplo real de uso

**Mudança:** incluir as datas especiais (dia, semana e mês comemorativos) dentro da geração automática do dia 20.

**Risco apontado:** alto. Parecia só uma melhoria de pauta, mas a análise mostrou:

| Etapa | Severidade | Conflito | Como ficou |
|---|---|---|---|
| 4 Geração | alto | Com 20+ peças, a resposta estoura o limite de tokens | Geração em **lotes de 8 peças em paralelo**, com validação por slot: 23 de 23 peças |
| 6 Revisão interna | alto | Volume de revisão humana sobe de 5 para 25+ peças | Ficou em aberto e depois foi resolvido pelo pivô de produto |
| 4 Geração | médio | Validação esperava exatamente 5 peças | Contagem de peças variável |
| 2 Pauta | médio | Datas espalhadas num documento mensal | Tabela de 211 datas com fonte no Supabase |
| Claude API | baixo | Custo por cliente não medido | Medido depois: cerca de R$ 6/cliente/mês |

O caso mostra o motivo do painel existir: o efeito de uma mudança aparece **antes** de ela ir para produção.
