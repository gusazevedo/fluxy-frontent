# Front-Specs — Especificações do Frontend do Fluxy

Este diretório reúne **todas as especificações necessárias para construir o frontend**
do Fluxy. Ele é **derivado** da fonte da verdade do produto — as specs de backend em
[`../specs`](../specs) e o código da API — e **não introduz regras de negócio novas**.

> ⚠️ **Hierarquia da verdade.** Em caso de divergência, vale: (1) o código da API em
> `../src`, (2) as specs de backend `../specs/0001…0006`, e só então este diretório.
> Se algo aqui contradisser o backend, o backend prevalece — **pare e consulte o
> desenvolvedor** antes de implementar (regra SSD do [CLAUDE.md](../CLAUDE.md)).

## Escopo destas specs

- **Incluído:** contrato completo da API, modelos/DTOs, enums, validações, regras de
  negócio que o frontend deve respeitar, fluxos de autenticação/sessão e catálogo de
  erros com a reação esperada do cliente.
- **Não incluído (decisão do projeto):** design de telas, wireframes, componentes,
  sistema de design e navegação visual. **A UI será definida posteriormente.** Estas
  specs descrevem *o que* o frontend precisa fazer e *com que contrato*, não *como* a
  interface se parece.

## Stack alvo

- **Web app em Next.js (React, App Router).** Ver [0001](./0001-visao-geral-e-stack.md).

## Índice

| # | Título | Conteúdo |
|---|--------|----------|
| [0001](./0001-visao-geral-e-stack.md) | Visão Geral & Stack | Produto, stack, princípios, fora de escopo |
| [0002](./0002-modelos-e-conceitos.md) | Modelos & Conceitos | Entidades, DTOs, enums, dinheiro, datas |
| [0003](./0003-contrato-da-api.md) | Contrato da API | Base URL, headers, todos os endpoints (req/resp) |
| [0004](./0004-autenticacao-e-sessao.md) | Autenticação & Sessão | Tokens, fluxos, rotas que recebem token por e-mail |
| [0005](./0005-regras-de-negocio.md) | Regras de Negócio | Regras que o cliente precisa respeitar/refletir |
| [0006](./0006-tratamento-de-erros.md) | Tratamento de Erros | Envelope, catálogo de `code`, reação esperada |

## Convenção

- Numeração sequencial `NNNN-titulo-em-kebab-case.md`, espelhando `../specs`.
- Toda afirmação rastreável a uma spec ou arquivo de origem é referenciada (ex.: *0005
  §6*, `src/modules/...`).
</content>
</invoke>
