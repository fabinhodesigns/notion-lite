const NoteApp = (function () {

    let currentUsername = null; // Defini quais notas buscar com base no usuario. NULL = Anonimo
    let showConfirmModal = null; // Chamar o modal de confirmação auth.js
    let cacheDeNotas = {}; // Banco de dados das notas
    let notaAtualId = null; // Qual nota está aberta na tela

    const ANON_NOTES_KEY = 'Notas Anonimas'; // Notas de quem não está logado
    
    const $noteList = $('#note-list');
    const $searchInput = $('#search-input');
    const $placeholder = $('#placeholder');
    const $editorContainer = $('#editor-container');
    const $noteTitle = $('#note-title');
    const $noteBody = $('#note-body');
    const $btnSave = $('#btn-save');
    const $btnDelete = $('#btn-delete');
    const $btnNewNote = $('#btn-new-note');

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
        // Delay pra adicionar a transição do css
        setTimeout(() => toast.addClass('show'), 100);
        setTimeout(() => {
            toast.removeClass('show');
            setTimeout(() => toast.remove(), 500);
        }, 3000);
    }

    // Decide quais notas buscar com base no usuario
    function getNotesKey() {
        return currentUsername ? `notes_${currentUsername}` : ANON_NOTES_KEY;
    }

    // Carrega as notas do localStorage pro nosso cache
    function loadNotesFromStorage(username) {
        currentUsername = username; // Atualiza o "dono" das notas
        console.log(`[Notes] Carregando notas da chave: ${getNotesKey()}`);

        const notasSalvas = localStorage.getItem(getNotesKey());

        if (notasSalvas) {
            cacheDeNotas = JSON.parse(notasSalvas);
        } else {
            cacheDeNotas = {}; // Limpa se não tiver nada
        }

        populateNoteList(); // Mostra as notas na tela
        return cacheDeNotas; // Retorna o cache pro auth.js (pra ele saber se tem nota anônima)
    }

    // Salva o cache (memória) de volta no localStorage (disco)
    function saveNotesToStorage() {
        console.log(`[Notes] Salvando todas as notas na chave: ${getNotesKey()}`);
        localStorage.setItem(getNotesKey(), JSON.stringify(cacheDeNotas));
    }

    // Filtra as notas locais
    function filterLocalNotes(query) {
        console.log(`[Notes] Buscando localmente por: "${query}"`);

        $noteList.empty(); // Limpa a lista atual

        const termoBusca = query.toLowerCase();

        // Pega os valores do nosso cache e filtra
        const notasFiltradas = Object.values(cacheDeNotas).filter(note => {
            // Compara título e corpo da nota
            return note.title.toLowerCase().includes(termoBusca) ||
                   note.body.toLowerCase().includes(termoBusca);
        });

        if (notasFiltradas.length > 0) {
            notasFiltradas.forEach(note => {
                appendNoteToList(note);
            });
        } else {
            $noteList.append('<li class="empty-list">Nenhuma nota encontrada.</li>');
        }
    }

    // Checa se o usuário anônimo tem notas
    function hasAnonymousNotes() {
        const notasAnonimas = localStorage.getItem(ANON_NOTES_KEY);
        // Verifica se existe E se não é só um objeto vazio '{}'
        return (notasAnonimas && notasAnonimas !== '{}');
    }

    // Limpa o lixo anônimo
    function deleteAnonymousNotes() {
        console.warn('[Auth] Limpando notas anônimas do localStorage...');
        localStorage.removeItem(ANON_NOTES_KEY);
        showToast('Notas anônimas foram limpas.', 'info');
    }

    // Joga as notas do cache na tela (lista da sidebar)
    function populateNoteList() {
        $noteList.empty(); // limpa antes de popular
        if (Object.keys(cacheDeNotas).length === 0) {
            $noteList.append('<li class="empty-list">Nenhuma nota.</li>');
            return;
        }
        Object.values(cacheDeNotas).forEach(note => {
            appendNoteToList(note);
        });
    }

    // Cria o HTML de cada item da lista
    function createNoteListItem(note) {
        return $(`
            <li data-id="${note.id}">
                <i class="bi bi-file-earmark-text"></i>
                ${note.title}
            </li>
        `);
    }

    // Adiciona um item na lista
    function appendNoteToList(note) {
        $noteList.find('.empty-list').remove(); // remove o "nenhuma nota"
        const noteItem = createNoteListItem(note);
        $noteList.append(noteItem);
    }

    // Atualiza o título na lista (depois de salvar)
    function updateNoteInList(id, newTitle) {
        const noteItem = $noteList.find(`li[data-id="${id}"]`);
        if (noteItem.length > 0) {
            noteItem.html(`<i class="bi bi-file-earmark-text"></i> ${newTitle}`);
        }
    }

    // Remove o item da lista (depois de deletar)
    function removeNoteFromList(id) {
        const noteItem = $noteList.find(`li[data-id="${id}"]`);
        if (noteItem.length > 0) {
            noteItem.remove();
        }
        // Se a lista ficar vazia, bota o aviso de volta
        if (Object.keys(cacheDeNotas).length === 0) {
            $noteList.append('<li class="empty-list">Nenhuma nota.</li>');
        }
    }

    // Abre a nota no editor
    function openNote(id) {
        // Pinta o item na lista
        $noteList.find('li').removeClass('active');
        $noteList.find(`li[data-id="${id}"]`).addClass('active');

        notaAtualId = id; // Guarda o ID da nota que tá aberta
        const note = cacheDeNotas[id];

        if (note) {
            console.log('[Notes] Abrindo nota do cache local:', note);

            // Mostra o editor, esconde o placeholder
            $placeholder.addClass('hidden');
            $editorContainer.removeClass('hidden');

            // Joga os dados da nota no editor
            $noteTitle.val(note.title);
            $noteBody.val(note.body);
        } else {
            console.error(`[Notes ERROR] PERDENDO NOTA! ID ${id} não achado no cache.`);
            showToast('Erro: Não foi possível abrir a nota.', 'error');
        }
    }

    // Limpa o editor pra uma nota nova
    function createNewNote() {
        notaAtualId = null; // Seta o ID pra nulo
        $noteList.find('li').removeClass('active'); // Tira seleção

        $noteTitle.val('');
        $noteBody.val('');
        $noteTitle.attr('placeholder', 'Dê um título para sua nova nota...');

        // Mostra o editor
        $placeholder.addClass('hidden');
        $editorContainer.removeClass('hidden');
        $noteTitle.focus(); // Foca no título pro user já digitar
    }

    // Salva a nota (PUT ou POST)
    function saveNote() {
        // Pega o título, se tiver vazio, bota um padrão
        const title = $noteTitle.val() || "Nota sem título";
        const body = $noteBody.val();

        // Feedback de loading
        $btnSave.prop('disabled', true);
        $btnSave.find('.spinner-border-sm').show();

        if (notaAtualId) {
            console.log(`PUT - Atualizando nota ID: ${notaAtualId}`);

            const note = cacheDeNotas[notaAtualId];
            note.title = title;
            note.body = body;

            cacheDeNotas[notaAtualId] = note; // Salva no cache
            updateNoteInList(notaAtualId, title); // Atualiza o título na lista

            showToast(`Nota "${title}" atualizada!`, 'success');

        } else {
            const newId = 'note_' + Date.now(); // ID local único
            console.log(`Post - Nova nota ID: ${newId}`);

            const newNote = {
                id: newId,
                title: title,
                body: body,
                userId: currentUsername || 'anonymous'
            };

            cacheDeNotas[newId] = newNote; // Salva no cache
            appendNoteToList(newNote); // Adiciona na lista da sidebar
            notaAtualId = newId; // Define como a nota ativa

            // Pinta a nota nova na lista
            $noteList.find('li').removeClass('active');
            $noteList.find(`li[data-id="${notaAtualId}"]`).addClass('active');

            showToast(`Nota "${title}" criada!`, 'success');
        }

        // Salva tudo no "banco de dados" (localStorage)
        saveNotesToStorage();

        // Libera o botão
        setTimeout(() => {
            $btnSave.prop('disabled', false);
            $btnSave.find('.spinner-border-sm').hide();
        }, 300);
    }

    // Deletar nota
    function deleteNote() {
        if (!notaAtualId) {
            showToast('Nenhuma nota selecionada para excluir.', 'error');
            return;
        }

        if (showConfirmModal) {
            showConfirmModal(
                'Excluir Nota',
                'Tem certeza que deseja excluir esta nota? Esta ação não pode ser desfeita.',
                'danger',
                function () {
                    console.log(`Excluindo nota ID: ${notaAtualId}`);

                    delete cacheDeNotas[notaAtualId]; 
                    removeNoteFromList(notaAtualId); 
                    saveNotesToStorage();     

                    // Limpa o editor
                    notaAtualId = null;
                    $editorContainer.addClass('hidden');
                    $placeholder.removeClass('hidden');

                    showToast(`Nota excluída com sucesso.`, 'success');
                }
            );
        } else {
            // Fallback (plano B) caso a "ponte" falhe
            // Isso aqui não deve rodar nunca, mas é bom ter
            if (confirm('Tem certeza? (fallback)')) {
                console.log(`[Notes] Excluindo nota ID: ${notaAtualId}`);
                delete cacheDeNotas[notaAtualId];
                removeNoteFromList(notaAtualId);
                saveNotesToStorage();
                notaAtualId = null;
                $editorContainer.addClass('hidden');
                $placeholder.removeClass('hidden');
                showToast(`Nota excluída com sucesso.`, 'success');
            }
        }
    }

    // Amarra os botões tudo
    function initNoteEvents(confirmModalFunction) {
        // Cria a "ponte" pra função do modal
        showConfirmModal = confirmModalFunction;
        
        // Listener de clique na lista de notas
        $noteList.on('click', 'li', function () {
            const id = $(this).data('id');
            if (id) {
                openNote(id);
            }
        });

        // Botões
        $btnNewNote.on('click', createNewNote);
        $btnSave.on('click', saveNote);
        $btnDelete.on('click', deleteNote);

        // Busca em tempo real conforme o usuario digita
        $searchInput.on('keyup', function (e) {
            const query = $(this).val();
            if (query) {
                filterLocalNotes(query);
            } else {
                // Quando limpar o input da pesquisa, busca novamente as notas sem filtros
                populateNoteList();
            }
        });
    }

    // Coloca as funções públicas pro Auth enxergar elas
    return {
        initNoteEvents: initNoteEvents,
        loadNotesFromStorage: loadNotesFromStorage,
        hasAnonymousNotes: hasAnonymousNotes,
        deleteAnonymousNotes: deleteAnonymousNotes,
        showToast: showToast
    };

})();