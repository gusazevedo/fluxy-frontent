# 0005 — Regras de Negócio (Frontend)

| Campo | Valor |
|-------|-------|
| **Status** | Aprovada |
| **Origem** | [../specs/0001](../specs/0001-visao-geral-do-produto.md), [../specs/0004](../specs/0004-categorias.md), [../specs/0005](../specs/0005-transacoes.md), [../specs/0006](../specs/0006-relatorios.md), `src/modules/*` |
| **Atualizada em** | 2026-06-21 |

Regras que o frontend **precisa respeitar e refletir**. Todas são impostas pelo backend
— aqui estão consolidadas para o cliente não construir UX que as contradiga. **O
frontend nunca reimplementa a regra; no máximo a antecipa para melhorar UX.**

## 1. Validações de entrada (espelháveis no formulário)

| Campo | Regra | Erro do servidor se violar |
|-------|-------|----------------------------|
| `email` | formato `algo@algo.dominio`, ≤ 320 chars | `VALIDATION_ERROR` |
| `password` | 8..200 chars | `VALIDATION_ERROR` |
| Categoria `name` | 1..60 chars (trim no backend) | `VALIDATION_ERROR` |
| Categoria `kind` | `expense` \| `income` | `VALIDATION_ERROR` |
| Transação `amountCents` | inteiro **> 0** | `VALIDATION_ERROR` (não-inteiro) / `INVALID_AMOUNT` (≤ 0) |
| Transação `description` | ≤ 280 chars, opcional | `VALIDATION_ERROR` |
| `occurredAt`/`from`/`to` | `YYYY-MM-DD` | `VALIDATION_ERROR` |
| `id`/`categoryId` | UUID | `VALIDATION_ERROR` |
| `limit` (lista tx) | inteiro 1..100 (default 20) | `VALIDATION_ERROR` |

> `amountCents` é validado em dois níveis: o schema exige **inteiro**; o serviço exige
> **positivo** (`INVALID_AMOUNT`). Envie sempre inteiro positivo em centavos.

## 2. Categorias

- **RN-Cat-1 — Tipo imutável.** `kind` não muda após criar. A UI de edição só permite
  alterar o **nome** (`PATCH` aceita só `name`). Para mudar o tipo, criar outra
  categoria.
- **RN-Cat-2 — Nome único por (usuário + tipo) entre ativas.** Pode existir uma
  despesa "Outros" **e** uma receita "Outros" (tipos diferentes). Duplicar nome+tipo
  ativo ⇒ `CATEGORY_NAME_IN_USE`.
- **RN-Cat-3 — Exclusão preserva histórico (soft-delete condicional).**
  - Categoria **sem** transações → excluída de fato.
  - Categoria **com** transações → **arquivada** (`archived: true`): some da lista
    ativa e **não pode ser usada em novas transações**, mas as transações antigas
    continuam vinculadas a ela.
  - Em ambos os casos o `DELETE` responde **204**. A UI não sabe de antemão qual caso
    ocorreu; reavaliar a lista após excluir.
- **RN-Cat-4 — Arquivadas fora dos seletores.** Em formulários de criação/edição de
  transação, **só ofereça categorias ativas** (`archived: false`). Use
  `GET /categories` sem `includeArchived` para os seletores; use `includeArchived=true`
  apenas em telas de histórico/gestão se necessário.
- **RN-Cat-5 — Categorias padrão no cadastro.** Todo usuário novo já vem com um
  conjunto padrão de categorias (não precisa criá-las). Lista exata (de
  `category.defaults.ts`):
  - **Despesas:** Alimentação, Transporte, Moradia, Saúde, Educação, Lazer, Compras,
    Contas e Serviços, Outros.
  - **Receitas:** Salário, Investimentos, Outros.
  - São categorias comuns: **editáveis e excluíveis**, sem proteção especial.

## 3. Transações

- **RN-Tx-1 — Categoria obrigatória, exatamente uma.** Toda transação tem um
  `categoryId`. A UI deve exigir categoria ao criar.
- **RN-Tx-2 — Categoria deve casar com o tipo.** A categoria escolhida precisa ter o
  **mesmo `kind`** da transação. Ao escolher `kind=expense`, só ofereça categorias de
  despesa (e vice-versa). Violar ⇒ `CATEGORY_KIND_MISMATCH`.
- **RN-Tx-3 — Não usar categoria arquivada em nova/realocação.** Atribuir categoria
  arquivada ⇒ `CATEGORY_ARCHIVED`. (Manter o vínculo já existente de uma transação cuja
  categoria foi arquivada **é válido** — não force troca.)
- **RN-Tx-4 — Valor positivo em centavos.** O sinal no saldo vem do `kind`, não do
  valor. Nunca enviar negativo.
- **RN-Tx-5 — Data futura permitida.** `occurredAt` aceita qualquer data válida,
  inclusive no futuro. Não bloquear datas futuras.
- **RN-Tx-6 — Edição parcial.** `PATCH` aceita só os campos alterados; `description:
  null` limpa a descrição. Trocar `kind` exige categoria compatível com o novo tipo.
- **RN-Tx-7 — Exclusão é definitiva.** Hard delete; sem lixeira/desfazer. Confirme com
  o usuário antes de excluir.
- **RN-Tx-8 — Paginação por cursor.** A lista usa scroll/cursor, **não offset**. Não há
  `total` na listagem. Para "carregar mais", reenvie a mesma query com
  `cursor=nextCursor`; pare quando `nextCursor` for `null`. Os filtros não devem mudar
  entre páginas da mesma sequência.

## 4. Relatórios / saldo

- **RN-Rep-1 — Saldo = receitas − despesas.** `balanceCents = incomeCents −
  expenseCents`, **pode ser negativo** (saldo no vermelho é caso válido a exibir).
- **RN-Rep-2 — Período inclusivo; default mês corrente.** `from`/`to` inclusivos nas
  duas pontas; omitir ambos ⇒ mês atual. `from > to` ⇒ `VALIDATION_ERROR`.
- **RN-Rep-3 — Breakdown inclui arquivadas com histórico.** Itens de `byCategory`
  podem ter `archived: true` (categoria arquivada que teve transações no período). A UI
  deve exibi-las (ex.: marcá-las como arquivadas), não escondê-las.
- **RN-Rep-4 — Percentual é cálculo do cliente.** A API não envia percentual por
  categoria; se exibir, calcule a partir de `totalCents` / total do tipo.
- **RN-Rep-5 — Agregação é do servidor.** Não baixe todas as transações para somar no
  cliente; use `/reports/summary`.

## 5. Isolamento e identidade

- **RN-Iso-1.** Toda resposta autenticada já é **filtrada pelo usuário do token**. O
  frontend nunca envia `userId` e nunca deve tentar acessar recursos por id "chutado"
  de outro usuário — retornaria 404 (`*_NOT_FOUND`).

## 6. Moeda e formatação

- **RN-Money-1.** Tudo em **BRL**, centavos inteiros na API. Formatar para exibição e
  converter input → centavos antes de enviar (ver [0002](./0002-modelos-e-conceitos.md)
  §3).

## 7. Referências

- [../specs/0001](../specs/0001-visao-geral-do-produto.md) (RN-1..6),
  [../specs/0004](../specs/0004-categorias.md) (categorias),
  [../specs/0005](../specs/0005-transacoes.md) (transações),
  [../specs/0006](../specs/0006-relatorios.md) (relatórios)
- `src/modules/categories/category.defaults.ts` (lista padrão)
</content>
