# 0001 — Visão Geral & Stack (Frontend)

| Campo | Valor |
|-------|-------|
| **Status** | Aprovada |
| **Origem** | [../specs/0001](../specs/0001-visao-geral-do-produto.md), [../specs/0002](../specs/0002-arquitetura-tecnica.md) |
| **Atualizada em** | 2026-06-21 |

## 1. O produto

O **Fluxy** é um app de **controle de finanças pessoais**. O usuário registra suas
**movimentações** (despesas e receitas), organiza-as em **categorias** e consulta
**resumos** que mostram para onde o dinheiro está indo, por categoria e por período
(fonte: 0001 §1). O backend é uma **API REST**; este frontend é o cliente que a consome.

Funcionalidades que o frontend precisa cobrir (fonte: 0001 §2/§4):

1. **Conta & autenticação** — cadastro, verificação de e-mail, login, logout, refresh,
   recuperação e troca de senha, consulta da conta atual.
2. **Categorias** — listar, criar, detalhar, renomear e excluir; tipos despesa/receita;
   categorias padrão já vêm criadas no cadastro.
3. **Transações** — criar, listar (com filtros e paginação), detalhar, editar e excluir.
4. **Relatórios** — resumo de um período: totais (receita, despesa, saldo, contagem) e
   breakdown por categoria.

## 2. Stack alvo

- **Next.js (React, App Router)** — web app.
- **Linguagem:** TypeScript (o backend é TS-first; reuso de tipos/contratos é desejável).
- **Comunicação:** REST + JSON sobre HTTPS (em produção). Autenticação por **Bearer
  token** no header `Authorization` (ver [0004](./0004-autenticacao-e-sessao.md)).
- **Configuração de ambiente:** a URL da API deve vir de variável de ambiente (ex.:
  `NEXT_PUBLIC_API_URL`). Em dev local o backend sobe em `http://localhost:3333`
  (`PORT` default `3333`, `src/shared/config/env.ts`).

> **CORS / `APP_URL`.** O backend libera CORS para `APP_URL` (default
> `http://localhost:3000`) em stages não-locais, com `credentials: true`
> (`src/shared/plugins/security.ts`). O frontend **deve rodar na origem configurada em
> `APP_URL`** do backend, senão as requisições serão bloqueadas por CORS.

## 3. Princípios que o frontend deve respeitar

- **P1 — Fonte da verdade é a API.** Toda regra de negócio (validação, agregação,
  arquivamento, saldo) é resolvida no backend. O frontend valida por UX, mas **nunca**
  reimplementa nem contradiz a regra do servidor. Em divergência, vence o servidor.
- **P2 — Isolamento por usuário.** Toda chamada autenticada retorna **somente dados do
  próprio usuário** (0001 RNF-1). O frontend nunca recebe nem precisa enviar `userId`.
- **P3 — Dinheiro em centavos inteiros.** Valores trafegam como `amountCents`
  (inteiro). A conversão para exibição (BRL) é responsabilidade do frontend
  ([0002](./0002-modelos-e-conceitos.md) §3). Nunca usar ponto flutuante para somar.
- **P4 — Moeda única (BRL).** Sem multi-moeda (0001 D2). Formatar sempre como Real.
- **P5 — Envelope de erro padrão.** Erros sempre vêm como `{ error: { code, message,
  ... } }`. O frontend reage pelo `code`, não pela `message`
  ([0006](./0006-tratamento-de-erros.md)).

## 4. Fora de escopo (do produto — não construir)

Herdado de 0001 §3 / specs de feature. O frontend **não** deve oferecer:

- Transações **recorrentes/agendadas**.
- **Orçamentos** e **metas** por categoria.
- **Múltiplas carteiras/contas** (corrente, poupança, cartão).
- **Importação** (Open Finance, extratos, CSV) e sincronização bancária.
- **Multi-moeda**.
- **Compartilhamento/colaboração** entre usuários.
- **Anexos/comprovantes** em transações.
- **Login social/OAuth**, **MFA/2FA**, **RBAC** (0003 §3).
- **Exclusão de conta** (`DELETE /me` não existe no MVP — 0003 §3/D6).
- **Subcategorias/hierarquia**, **cor/ícone** de categoria (0004 D5), **reordenação
  manual**.
- **Timeline mês a mês** e **export** de relatórios (0006 §3 / D4).
- **Busca textual** por descrição de transação (0005 §3).
- **Percentual por categoria** vindo da API — se quiser exibir, o frontend calcula a
  partir dos totais (0006 D2).

> Se o produto pedir algo desta lista, é **mudança de escopo**: pare e consulte o
> desenvolvedor (regra SSD).

## 5. Referências

- [../specs/0001 — Visão Geral do Produto](../specs/0001-visao-geral-do-produto.md)
- [../specs/0002 — Arquitetura Técnica](../specs/0002-arquitetura-tecnica.md)
- [../CLAUDE.md](../CLAUDE.md)
</content>
