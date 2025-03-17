
// Importações do Firebase
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getFirestore, collection, getDocs, setDoc, doc, deleteDoc, getDoc, writeBatch } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';

// Configuração do Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBxPLohS2xOErPb8FH0cFRnNzxy699KHUM",
    authDomain: "agendaunica-fb0ea.firebaseapp.com",
    projectId: "agendaunica-fb0ea",
    storageBucket: "agendaunica-fb0ea.firebasestorage.app",
    messagingSenderId: "1060358457274",
    appId: "1:1060358457274:web:99f18e2c7e1e889e547f83",
    measurementId: "G-L8C2KQZMH7"
};

// Versão do IndexedDB
const DB_VERSION = 2;

// Variáveis Globais
let app, db, auth;
let appointments = [];
let medicos = [];
let users = [];
let currentView = 'list';
let lastSync = 0;
let deleteAllPassword = '1234';
let draggedCard = null;
let theme = {};
let errorLogs = [];
let currentUser = null;
let notification = null;
let currentPage = 1;
let itemsPerPage = 10;
let totalPages = 1;

// Elementos do DOM
let appointmentForm = null;
let appointmentsBody = null;
let gridView = null;
let pipelineView = null;
let statusFilter = null;
let actionBox = null;
let medicoModal = null;
let deleteAllModal = null;
let sortFilterModal = null;
let settingsModal = null;
let medicosListDisplay = null;
let usersList = null;
let loginForm = null;
let loginEmail = null;
let loginPassword = null;
let prevPageBtn = null;
let nextPageBtn = null;
let pageInfo = null;
let itemsPerPageSelect = null;
let selectAllBtn = null;

// Inicialização do Firebase
try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    console.log("Firebase inicializado com sucesso!");
} catch (error) {
    console.error("Erro ao inicializar Firebase:", error);
    errorLogs.push(`[${new Date().toISOString()}] Erro ao inicializar Firebase: ${error.message}`);
}

// Inicialização do DOM
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM carregado, iniciando aplicação...");
    
    notification = document.getElementById('notification');
    appointmentForm = document.getElementById('appointmentForm');
    appointmentsBody = document.getElementById('appointmentsBody');
    gridView = document.getElementById('gridView');
    pipelineView = document.getElementById('pipelineView');
    statusFilter = document.getElementById('statusFilter');
    actionBox = document.getElementById('actionBox');
    medicoModal = document.getElementById('medicoModal');
    deleteAllModal = document.getElementById('deleteAllModal');
    sortFilterModal = document.getElementById('sortFilterModal');
    settingsModal = document.getElementById('settingsModal');
    medicosListDisplay = document.getElementById('medicosListDisplay');
    usersList = document.getElementById('usersList');
    loginForm = document.getElementById('loginForm');
    loginEmail = document.getElementById('loginEmail');
    loginPassword = document.getElementById('loginPassword');
    prevPageBtn = document.getElementById('prevPageBtn');
    nextPageBtn = document.getElementById('nextPageBtn');
    pageInfo = document.getElementById('pageInfo');
    itemsPerPageSelect = document.getElementById('itemsPerPage');
    selectAllBtn = document.getElementById('selectAllBtn');

    if (!notification || !appointmentForm || !appointmentsBody || !gridView || !pipelineView) {
        console.error("Elementos essenciais do DOM não encontrados!");
        errorLogs.push(`[${new Date().toISOString()}] Elementos essenciais do DOM não encontrados`);
        alert("Erro: Interface não carregada corretamente. Verifique o HTML.");
        return;
    }

    if (notification) showNotification("Aplicação iniciada com sucesso!");
    setupEventListeners();

    onAuthStateChanged(auth, (user) => {
        console.log("Estado de autenticação alterado:", user ? "Usuário logado" : "Nenhum usuário logado");
        currentUser = user;
        if (user) {
            document.getElementById('loginContainer').style.display = 'none';
            document.getElementById('mainContent').style.display = 'block';
            loadInitialData();
            showNotification(`Bem-vindo de volta, ${user.email}!`);
        } else {
            document.getElementById('loginContainer').style.display = 'flex';
            document.getElementById('mainContent').style.display = 'none';
            loadSavedCredentials();
        }
    });
});

// Configuração de Listeners
function setupEventListeners() {
    console.log("Configurando eventos...");
    try {
        if (loginForm) loginForm.addEventListener('submit', (e) => { e.preventDefault(); loginUser(); });
        if (appointmentForm) appointmentForm.addEventListener('submit', saveAppointment);
        if (statusFilter) statusFilter.addEventListener('change', () => { currentPage = 1; renderAppointments(); showNotification('Filtro de status aplicado!'); });
        document.getElementById('selectAll')?.addEventListener('change', toggleSelectAll);
        document.querySelectorAll('.view-mode').forEach(btn => btn.addEventListener('click', changeView));
        document.getElementById('allBtn')?.addEventListener('click', () => { showTab('allTab'); showNotification('Aba "Todos" selecionada!'); });
        document.getElementById('reportsBtn')?.addEventListener('click', () => { showTab('reportsTab'); showNotification('Aba "Relatórios" selecionada!'); });
        document.getElementById('insightsBtn')?.addEventListener('click', () => { showTab('insightsTab'); showNotification('Aba "Insights" selecionada!'); });
        document.getElementById('printBtn')?.addEventListener('click', printAppointments);
        document.getElementById('deleteAllBtn')?.addEventListener('click', () => { openDeleteAllModal(); showNotification('Modal de exclusão aberto!'); });
        document.getElementById('sortFilterBtn')?.addEventListener('click', () => { openSortFilterModal(); showNotification('Modal de filtros aberto!'); });
        document.getElementById('settingsBtn')?.addEventListener('click', () => { openSettingsModal(); showNotification('Modal de configurações aberto!'); });
        document.getElementById('resetBtn')?.addEventListener('click', () => { resetForm(); showNotification('Formulário resetado!'); });
        document.getElementById('exportExcelBtn')?.addEventListener('click', () => { exportToExcel(); });
        document.getElementById('clearFiltersBtn')?.addEventListener('click', () => { clearFilters(); showNotification('Filtros limpos!'); });
        document.getElementById('logoutBtn')?.addEventListener('click', () => { logoutUser(); showNotification('Logout solicitado!'); });
        document.getElementById('statusFilterBtn')?.addEventListener('click', () => { scrollToStatusSection(); showNotification('Navegando para seção de status!'); });
        if (prevPageBtn) prevPageBtn.addEventListener('click', () => { changePage(-1); showNotification('Página anterior!'); });
        if (nextPageBtn) nextPageBtn.addEventListener('click', () => { changePage(1); showNotification('Próxima página!'); });
        if (itemsPerPageSelect) itemsPerPageSelect.addEventListener('change', () => { itemsPerPage = parseInt(itemsPerPageSelect.value); currentPage = 1; renderAppointments(); showNotification(`Itens por página alterados para ${itemsPerPage}!`); });
        if (selectAllBtn) selectAllBtn.addEventListener('click', toggleSelectAllItems);

        document.querySelectorAll('.modal-close').forEach(btn => btn.addEventListener('click', () => { closeModal(btn.closest('.modal')); showNotification('Modal fechado!'); }));
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) { closeModal(modal); showNotification('Modal fechado ao clicar fora!'); }
            });
        });

        document.getElementById('saveTheme')?.addEventListener('click', () => { saveTheme(); showNotification('Tema salvo!'); });
        document.getElementById('resetTheme')?.addEventListener('click', () => { resetTheme(); showNotification('Tema resetado!'); });
    } catch (error) {
        console.error("Erro ao configurar eventos:", error);
        errorLogs.push(`[${new Date().toISOString()}] Erro ao configurar eventos: ${error.message}`);
    }
}

// Funções de Autenticação
async function loginUser() {
    const email = loginEmail.value.trim();
    const password = loginPassword.value.trim();
    if (!email || !password) {
        showNotification('Por favor, preencha email e senha!', true);
        return;
    }
    console.log("Tentando login com:", { email });
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        console.log("Login bem-sucedido:", user);
        showNotification(`Login realizado com sucesso! Bem-vindo, ${user.email}!`);
    } catch (error) {
        console.error('Erro ao fazer login:', error);
        errorLogs.push(`[${new Date().toISOString()}] Erro ao fazer login: ${error.message}`);
        showNotification('Erro ao fazer login: ' + error.message, true);
    }
}

function loadSavedCredentials() {
    try {
        const savedEmail = localStorage.getItem('savedEmail');
        if (savedEmail) {
            loginEmail.value = savedEmail;
            console.log("Email carregado do localStorage:", savedEmail);
        }
    } catch (error) {
        console.error('Erro ao carregar credenciais salvas:', error);
        errorLogs.push(`[${new Date().toISOString()}] Erro ao carregar credenciais salvas: ${error.message}`);
    }
}

async function logoutUser() {
    try {
        await signOut(auth);
        console.log("Logout realizado com sucesso.");
        showNotification('Logout realizado com sucesso!');
    } catch (error) {
        console.error('Erro ao fazer logout:', error);
        errorLogs.push(`[${new Date().toISOString()}] Erro ao fazer logout: ${error.message}`);
        showNotification('Erro ao fazer logout: ' + error.message, true);
    }
}

