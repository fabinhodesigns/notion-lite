const NoteApp = (function () {

    const API_BASE = 'https://jsonplaceholder.typicode.com';

    let usuarioCorrente = null;
    let apiUserId = 1;
    let showConfirmModal = null;
    let notasApi = [];
    let idNotaAberta = null;

    const $listaNotas = $('#note-list');
    const $campoBusca = $('#search-input');
    const $placeholder = $('#placeholder');
    const $editor = $('#editor-container');
    const $tituloNota = $('#note-title');
    const $corpoNota = $('#note-body');
    const $btnSalvar = $('#btn-save');
    const $btnDeletar = $('#btn-delete');
    const $btnNotaNova = $('#btn-new-note');
    const $sidebarLoading = $('#sidebar-loading');

    const queryParams = new URLSearchParams(window.location.search);

    function showToast(message, type = 'info') {
        const toastId = 'toast-' + Date.now();
        let icon = '';

        if (type === 'success') icon = '<i class="bi bi-check-circle-fill"></i>';
        else if (type === 'error') icon = '<i class="bi bi-x-circle-fill"></i>';
        else icon = '<i class="bi bi-info-circle-fill"></i>';

        const toast = $(`
            <div class="toast ${type}" id="${toastId}">
                ${icon} ${message}
            </div>
        `);

        $('#toast-container').append(toast);
        setTimeout(() => toast.addClass('show'), 100);
        setTimeout(() => {
            toast.removeClass('show');
            setTimeout(() => toast.remove(), 500);
        }, 3000);
    }

    function setLoadingList(ativo) {
        if (ativo) $sidebarLoading.show();
        else $sidebarLoading.hide();
    }

    function buildErrorMessage(status) {
        if (status >= 500) return `Erro de servidor (${status}).`;
        if (status >= 400) return `Erro de requisicao (${status}).`;
        return `Erro inesperado (${status}).`;
    }

    async function carregarNotas(username, userIdFromAuth) {
        usuarioCorrente = username;
        apiUserId = Number(userIdFromAuth) || Number(queryParams.get('userId')) || 1;

        if (!queryParams.get('userId')) queryParams.set('userId', apiUserId);

        const searchFromUrl = queryParams.get('q') || '';
        if (searchFromUrl) $campoBusca.val(searchFromUrl);

        await buscarNotasNaApi();
        const noteIdFromUrl = Number(queryParams.get('noteId'));
        if (noteIdFromUrl) abrirNota(noteIdFromUrl);
        return notasApi;
    }

    async function buscarNotasNaApi() {
        setLoadingList(true);
        const userId = queryParams.get('userId') || apiUserId;
        try {
            const response = await fetch(`${API_BASE}/posts?userId=${userId}`);
            if (!response.ok) throw new Error(buildErrorMessage(response.status));

            notasApi = await response.json();
            desenharLista($campoBusca.val());
        } catch (error) {
            console.error('[Notes] Falha ao buscar notas na API', error);
            showToast(error.message || 'Erro ao consultar API.', 'error');
        } finally {
            setLoadingList(false);
        }
    }

    function filtrarNotasLocais(query) {
        const termoBusca = (query || '').toLowerCase();
        let htmlString = '';

        const notasFiltradas = notasApi.filter(note => {
            return note.title.toLowerCase().includes(termoBusca) ||
                note.body.toLowerCase().includes(termoBusca);
        });

        if (notasFiltradas.length > 0) {
            notasFiltradas.forEach(note => {
                htmlString += `
                    <li data-id="${note.id}">
                        <i class="bi bi-file-earmark-text"></i>
                        ${note.title}
                    </li>`;
            });
        } else {
            htmlString = '<li class="empty-list">Nenhuma nota encontrada.</li>';
        }

        $listaNotas.html(htmlString);
    }

    function desenharLista(buscaAtual = '') {
        $listaNotas.empty();
        if (!notasApi || notasApi.length === 0) {
            $listaNotas.append('<li class="empty-list">Nenhuma nota.</li>');
            return;
        }
        filtrarNotasLocais(buscaAtual);
    }

    function adicionarItemNaLista(note) {
        $listaNotas.find('.empty-list').remove();
        const noteItem = $(`
            <li data-id="${note.id}">
                <i class="bi bi-file-earmark-text"></i>
                ${note.title}
            </li>
        `);
        $listaNotas.append(noteItem);
    }

    function atualizarItemNaLista(id, newTitle) {
        const $noteItem = $listaNotas.find(`li[data-id="${id}"]`);
        if ($noteItem.length > 0) $noteItem.html(`<i class="bi bi-file-earmark-text"></i> ${newTitle}`);
    }

    function removerItemDaLista(id) {
        $listaNotas.find(`li[data-id="${id}"]`).remove();
        if (!notasApi || notasApi.length === 0) {
            $listaNotas.append('<li class="empty-list">Nenhuma nota.</li>');
        }
    }

    function abrirNota(id) {
        const numericId = Number(id);
        $listaNotas.find('li').removeClass('active');
        $listaNotas.find(`li[data-id="${numericId}"]`).addClass('active');

        idNotaAberta = numericId;
        const note = notasApi.find(item => item.id === numericId);

        if (note) {
            $placeholder.addClass('hidden');
            $editor.removeClass('hidden');

            $tituloNota.val(note.title);
            $corpoNota.val(note.body);

            queryParams.set('noteId', numericId);
            history.replaceState({}, '', `${location.pathname}?${queryParams.toString()}`);
        } else {
            showToast('Erro: Nota nao encontrada.', 'error');
        }
    }

    function criarNotaNova() {
        idNotaAberta = null;
        $listaNotas.find('li').removeClass('active');

        $tituloNota.val('');
        $corpoNota.val('');
        $tituloNota.attr('placeholder', 'De um titulo para sua nova nota...');

        $placeholder.addClass('hidden');
        $editor.removeClass('hidden');
        $tituloNota.focus();

        queryParams.delete('noteId');
        history.replaceState({}, '', `${location.pathname}?${queryParams.toString()}`);
    }

    async function salvarNota() {
        const title = $tituloNota.val() || "Nota sem titulo";
        const body = $corpoNota.val();

        $btnSalvar.prop('disabled', true);
        $btnSalvar.find('.spinner-border-sm').show();

        try {
            if (idNotaAberta) {
                const response = await fetch(`${API_BASE}/posts/${idNotaAberta}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: idNotaAberta, title, body, userId: apiUserId })
                });
                if (!response.ok) throw new Error(buildErrorMessage(response.status));

                const updated = await response.json();
                notasApi = notasApi.map(note => note.id === idNotaAberta ? updated : note);
                atualizarItemNaLista(idNotaAberta, title);
                showToast(`Nota "${title}" atualizada (PUT).`, 'success');
            } else {
                const response = await fetch(`${API_BASE}/posts`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ title, body, userId: apiUserId })
                });
                if (!response.ok) throw new Error(buildErrorMessage(response.status));

                const created = await response.json();
                notasApi.unshift(created);
                adicionarItemNaLista(created);
                idNotaAberta = created.id;

                $listaNotas.find('li').removeClass('active');
                $listaNotas.find(`li[data-id="${idNotaAberta}"]`).addClass('active');
                showToast(`Nota "${title}" criada (POST).`, 'success');
            }
        } catch (error) {
            console.error('[Notes] Erro ao salvar nota', error);
            showToast(error.message || 'Falha ao salvar.', 'error');
        } finally {
            setTimeout(() => {
                $btnSalvar.prop('disabled', false);
                $btnSalvar.find('.spinner-border-sm').hide();
            }, 200);
        }
    }

    async function deletarNota() {
        if (!idNotaAberta) {
            showToast('Nenhuma nota selecionada para excluir.', 'error');
            return;
        }

        if (showConfirmModal) {
            showConfirmModal(
                'Excluir Nota',
                'Tem certeza que deseja excluir esta nota? Esta acao nao pode ser desfeita.',
                'danger',
                async function () {
                    try {
                        const response = await fetch(`${API_BASE}/posts/${idNotaAberta}`, { method: 'DELETE' });
                        if (!response.ok) throw new Error(buildErrorMessage(response.status));

                        notasApi = notasApi.filter(note => note.id !== idNotaAberta);
                        removerItemDaLista(idNotaAberta);

                        idNotaAberta = null;
                        $editor.addClass('hidden');
                        $placeholder.removeClass('hidden');

                        showToast('Nota removida (DELETE).', 'success');
                    } catch (error) {
                        console.error('[Notes] Erro ao deletar nota', error);
                        showToast(error.message || 'Falha ao deletar.', 'error');
                    }
                }
            );
        } else {
            alert('ERRO: Ponte do modal de confirmacao falhou.');
        }
    }

    function initNoteEvents(confirmModalFunction) {
        showConfirmModal = confirmModalFunction;

        $listaNotas.on('click', 'li', function () {
            const id = $(this).data('id');
            if (id) abrirNota(id);
        });

        $btnNotaNova.on('click', criarNotaNova);
        $btnSalvar.on('click', salvarNota);
        $btnDeletar.on('click', deletarNota);

        $campoBusca.on('keyup', function (e) {
            const query = $(this).val();
            if (e.key === 'Enter') {
                queryParams.set('q', query);
                history.replaceState({}, '', `${location.pathname}?${queryParams.toString()}`);
                filtrarNotasLocais(query);
            } else if (!query) {
                queryParams.delete('q');
                history.replaceState({}, '', `${location.pathname}?${queryParams.toString()}`);
                desenharLista();
            }
        });
    }

    return {
        initNoteEvents,
        loadNotesFromStorage: carregarNotas,
        hasAnonymousNotes: () => false,
        deleteAnonymousNotes: () => {},
        showToast
    };

})();
