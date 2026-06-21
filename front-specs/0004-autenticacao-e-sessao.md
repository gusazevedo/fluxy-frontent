# 0004 — Autenticação & Sessão (Frontend)

| Campo | Valor |
|-------|-------|
| **Status** | Aprovada |
| **Origem** | [../specs/0003](../specs/0003-autenticacao-e-contas.md), `src/modules/auth/auth.service.ts`, `src/shared/plugins/auth.ts` |
| **Atualizada em** | 2026-06-21 |

Como o frontend gerencia tokens, sessão e os fluxos de conta. Endpoints e códigos em
[0003](./0003-contrato-da-api.md).

## 1. Tokens

| Token | O que é | TTL (default) | Onde usar |
|-------|---------|---------------|-----------|
| **access** | JWT (HS256), claims `sub`/`iat`/`exp` | **15 min** (`expiresIn`) | header `Authorization: Bearer <access>` em toda rota 🔒 |
| **refresh** | String **opaca** de alta entropia | **30 dias** | corpo de `POST /auth/refresh` e `POST /auth/logout` |

- Ambos chegam juntos no `TokenPair` de `login`/`refresh`.
- **Armazenamento (decisão do backend, 0003 D5):** o refresh token é entregue **no
  corpo da resposta (JSON)** e **guardado pelo web app** — não há cookie httpOnly no
  MVP. O frontend é responsável por persistir os tokens (ex.: memória + storage) com o
  cuidado de segurança apropriado.
- **Verificação de acesso:** o backend rejeita access token ausente/inválido/expirado
  com `UNAUTHORIZED` (401) (`src/shared/plugins/auth.ts`).

## 2. Ciclo de vida da sessão

1. **Anexar o access token** em toda chamada 🔒.
2. **Renovar (refresh) com rotação:** quando uma chamada 🔒 retornar `401 UNAUTHORIZED`
   (access expirado), chamar `POST /auth/refresh` com o refresh atual:
   - **Sucesso:** substituir **os dois** tokens pelo novo par e **repetir** a chamada
     original. O refresh anterior foi revogado pelo backend.
   - **Falha (`TOKEN_INVALID`/`TOKEN_EXPIRED`):** sessão acabou → **deslogar** (limpar
     tokens) e mandar para o login.
3. **Evitar corrida de refresh:** com várias chamadas 401 simultâneas, **serializar**
   um único refresh (fila) e reusar o novo par — disparar refresh em paralelo invalida
   o par recém-emitido (rotação).
4. **⚠️ Reuso de refresh revogado:** se um refresh já rotacionado for reenviado, o
   backend responde `TOKEN_INVALID` **e revoga todas as sessões do usuário** (proteção
   contra roubo de token). Resultado prático para o frontend: deslogar e pedir login.

## 3. Eventos que invalidam todas as sessões

Após **qualquer** destes, todos os refresh tokens existentes deixam de funcionar — o
usuário precisa **refazer login** (0003 RN-4):

- `POST /auth/reset-password` (redefinição via e-mail).
- `POST /auth/change-password` (troca autenticada).
- Detecção de reuso de refresh (item 2.4).

O frontend deve, nesses fluxos, limpar a sessão local e redirecionar ao login com
mensagem apropriada.

## 4. Fluxos

### 4.1 Cadastro + verificação de e-mail
1. `POST /auth/register { email, password }` → 200/201 com **mensagem genérica** (não
   revela se o e-mail já existe). UI: "enviamos um link de verificação se o e-mail for
   válido".
2. O backend envia e-mail com link **`APP_URL/verify-email?token=<token>`**.
3. **O frontend DEVE ter a rota `/verify-email`** que lê `?token=` da URL e chama
   `POST /auth/verify-email { token }`. Sucesso → e-mail verificado, seguir para login.
4. Reenvio: `POST /auth/verify-email/resend { email }` (resposta genérica).

> **Login exige e-mail verificado.** Sem verificar, `login` retorna `403
> EMAIL_NOT_VERIFIED` — a UI deve oferecer "reenviar verificação".

### 4.2 Login
`POST /auth/login { email, password }` →
- **200** `TokenPair`: guardar tokens, ir para a área autenticada.
- **401** `INVALID_CREDENTIALS`: credenciais erradas.
- **403** `EMAIL_NOT_VERIFIED`: oferecer reenvio.

### 4.3 Logout
`POST /auth/logout { refreshToken }` → sempre 200. Limpar os tokens locais
independentemente da resposta.

### 4.4 Esqueci a senha
1. `POST /auth/forgot-password { email }` → **sempre 200 genérico** (não revela
   existência). UI mostra a mesma confirmação sempre.
2. Backend envia link **`APP_URL/reset-password?token=<token>`**.
3. **O frontend DEVE ter a rota `/reset-password`** que lê `?token=` e chama
   `POST /auth/reset-password { token, password }`. Sucesso → sessões revogadas;
   mandar para o login.

### 4.5 Trocar senha (logado)
`POST /auth/change-password { currentPassword, newPassword }` (🔒) → 200. Como **todas
as sessões são revogadas**, o frontend deve deslogar e pedir novo login.

## 5. Rotas que o frontend é obrigado a expor (deep-links de e-mail)

Derivam dos links que o backend coloca nos e-mails (`auth.service.ts`, baseados em
`APP_URL`):

| Rota do frontend | Lê | Chama |
|------------------|----|-------|
| `/verify-email` | `?token=` | `POST /auth/verify-email` |
| `/reset-password` | `?token=` | `POST /auth/reset-password` |

> Se estas rotas não existirem (ou `APP_URL` não apontar para o frontend), os links de
> e-mail quebram.

## 6. Política de senha (para validação de UX)

- **Mínimo 8 caracteres**, máximo 200, **sem complexidade obrigatória** (orientação
  NIST — 0003 RN-2 / `auth.schema.ts`). O frontend pode espelhar essa regra no
  formulário, mas a validação final é do servidor.

## 7. Referências

- [../specs/0003 — Autenticação & Contas](../specs/0003-autenticacao-e-contas.md)
- `src/modules/auth/auth.service.ts`, `src/shared/plugins/auth.ts`,
  `src/shared/config/env.ts` (`APP_URL`, TTLs)
</content>
