# Máquina de Conteúdo

**Pipeline de planejamento de conteúdo com IA para agências de comunicação.** Todo mês, a Máquina entrega sozinha as datas comemorativas e as referências do momento (assuntos, notícias e vídeos em alta), filtradas pelo perfil de marca de cada cliente. Também calcula o relatório mensal de métricas do Instagram. Nada chega ao cliente sem revisão humana.

Em produção desde setembro de 2026 com a agência **Roteirizow** (Fortaleza/CE), atendendo um cliente-piloto da área de saúde.

`n8n` · `Claude API` · `Supabase / PostgreSQL` · `Telegram Bot API` · `Google Drive API` · `YouTube Data API` · `MCP` · `JavaScript`

---

## O problema

A Roteirizow é uma agência pequena que atende vários clientes. Todo mês o time precisava levantar datas comemorativas, acompanhar o que estava em alta e cruzar tudo isso com o tom e as restrições de cada marca antes de planejar as gravações. Para um cliente da área da saúde, as restrições são sérias: sem promessa de resultado, sem preço, sem paciente identificável, sem médico em vídeo.

A agência queria ganhar tempo nessa etapa **sem perder o controle criativo** e conseguir operar de longe.

## A solução

```mermaid
flowchart LR
    A[Dia 20 ou<br/>pedido no Telegram] --> B[Perfil de marca<br/>+ jeito de ser da agência]
    B --> C[Datas comemorativas<br/>+ referências em alta]
    C --> D[Claude gera a<br/>entrega do mês]
    D --> E{Trava de<br/>qualidade}
    E -->|ok| F[Revisão humana]
    F --> G[Pasta da agência<br/>no Drive]
    E -->|falhou| H[Aviso ao operador]
```

- **Entrega automática todo dia 20:** datas comemorativas do mês seguinte (mundiais, nacionais e regionais, cada uma com sugestão de post) e até 10 assuntos, 4 notícias e 8 vídeos em alta, **sempre com o link da fonte**.
- **Pedidos em português pelo Telegram:** a agência escreve algo como *"gera janeiro com foco em prevenção"* e um nó de IA interpreta o pedido e dispara o gerador. Só atende chats autorizados.
- **Perfil de marca por cliente** no Supabase, abaixo de uma camada fixa com o "jeito de ser" da agência. Toda restrição dita pelo cliente vira regra no perfil.
- **Relatório mensal de métricas:** a agência anexa o CSV exportado do Meta Business Suite e um conector MCP devolve os números já calculados (top 3, resultado por categoria, alcance médio, hashtags), mapeados página a página no modelo de relatório da agência no Canva.
- **Linha da Máquina:** painel interno em que cada mudança no produto é registrada e recebe uma **análise de impacto feita por IA** antes de ir para produção.

## Resultados

- **De zero a produção em cerca de 4 semanas**, com um cliente real pagando.
- **Custo de IA de cerca de R$ 6 por cliente por mês** no formato atual de entrega.
- **Pivô guiado pelo uso:** a primeira versão gerava 23 posts prontos e 48 imagens por mês. A agência mostrou que planeja antes de filmar, e o produto virou "matéria-prima de planejamento". A entrega ficou menor e passou a ser usada.
- **Incidentes viraram salvaguardas:** o corte de respostas pelo Cloudflare levou à resposta assíncrona, o limite de tokens levou à geração em lotes paralelos e a entrega vazia levou à trava de qualidade (detalhes em [histórico e lições](docs/historico-e-licoes.md)).

## O que tem neste repositório

```
src/
  relatorio-de-metricas.js   cálculo do relatório mensal a partir do CSV do Meta (ferramenta do conector MCP)
  dias-uteis.js              calendário de dias úteis com feriados móveis (Páscoa) e locais, usado nos agendamentos
  trava-de-entrega.js        validação da resposta da IA antes de qualquer entrega ao cliente
test/                        testes com o runner nativo do Node (node:test), sem dependências
exemplos/posts-exemplo.csv   CSV fictício no formato do export do Meta Business Suite
sql/schema.sql               schema multi-cliente no Supabase, com RLS
prompts/analise-de-impacto.md  prompt da análise de impacto da Linha da Máquina, com um caso real
docs/arquitetura.md          stack, fluxos do n8n e decisões técnicas
docs/historico-e-licoes.md   linha do tempo do projeto e o que cada fase ensinou
```

Os fluxos rodam no n8n. Os arquivos em `src/` são a lógica dos nós de código e da ferramenta MCP, organizada em módulos testáveis. As credenciais, IDs internos e dados de clientes foram removidos.

## Como rodar

Requer Node.js 20 ou superior. Não há dependências para instalar.

```bash
npm test
```

```bash
npm run exemplo
```

`npm run exemplo` gera o relatório de métricas a partir do CSV fictício em `exemplos/`.

## Próximos passos

- Escalar o agendamento para vários clientes da mesma agência sem configuração manual.
- Automatizar a coleta do Instagram Insights (depende de aprovação de app na Meta).
- Medir o impacto das sugestões no desempenho real dos posts contra a linha de base.

## Projeto relacionado

**[Máquina de Prospecção](https://github.com/Sk0bbar/maquina-de-prospeccao)**: a mesma base (n8n + Supabase + Claude), aplicada à geração de novos clientes para a mesma agência.

---

Desenvolvido por **Pablo Vidal** ([Vidal Intelligence](https://github.com/Sk0bbar)).
