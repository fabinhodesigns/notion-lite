# Notion Lite (Front-end)

Aplicacao de notas com jQuery/HTML/CSS consumindo APIs de teste para cumprir o checklist (CRUD HTTP, filtros por URL, status/erros e autenticacao com token em cookie).

## Como executar
1. Abra a pasta no VS Code.
2. Instale/ative a extensao **Live Server**.
3. Clique com o botao direito no `index.html` > **Open with Live Server**.
4. O app abre no navegador. O login e obrigatorio na primeira tela.

## Endpoints usados
- **Autenticacao (DummyJSON)**: `POST https://dummyjson.com/auth/login`
  - Exemplo de acesso rapido: `username=kminchelle`, `password=0lelplR` (retorna `token` e `id`). O token fica salvo em cookie `authToken` por 1h e tambem no `localStorage` para resgatar perfil.
- **Notas (JSONPlaceholder)**: `https://jsonplaceholder.typicode.com/posts`
  - `GET /posts?userId={id}` lista notas do usuario.
  - `POST /posts` cria (JSON).
  - `PUT /posts/{id}` atualiza (JSON).
  - `DELETE /posts/{id}` remove.
  - Os filtros `userId`, `q` (texto local) e `noteId` ficam refletidos na URL.

## Rotas e filtros na URL
- `?userId=1` define o grupo de notas carregado da API.
- `?q=termo` filtra a lista localmente (aperta Enter no campo de busca para atualizar).
- `?noteId=123` abre a nota selecionada.

## Fluxo de login (obrigatorio)
- Modal abre automaticamente se nao houver cookie `authToken`.
- Login chama DummyJSON; em caso de erro mostra status/mensagem.
- Ao logar, salva `token` em cookie + perfil no `localStorage`/`sessionStorage` e carrega notas via `NoteApp.loadNotesFromStorage` com o `userId` retornado.
- Logout limpa cookie, perfil e recarrega a aplicacao.

## Feedbacks e status
- Toasts de sucesso/erro para todas as operacoes.
- Spinner de carregamento na sidebar ao buscar na API.
- Botoes de salvar mostram loading; modais de confirmacao para DELETE.
- Erros de HTTP sao tratados (4xx/5xx) e exibidos com mensagem amigavel.

## Responsividade
- Layout reorganiza para coluna em telas menores, espaca lista de notas e modais ocupam 95% em mobile.

## Checklist atendido
- [x] CRUD completo: GET / POST / PUT / DELETE funcionando via JSONPlaceholder.
- [x] Rotas e filtros por URL implementados (`userId`, `q`, `noteId`).
- [x] Envio/recebimento de JSON via fetch.
- [x] Tratamento de status codes e mensagens ao usuario (toasts + console).
- [x] Loading e feedbacks de erro.
- [x] README com endpoints e instrucoes.
- [x] Autenticacao com token salvo em cookie (DummyJSON) — bonus.
- [ ] Video demonstrativo (opcional). 

## Observacoes rapidas
- JSONPlaceholder nao persiste dados de fato, mas responde com 201/200/204 simulando backend.
- DummyJSON exige credenciais validas; use `kminchelle/0lelplR` para testar rapido ou consulte a doc deles para outros logins de demo.
