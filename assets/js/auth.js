$(document).ready(function () {

    const DB_USERS_KEY = 'notionLiteUsers_db';
    const SESSAO_ATIVA_KEY = 'notionLiteSession';
    const USER_PROFILE_KEY = 'notionLiteUserProfile';
    const AUTH_API_URL = 'https://dummyjson.com/auth/login';

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
    let authToken = null;
    let userIdApi = 1;
    let loginObrigatorio = false;

    function setCookie(name, value, minutes) {
        const expires = new Date(Date.now() + minutes * 60000).toUTCString();
        document.cookie = `${name}=${value}; path=/; expires=${expires}`;
    }

    function getCookie(name) {
        const cookies = document.cookie.split(';').map(c => c.trim());
        const target = cookies.find(c => c.startsWith(`${name}=`));
        return target ? target.split('=')[1] : null;
    }

    function clearCookie(name) {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    }

    function carregarBancoUsuarios() {
        const usersData = localStorage.getItem(DB_USERS_KEY);
        return usersData ? JSON.parse(usersData) : {};
    }

    function salvarBancoUsuarios(bancoUsuarios) {
        localStorage.setItem(DB_USERS_KEY, JSON.stringify(bancoUsuarios));
    }

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

        $confirmBtnOk.off('click').on('click', function () {
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

    function hideModais(force = false) {
        if (loginObrigatorio && !authToken && !force) return;
        $modalOverlay.addClass('hidden');
        $('.modal').addClass('hidden');
    }

    $btnAbreLogin.on('click', () => showModal($loginModal));
    $btnMudarSenha.on('click', () => showModal($changePassModal));

    $modalOverlay.on('click', () => {
        if (!loginObrigatorio) hideModais();
    });

    $('#switch-to-register').on('click', (e) => {
        e.preventDefault();
        hideModais(true);
        showModal($registerModal);
    });

    $('#switch-to-login').on('click', (e) => {
        e.preventDefault();
        hideModais(true);
        showModal($loginModal);
    });

    $('#register-form').on('submit', function (e) {
        e.preventDefault();
        const username = $('#register-username').val();
        const password = $('#register-password').val();

        if (!username || username.includes(' ')) {
            NoteApp.showToast('Nome de usuario invalido (sem espacos).', 'error');
            return;
        }

        if (password.length < 4) {
            NoteApp.showToast('Senha fraca (min 4 chars).', 'error');
            return;
        }

        const bancoUsuarios = carregarBancoUsuarios();

        if (bancoUsuarios[username]) {
            NoteApp.showToast('Usuario ja existe.', 'error');
        } else {
            bancoUsuarios[username] = password;
            salvarBancoUsuarios(bancoUsuarios);

            NoteApp.showToast('Conta criada localmente. Use login para autenticar.', 'success');
            hideModais(true);
            showModal($loginModal);
        }
    });

    $('#login-form').on('submit', async function (e) {
        e.preventDefault();
        const username = $('#login-username').val();
        const password = $('#login-password').val();

        if (!username || !password) {
            NoteApp.showToast('Preencha usuario e senha.', 'error');
            return;
        }

        console.info('[Auth][LOGIN] Tentativa de login iniciada', { username });

        const bancoUsuarios = carregarBancoUsuarios();
        if (bancoUsuarios[username] && bancoUsuarios[username] === password) {
            const profile = { username, userId: 1 };
            authToken = `local-${Date.now()}`;
            setCookie('authToken', authToken, 60);
            sessionStorage.setItem(SESSAO_ATIVA_KEY, profile.username);
            sessionStorage.setItem('notionLiteUserId', profile.userId);
            localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));
            usuarioLogado = profile.username;
            loginObrigatorio = false;
            console.info('[Auth][LOGIN][LOCAL] Usuario autenticado localmente', { username: usuarioLogado });
            NoteApp.showToast(`Bem-vindo, ${usuarioLogado}!`, 'success');
            hideModais(true);
            aplicarEstadoLogado(profile);
            await NoteApp.loadNotesFromStorage(usuarioLogado, profile.userId);
        } else {
            await autenticarNoBackend(username, password);
        }
    });

    $btnLogout.on('click', function () {
        console.info('[Auth][LOGOUT] Usuario encerrou a sessao', { username: usuarioLogado });
        sessionStorage.removeItem(SESSAO_ATIVA_KEY);
        sessionStorage.removeItem('notionLiteUserId');
        localStorage.removeItem(USER_PROFILE_KEY);
        clearCookie('authToken');
        authToken = null;
        location.reload();
    });

    $('#change-pass-form').on('submit', function (e) {
        e.preventDefault();
        const oldPassword = $('#change-old-password').val();
        const newPassword = $('#change-new-password').val();
        const confirmPassword = $('#change-confirm-password').val();

        if (newPassword.length < 4) {
            NoteApp.showToast('Senha nova fraca (min 4 chars).', 'error');
            return;
        }

        if (newPassword !== confirmPassword) {
            NoteApp.showToast('As senhas nao coincidem.', 'error');
            return;
        }

        const bancoUsuarios = carregarBancoUsuarios();

        if (bancoUsuarios[usuarioLogado] && bancoUsuarios[usuarioLogado] === oldPassword) {
            bancoUsuarios[usuarioLogado] = newPassword;
            salvarBancoUsuarios(bancoUsuarios);

            NoteApp.showToast('Senha alterada localmente.', 'success');
            hideModais();
            $(this)[0].reset();
        } else {
            NoteApp.showToast('Senha antiga incorreta.', 'error');
        }
    });

    async function autenticarNoBackend(username, password) {
        try {
            $loginModal.addClass('loading');
            console.info('[Auth][POST] Autenticando no backend DummyJSON', { username });
            const response = await fetch(AUTH_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const payload = await response.json();
            if (!response.ok) {
                const msg = payload.message || payload.error || `Falha no login (${response.status})`;
                throw new Error(msg);
            }

            authToken = payload.token;
            userIdApi = payload.id || 1;

            const profile = {
                username: payload.username || username,
                userId: userIdApi
            };

            setCookie('authToken', authToken, 60); // 1h
            sessionStorage.setItem(SESSAO_ATIVA_KEY, profile.username);
            sessionStorage.setItem('notionLiteUserId', profile.userId);
            localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));

            usuarioLogado = profile.username;
            loginObrigatorio = false;
            console.info('[Auth][POST] Login no backend bem-sucedido', { username: usuarioLogado, userId: profile.userId });

            NoteApp.showToast(`Bem-vindo, ${usuarioLogado}!`, 'success');
            hideModais();
            aplicarEstadoLogado(profile);
            await NoteApp.loadNotesFromStorage(usuarioLogado, profile.userId);
        } catch (error) {
            console.error('[Auth] Erro de login', error);
            NoteApp.showToast(error.message || 'Erro ao logar.', 'error');
        } finally {
            $loginModal.removeClass('loading');
        }
    }

    function aplicarEstadoLogado(profile) {
        $btnAbreLogin.addClass('hidden');
        $menuUsuario.removeClass('hidden');
        $msgBoasVindas.text(`Ola, ${profile.username}`);
    }

    function initApp() {
        authToken = getCookie('authToken');
        const profile = localStorage.getItem(USER_PROFILE_KEY) ? JSON.parse(localStorage.getItem(USER_PROFILE_KEY)) : null;

        if (authToken && profile && profile.username) {
            usuarioLogado = profile.username;
            userIdApi = profile.userId || 1;
            sessionStorage.setItem(SESSAO_ATIVA_KEY, usuarioLogado);
            sessionStorage.setItem('notionLiteUserId', userIdApi);
            aplicarEstadoLogado(profile);
            NoteApp.initNoteEvents(showConfirmModal);
            NoteApp.loadNotesFromStorage(usuarioLogado, userIdApi);
        } else {
            loginObrigatorio = true;
            showModal($loginModal);
            $btnAbreLogin.addClass('hidden');
            $menuUsuario.addClass('hidden');
            NoteApp.initNoteEvents(showConfirmModal);
        }
    }

    initApp();

});