// Carregamento Inicial
async function loadInitialData() {
    try {
        console.log("Carregando dados iniciais...");
        await syncLocalWithFirebase();
        const cachedData = await loadFromIndexedDB();
        appointments = cachedData.appointments || [];
        medicos = cachedData.medicos || [];
        users = cachedData.users && cachedData.users.length > 0 ? cachedData.users : [{ username: 'admin', password: '1234' }];
        currentView = cachedData.settings?.currentView || 'list';
        deleteAllPassword = cachedData.settings?.deleteAllPassword || '1234';
        lastSync = cachedData.settings?.lastSync || 0;
        theme = cachedData.settings?.theme || {};
        loadFormData();
        updateMedicosList();
        updateUsersList();
        applyTheme();
        renderAppointments();
        showNotification('Dados iniciais carregados com sucesso!');
    } catch (error) {
        console.error('Erro ao carregar dados iniciais:', error);
        errorLogs.push(`[${new Date().toISOString()}] Erro ao carregar dados iniciais: ${error.message}`);
        showNotification('Erro ao carregar dados: ' + error.message, true);
    }
}

// Funções de CRUD
async function saveAppointment(e) {
    e.preventDefault();
    try {
        const appointment = {
            id: appointmentForm.dataset.id || Date.now().toString(),
            nomePaciente: document.getElementById('nomePaciente').value || 'Paciente Sem Nome',
            telefone: document.getElementById('telefone').value || '',
            email: document.getElementById('email').value || '',
            nomeMedico: document.getElementById('nomeMedico').value || '',
            localCRM: document.getElementById('localCRM').value || '',
            dataConsulta: document.getElementById('dataConsulta').value || '',
            horaConsulta: document.getElementById('horaConsulta').value || '',
            tipoCirurgia: document.getElementById('tipoCirurgia').value || '',
            procedimentos: document.getElementById('procedimentos').value || '',
            agendamentoFeitoPor: document.getElementById('agendamentoFeitoPor').value || '',
            descricao: document.getElementById('descricao').value || '',
            status: document.getElementById('status').value || 'Aguardando Atendimento'
        };

        const index = appointments.findIndex(a => a.id === appointment.id);
        if (index !== -1) {
            appointments[index] = appointment;
            showNotification('Agendamento atualizado com sucesso!');
        } else {
            appointments.push(appointment);
            showNotification('Novo agendamento salvo com sucesso!');
        }

        await saveToFirebase('appointments', appointment);
        await saveToIndexedDB('appointments', appointments);
        resetForm();
        renderAppointments();
    } catch (error) {
        console.error('Erro ao salvar agendamento:', error);
        errorLogs.push(`[${new Date().toISOString()}] Erro ao salvar agendamento: ${error.message}`);
        showNotification('Erro ao salvar: ' + error.message, true);
    }
}

async function deleteAppointment(id) {
    try {
        if (confirm('Tem certeza que deseja excluir este agendamento?')) {
            appointments = appointments.filter(a => a.id !== id);
            await deleteFromFirebase('appointments', id);
            await saveToIndexedDB('appointments', appointments);
            renderAppointments();
            showNotification('Agendamento excluído com sucesso!');
        }
    } catch (error) {
        console.error('Erro ao excluir agendamento:', error);
        errorLogs.push(`[${new Date().toISOString()}] Erro ao excluir agendamento: ${error.message}`);
        showNotification('Erro ao excluir: ' + error.message, true);
    }
}

function editAppointment(id) {
    try {
        const appointment = appointments.find(a => a.id === id);
        if (appointment) {
            loadFormData(appointment);
            document.getElementById('statusGroup').style.display = 'block';
            showNotification('Agendamento carregado para edição!');
        }
    } catch (error) {
        console.error('Erro ao editar agendamento:', error);
        errorLogs.push(`[${new Date().toISOString()}] Erro ao editar agendamento: ${error.message}`);
        showNotification('Erro ao editar: ' + error.message, true);
    }
}

function viewAppointment(id) {
    try {
        const appointment = appointments.find(a => a.id === id);
        if (appointment) {
            alert(JSON.stringify(appointment, null, 2));
            showNotification('Detalhes do agendamento exibidos!');
        }
    } catch (error) {
        console.error('Erro ao visualizar agendamento:', error);
        errorLogs.push(`[${new Date().toISOString()}] Erro ao visualizar agendamento: ${error.message}`);
        showNotification('Erro ao visualizar: ' + error.message, true);
    }
}

function shareAppointment(id) {
    try {
        const appointment = appointments.find(a => a.id === id);
        if (appointment) {
            const message = `Agendamento:\nPaciente: ${appointment.nomePaciente}\nTelefone: ${appointment.telefone}\nMédico: ${appointment.nomeMedico}\nData: ${appointment.dataConsulta} às ${appointment.horaConsulta}\nStatus: ${appointment.status}`;
            const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
            window.open(whatsappUrl, '_blank');
            showNotification('Agendamento compartilhado via WhatsApp!');
        }
    } catch (error) {
        console.error('Erro ao compartilhar agendamento:', error);
        errorLogs.push(`[${new Date().toISOString()}] Erro ao compartilhar agendamento: ${error.message}`);
        showNotification('Erro ao compartilhar: ' + error.message, true);
    }
}

