# Projeto Final de TI — Gerenciador de Produtos (Front-end)

Este projeto é um front-end desenvolvido em **HTML, CSS, JavaScript (com jQuery)** e **Bootstrap 5** que consome uma API de teste (DummyJSON) para realizar operações de CRUD (Create, Read, Update, Delete).

O foco do projeto é demonstrar o uso correto de requisições HTTP (Fetch/AJAX), manipulação de rotas/filtros, tratamento de status codes e feedback visual ao usuário.

## 🎯 Objetivo

Desenvolver um front-end que realize as operações GET, POST, PUT e DELETE, consumindo um backend de teste (DummyJSON).

---

## 🚀 Como Executar

1.  Clone ou baixe este repositório.
2.  Como este é um projeto de front-end puro (HTML/JS/CSS), você **não precisa** de um servidor complexo.
3.  Basta abrir o arquivo `index.html` diretamente no seu navegador de preferência (Google Chrome, Firefox, etc.).

---

## ⚙️ Endpoints da API Utilizados (DummyJSON)

O projeto está configurado para usar a API [DummyJSON](https://dummyjson.com/docs/products).

* **GET (Listar Todos):** `GET https://dummyjson.com/products`
* **GET (Filtrar/Buscar):** `GET https://dummyjson.com/products/search?q=[termo]`
* **GET (Buscar por ID):** `GET https://dummyjson.com/products/[id]`
* **POST (Criar):** `POST https://dummyjson.com/products/add`
* **PUT (Atualizar):** `PUT https://dummyjson.com/products/[id]`
* **DELETE (Excluir):** `DELETE https://dummyjson.com/products/[id]`

---

## ✅ Checklist de Entrega

Este projeto cumpre os seguintes requisitos:

-   [x] Repositório público com README (este arquivo).
-   [x] CRUD completo: GET / POST / PUT / DELETE funcionando.
-   [x] Rotas e filtros por URL implementados.
    -   *Rotas:* O `GET`, `PUT` e `DELETE` usam o parâmetro `/products/:id` na URL.
    -   *Filtros:* A barra de busca implementa o filtro `?q=...` na URL da API.
-   [x] Tratamento de status codes e mensagens ao usuário.
    -   *Sucesso:* Alertas verdes são mostrados para status 200 (OK), 201 (Created).
    -   *Erro:* Alertas vermelhos são mostrados para status 4xx e 5xx, informando o código do erro.
-   [x] Loading e feedbacks de erro.
    -   *Loading:* Um spinner é exibido enquanto as requisições (GET) estão em andamento.
    -   *Feedback:* O botão "Salvar" do formulário exibe um spinner e fica desabilitado durante o envio (POST/PUT).
-   [x] README com endpoints e instruções de execução (este arquivo).

---