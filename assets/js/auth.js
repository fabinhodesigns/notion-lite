$(document).ready(function() {

    const USUARIOS_KEY = 'notionLiteUsers_db'; // "TABELA DE USUARIOS" localstorage
    const SESSAO_KEY = 'notionLiteSession'; // Salvar quem está logado

    // Pegar os elementos importantes da tela
    const $btnAcessar = $('#btn-open-login-modal');
    const $menuUsuario = $('#user-menu');
    const $msgBoasVindas = $('#welcome-message');
    const $btnLogout = $('#btn-logout');
    const $btnMudarSenha = $('#btn-change-pass');

    const $modalOverlay = $('#modal-overlay');
    const $loginModal = $('#login-modal');
    const $registerModal = $('#register-modal');
    const $changePassModal = $('#change-pass-modal');

    // Pegar os botões de confirmação da tela
    const $confirmModal = $('#confirm-modal');
    const $confirmTitle = $('#confirm-title');
    const $confirmMessage = $('#confirm-message');
    const $confirmBtnOk = $('#confirm-btn-ok');
    const $confirmBtnCancel = $('#confirm-btn-cancel');
    const $confirmIcon = $('#confirm-icon');

    let usuarioAtual = null;

    function getBancoUsuarios() {
        const usersData = localStorage.getItem(USUARIOS_KEY);
        return usersData ? JSON.parse(usersData) : {};
    }

    function saveBancoUsuarios(bancoUsuarios) {
        localStorage.setItem(USUARIOS_KEY, JSON.stringify(bancoUsuarios));
    }

    /**
     * Mostra o novo modal de confirmação
     * @param {string} title - O título do modal
     * @param {string} message - A mensagem
     * @param {string} type - 'info' (azul) ou 'danger' (vermelho)
     * @param {function} onConfirm - A função "callback" que roda se o user clicar OK
     */

    function showConfirmModal(title, message, type = 'info', onConfirm) {
        $confirmTitle.text(title);
        $confirmMessage.text(message);

        // Limpa classes tipo pra não dar erro 
        $confirmIcon.removeClass('info danger');
        $confirmBtnOk.removeClass('btn-modal-danger btn-modal-primary');

        // Adiciona novas classes de tipo
        if (type === 'danger') {
            $confirmIcon.addClass('danger');
            $confirmBtnOk.addClass('btn-modal-danger').text('Excluir');
        } else {
            $confirmIcon.addClass('info');
            $confirmBtnOk.addClass('btn-modal-primary').text('Confirmar');
        }
        
        $confirmBtnOk.off('click').on('click', function() {
            onConfirm(); // Executa a ação
            hideModais();
        });
        
        $confirmBtnCancel.on('click', hideModais);
        
        showModal($confirmModal);
    }

    // MODAIS HTML

    function showModal(modal) {
        $modalOverlay.removeClass('hidden');
        modal.removeClass('hidden');
    }

    function hideModais() {
        $modalOverlay.addClass('hidden');
        $('.modal').addClass('hidden');
    }

    // Fechar modais
    $btnAcessar.on('click', () => showModal($loginModal));
    $btnMudarSenha.on('click', () => showModal($changePassModal));

    // Fecha clicando fora do modal
    $modalOverlay.on('click', hideModais);
    
    // Troca do modal de login pro de registro
    $('#switch-to-register').on('click', (e) => {
        e.preventDefault();
        hideModais();
        showModal($registerModal);
    });
    // Troca do modal de registro pro de login
    $('#switch-to-login').on('click', (e) => {
        e.preventDefault();
        hideModais();
        showModal($loginModal);
    });

    /**
     * REGISTRO
     */
    $('#register-form').on('submit', function(e) {
        e.preventDefault();
        const username = $('#register-username').val();
        const password = $('#register-password').val();

        if (!username || username.includes(' ')) {
            NoteApp.showToast('Nome de usuário inválido (não use espaços).', 'error');
            return;
        }

        const bancoUsuarios = getBancoUsuarios();

        if (bancoUsuarios[username]) {
            NoteApp.showToast('Este nome de usuário já existe.', 'error');
        } else {
            // Salva o usuário novo
            bancoUsuarios[username] = password; // ATENÇÃO: Salvando senha em texto
            saveBancoUsuarios(bancoUsuarios);
            
            NoteApp.showToast('Conta criada com sucesso! Faça o login.', 'success');
            hideModais();
            showModal($loginModal); // Manda pro login
        }
    });

    /**
     * LOGIN
     */
    $('#login-form').on('submit', function(e) {
        e.preventDefault();
        const username = $('#login-username').val();
        const password = $('#login-password').val();
        
        const bancoUsuarios = getBancoUsuarios();

        // Verifica a existencia do usuário e se a senha é igual
        if (bancoUsuarios[username] && bancoUsuarios[username] === password) {
            
            // Helper pra logar
            const performLogin = () => {
                sessionStorage.setItem(SESSAO_KEY, username); // Salva na sessão
                NoteApp.showToast(`Bem-vindo, ${username}!`, 'success');
                
                // 1s pro usuário ler o "Bem-vindo" antes de recarregar a página
                setTimeout(() => {
                    location.reload();
                }, 1000);
            };

            // Verifica se o usuário anonimo tinha notas
            if (NoteApp.hasAnonymousNotes()) {
                showConfirmModal(
                    'Aviso de Login',
                    'Você tem notas salvas como anônimo. Se você logar, elas serão DELETADAS para carregar as notas da sua conta. Deseja continuar?',
                    'info',
                    function() {
                        console.warn('[Auth] Usuário confirmou. Deletando notas anônimas...');
                        NoteApp.deleteAnonymousNotes();
                        performLogin();
                    }
                );
            } else {
                performLogin();
            }
            
        } else {
            NoteApp.showToast('Usuário ou senha inválidos.', 'error');
        }
    });

    $btnLogout.on('click', function() {
        sessionStorage.removeItem(SESSAO_KEY); // Limpa a sessão
        location.reload(); // Recarrega a página (volta a ser anônimo)
    });

    /**
     * MUDAR SENHA
     */
    $('#change-pass-form').on('submit', function(e) {
        e.preventDefault();
        const oldPassword = $('#change-old-password').val();
        const newPassword = $('#change-new-password').val();
        const confirmPassword = $('#change-confirm-password').val();

        if (newPassword !== confirmPassword) {
            NoteApp.showToast('As novas senhas não coincidem.', 'error');
            return;
        }

        const bancoUsuarios = getBancoUsuarios();
        
        // Verificar senha antiga
        if (bancoUsuarios[usuarioAtual] && bancoUsuarios[usuarioAtual] === oldPassword) {
            // Atualiza a senha
            bancoUsuarios[usuarioAtual] = newPassword;
            saveBancoUsuarios(bancoUsuarios);
            
            NoteApp.showToast('Senha alterada com sucesso!', 'success');
            hideModais();
            $(this)[0].reset(); // Limpa o formulário
        } else {
            NoteApp.showToast('A senha antiga está incorreta.', 'error');
        }
    });



    // INICIO APLICAÇÃO
    function initApp() {
        // Verifica usuario logado
        usuarioAtual = sessionStorage.getItem(SESSAO_KEY);

        // Atualiza html (mostra "Acessar" ou "Olá, Usuario")
        if (usuarioAtual) {
            $btnAcessar.addClass('hidden');
            $menuUsuario.removeClass('hidden');
            $msgBoasVindas.text(`Olá, ${usuarioAtual}`);
        } else {
            $btnAcessar.removeClass('hidden');
            $menuUsuario.addClass('hidden');
        }

        NoteApp.initNoteEvents(showConfirmModal);

        // carrega as notas do usuário atual ou anonimas
        NoteApp.loadNotesFromStorage(usuarioAtual);
    }

    initApp();

});