// Renderização com Paginação
function renderAppointments() {
    console.log("Renderizando agendamentos...");
    try {
        if (!appointmentsBody || !gridView || !pipelineView || !statusFilter) {
            console.error("Elementos do DOM não encontrados!");
            errorLogs.push(`[${new Date().toISOString()}] Elementos do DOM não encontrados em renderAppointments`);
            showNotification("Erro: Interface não carregada corretamente!", true);
            return;
        }

        let filteredAppointments = statusFilter.value === 'all' ? appointments : appointments.filter(app => app.status === statusFilter.value);

        totalPages = Math.ceil(filteredAppointments.length / itemsPerPage);
        currentPage = Math.min(currentPage, totalPages) || 1;
        const start = (currentPage - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        const paginatedAppointments = filteredAppointments.slice(start, end);

        prevPageBtn.disabled = currentPage === 1;
        nextPageBtn.disabled = currentPage === totalPages || totalPages === 0;
        pageInfo.textContent = `Página ${currentPage} de ${totalPages || 1}`;

        appointmentsBody.innerHTML = '';
        gridView.innerHTML = '';
        pipelineView.querySelectorAll('.column-content').forEach(col => col.innerHTML = '');

        if (currentView === 'pipeline') {
            filteredAppointments.forEach(app => {
                const column = pipelineView.querySelector(`.pipeline-column[data-status="${app.status}"] .column-content`);
                if (column) {
                    const miniCard = document.createElement('div');
                    miniCard.className = 'mini-card';
                    miniCard.draggable = true;
                    miniCard.dataset.id = app.id;
                    miniCard.dataset.status = app.status;
                    miniCard.innerHTML = `
                        <h4>${app.nomePaciente || 'Sem Nome'}</h4>
                        <p>ID: ${app.id || '-'}</p>
                        <p>Médico: ${app.nomeMedico || '-'}</p>
                        <p>Data: ${app.dataConsulta || '-'} às ${app.horaConsulta || '-'}</p>
                        <button class="action-btn view-btn" onclick="toggleDetails(this.parentElement)">Mais Detalhes</button>
                        <div class="card-details" style="display: none;">
                            <p>ID: ${app.id || '-'}</p>
                            <p>Nome: ${app.nomePaciente || '-'}</p>
                            <p>Telefone: ${app.telefone || '-'}</p>
                            <p>Email: ${app.email || '-'}</p>
                            <p>Médico: ${app.nomeMedico || '-'}</p>
                            <p>Local CRM: ${app.localCRM || '-'}</p>
                            <p>Data: ${app.dataConsulta || '-'}</p>
                            <p>Hora: ${app.horaConsulta || '-'}</p>
                            <p>Tipo Cirurgia: ${app.tipoCirurgia || '-'}</p>
                            <p>Procedimentos: ${app.procedimentos || '-'}</p>
                            <p>Feito Por: ${app.agendamentoFeitoPor || '-'}</p>
                            <p>Descrição: ${app.descricao || '-'}</p>
                            <p>Status: ${app.status || '-'}</p>
                            <div class="card-actions">
                                <button class="action-btn edit-btn" onclick="editAppointment('${app.id}')">Editar</button>
                                <button class="action-btn share-btn" onclick="shareAppointment('${app.id}')">WhatsApp</button>
                                <button class="action-btn view-btn" onclick="viewAppointment('${app.id}')">Visualizar</button>
                                <button class="action-btn delete-btn" onclick="deleteAppointment('${app.id}')">Excluir</button>
                            </div>
                        </div>
                    `;
                    column.appendChild(miniCard);
                }
            });
        } else {
            paginatedAppointments.forEach(app => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td><input type="checkbox" class="select-row" data-id="${app.id}"></td>
                    <td>${app.id || '-'}</td>
                    <td>${app.nomePaciente || '-'}</td>
                    <td>${app.telefone || '-'}</td>
                    <td>${app.email || '-'}</td>
                    <td>${app.nomeMedico || '-'}</td>
                    <td>${app.localCRM || '-'}</td>
                    <td>${app.dataConsulta || '-'}</td>
                    <td>${app.horaConsulta || '-'}</td>
                    <td>${app.tipoCirurgia || '-'}</td>
                    <td>${app.procedimentos || '-'}</td>
                    <td>${app.agendamentoFeitoPor || '-'}</td>
                    <td>${app.descricao || '-'}</td>
                    <td>${app.status || '-'}</td>
                    <td class="no-print">
                        <button class="action-btn edit-btn" onclick="editAppointment('${app.id}')">Editar</button>
                        <button class="action-btn share-btn" onclick="shareAppointment('${app.id}')">WhatsApp</button>
                        <button class="action-btn view-btn" onclick="viewAppointment('${app.id}')">Visualizar</button>
                        <button class="action-btn delete-btn" onclick="deleteAppointment('${app.id}')">Excluir</button>
                    </td>
                `;
                appointmentsBody.appendChild(row);

                const card = document.createElement('div');
                card.className = 'card';
                card.innerHTML = `
                    <input type="checkbox" class="select-row" data-id="${app.id}">
                    <h4>${app.nomePaciente || 'Sem Nome'}</h4>
                    <p>ID: ${app.id || '-'}</p>
                    <p>Telefone: ${app.telefone || '-'}</p>
                    <p>Email: ${app.email || '-'}</p>
                    <p>Médico: ${app.nomeMedico || '-'}</p>
                    <p>Local CRM: ${app.localCRM || '-'}</p>
                    <p>Data: ${app.dataConsulta || '-'}</p>
                    <p>Hora: ${app.horaConsulta || '-'}</p>
                    <p>Tipo Cirurgia: ${app.tipoCirurgia || '-'}</p>
                    <p>Procedimentos: ${app.procedimentos || '-'}</p>
                    <p>Feito Por: ${app.agendamentoFeitoPor || '-'}</p>
                    <p>Descrição: ${app.descricao || '-'}</p>
                    <p>Status: ${app.status || '-'}</p>
                    <div class="card-actions">
                        <button class="action-btn edit-btn" onclick="editAppointment('${app.id}')">Editar</button>
                        <button class="action-btn share-btn" onclick="shareAppointment('${app.id}')">WhatsApp</button>
                        <button class="action-btn view-btn" onclick="viewAppointment('${app.id}')">Visualizar</button>
                        <button class="action-btn delete-btn" onclick="deleteAppointment('${app.id}')">Excluir</button>
                    </div>
                `;
                gridView.appendChild(card);
            });
        }

        document.getElementById('appointmentsTable').classList.toggle('active', currentView === 'list');
        gridView.classList.toggle('active', currentView === 'grid');
        pipelineView.classList.toggle('active', currentView === 'pipeline');

        pipelineView.querySelectorAll('.mini-card').forEach(card => {
            card.addEventListener('dragstart', handleDragStart);
            card.addEventListener('dragend', handleDragEnd);
            card.addEventListener('click', (e) => {
                if (!e.target.classList.contains('action-btn')) {
                    actionBox.style.display = 'block';
                    actionBox.dataset.id = card.dataset.id;
                    showNotification('Ações do card abertas!');
                }
            });
        });

        pipelineView.querySelectorAll('.pipeline-column').forEach(column => {
            column.addEventListener('dragover', handleDragOver);
            column.addEventListener('drop', handleDrop);
        });

        showNotification('Agendamentos renderizados!');
    } catch (error) {
        console.error('Erro ao renderizar agendamentos:', error);
        errorLogs.push(`[${new Date().toISOString()}] Erro ao renderizar agendamentos: ${error.message}`);
        showNotification('Erro ao renderizar: ' + error.message, true);
    }
}

// Funções de Visualização
function changeView(e) {
    try {
        currentView = e.target.closest('.view-mode').dataset.view;
        document.querySelectorAll('.view-mode').forEach(btn => btn.classList.remove('active'));
        e.target.closest('.view-mode').classList.add('active');
        currentPage = 1;
        renderAppointments();
        saveToFirebase('settings', { currentView, deleteAllPassword, lastSync, theme });
        saveToIndexedDB('settings', { currentView, deleteAllPassword, lastSync, theme });
        showNotification(`Modo de visualização alterado para ${currentView}!`);
    } catch (error) {
        console.error('Erro ao mudar visualização:', error);
        errorLogs.push(`[${new Date().toISOString()}] Erro ao mudar visualização: ${error.message}`);
        showNotification('Erro ao mudar visualização: ' + error.message, true);
    }
}

function showTab(tabId) {
    try {
        document.querySelectorAll('.tab-content').forEach(tab => tab.style.display = 'none');
        document.getElementById(tabId).style.display = 'block';
        if (tabId === 'allTab') renderAppointments();
        else if (tabId === 'insightsTab') generateInsights();
    } catch (error) {
        console.error('Erro ao mostrar aba:', error);
        errorLogs.push(`[${new Date().toISOString()}] Erro ao mostrar aba: ${error.message}`);
        showNotification('Erro ao mostrar aba: ' + error.message, true);
    }
}

// Paginação
function changePage(direction) {
    try {
        currentPage += direction;
        renderAppointments();
    } catch (error) {
        console.error('Erro ao mudar página:', error);
        errorLogs.push(`[${new Date().toISOString()}] Erro ao mudar página: ${error.message}`);
        showNotification('Erro ao mudar página: ' + error.message, true);
    }
}

// Selecionar/Desmarcar Todos
function toggleSelectAllItems() {
    try {
        const allChecked = document.querySelectorAll('.select-row').length === document.querySelectorAll('.select-row:checked').length;
        document.querySelectorAll('.select-row').forEach(checkbox => checkbox.checked = !allChecked);
        selectAllBtn.innerHTML = allChecked ? '<i class="fas fa-check-square"></i> Selecionar Todos' : '<i class="fas fa-times-square"></i> Desmarcar Todos';
        showNotification(allChecked ? 'Todos os itens desmarcados!' : 'Todos os itens selecionados!');
    } catch (error) {
        console.error('Erro ao alternar seleção de itens:', error);
        errorLogs.push(`[${new Date().toISOString()}] Erro ao alternar seleção de itens: ${error.message}`);
        showNotification('Erro ao alternar seleção: ' + error.message, true);
    }
}

function toggleSelectAll(e) {
    try {
        document.querySelectorAll('.select-row').forEach(checkbox => checkbox.checked = e.target.checked);
        showNotification(e.target.checked ? 'Todos os itens selecionados!' : 'Seleção removida!');
    } catch (error) {
        console.error('Erro ao alternar seleção total:', error);
        errorLogs.push(`[${new Date().toISOString()}] Erro ao alternar seleção total: ${error.message}`);
        showNotification('Erro ao alternar seleção: ' + error.message, true);
    }
}

// Drag and Drop
function handleDragStart(e) {
    try {
        draggedCard = e.target;
        e.dataTransfer.setData('text/plain', draggedCard.dataset.id);
        setTimeout(() => draggedCard.classList.add('dragging'), 0);
        showNotification('Arrastando card...');
    } catch (error) {
        console.error('Erro ao iniciar arrastar:', error);
        errorLogs.push(`[${new Date().toISOString()}] Erro ao iniciar arrastar: ${error.message}`);
        showNotification('Erro ao iniciar arrastar: ' + error.message, true);
    }
}

function handleDragEnd(e) {
    try {
        draggedCard.classList.remove('dragging');
        draggedCard = null;
        showNotification('Arrastar concluído!');
    } catch (error) {
        console.error('Erro ao finalizar arrastar:', error);
        errorLogs.push(`[${new Date().toISOString()}] Erro ao finalizar arrastar: ${error.message}`);
        showNotification('Erro ao finalizar arrastar: ' + error.message, true);
    }
}

function handleDragOver(e) {
    try {
        e.preventDefault();
    } catch (error) {
        console.error('Erro ao passar sobre arrastar:', error);
        errorLogs.push(`[${new Date().toISOString()}] Erro ao passar sobre arrastar: ${error.message}`);
    }
}

async function handleDrop(e) {
    e.preventDefault();
    try {
        const id = e.dataTransfer.getData('text/plain');
        const newStatus = e.currentTarget.dataset.status;
        const appointment = appointments.find(app => app.id === id);
        if (appointment && appointment.status !== newStatus) {
            appointment.status = newStatus;
            await saveToFirebase('appointments', appointment);
            await saveToIndexedDB('appointments', appointments);
            renderAppointments();
            showNotification(`Agendamento movido para "${newStatus}" com sucesso!`);
        }
    } catch (error) {
        console.error('Erro ao soltar card:', error);
        errorLogs.push(`[${new Date().toISOString()}] Erro ao soltar card: ${error.message}`);
        showNotification('Erro ao mover agendamento: ' + error.message, true);
    }
}

async function moveCard(newStatus) {
    try {
        const id = actionBox.dataset.id;
        const appointment = appointments.find(app => app.id === id);
        if (appointment && appointment.status !== newStatus) {
            appointment.status = newStatus;
            await saveToFirebase('appointments', appointment);
            await saveToIndexedDB('appointments', appointments);
            renderAppointments();
            actionBox.style.display = 'none';
            showNotification(`Agendamento movido para "${newStatus}" com sucesso!`);
        }
    } catch (error) {
        console.error('Erro ao mover card:', error);
        errorLogs.push(`[${new Date().toISOString()}] Erro ao mover card: ${error.message}`);
        showNotification('Erro ao mover agendamento: ' + error.message, true);
    }
}

function toggleDetails(card) {
    try {
        const details = card.querySelector('.card-details');
        details.style.display = details.style.display === 'none' ? 'block' : 'none';
        showNotification(details.style.display === 'block' ? 'Detalhes exibidos!' : 'Detalhes ocultados!');
    } catch (error) {
        console.error('Erro ao alternar detalhes:', error);
        errorLogs.push(`[${new Date().toISOString()}] Erro ao alternar detalhes: ${error.message}`);
        showNotification('Erro ao alternar detalhes: ' + error.message, true);
    }
}

// Funções de Modal
function openMedicoModal() {
    try {
        medicoModal.style.display = 'block';
        updateMedicosList();
        showNotification('Modal de médicos aberto!');
    } catch (error) {
        console.error('Erro ao abrir modal de médicos:', error);
        errorLogs.push(`[${new Date().toISOString()}] Erro ao abrir modal de médicos: ${error.message}`);
        showNotification('Erro ao abrir modal: ' + error.message, true);
    }
}

function closeMedicoModal() {
    try {
        medicoModal.style.display = 'none';
        showNotification('Modal de médicos fechado!');
    } catch (error) {
        console.error('Erro ao fechar modal de médicos:', error);
        errorLogs.push(`[${new Date().toISOString()}] Erro ao fechar modal de médicos: ${error.message}`);
        showNotification('Erro ao fechar modal: ' + error.message, true);
    }
}

async function saveMedico() {
    try {
        const nome = document.getElementById('novoMedicoNome').value.trim();
        const crm = document.getElementById('novoMedicoCRM').value.trim();
        if (nome) {
            const medico = { nome, crm: crm || '', id: Date.now().toString() };
            medicos.push(medico);
            await saveToFirebase('medicos', medico);
            await saveToIndexedDB('medicos', medicos);
            updateMedicosList();
            document.getElementById('novoMedicoNome').value = '';
            document.getElementById('novoMedicoCRM').value = '';
            closeMedicoModal();
            showNotification('Médico cadastrado com sucesso!');
        } else {
            showNotification('Por favor, insira o nome do médico!', true);
        }
    } catch (error) {
        console.error('Erro ao salvar médico:', error);
        errorLogs.push(`[${new Date().toISOString()}] Erro ao salvar médico: ${error.message}`);
        showNotification('Erro ao salvar médico: ' + error.message, true);
    }
}

function updateMedicosList() {
    try {
        const medicoList = document.getElementById('medicosList');
        if (!medicoList || !medicosListDisplay) return;
        medicosListDisplay.innerHTML = '';
        medicoList.innerHTML = '';
        medicos.forEach((medico, index) => {
            const option = document.createElement('option');
            option.value = medico.nome;
            medicoList.appendChild(option);

            const li = document.createElement('li');
            li.innerHTML = `${medico.nome} ${medico.crm ? `(${medico.crm})` : ''} 
                <button class="delete-medico-btn" onclick="deleteMedico(${index})">Excluir</button>`;
            medicosListDisplay.appendChild(li);
        });
    } catch (error) {
        console.error('Erro ao atualizar lista de médicos:', error);
        errorLogs.push(`[${new Date().toISOString()}] Erro ao atualizar lista de médicos: ${error.message}`);
        showNotification('Erro ao atualizar lista: ' + error.message, true);
    }
}

async function deleteMedico(index) {
    try {
        if (confirm('Tem certeza que deseja excluir este médico?')) {
            const medico = medicos[index];
            medicos.splice(index, 1);
            await deleteFromFirebase('medicos', medico.id);
            await saveToIndexedDB('medicos', medicos);
            updateMedicosList();
            showNotification('Médico excluído com sucesso!');
        }
    } catch (error) {
        console.error('Erro ao excluir médico:', error);
        errorLogs.push(`[${new Date().toISOString()}] Erro ao excluir médico: ${error.message}`);
        showNotification('Erro ao excluir médico: ' + error.message, true);
    }
}

function openDeleteAllModal() {
    try {
        deleteAllModal.style.display = 'block';
        showNotification('Modal de exclusão aberto!');
    } catch (error) {
        console.error('Erro ao abrir modal de exclusão:', error);
        errorLogs.push(`[${new Date().toISOString()}] Erro ao abrir modal de exclusão: ${error.message}`);
        showNotification('Erro ao abrir modal: ' + error.message, true);
    }
}

function closeDeleteAllModal() {
    try {
        deleteAllModal.style.display = 'none';
        showNotification('Modal de exclusão fechado!');
    } catch (error) {
        console.error('Erro ao fechar modal de exclusão:', error);
        errorLogs.push(`[${new Date().toISOString()}] Erro ao fechar modal de exclusão: ${error.message}`);
        showNotification('Erro ao fechar modal: ' + error.message, true);
    }
}

async function confirmDeleteAll() {
    try {
        const password = document.getElementById('deletePassword').value;
        if (password === deleteAllPassword) {
            appointments = [];
            await deleteAllFromFirebase('appointments');
            await saveToIndexedDB('appointments', appointments);
            renderAppointments();
            closeDeleteAllModal();
            showNotification('Todos os agendamentos foram excluídos!');
        } else {
            showNotification('Senha incorreta!', true);
        }
    } catch (error) {
        console.error('Erro ao confirmar exclusão de todos:', error);
        errorLogs.push(`[${new Date().toISOString()}] Erro ao confirmar exclusão de todos: ${error.message}`);
        showNotification('Erro ao excluir todos: ' + error.message, true);
    }
}

function openSortFilterModal() {
    try {
        sortFilterModal.style.display = 'block';
        showNotification('Modal de filtros aberto!');
    } catch (error) {
        console.error('Erro ao abrir modal de filtros:', error);
        errorLogs.push(`[${new Date().toISOString()}] Erro ao abrir modal de filtros: ${error.message}`);
        showNotification('Erro ao abrir modal: ' + error.message, true);
    }
}

function closeSortFilterModal() {
    try {
        sortFilterModal.style.display = 'none';
        showNotification('Modal de filtros fechado!');
    } catch (error) {
        console.error('Erro ao fechar modal de filtros:', error);
        errorLogs.push(`[${new Date().toISOString()}] Erro ao fechar modal de filtros: ${error.message}`);
        showNotification('Erro ao fechar modal: ' + error.message, true);
    }
}

function applySortFilter() {
    try {
        const sortType = document.getElementById('sortType').value;
        let sortedAppointments = [...appointments];
        switch (sortType) {
            case 'nameAZ': sortedAppointments.sort((a, b) => (a.nomePaciente || '').localeCompare(b.nomePaciente || '')); break;
            case 'recent': sortedAppointments.sort((a, b) => new Date(b.dataConsulta) - new Date(a.dataConsulta)); break;
            case 'oldest': sortedAppointments.sort((a, b) => new Date(a.dataConsulta) - new Date(b.dataConsulta)); break;
            case 'phone': sortedAppointments.sort((a, b) => (a.telefone || '').localeCompare(b.telefone || '')); break;
            case 'date': sortedAppointments.sort((a, b) => (a.dataConsulta || '').localeCompare(b.dataConsulta || '')); break;
            case 'doctor': sortedAppointments.sort((a, b) => (a.nomeMedico || '').localeCompare(b.nomeMedico || '')); break;
            case 'month': sortedAppointments.sort((a, b) => new Date(a.dataConsulta).getMonth() - new Date(b.dataConsulta).getMonth()); break;
            case 'year': sortedAppointments.sort((a, b) => new Date(a.dataConsulta).getFullYear() - new Date(b.dataConsulta).getFullYear()); break;
        }
        appointments = sortedAppointments;
        currentPage = 1;
        renderAppointments();
        closeSortFilterModal();
        showNotification('Filtro de ordenação aplicado!');
    } catch (error) {
        console.error('Erro ao aplicar filtro de ordenação:', error);
        errorLogs.push(`[${new Date().toISOString()}] Erro ao aplicar filtro de ordenação: ${error.message}`);
        showNotification('Erro ao aplicar filtro: ' + error.message, true);
    }
}

function openSettingsModal() {
    try {
        settingsModal.style.display = 'block';
        loadThemeSettings();
        updateUsersList();
        showNotification('Modal de configurações aberto!');
    } catch (error) {
        console.error('Erro ao abrir modal de configurações:', error);
        errorLogs.push(`[${new Date().toISOString()}] Erro ao abrir modal de configurações: ${error.message}`);
        showNotification('Erro ao abrir modal: ' + error.message, true);
    }
}

function closeModal(modal) {
    try {
        modal.style.display = 'none';
        showNotification('Modal fechado!');
    } catch (error) {
        console.error('Erro ao fechar modal:', error);
        errorLogs.push(`[${new Date().toISOString()}] Erro ao fechar modal: ${error.message}`);
        showNotification('Erro ao fechar modal: ' + error.message, true);
    }
}

async function saveTheme() {
    try {
        theme = {
            bodyBgColor: document.getElementById('bodyBgColor').value,
            cardBgColor: document.getElementById('cardBgColor').value,
            formBgColor: document.getElementById('formBgColor').value,
            textColor: document.getElementById('textColor').value,
            borderColor: document.getElementById('borderColor').value,
            cardBorderColor: document.getElementById('cardBorderColor').value
        };
        const newDeleteAllPassword = document.getElementById('deleteAllPassword').value;
        if (newDeleteAllPassword) deleteAllPassword = newDeleteAllPassword;
        await saveToFirebase('settings', { theme, deleteAllPassword, currentView, lastSync });
        await saveToIndexedDB('settings', { currentView, deleteAllPassword, lastSync, theme });
        applyTheme();
        closeModal(settingsModal);
        showNotification('Configurações de tema salvas!');
    } catch (error) {
        console.error('Erro ao salvar tema:', error);
        errorLogs.push(`[${new Date().toISOString()}] Erro ao salvar tema: ${error.message}`);
        showNotification('Erro ao salvar configurações: ' + error.message, true);
    }
}

function resetTheme() {
    try {
        theme = {};
        document.getElementById('bodyBgColor').value = '#f0f4f8';
        document.getElementById('cardBgColor').value = '#ffffff';
        document.getElementById('formBgColor').value = '#ffffff';
        document.getElementById('textColor').value = '#1f2937';
        document.getElementById('borderColor').value = '#1e40af';
        document.getElementById('cardBorderColor').value = '#d9d9ec';
        applyTheme();
        saveToFirebase('settings', { currentView, deleteAllPassword, lastSync, theme });
        saveToIndexedDB('settings', { currentView, deleteAllPassword, lastSync, theme });
        showNotification('Tema restaurado para padrão!');
    } catch (error) {
        console.error('Erro ao resetar tema:', error);
        errorLogs.push(`[${new Date().toISOString()}] Erro ao resetar tema: ${error.message}`);
        showNotification('Erro ao resetar tema: ' + error.message, true);
    }
}

function loadThemeSettings() {
    try {
        const bodyBgColor = document.getElementById('bodyBgColor');
        const cardBgColor = document.getElementById('cardBgColor');
        const formBgColor = document.getElementById('formBgColor');
        const textColor = document.getElementById('textColor');
        const borderColor = document.getElementById('borderColor');
        const cardBorderColor = document.getElementById('cardBorderColor');

        if (bodyBgColor) bodyBgColor.value = theme.bodyBgColor || '#f0f4f8';
        if (cardBgColor) cardBgColor.value = theme.cardBgColor || '#ffffff';
        if (formBgColor) formBgColor.value = theme.formBgColor || '#ffffff';
        if (textColor) textColor.value = theme.textColor || '#1f2937';
        if (borderColor) borderColor.value = theme.borderColor || '#1e40af';
        if (cardBorderColor) cardBorderColor.value = theme.cardBorderColor || '#d9d9ec';
    } catch (error) {
        console.error('Erro ao carregar configurações de tema:', error);
        errorLogs.push(`[${new Date().toISOString()}] Erro ao carregar configurações de tema: ${error.message}`);
        showNotification('Erro ao carregar tema: ' + error.message, true);
    }
}

function applyTheme() {
    try {
        document.body.style.backgroundColor = theme.bodyBgColor || '#f0f4f8';
        document.querySelectorAll('.card').forEach(card => {
            card.style.backgroundColor = theme.cardBgColor || '#ffffff';
            card.style.borderColor = theme.cardBorderColor || '#d9d9ec';
        });
        document.querySelector('.form-section').style.backgroundColor = theme.formBgColor || '#ffffff';
        document.body.style.color = theme.textColor || '#1f2937';
        document.querySelectorAll('button').forEach(btn => btn.style.borderColor = theme.borderColor || '#1e40af');
    } catch (error) {
        console.error('Erro ao aplicar tema:', error);
        errorLogs.push(`[${new Date().toISOString()}] Erro ao aplicar tema: ${error.message}`);
        showNotification('Erro ao aplicar tema: ' + error.message, true);
    }
}

// Funções de Usuários
async function addUser() {
    try {
        const username = document.getElementById('newUsername').value.trim();
        const password = document.getElementById('newPassword').value.trim();
        if (username && password) {
            const user = { username, password, id: Date.now().toString() };
            users.push(user);
            await saveToFirebase('users', user);
            await saveToIndexedDB('users', users);
            updateUsersList();
            document.getElementById('newUsername').value = '';
            document.getElementById('newPassword').value = '';
            showNotification('Usuário adicionado com sucesso!');
        } else {
            showNotification('Por favor, preencha usuário e senha!', true);
        }
    } catch (error) {
        console.error('Erro ao adicionar usuário:', error);
        errorLogs.push(`[${new Date().toISOString()}] Erro ao adicionar usuário: ${error.message}`);
        showNotification('Erro ao adicionar usuário: ' + error.message, true);
    }
}

function updateUsersList() {
    try {
        if (!usersList) return;
        usersList.innerHTML = '';
        users.forEach((user, index) => {
            const li = document.createElement('li');
            li.innerHTML = `${user.username} <button onclick="deleteUser(${index})">Excluir</button>`;
            usersList.appendChild(li);
        });
    } catch (error) {
        console.error('Erro ao atualizar lista de usuários:', error);
        errorLogs.push(`[${new Date().toISOString()}] Erro ao atualizar lista de usuários: ${error.message}`);
        showNotification('Erro ao atualizar lista: ' + error.message, true);
    }
}

async function deleteUser(index) {
    try {
        if (confirm('Tem certeza que deseja excluir este usuário?')) {
            const user = users[index];
            users.splice(index, 1);
            await deleteFromFirebase('users', user.id);
            await saveToIndexedDB('users', users);
            updateUsersList();
            showNotification('Usuário excluído com sucesso!');
        }
    } catch (error) {
        console.error('Erro ao excluir usuário:', error);
        errorLogs.push(`[${new Date().toISOString()}] Erro ao excluir usuário: ${error.message}`);
        showNotification('Erro ao excluir usuário: ' + error.message, true);
    }
}

// Funções de Formulário
function loadFormData(appointment = {}) {
    try {
        document.getElementById('nomePaciente').value = appointment.nomePaciente || '';
        document.getElementById('telefone').value = appointment.telefone || '';
        document.getElementById('email').value = appointment.email || '';
        document.getElementById('nomeMedico').value = appointment.nomeMedico || '';
        document.getElementById('localCRM').value = appointment.localCRM || '';
        document.getElementById('dataConsulta').value = appointment.dataConsulta || '';
        document.getElementById('horaConsulta').value = appointment.horaConsulta || '';
        document.getElementById('tipoCirurgia').value = appointment.tipoCirurgia || '';
        document.getElementById('procedimentos').value = appointment.procedimentos || '';
        document.getElementById('agendamentoFeitoPor').value = appointment.agendamentoFeitoPor || '';
        document.getElementById('descricao').value = appointment.descricao || '';
        document.getElementById('status').value = appointment.status || 'Aguardando Atendimento';
        appointmentForm.dataset.id = appointment.id || '';
    } catch (error) {
        console.error('Erro ao carregar dados do formulário:', error);
        errorLogs.push(`[${new Date().toISOString()}] Erro ao carregar dados do formulário: ${error.message}`);
        showNotification('Erro ao carregar formulário: ' + error.message, true);
    }
}

function resetForm() {
    try {
        appointmentForm.reset();
        delete appointmentForm.dataset.id;
        document.getElementById('statusGroup').style.display = 'none';
        showNotification('Formulário limpo!');
    } catch (error) {
        console.error('Erro ao resetar formulário:', error);
        errorLogs.push(`[${new Date().toISOString()}] Erro ao resetar formulário: ${error.message}`);
        showNotification('Erro ao resetar formulário: ' + error.message, true);
    }
}

function clearFilters() {
    try {
        statusFilter.value = 'all';
        document.getElementById('sortType') && (document.getElementById('sortType').value = 'nameAZ');
        currentPage = 1;
        renderAppointments();
        showNotification('Filtros limpos!');
    } catch (error) {
        console.error('Erro ao limpar filtros:', error);
        errorLogs.push(`[${new Date().toISOString()}] Erro ao limpar filtros: ${error.message}`);
        showNotification('Erro ao limpar filtros: ' + error.message, true);
    }
}

// Impressão Unificada (mantida como estava)
function printAppointments() {
    try {
        const selectedIds = Array.from(document.querySelectorAll('.select-row:checked')).map(cb => cb.dataset.id);
        if (selectedIds.length === 0) {
            showNotification('Nenhum item selecionado para impressão!', true);
            return;
        }

        const selectedAppointments = appointments.filter(app => selectedIds.includes(app.id));
        const printWindow = window.open('', '_blank');

        if (!printWindow) {
            showNotification('Erro ao abrir janela de impressão. Verifique bloqueadores de pop-up!', true);
            return;
        }

        if (currentView === 'list') {
            printWindow.document.write(`
                <html>
                <head>
                    <title>Impressão - Lista de Agendamentos</title>
                    <style>
                        @page { size: landscape; margin: 10mm; }
                        body { font-family: Arial, sans-serif; margin: 0; padding: 10mm; }
                        h1 { text-align: center; font-size: 18px; margin-bottom: 10px; }
                        table { width: 100%; border-collapse: collapse; font-size: 12px; }
                        th, td { border: 1px solid #333; padding: 8px; text-align: left; }
                        th { background-color: #e9ecef; font-weight: bold; }
                        tr:nth-child(even) { background-color: #f9f9f9; }
                        .no-print { display: none; }
                    </style>
                </head>
                <body>
                    <h1>Lista de Agendamentos</h1>
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Paciente</th>
                                <th>Telefone</th>
                                <th>Email</th>
                                <th>Médico</th>
                                <th>Local CRM</th>
                                <th>Data</th>
                                <th>Hora</th>
                                <th>Tipo Cirurgia</th>
                                <th>Procedimentos</th>
                                <th>Feito Por</th>
                                <th>Descrição</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${selectedAppointments.map(app => `
                                <tr>
                                    <td>${app.id || '-'}</td>
                                    <td>${app.nomePaciente || '-'}</td>
                                    <td>${app.telefone || '-'}</td>
                                    <td>${app.email || '-'}</td>
                                    <td>${app.nomeMedico || '-'}</td>
                                    <td>${app.localCRM || '-'}</td>
                                    <td>${app.dataConsulta || '-'}</td>
                                    <td>${app.horaConsulta || '-'}</td>
                                    <td>${app.tipoCirurgia || '-'}</td>
                                    <td>${app.procedimentos || '-'}</td>
                                    <td>${app.agendamentoFeitoPor || '-'}</td>
                                    <td>${app.descricao || '-'}</td>
                                    <td>${app.status || '-'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </body>
                </html>
            `);
        } else if (currentView === 'grid') {
            printWindow.document.write(`
                <html>
                <head>
                    <title>Impressão - Grid de Agendamentos</title>
                    <style>
                        @page { size: landscape; margin: 10mm; }
                        body { font-family: Arial, sans-serif; margin: 0; padding: 10mm; }
                        h1 { text-align: center; font-size: 18px; margin-bottom: 10px; }
                        .card-container { display: flex; flex-wrap: wrap; gap: 15px; }
                        .card { border: 1px solid #333; padding: 15px; width: 300px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); background-color: #fff; page-break-inside: avoid; }
                        .card h4 { font-size: 16px; margin-bottom: 10px; color: #007bff; }
                        .card p { font-size: 12px; margin: 5px 0; }
                        .card p strong { color: #333; }
                    </style>
                </head>
                <body>
                    <h1>Grid de Agendamentos</h1>
                    <div class="card-container">
                        ${selectedAppointments.map(app => `
                            <div class="card">
                                <h4>${app.nomePaciente || 'Sem Nome'}</h4>
                                <p><strong>ID:</strong> ${app.id || '-'}</p>
                                <p><strong>Telefone:</strong> ${app.telefone || '-'}</p>
                                <p><strong>Email:</strong> ${app.email || '-'}</p>
                                <p><strong>Médico:</strong> ${app.nomeMedico || '-'}</p>
                                <p><strong>Local CRM:</strong> ${app.localCRM || '-'}</p>
                                <p><strong>Data:</strong> ${app.dataConsulta || '-'}</p>
                                <p><strong>Hora:</strong> ${app.horaConsulta || '-'}</p>
                                <p><strong>Tipo Cirurgia:</strong> ${app.tipoCirurgia || '-'}</p>
                                <p><strong>Procedimentos:</strong> ${app.procedimentos || '-'}</p>
                                <p><strong>Feito Por:</strong> ${app.agendamentoFeitoPor || '-'}</p>
                                <p><strong>Descrição:</strong> ${app.descricao || '-'}</p>
                                <p><strong>Status:</strong> ${app.status || '-'}</p>
                            </div>
                        `).join('')}
                    </div>
                </body>
                </html>
            `);
        } else {
            printWindow.close();
            showNotification('Impressão não suportada no modo Pipeline!', true);
            return;
        }

        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        showNotification(`Impressão iniciada no modo ${currentView === 'list' ? 'Lista' : 'Grid'}!`);
        setTimeout(() => printWindow.close(), 1000);
    } catch (error) {
        console.error('Erro ao gerar impressão:', error);
        errorLogs.push(`[${new Date().toISOString()}] Erro ao gerar impressão: ${error.message}`);
        showNotification('Erro ao gerar impressão: ' + error.message, true);
    }
}

// Função de Exportação para Excel
function exportToExcel() {
    try {
        console.log("Função exportToExcel chamada!");
        if (typeof XLSX === 'undefined') {
            console.error('Biblioteca SheetJS não carregada!');
            errorLogs.push(`[${new Date().toISOString()}] Biblioteca SheetJS não carregada`);
            showNotification('Erro: Biblioteca SheetJS não carregada. Verifique o script no HTML!', true);
            return;
        }

        const selectedIds = Array.from(document.querySelectorAll('.select-row:checked')).map(cb => cb.dataset.id);
        let exportData;

        if (selectedIds.length > 0) {
            exportData = appointments.filter(app => selectedIds.includes(app.id));
            showNotification(`Exportando ${selectedIds.length} agendamentos selecionados...`);
        } else {
            exportData = statusFilter.value === 'all' ? appointments : appointments.filter(app => app.status === statusFilter.value);
            showNotification(`Exportando todos os agendamentos visíveis (${exportData.length})...`);
        }

        if (exportData.length === 0) {
            showNotification('Nenhum agendamento disponível para exportar!', true);
            return;
        }

        const headers = [
            'ID', 'Paciente', 'Telefone', 'Email', 'Médico', 'Local CRM',
            'Data', 'Hora', 'Tipo Cirurgia', 'Procedimentos', 'Feito Por', 'Descrição', 'Status'
        ];

        const data = [headers, ...exportData.map(app => [
            app.id || '-',
            app.nomePaciente || '-',
            app.telefone || '-',
            app.email || '-',
            app.nomeMedico || '-',
            app.localCRM || '-',
            app.dataConsulta || '-',
            app.horaConsulta || '-',
            app.tipoCirurgia || '-',
            app.procedimentos || '-',
            app.agendamentoFeitoPor || '-',
            app.descricao || '-',
            app.status || '-'
        ])];

        const ws = XLSX.utils.aoa_to_sheet(data);
        const colWidths = headers.map((header, i) => ({
            wch: Math.max(
                header.length,
                ...exportData.map(app => {
                    const value = data[1 + exportData.indexOf(app)][i] || '';
                    return value.toString().length;
                })
            ) + 2
        }));
        ws['!cols'] = colWidths;

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Agendamentos');

        const fileName = `agendamentos_${new Date().toISOString().slice(0,10)}.xlsx`;
        XLSX.writeFile(wb, fileName);

        showNotification('Planilha Excel exportada com sucesso!');
    } catch (error) {
        console.error('Erro ao exportar para Excel:', error);
        errorLogs.push(`[${new Date().toISOString()}] Erro ao exportar para Excel: ${error.message}`);
        showNotification('Erro ao exportar para Excel: ' + error.message, true);
    }
}

// Funções de Relatórios
async function generateReport() {
    try {
        const reportType = document.getElementById('reportType').value;
        const reportMonth = document.getElementById('reportMonth').value;
        const reportYear = document.getElementById('reportYear').value;
        const reportDoctor = document.getElementById('reportDoctor').value;

        let filteredAppointments = [...appointments];
        if (reportMonth) {
            const [year, month] = reportMonth.split('-');
            filteredAppointments = filteredAppointments.filter(app => {
                const date = new Date(app.dataConsulta);
                return date.getFullYear() === parseInt(year) && date.getMonth() === parseInt(month) - 1;
            });
        }
        if (reportYear) {
            filteredAppointments = filteredAppointments.filter(app => new Date(app.dataConsulta).getFullYear() === parseInt(reportYear));
        }
        if (reportDoctor) {
            filteredAppointments = filteredAppointments.filter(app => app.nomeMedico === reportDoctor);
        }

        switch (reportType) {
            case 'byName': filteredAppointments.sort((a, b) => (a.nomePaciente || '').localeCompare(b.nomePaciente || '')); break;
            case 'byRecent': filteredAppointments.sort((a, b) => new Date(b.dataConsulta) - new Date(a.dataConsulta)); break;
            case 'byOldest': filteredAppointments.sort((a, b) => new Date(a.dataConsulta) - new Date(b.dataConsulta)); break;
            case 'byPhone': filteredAppointments.sort((a, b) => (a.telefone || '').localeCompare(b.telefone || '')); break;
            case 'byDate': filteredAppointments.sort((a, b) => (a.dataConsulta || '').localeCompare(b.dataConsulta || '')); break;
            case 'byDoctor': filteredAppointments.sort((a, b) => (a.nomeMedico || '').localeCompare(b.nomeMedico || '')); break;
            case 'byMonth': filteredAppointments.sort((a, b) => new Date(a.dataConsulta).getMonth() - new Date(b.dataConsulta).getMonth()); break;
            case 'byYear': filteredAppointments.sort((a, b) => new Date(a.dataConsulta).getFullYear() - new Date(b.dataConsulta).getFullYear()); break;
        }

        const reportBody = document.getElementById('reportBody');
        const reportGrid = document.getElementById('reportGrid');
        reportBody.innerHTML = '';
        reportGrid.innerHTML = '';

        filteredAppointments.forEach(app => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${app.id || '-'}</td>
                <td>${app.nomePaciente || '-'}</td>
                <td>${app.telefone || '-'}</td>
                <td>${app.email || '-'}</td>
                <td>${app.nomeMedico || '-'}</td>
                <td>${app.localCRM || '-'}</td>
                <td>${app.dataConsulta || '-'}</td>
                <td>${app.horaConsulta || '-'}</td>
                <td>${app.tipoCirurgia || '-'}</td>
                <td>${app.procedimentos || '-'}</td>
                <td>${app.agendamentoFeitoPor || '-'}</td>
                <td>${app.descricao || '-'}</td>
                <td>${app.status || '-'}</td>
            `;
            reportBody.appendChild(row);

            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `
                <h4>${app.nomePaciente || 'Sem Nome'}</h4>
                <p>ID: ${app.id || '-'}</p>
                <p>Telefone: ${app.telefone || '-'}</p>
                <p>Email: ${app.email || '-'}</p>
                <p>Médico: ${app.nomeMedico || '-'}</p>
                <p>Local CRM: ${app.localCRM || '-'}</p>
                <p>Data: ${app.dataConsulta || '-'}</p>
                <p>Hora: ${app.horaConsulta || '-'}</p>
                <p>Tipo Cirurgia: ${app.tipoCirurgia || '-'}</p>
                <p>Procedimentos: ${app.procedimentos || '-'}</p>
                <p>Feito Por: ${app.agendamentoFeitoPor || '-'}</p>
                <p>Descrição: ${app.descricao || '-'}</p>
                <p>Status: ${app.status || '-'}</p>
            `;
            reportGrid.appendChild(card);
        });

        await saveToFirebase('reports', { id: Date.now().toString(), type: reportType, data: filteredAppointments });
        showNotification('Relatório gerado e salvo no Firebase com sucesso!');
    } catch (error) {
        console.error('Erro ao gerar relatório:', error);
        errorLogs.push(`[${new Date().toISOString()}] Erro ao gerar relatório: ${error.message}`);
        showNotification('Erro ao gerar relatório: ' + error.message, true);
    }
}

function toggleReportView(view) {
    try {
        document.getElementById('reportResult').style.display = view === 'list' ? 'block' : 'none';
        document.getElementById('reportGrid').style.display = view === 'grid' ? 'grid' : 'none';
        document.querySelectorAll('#reportsTab .view-mode').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`#reportsTab .view-mode[data-view="${view}"]`).classList.add('active');
        showNotification(`Visualização de relatório alterada para ${view}!`);
    } catch (error) {
        console.error('Erro ao alternar visualização de relatório:', error);
        errorLogs.push(`[${new Date().toISOString()}] Erro ao alternar visualização de relatório: ${error.message}`);
        showNotification('Erro ao alternar visualização: ' + error.message, true);
    }
}

// Funções de Insights
async function generateInsights() {
    try {
        const insightsCards = document.getElementById('insightsCards');
        insightsCards.innerHTML = '';

        const totalAppointments = appointments.length;
        const statusCount = {
            'Aguardando Atendimento': 0,
            'Atendido': 0,
            'Reagendado': 0,
            'Cancelado': 0
        };
        appointments.forEach(app => statusCount[app.status]++);

        const doctorsCount = {};
        appointments.forEach(app => doctorsCount[app.nomeMedico] = (doctorsCount[app.nomeMedico] || 0) + 1);

        const totalCard = document.createElement('div');
        totalCard.className = 'insights-card';
        totalCard.innerHTML = `<h4><i class="fas fa-calendar-check"></i> Total de Agendamentos</h4><p>${totalAppointments} agendamentos registrados.</p>`;
        insightsCards.appendChild(totalCard);

        const statusCard = document.createElement('div');
        statusCard.className = 'insights-card';
        statusCard.innerHTML = `<h4><i class="fas fa-chart-pie"></i> Status dos Agendamentos</h4><ul>` +
            Object.entries(statusCount).map(([status, count]) => `<li>${status}: ${count}</li>`).join('') + `</ul>`;
        insightsCards.appendChild(statusCard);

        const doctorsCard = document.createElement('div');
        doctorsCard.className = 'insights-card';
        doctorsCard.innerHTML = `<h4><i class="fas fa-user-md"></i> Agendamentos por Médico</h4><ul>` +
            Object.entries(doctorsCount).map(([doctor, count]) => `<li>${doctor || 'Não especificado'}: ${count}</li>`).join('') + `</ul>`;
        insightsCards.appendChild(doctorsCard);

        const errorLogCard = document.createElement('div');
        errorLogCard.className = 'insights-card error-log-card';
        errorLogCard.innerHTML = `<h4><i class="fas fa-exclamation-triangle"></i> Logs de Erros</h4><ul>` +
            (errorLogs.length ? errorLogs.map(log => `<li>${log}</li>`).join('') : '<li>Nenhum erro registrado.</li>') + `</ul>`;
        insightsCards.appendChild(errorLogCard);

        await saveToFirebase('insights', { id: 'default', totalAppointments, statusCount, doctorsCount, errorLogs });
        showNotification('Insights gerados e salvos no Firebase com sucesso!');
    } catch (error) {
        console.error('Erro ao gerar insights:', error);
        errorLogs.push(`[${new Date().toISOString()}] Erro ao gerar insights: ${error.message}`);
        showNotification('Erro ao gerar insights: ' + error.message, true);
    }
}

// Funções de Backup
function backupLocal() {
    try {
        const data = { appointments, medicos, users, settings: { currentView, deleteAllPassword, lastSync, theme } };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `backup_${new Date().toISOString()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showNotification('Backup local salvo com sucesso!');
    } catch (error) {
        console.error('Erro ao salvar backup local:', error);
        errorLogs.push(`[${new Date().toISOString()}] Erro ao salvar backup local: ${error.message}`);
        showNotification('Erro ao salvar backup local: ' + error.message, true);
    }
}

function restoreLocal() {
    try {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/json';
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) {
                showNotification('Nenhum arquivo selecionado!', true);
                return;
            }

            const progressModal = document.getElementById('progressModal');
            const progressFill = document.getElementById('progressFill');
            const progressText = document.getElementById('progressText');
            progressModal.style.display = 'block';
            let progress = 0;

            // Etapa 1: Ler o arquivo
            progressFill.style.width = '10%';
            progressText.textContent = '10% - Lendo arquivo...';
            const text = await file.text();
            const data = JSON.parse(text);
            console.log("Dados lidos do arquivo JSON:", data);

            if (!data || typeof data !== 'object') {
                showNotification('Arquivo JSON inválido!', true);
                progressModal.style.display = 'none';
                return;
            }

            // Etapa 2: Atribuir dados
            progress += 20;
            progressFill.style.width = `${progress}%`;
            progressText.textContent = `${progress}% - Atribuindo dados...`;
            appointments = Array.isArray(data.appointments) ? data.appointments : [];
            medicos = Array.isArray(data.medicos) ? data.medicos : [];
            users = Array.isArray(data.users) ? data.users : [];
            const settings = data.settings || {};
            currentView = settings.currentView || 'list';
            deleteAllPassword = settings.deleteAllPassword || '1234';
            lastSync = settings.lastSync || 0;
            theme = settings.theme || {};

            // Etapa 3: Salvar no Firebase
            progress += 30;
            progressFill.style.width = `${progress}%`;
            progressText.textContent = `${progress}% - Salvando no Firebase...`;
            await saveToFirebase('appointments', appointments);
            await saveToFirebase('medicos', medicos);
            await saveToFirebase('users', users);
            await saveToFirebase('settings', { currentView, deleteAllPassword, lastSync, theme });

            // Etapa 4: Salvar no IndexedDB
            progress += 30;
            progressFill.style.width = `${progress}%`;
            progressText.textContent = `${progress}% - Salvando no IndexedDB...`;
            await saveToIndexedDB('appointments', appointments);
            await saveToIndexedDB('medicos', medicos);
            await saveToIndexedDB('users', users);
            await saveToIndexedDB('settings', { currentView, deleteAllPassword, lastSync, theme });

            // Etapa 5: Renderizar
            progress = 100;
            progressFill.style.width = '100%';
            progressText.textContent = '100% - Finalizando...';
            renderAppointments();
            updateMedicosList();
            updateUsersList();
            applyTheme();

            setTimeout(() => {
                progressModal.style.display = 'none';
                showNotification('Backup local restaurado com sucesso!');
            }, 500);
        };
        input.click();
    } catch (error) {
        console.error('Erro ao restaurar backup local:', error);
        errorLogs.push(`[${new Date().toISOString()}] Erro ao restaurar backup local: ${error.message}`);
        document.getElementById('progressModal').style.display = 'none';
        showNotification('Erro ao restaurar backup local: ' + error.message, true);
    }
}


// Continuação da função syncLocalWithFirebase
async function syncLocalWithFirebase() {
    const now = Date.now();
    if (now - lastSync > 60000) {
        try {
            const snapshot = await getDocs(collection(db, 'appointments'));
            const firebaseAppointments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            appointments = mergeData(appointments, firebaseAppointments, 'id');
            await saveToIndexedDB('appointments', appointments);

            const medicosSnapshot = await getDocs(collection(db, 'medicos'));
            const firebaseMedicos = medicosSnapshot.docs.map(doc => doc.data());
            medicos = mergeData(medicos, firebaseMedicos, 'nome');
            await saveToIndexedDB('medicos', medicos);

            const usersSnapshot = await getDocs(collection(db, 'users'));
            const firebaseUsers = usersSnapshot.docs.map(doc => doc.data());
            users = mergeData(users, firebaseUsers, 'username');
            await saveToIndexedDB('users', users);

            const settingsDoc = await getDoc(doc(db, 'settings', 'default'));
            if (settingsDoc.exists()) {
                const firebaseSettings = settingsDoc.data();
                currentView = firebaseSettings.currentView || 'list';
                deleteAllPassword = firebaseSettings.deleteAllPassword || '1234';
                theme = firebaseSettings.theme || {};
                lastSync = firebaseSettings.lastSync || 0;
                await saveToIndexedDB('settings', { currentView, deleteAllPassword, lastSync, theme });
            }

            lastSync = now;
            await saveToFirebase('settings', { currentView, deleteAllPassword, lastSync, theme });
            showNotification('Dados sincronizados com o Firebase com sucesso!');
        } catch (error) {
            console.error('Erro ao sincronizar com Firebase:', error);
            errorLogs.push(`[${new Date().toISOString()}] Erro ao sincronizar com Firebase: ${error.message}`);
            showNotification('Erro ao sincronizar com Firebase: ' + error.message, true);
        }
    }
}

// Função de Mesclagem de Dados
function mergeData(localData, remoteData, key) {
    try {
        const merged = [...localData];
        remoteData.forEach(remoteItem => {
            const localIndex = merged.findIndex(localItem => localItem[key] === remoteItem[key]);
            if (localIndex === -1) {
                merged.push(remoteItem);
            } else {
                merged[localIndex] = { ...merged[localIndex], ...remoteItem };
            }
        });
        return merged;
    } catch (error) {
        console.error('Erro ao mesclar dados:', error);
        errorLogs.push(`[${new Date().toISOString()}] Erro ao mesclar dados: ${error.message}`);
        return localData; // Retorna dados locais em caso de erro
    }
}

// Funções de Armazenamento no Firebase
async function saveToFirebase(collectionName, data) {
    try {
        if (Array.isArray(data)) {
            const batch = writeBatch(db);
            data.forEach(item => {
                const docId = item.id || Date.now().toString();
                const docRef = doc(db, collectionName, docId);
                batch.set(docRef, item);
            });
            await batch.commit();
            console.log(`Array de dados salvos no Firebase (${collectionName}):`, data);
        } else {
            const docId = data.id || (collectionName === 'settings' || collectionName === 'reports' || collectionName === 'insights' ? 'default' : Date.now().toString());
            await setDoc(doc(db, collectionName, docId), data);
            console.log(`Dados salvos no Firebase (${collectionName}):`, data);
        }
    } catch (error) {
        console.error(`Erro ao salvar no Firebase (${collectionName}):`, error);
        errorLogs.push(`[${new Date().toISOString()}] Erro ao salvar no Firebase (${collectionName}): ${error.message}`);
        throw error;
    }
}

async function deleteFromFirebase(collectionName, id) {
    try {
        await deleteDoc(doc(db, collectionName, id));
        console.log(`Documento excluído do Firebase (${collectionName}/${id})`);
    } catch (error) {
        console.error(`Erro ao excluir do Firebase (${collectionName}/${id}):`, error);
        errorLogs.push(`[${new Date().toISOString()}] Erro ao excluir do Firebase (${collectionName}/${id}): ${error.message}`);
        throw error;
    }
}

async function deleteAllFromFirebase(collectionName) {
    try {
        const snapshot = await getDocs(collection(db, collectionName));
        const batch = writeBatch(db);
        snapshot.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
        console.log(`Todos os documentos excluídos do Firebase (${collectionName})`);
    } catch (error) {
        console.error(`Erro ao excluir todos do Firebase (${collectionName}):`, error);
        errorLogs.push(`[${new Date().toISOString()}] Erro ao excluir todos do Firebase (${collectionName}): ${error.message}`);
        throw error;
    }
}

// Funções de Armazenamento no IndexedDB
async function saveToIndexedDB(storeName, data) {
    try {
        const dbRequest = indexedDB.open('AgendaUnicaDB', DB_VERSION);
        return new Promise((resolve, reject) => {
            dbRequest.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains('appointments')) db.createObjectStore('appointments', { keyPath: 'id' });
                if (!db.objectStoreNames.contains('medicos')) db.createObjectStore('medicos', { keyPath: 'id' });
                if (!db.objectStoreNames.contains('users')) db.createObjectStore('users', { keyPath: 'id' });
                if (!db.objectStoreNames.contains('settings')) db.createObjectStore('settings', { keyPath: 'id' });
            };
            dbRequest.onsuccess = (event) => {
                const db = event.target.result;
                const transaction = db.transaction([storeName], 'readwrite');
                const store = transaction.objectStore(storeName);
                if (Array.isArray(data)) {
                    data.forEach(item => {
                        if (!item.id) item.id = Date.now().toString(); // Garante que cada item tenha um id
                        store.put(item);
                    });
                } else {
                    store.put({ id: 'default', ...data }); // Adiciona id: 'default' para objetos únicos como settings
                }
                transaction.oncomplete = () => {
                    console.log(`Dados salvos no IndexedDB (${storeName}):`, data);
                    resolve();
                };
                transaction.onerror = (e) => reject(e.target.error);
                db.close();
            };
            dbRequest.onerror = (e) => reject(e.target.error);
        });
    } catch (error) {
        console.error(`Erro ao salvar no IndexedDB (${storeName}):`, error);
        errorLogs.push(`[${new Date().toISOString()}] Erro ao salvar no IndexedDB (${storeName}): ${error.message}`);
        throw error;
    }
}

// Função de Navegação
function scrollToStatusSection() {
    try {
        document.getElementById('statusFilterSection').scrollIntoView({ behavior: 'smooth' });
        showNotification('Rolando para seção de status!');
    } catch (error) {
        console.error('Erro ao rolar para seção de status:', error);
        errorLogs.push(`[${new Date().toISOString()}] Erro ao rolar para seção de status: ${error.message}`);
        showNotification('Erro ao rolar para seção: ' + error.message, true);
    }
}

// Função de Notificação
function showNotification(message, isError = false) {
    try {
        if (!notification) return;
        notification.textContent = message;
        notification.className = isError ? 'notification error' : 'notification';
        notification.style.display = 'block';
        setTimeout(() => notification.style.display = 'none', 3000);
    } catch (error) {
        console.error('Erro ao exibir notificação:', error);
        errorLogs.push(`[${new Date().toISOString()}] Erro ao exibir notificação: ${error.message}`);
    }
}

// Console de Erros no Final
window.addEventListener('beforeunload', () => {
    console.log("===== Console de Erros =====");
    if (errorLogs.length > 0) {
        console.log("Erros registrados durante a sessão:");
        errorLogs.forEach((log, index) => console.log(`${index + 1}. ${log}`));
    } else {
        console.log("Nenhum erro registrado nesta sessão.");
    }
    console.log("===========================");
});

// Expor funções ao escopo global para uso no HTML
window.saveAppointment = saveAppointment;
window.deleteAppointment = deleteAppointment;
window.editAppointment = editAppointment;
window.viewAppointment = viewAppointment;
window.shareAppointment = shareAppointment;
window.changeView = changeView;
window.showTab = showTab;
window.changePage = changePage;
window.toggleSelectAll = toggleSelectAll;
window.toggleSelectAllItems = toggleSelectAllItems;
window.handleDragStart = handleDragStart;
window.handleDragEnd = handleDragEnd;
window.handleDragOver = handleDragOver;
window.handleDrop = handleDrop;
window.moveCard = moveCard;
window.toggleDetails = toggleDetails;
window.openMedicoModal = openMedicoModal;
window.closeMedicoModal = closeMedicoModal;
window.saveMedico = saveMedico;
window.deleteMedico = deleteMedico;
window.openDeleteAllModal = openDeleteAllModal;
window.closeDeleteAllModal = closeDeleteAllModal;
window.confirmDeleteAll = confirmDeleteAll;
window.openSortFilterModal = openSortFilterModal;
window.closeSortFilterModal = closeSortFilterModal;
window.applySortFilter = applySortFilter;
window.openSettingsModal = openSettingsModal;
window.closeModal = closeModal;
window.saveTheme = saveTheme;
window.resetTheme = resetTheme;
window.addUser = addUser;
window.deleteUser = deleteUser;
window.resetForm = resetForm;
window.clearFilters = clearFilters;
window.printAppointments = printAppointments;
window.exportToExcel = exportToExcel;
window.generateReport = generateReport;
window.toggleReportView = toggleReportView;
window.generateInsights = generateInsights;
window.backupLocal = backupLocal;
window.restoreLocal = restoreLocal;
window.backupFirebase = backupFirebase;
window.restoreFirebase = restoreFirebase;
window.scrollToStatusSection = scrollToStatusSection;

console.log("Script carregado com sucesso!");
