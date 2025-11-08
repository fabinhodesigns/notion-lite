const NoteApp = (function () {

    let usuarioCorrente = null; 
    let showConfirmModal = null;  
    let bancoDeNotasLocal = {}; 
    let idNotaAberta = null; 

    const CHAVE_ANONIMO = 'Notas Anonimas'; 
    
    const $listaNotas = $('#note-list');
    const $campoBusca = $('#search-input');
    const $placeholder = $('#placeholder');
    const $editor = $('#editor-container');
    const $tituloNota = $('#note-title');
    const $corpoNota = $('#note-body');
    const $btnSalvar = $('#btn-save');
    const $btnDeletar = $('#btn-delete');
    const $btnNotaNova = $('#btn-new-note');

    
    function showToast(message, type = 'info') {
        const toastId = 'toast-' + Date.now();
        let icon = '';

        if (type === 'success') {
            icon = '<i class="bi bi-check-circle-fill"></i>';
        } else if (type === 'error') {
            icon = '<i class="bi bi-x-circle-fill"></i>';
        } else {
            icon = '<i class="bi bi-info-circle-fill"></i>';
        }

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

    function getStorageKey() {
        return usuarioCorrente ? `notes_${usuarioCorrente}` : CHAVE_ANONIMO;
    }

    function carregarNotas(username) {
        usuarioCorrente = username; 
        console.log(`[Notes] Carregando notas da chave: ${getStorageKey()}`);

        const notasSalvas = localStorage.getItem(getStorageKey());

        if (notasSalvas) {
            bancoDeNotasLocal = JSON.parse(notasSalvas);
        } else {
            bancoDeNotasLocal = {}; 
        }

        desenharLista();
        return bancoDeNotasLocal; 
    }

    function salvarNotas() {
        console.log(`[Notes] (SAVE) Salvando todas as notas na chave: ${getStorageKey()}`);
        localStorage.setItem(getStorageKey(), JSON.stringify(bancoDeNotasLocal));
    }

    function filtrarNotasLocais(query) {
        console.log(`[Notes] Buscando localmente por: "${query}"`);

        const termoBusca = query.toLowerCase();
        let htmlString = ''; 

        const notasFiltradas = Object.values(bancoDeNotasLocal).filter(note => {
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

    function temNotasAnonimas() {
        const notasAnonimas = localStorage.getItem(CHAVE_ANONIMO);
        return (notasAnonimas && notasAnonimas !== '{}');
    }

    function deletarNotasAnonimas() {
        console.warn('[Auth] Limpando notas anônimas do localStorage...');
        localStorage.removeItem(CHAVE_ANONIMO);
        showToast('Notas anônimas foram limpas.', 'info');
    }

    function desenharLista() {
        $listaNotas.empty(); 
        if (Object.keys(bancoDeNotasLocal).length === 0) {
            $listaNotas.append('<li class="empty-list">Nenhuma nota.</li>');
            return;
        }
        Object.values(bancoDeNotasLocal).forEach(note => {
            adicionarItemNaLista(note);
        });
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
        if ($noteItem.length > 0) {
            $noteItem.html(`<i class="bi bi-file-earmark-text"></i> ${newTitle}`);
        }
    }

    function removerItemDaLista(id) {
        $listaNotas.find(`li[data-id="${id}"]`).remove();
        
        if (Object.keys(bancoDeNotasLocal).length === 0) {
            $listaNotas.append('<li class="empty-list">Nenhuma nota.</li>');
        }
    }

    function abrirNota(id) {
        $listaNotas.find('li').removeClass('active');
        $listaNotas.find(`li[data-id="${id}"]`).addClass('active');

        idNotaAberta = id; 
        const note = bancoDeNotasLocal[id];

        if (note) {
            console.log('[Notes] Abrindo nota do cache local:', note);
            $placeholder.addClass('hidden');
            $editor.removeClass('hidden');

            $tituloNota.val(note.title);
            $corpoNota.val(note.body);
        } else {
            console.error(`[Notes ERROR] PERDENDO NOTA! ID ${id} não achado no cache.`);
            showToast('Erro: Não foi possível abrir a nota.', 'error');
        }
    }

    function criarNotaNova() {
        idNotaAberta = null;
        $listaNotas.find('li').removeClass('active');

        $tituloNota.val('');
        $corpoNota.val('');
        $tituloNota.attr('placeholder', 'Dê um título para sua nova nota...');

        $placeholder.addClass('hidden');
        $editor.removeClass('hidden');
        $tituloNota.focus();
    }

    function salvarNota() {
        const title = $tituloNota.val() || "Nota sem título";
        const body = $corpoNota.val();

        $btnSalvar.prop('disabled', true);
        $btnSalvar.find('.spinner-border-sm').show();

        if (idNotaAberta) {
            console.log(`[SIMULATE PUT] Atualizando nota ID: ${idNotaAberta}`);

            const note = bancoDeNotasLocal[idNotaAberta];
            note.title = title;
            note.body = body;

            bancoDeNotasLocal[idNotaAberta] = note; 
            atualizarItemNaLista(idNotaAberta, title); 

            showToast(`Nota "${title}" atualizada!`, 'success');

        } else {
            const newId = 'note_' + Date.now(); 
            console.log(`[SIMULATE POST] Criando nova nota ID: ${newId}`);

            const newNote = {
                id: newId,
                title: title,
                body: body,
                userId: usuarioCorrente || 'anonymous' 
            };

            bancoDeNotasLocal[newId] = newNote; 
            adicionarItemNaLista(newNote);
            idNotaAberta = newId; 

            $listaNotas.find('li').removeClass('active');
            $listaNotas.find(`li[data-id="${idNotaAberta}"]`).addClass('active');

            showToast(`Nota "${title}" criada!`, 'success');
        }

        salvarNotas();

        setTimeout(() => {
            $btnSalvar.prop('disabled', false);
            $btnSalvar.find('.spinner-border-sm').hide();
        }, 300);
    }

    function deletarNota() {
        if (!idNotaAberta) {
            showToast('Nenhuma nota selecionada para excluir.', 'error');
            return;
        }

        if (showConfirmModal) {
            showConfirmModal(
                'Excluir Nota',
                'Tem certeza que deseja excluir esta nota? Esta ação não pode ser desfeita.',
                'danger',
                function () { 
                    console.log(`[SIMULATE DELETE] Excluindo nota ID: ${idNotaAberta}`);

                    delete bancoDeNotasLocal[idNotaAberta]; 
                    removerItemDaLista(idNotaAberta);
                    salvarNotas();           

                    idNotaAberta = null;
                    $editor.addClass('hidden');
                    $placeholder.removeClass('hidden');

                    showToast(`Nota excluída com sucesso.`, 'success');
                }
            );
        } else {
            alert("ERRO: Ponte do modal de confirmação falhou.");
        }
    }

    function initNoteEvents(confirmModalFunction) {
        showConfirmModal = confirmModalFunction;
        
        $listaNotas.on('click', 'li', function () {
            const id = $(this).data('id');
            if (id) { 
                abrirNota(id);
            }
        });

        $btnNotaNova.on('click', criarNotaNova);
        $btnSalvar.on('click', salvarNota);
        $btnDeletar.on('click', deletarNota);

        $campoBusca.on('keyup', function (e) {
            const query = $(this).val();
            if (query) {
                filtrarNotasLocais(query);
            } else {
                
                desenharLista();
            }
        });
    }

    return {
        initNoteEvents: initNoteEvents,
        loadNotesFromStorage: carregarNotas,
        hasAnonymousNotes: temNotasAnonimas,
        deleteAnonymousNotes: deletarNotasAnonimas,
        showToast: showToast
    };

})();