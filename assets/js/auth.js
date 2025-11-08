
$(document).ready(function() {

    const DB_USERS_KEY = 'notionLiteUsers_db'; 
    const SESSAO_ATIVA_KEY = 'notionLiteSession'; 

    const $btnAbreLogin = $('#btn-open-login-modal');
    const $menuUsuario = $('#user-menu');
    const $msgBoasVindas = $('#welcome-message');
    const $btnLogout = $('#btn-logout');
    const $btnMudarSenha = $('#btn-change-pass');

    const $modalOverlay = $('#modal-overlay');
    const $loginModal = $('#login-modal');
    const $registerModal = $('#register-modal');
    const $changePassModal = $('#change-pass-modal');

    const $confirmModal = $('#confirm-modal');
    const $confirmTitle = $('#confirm-title');
    const $confirmMessage = $('#confirm-message');
    const $confirmBtnOk = $('#confirm-btn-ok');
    const $confirmBtnCancel = $('#confirm-btn-cancel');
    const $confirmIcon = $('#confirm-icon');

    let usuarioLogado = null; 


    function carregarBancoUsuarios() {
        const usersData = localStorage.getItem(DB_USERS_KEY);
        return usersData ? JSON.parse(usersData) : {};
    }

    function salvarBancoUsuarios(bancoUsuarios) {
        localStorage.setItem(DB_USERS_KEY, JSON.stringify(bancoUsuarios));
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

        $confirmIcon.removeClass('info danger');
        $confirmBtnOk.removeClass('btn-modal-danger btn-modal-primary');

        if (type === 'danger') {
            $confirmIcon.addClass('danger');
            $confirmBtnOk.addClass('btn-modal-danger').text('Excluir');
        } else {
            $confirmIcon.addClass('info');
            $confirmBtnOk.addClass('btn-modal-primary').text('Confirmar');
        }
        
        $confirmBtnOk.off('click').on('click', function() {
            onConfirm();
            hideModais();
        });
        
        $confirmBtnCancel.on('click', hideModais);
        
        showModal($confirmModal);
    }

    function showModal(modal) {
        $modalOverlay.removeClass('hidden');
        modal.removeClass('hidden');
    }

    function hideModais() {
        $modalOverlay.addClass('hidden');
        $('.modal').addClass('hidden');
    }

    $btnAbreLogin.on('click', () => showModal($loginModal));
    $btnMudarSenha.on('click', () => showModal($changePassModal));

    $modalOverlay.on('click', hideModais);
    
    $('#switch-to-register').on('click', (e) => {
        e.preventDefault(); 
        hideModais();
        showModal($registerModal);
    });

    $('#switch-to-login').on('click', (e) => {
        e.preventDefault();
        hideModais();
        showModal($loginModal);
    });

    $('#register-form').on('submit', function(e) {
        e.preventDefault();
        const username = $('#register-username').val();
        const password = $('#register-password').val();

        if (!username || username.includes(' ')) {
            NoteApp.showToast('Nome de usuário inválido (não use espaços).', 'error');
            return;
        }
        
        if (password.length < 4) {
             NoteApp.showToast('Senha muito fraca (mín. 4 chars).', 'error');
            return;
        }

        const bancoUsuarios = carregarBancoUsuarios();

        if (bancoUsuarios[username]) {
            NoteApp.showToast('Este nome de usuário já existe.', 'error');
        } else {
            bancoUsuarios[username] = password; 
            salvarBancoUsuarios(bancoUsuarios);
            
            NoteApp.showToast('Conta criada com sucesso! Faça o login.', 'success');
            hideModais();
            showModal($loginModal); 
        }
    });

    $('#login-form').on('submit', function(e) {
        e.preventDefault();
        const username = $('#login-username').val();
        const password = $('#login-password').val();
        
        const bancoUsuarios = carregarBancoUsuarios();

        if (bancoUsuarios[username] && bancoUsuarios[username] === password) {
            
            const logarUsuario = () => {
                sessionStorage.setItem(SESSAO_ATIVA_KEY, username); 
                NoteApp.showToast(`Bem-vindo, ${username}!`, 'success');
                
                setTimeout(() => {
                    location.reload();
                }, 1000);
            };

            if (NoteApp.hasAnonymousNotes()) {
                showConfirmModal(
                    'Aviso de Login',
                    'Você tem notas salvas como anônimo. Se você logar, elas serão DELETADAS para carregar as notas da sua conta. Deseja continuar?',
                    'info',
                    function() {
                        console.warn('[Auth] Usuário confirmou. Deletando notas anônimas...');
                        NoteApp.deleteAnonymousNotes();
                        logarUsuario();
                    }
                );
            } else {
                logarUsuario();
            }
            
        } else {
            NoteApp.showToast('Usuário ou senha inválidos.', 'error');
        }
    });

    $btnLogout.on('click', function() {
        sessionStorage.removeItem(SESSAO_ATIVA_KEY); 
        location.reload(); 
    });

    $('#change-pass-form').on('submit', function(e) {
        e.preventDefault();
        const oldPassword = $('#change-old-password').val();
        const newPassword = $('#change-new-password').val();
        const confirmPassword = $('#change-confirm-password').val();

        if (newPassword.length < 4) {
             NoteApp.showToast('Senha nova muito fraca (mín. 4 chars).', 'error');
            return;
        }

        if (newPassword !== confirmPassword) {
            NoteApp.showToast('As novas senhas não coincidem.', 'error');
            return;
        }

        const bancoUsuarios = carregarBancoUsuarios();
        
        if (bancoUsuarios[usuarioLogado] && bancoUsuarios[usuarioLogado] === oldPassword) {
            bancoUsuarios[usuarioLogado] = newPassword;
            salvarBancoUsuarios(bancoUsuarios);
            
            NoteApp.showToast('Senha alterada com sucesso!', 'success');
            hideModais();
            $(this)[0].reset(); 
        } else {
            NoteApp.showToast('A senha antiga está incorreta.', 'error');
        }
    });


    function initApp() {
        console.log("Iniciando App...");
        usuarioLogado = sessionStorage.getItem(SESSAO_ATIVA_KEY);

        if (usuarioLogado) {
            $btnAbreLogin.addClass('hidden');
            $menuUsuario.removeClass('hidden');
            $msgBoasVindas.text(`Olá, ${usuarioLogado}`);
        } else {
            $btnAbreLogin.removeClass('hidden');
            $menuUsuario.addClass('hidden');
        }

        // Isso é a "ponte" que deixa o notes.js chamar o modal do auth.js
        NoteApp.initNoteEvents(showConfirmModal);

        // 4. Carrega as notas certas (do user atual ou as anônimas)
        NoteApp.loadNotesFromStorage(usuarioLogado);
    }

    // Roda a aplicação
    initApp();

});