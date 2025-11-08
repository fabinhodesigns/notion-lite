# Notion Lite

Um app simples de anotações rápidas feito com JavaScript (jQuery) e HTML/CSS.

Tudo funciona 100% local no seu navegador, usando o `localStorage` para salvar tanto as notas quanto as contas de usuário.

## 🚀 Como Executar

1.  Abra a pasta do app no VS Code.
2.  Tenha a extensão "Live Server" instalada.
3.  Clique com o botão direito no `index.html` e escolha "Open with Live Server".

## ⚙️ Como Funciona

A lógica do app é separada por usuário, usando o `localStorage` como um pequeno banco de dados.

### 1. Modo Anônimo

* Ao abrir, você pode criar, editar e excluir notas sem estar logado.
* Essas notas são salvas numa "gaveta" especial para usuários anônimos (`Notas Anonimas`). Elas ficam salvas mesmo se você fechar o navegador.

### 2. Autenticação

* Ao clicar em **"Acessar"**, você pode logar ou se cadastrar.
* As contas (usuário/senha) são salvas localmente. O sistema não deixa criar dois usuários com o mesmo nome.
* **Aviso Importante:** Se você tem notas no modo anônimo e decide logar, um aviso aparece. Ele informa que, ao logar, suas notas anônimas serão **apagadas** para dar lugar às notas da sua conta.
* **Troca de Usuário:** Cada usuário logado tem sua própria "gaveta" de notas (ex: `notes_usuario1`). Se você deslogar e outro usuário logar, as notas são trocadas. Cada um só vê o que é seu.
* **Logout:** Ao sair, o app recarrega e volta para o modo anônimo.

## 📋 Funcionalidades Implementadas

* **CRUD (POST, GET, PUT, DELETE):** Todas as operações são simuladas localmente.
    * **`saveNote()`** (Simula POST/PUT): Cria ou atualiza a nota no `localStorage`.
    * **`deleteNote()`** (Simula DELETE): Remove a nota do `localStorage`.
    * **`loadNotesFromStorage()`** (Simula GET): Lê as notas do `localStorage` para mostrar na tela.

* **Filtros:** A barra de busca funciona **em tempo real**, filtrando as notas *locais* (título ou corpo) enquanto você digita.

* **Feedbacks Visuais:**
    * O app não usa alertas padrão do navegador.
    * **Toasts Modernos:** Notificações (estilo banner) deslizam do topo para dar feedback de sucesso (verde) ou erro (vermelho).
    * **Modais Customizados:** Alertas de confirmação (como o de "Excluir" ou o "Aviso de Login") são modais customizados que usam `backdrop-filter: blur()` para um visual mais limpo.

* **Autenticação:**
    * O sistema usa `sessionStorage` para manter o usuário logado (similar a um token de sessão).
    * Inclui as rotinas de **Login**, **Cadastro** e **Alteração de Senha** (verificando a senha antiga).
