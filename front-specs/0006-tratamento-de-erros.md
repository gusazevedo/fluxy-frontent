# 0006 — Tratamento de Erros (Frontend)

| Campo | Valor |
|-------|-------|
| **Status** | Aprovada |
| **Origem** | `src/shared/plugins/error-handler.ts`, `src/shared/errors.ts`, `src/modules/*/*.service.ts` |
| **Atualizada em** | 2026-06-21 |

Como o frontend interpreta e reage a erros da API.

## 1. Envelope

Todo erro vem assim (`src/shared/plugins/error-handler.ts`):

```json
{
  "error": {
    "statusCode": 400,
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [ /* opcional: detalhes de validação do TypeBox */ ]
  }
}
```

- **Reaja sempre pelo `code`** (estável), não pela `message` (texto livre, pode mudar e
  está em inglês).
- `details` só aparece em alguns erros (notadamente `VALIDATION_ERROR`), com a lista de
  campos inválidos — útil para destacar campos no formulário.
- **404 de rota inexistente** também usa o envelope, com `code: "NOT_FOUND"` e mensagem
  `Route <METHOD> <url> not found`.

## 2. Catálogo de códigos

### Genéricos / transversais
| `code` | HTTP | Quando | Reação sugerida no frontend |
|--------|------|--------|------------------------------|
| `VALIDATION_ERROR` | 400 | Corpo/query/params fora do schema (ou cursor inválido) | Mostrar erros por campo (usar `details`); não reenviar igual |
| `BAD_REQUEST` | 400 | Requisição malformada (genérico) | Mensagem genérica |
| `UNAUTHORIZED` | 401 | Access token ausente/inválido/expirado | Tentar **refresh**; se falhar, deslogar |
| `FORBIDDEN` | 403 | Ação não permitida | Mensagem; sem retry |
| `NOT_FOUND` | 404 | Rota inexistente | Erro de programação/rota — logar |
| `CONFLICT` | 409 | Conflito genérico de estado | Mensagem; revalidar dados |
| `INTERNAL_SERVER_ERROR` | 500 | Falha inesperada no servidor | "Algo deu errado"; permitir retry |
| (rate limit) | 429 | > 100 req/min | Backoff + avisar usuário |

### Autenticação
| `code` | HTTP | Significado | Reação |
|--------|------|-------------|--------|
| `INVALID_CREDENTIALS` | 401 | E-mail/senha errados, **ou** senha atual errada no change-password | Erro no formulário |
| `EMAIL_NOT_VERIFIED` | 403 | Login antes de verificar e-mail | Oferecer "reenviar verificação" |
| `TOKEN_INVALID` | 400 (verify/reset) · 401 (refresh) | Token de e-mail ou refresh inválido | E-mail: pedir reenvio. Refresh: deslogar |
| `TOKEN_EXPIRED` | 400 (verify/reset) · 401 (refresh) | Token expirado | E-mail: pedir reenvio. Refresh: deslogar |

> ⚠️ Em `POST /auth/refresh`, `TOKEN_INVALID` pode significar **reuso de refresh
> revogado** — o backend revoga **todas as sessões**. Tratamento prático: deslogar e
> pedir login (ver [0004](./0004-autenticacao-e-sessao.md) §2).

### Categorias
| `code` | HTTP | Significado | Reação |
|--------|------|-------------|--------|
| `CATEGORY_NOT_FOUND` | 404 | Categoria inexistente/não é do usuário | Mensagem; recarregar lista |
| `CATEGORY_NAME_IN_USE` | 409 | Já existe categoria **ativa** com mesmo nome+tipo | Erro no campo nome |

### Transações
| `code` | HTTP | Significado | Reação |
|--------|------|-------------|--------|
| `TRANSACTION_NOT_FOUND` | 404 | Transação inexistente/não é do usuário | Mensagem; recarregar lista |
| `INVALID_AMOUNT` | 400 | `amountCents` ≤ 0 | Erro no campo valor |
| `CATEGORY_NOT_FOUND` | 404 | `categoryId` não existe para o usuário | Revalidar seletor de categoria |
| `CATEGORY_ARCHIVED` | 409 | Tentou usar categoria arquivada em nova/realocação | Remover arquivadas do seletor |
| `CATEGORY_KIND_MISMATCH` | 409 | Categoria de tipo diferente do `kind` da transação | Filtrar categorias pelo `kind` |

### Relatórios
| `code` | HTTP | Significado | Reação |
|--------|------|-------------|--------|
| `VALIDATION_ERROR` | 400 | Ex.: `from` > `to`, datas malformadas | Corrigir o intervalo |

## 3. Estratégia recomendada (cliente HTTP)

1. **Sempre** parsear o envelope e extrair `error.code`.
2. **Interceptor 401:** em rota 🔒, tentar `refresh` uma vez (serializado); repetir a
   chamada; se o refresh falhar, limpar sessão e ir ao login.
3. **429:** respeitar como limite de abuso — backoff exponencial curto e feedback.
4. **5xx / rede:** tratar como transitório; permitir retry manual; não deslogar.
5. **`VALIDATION_ERROR`:** usar `details` para marcar campos; nunca reenviar o mesmo
   payload sem corrigir.
6. **Mensagens ao usuário:** preferir textos próprios (PT-BR) mapeados por `code` —
   a `message` da API é técnica e em inglês.

## 4. Referências

- `src/shared/plugins/error-handler.ts` (envelope, validação, rate-limit, 500)
- `src/shared/errors.ts` (genéricos) e os `*.service.ts` de cada módulo (códigos de
  domínio)
- [0003 — Contrato da API](./0003-contrato-da-api.md) (erros por endpoint)
</content>
