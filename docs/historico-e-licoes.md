# Histórico e lições

O projeto saiu do papel para produção em cerca de quatro semanas e depois mudou de forma com base no uso real. Abaixo estão os marcos, cada um com a lição que deixou.

| Quando | O que aconteceu | Lição |
|---|---|---|
| Agosto/2026 | Documento matriz e proposta. A revisão humana entra como parte da estrutura do produto, não como etapa opcional. | Em conteúdo para saúde, a IA rascunha e a pessoa decide. |
| Início de setembro | A agência pede planejamento, edição de foto e análise de dados. A geração de imagem com Firefly sai do escopo. | O escopo real aparece na primeira conversa, não no documento. |
| Setembro | Gerador no n8n, webhooks com token, geração automática todo dia 20 e pedidos pelo Telegram. | Automação só vale se o cliente consegue acionar sozinho. |
| 25/09 | Na call de apresentação, a agência testou o bot ao vivo. Um pedido de "janeiro" virou 2027 corretamente, e um bug real apareceu: o Cloudflare corta respostas depois de cerca de 100 s. | A infraestrutura de borda também tem limites; não dá para fazer o cliente esperar a máquina. |
| 28–29/09 | A agência diz que o calendário ficou "muito genérico" e que as imagens de IA não servem: o planejamento deles acontece **antes** da filmagem. | Perguntar o que o cliente faz com a entrega **antes** de automatizar a entrega. |
| 30/09–02/10 | **Pivô:** a entrega mensal passa a ser só datas comemorativas + referências (assuntos, notícias e vídeos em alta) como matéria-prima de planejamento. As peças prontas e as imagens foram desligadas. | Menos entrega, mais aderência. O custo de IA caiu para cerca de R$ 6 por cliente por mês. |
| Outubro | O cliente passa regras novas (médicos não gravam vídeo; gravação só dentro da clínica). Elas viram campos do perfil de marca no mesmo dia. | Toda restrição dita pelo cliente vai para o perfil, não só para a memória de quem ouviu. |
| 20/10 | A geração automática de novembro sai vazia (tokens gastos em raciocínio) e Docs vazios chegam à pasta do cliente. No mesmo dia: teto de tokens dobrado, esforço de raciocínio menor, trava de entrega e novembro regerado. | Automação sem trava de qualidade entrega o erro com a mesma pontualidade que entrega o acerto. |
| 29–30/10 | Relatório mensal de métricas vira um conector MCP no n8n, com lembrete automático no antepenúltimo dia útil. | Separar quem calcula (código) de quem escreve (modelo). |

## O que o projeto provou

- Agências com time criativo próprio querem **insumo de planejamento**, não peça pronta.
- O mesmo "chassi" (n8n + Supabase + Claude) serve a mais de um produto. Ele também é a base da [Máquina de Prospecção](https://github.com/Sk0bbar/maquina-de-prospeccao).
- O custo marginal por cliente é baixo; o custo real é o tempo humano de revisão.
- O retorno do cliente vira regra de produto em horas.

## O que ainda não provou

- Escala com vários clientes da mesma agência: o agendamento ainda é configurado cliente a cliente.
- Impacto das sugestões no desempenho real dos posts. A linha de base existe; falta tempo de série.
