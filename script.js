// Importações do Firebase
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getFirestore, collection, getDocs, setDoc, doc, deleteDoc } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
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

// Substitua pelos valores reais do seu projeto Firebase!

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
    document.getElementById('exportExcelBtn')?.addEventListener('click', () => { exportToExcel(); showNotification('Exportação para Excel iniciada!'); });
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
        console.error('Erro ao fazer login:', error.code, error.message);
        errorLogs.push(`[${new Date().toISOString()}] Erro ao fazer login: ${error.message}`);
        showNotification('Erro ao fazer login: ' + error.message, true);
    }
}

function loadSavedCredentials() {
    const savedEmail = localStorage.getItem('savedEmail');
    if (savedEmail) {
        loginEmail.value = savedEmail;
        console.log("Email carregado do localStorage:", savedEmail);
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

    try {
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
    if (confirm('Tem certeza que deseja excluir este agendamento?')) {
        try {
            appointments = appointments.filter(a => a.id !== id);
            await deleteFromFirebase('appointments', id);
            await saveToIndexedDB('appointments', appointments);
            renderAppointments();
            showNotification('Agendamento excluído com sucesso!');
        } catch (error) {
            console.error('Erro ao excluir:', error);
            errorLogs.push(`[${new Date().toISOString()}] Erro ao excluir agendamento: ${error.message}`);
            showNotification('Erro ao excluir: ' + error.message, true);
        }
    }
}

function editAppointment(id) {
    const appointment = appointments.find(a => a.id === id);
    if (appointment) {
        loadFormData(appointment);
        document.getElementById('statusGroup').style.display = 'block';
        showNotification('Agendamento carregado para edição!');
    }
}

function viewAppointment(id) {
    const appointment = appointments.find(a => a.id === id);
    if (appointment) {
        alert(JSON.stringify(appointment, null, 2));
        showNotification('Detalhes do agendamento exibidos!');
    }
}

function shareAppointment(id) {
    const appointment = appointments.find(a => a.id === id);
    if (appointment) {
        const message = `Agendamento:\nPaciente: ${appointment.nomePaciente}\nTelefone: ${appointment.telefone}\nMédico: ${appointment.nomeMedico}\nData: ${appointment.dataConsulta} às ${appointment.horaConsulta}\nStatus: ${appointment.status}`;
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
        showNotification('Agendamento compartilhado via WhatsApp!');
    }
}

// Renderização com Paginação
function renderAppointments() {
    console.log("Renderizando agendamentos...");
    if (!appointmentsBody || !gridView || !pipelineView || !statusFilter) {
        console.error("Elementos do DOM não encontrados!");
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
}

// Funções de Visualização
function changeView(e) {
    currentView = e.target.closest('.view-mode').dataset.view;
    document.querySelectorAll('.view-mode').forEach(btn => btn.classList.remove('active'));
    e.target.closest('.view-mode').classList.add('active');
    currentPage = 1;
    renderAppointments();
    saveToIndexedDB('settings', { currentView, deleteAllPassword, lastSync, theme });
    showNotification(`Modo de visualização alterado para ${currentView}!`);
}

function showTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.style.display = 'none');
    document.getElementById(tabId).style.display = 'block';
    if (tabId === 'allTab') renderAppointments();
    else if (tabId === 'insightsTab') generateInsights();
}

// Paginação
function changePage(direction) {
    currentPage += direction;
    renderAppointments();
}

// Selecionar/Desmarcar Todos
function toggleSelectAllItems() {
    const allChecked = document.querySelectorAll('.select-row').length === document.querySelectorAll('.select-row:checked').length;
    document.querySelectorAll('.select-row').forEach(checkbox => checkbox.checked = !allChecked);
    selectAllBtn.innerHTML = allChecked ? '<i class="fas fa-check-square"></i> Selecionar Todos' : '<i class="fas fa-times-square"></i> Desmarcar Todos';
    showNotification(allChecked ? 'Todos os itens desmarcados!' : 'Todos os itens selecionados!');
}

function toggleSelectAll(e) {
    document.querySelectorAll('.select-row').forEach(checkbox => checkbox.checked = e.target.checked);
    showNotification(e.target.checked ? 'Todos os itens selecionados!' : 'Seleção removida!');
}

// Drag and Drop
function handleDragStart(e) {
    draggedCard = e.target;
    e.dataTransfer.setData('text/plain', draggedCard.dataset.id);
    setTimeout(() => draggedCard.classList.add('dragging'), 0);
    showNotification('Arrastando card...');
}

function handleDragEnd(e) {
    draggedCard.classList.remove('dragging');
    draggedCard = null;
    showNotification('Arrastar concluído!');
}

function handleDragOver(e) {
    e.preventDefault();
}

async function handleDrop(e) {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    const newStatus = e.currentTarget.dataset.status;
    const appointment = appointments.find(app => app.id === id);
    if (appointment && appointment.status !== newStatus) {
        appointment.status = newStatus;
        try {
            await saveToFirebase('appointments', appointment);
            await saveToIndexedDB('appointments', appointments);
            renderAppointments();
            showNotification(`Agendamento movido para "${newStatus}" com sucesso!`);
        } catch (error) {
            console.error('Erro ao mover agendamento:', error);
            errorLogs.push(`[${new Date().toISOString()}] Erro ao mover agendamento: ${error.message}`);
            showNotification('Erro ao mover agendamento: ' + error.message, true);
        }
    }
}

async function moveCard(newStatus) {
    const id = actionBox.dataset.id;
    const appointment = appointments.find(app => app.id === id);
    if (appointment && appointment.status !== newStatus) {
        appointment.status = newStatus;
        try {
            await saveToFirebase('appointments', appointment);
            await saveToIndexedDB('appointments', appointments);
            renderAppointments();
            actionBox.style.display = 'none';
            showNotification(`Agendamento movido para "${newStatus}" com sucesso!`);
        } catch (error) {
            console.error('Erro ao mover agendamento:', error);
            errorLogs.push(`[${new Date().toISOString()}] Erro ao mover agendamento: ${error.message}`);
            showNotification('Erro ao mover agendamento: ' + error.message, true);
        }
    }
}

function toggleDetails(card) {
    const details = card.querySelector('.card-details');
    details.style.display = details.style.display === 'none' ? 'block' : 'none';
    showNotification(details.style.display === 'block' ? 'Detalhes exibidos!' : 'Detalhes ocultados!');
}

// Funções de Modal
function openMedicoModal() {
    medicoModal.style.display = 'block';
    updateMedicosList();
    showNotification('Modal de médicos aberto!');
}

function closeMedicoModal() {
    medicoModal.style.display = 'none';
    showNotification('Modal de médicos fechado!');
}

async function saveMedico() {
    const nome = document.getElementById('novoMedicoNome').value.trim();
    const crm = document.getElementById('novoMedicoCRM').value.trim();
    if (nome) {
        const medico = { nome, crm: crm || '' };
        medicos.push(medico);
        try {
            await saveToFirebase('medicos', medico);
            await saveToIndexedDB('medicos', medicos);
            updateMedicosList();
            document.getElementById('novoMedicoNome').value = '';
            document.getElementById('novoMedicoCRM').value = '';
            closeMedicoModal();
            showNotification('Médico cadastrado com sucesso!');
        } catch (error) {
            console.error('Erro ao salvar médico:', error);
            errorLogs.push(`[${new Date().toISOString()}] Erro ao salvar médico: ${error.message}`);
            showNotification('Erro ao salvar médico: ' + error.message, true);
        }
    } else {
        showNotification('Por favor, insira o nome do médico!', true);
    }
}

function updateMedicosList() {
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
}

async function deleteMedico(index) {
    if (confirm('Tem certeza que deseja excluir este médico?')) {
        medicos.splice(index, 1);
        try {
            await saveToIndexedDB('medicos', medicos);
            await syncLocalWithFirebase();
            updateMedicosList();
            showNotification('Médico excluído com sucesso!');
        } catch (error) {
            console.error('Erro ao excluir médico:', error);
            errorLogs.push(`[${new Date().toISOString()}] Erro ao excluir médico: ${error.message}`);
            showNotification('Erro ao excluir médico: ' + error.message, true);
        }
    }
}

function openDeleteAllModal() {
    deleteAllModal.style.display = 'block';
}

function closeDeleteAllModal() {
    deleteAllModal.style.display = 'none';
}

async function confirmDeleteAll() {
    const password = document.getElementById('deletePassword').value;
    if (password === deleteAllPassword) {
        try {
            appointments = [];
            await deleteAllFromFirebase('appointments');
            await saveToIndexedDB('appointments', appointments);
            renderAppointments();
            closeDeleteAllModal();
            showNotification('Todos os agendamentos foram excluídos!');
        } catch (error) {
            console.error('Erro ao excluir todos os agendamentos:', error);
            errorLogs.push(`[${new Date().toISOString()}] Erro ao excluir todos os agendamentos: ${error.message}`);
            showNotification('Erro ao excluir todos: ' + error.message, true);
        }
    } else {
        showNotification('Senha incorreta!', true);
    }
}

function openSortFilterModal() {
    sortFilterModal.style.display = 'block';
}

function closeSortFilterModal() {
    sortFilterModal.style.display = 'none';
}

function applySortFilter() {
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
}

function openSettingsModal() {
    settingsModal.style.display = 'block';
    loadThemeSettings();
    updateUsersList();
}

function closeModal(modal) {
    modal.style.display = 'none';
}

function saveTheme() {
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
    applyTheme();
    saveToIndexedDB('settings', { currentView, deleteAllPassword, lastSync, theme });
    showNotification('Configurações de tema salvas!');
}

function resetTheme() {
    theme = {};
    document.getElementById('bodyBgColor').value = '#f0f4f8';
    document.getElementById('cardBgColor').value = '#ffffff';
    document.getElementById('formBgColor').value = '#ffffff';
    document.getElementById('textColor').value = '#1f2937';
    document.getElementById('borderColor').value = '#1e40af';
    document.getElementById('cardBorderColor').value = '#d9d9ec';
    applyTheme();
    saveToIndexedDB('settings', { currentView, deleteAllPassword, lastSync, theme });
    showNotification('Tema restaurado para padrão!');
}

function loadThemeSettings() {
    document.getElementById('bodyBgColor').value = theme.bodyBgColor || '#f0f4f8';
    document.getElementById('cardBgColor').value = theme.cardBgColor || '#ffffff';
    document.getElementById('formBgColor').value = theme.formBgColor || '#ffffff';
    document.getElementById('textColor').value = theme.textColor || '#1f2937';
    document.getElementById('borderColor').value = theme.borderColor || '#1e40af';
    document.getElementById('cardBorderColor').value = theme.cardBorderColor || '#d9d9ec';
}

function applyTheme() {
    document.body.style.backgroundColor = theme.bodyBgColor || '#f0f4f8';
    document.querySelectorAll('.card').forEach(card => {
        card.style.backgroundColor = theme.cardBgColor || '#ffffff';
        card.style.borderColor = theme.cardBorderColor || '#d9d9ec';
    });
    document.querySelector('.form-section').style.backgroundColor = theme.formBgColor || '#ffffff';
    document.body.style.color = theme.textColor || '#1f2937';
    document.querySelectorAll('button').forEach(btn => btn.style.borderColor = theme.borderColor || '#1e40af');
}

// Funções de Usuários
function addUser() {
    const username = document.getElementById('newUsername').value.trim();
    const password = document.getElementById('newPassword').value.trim();
    if (username && password) {
        users.push({ username, password });
        saveToIndexedDB('users', users);
        updateUsersList();
        document.getElementById('newUsername').value = '';
        document.getElementById('newPassword').value = '';
        showNotification('Usuário adicionado com sucesso!');
    } else {
        showNotification('Por favor, preencha usuário e senha!', true);
    }
}

function updateUsersList() {
    if (!usersList) return;
    usersList.innerHTML = '';
    users.forEach((user, index) => {
        const li = document.createElement('li');
        li.innerHTML = `${user.username} <button onclick="deleteUser(${index})">Excluir</button>`;
        usersList.appendChild(li);
    });
}

function deleteUser(index) {
    if (confirm('Tem certeza que deseja excluir este usuário?')) {
        users.splice(index, 1);
        saveToIndexedDB('users', users);
        updateUsersList();
        showNotification('Usuário excluído com sucesso!');
    }
}

// Funções de Formulário
function loadFormData(appointment = {}) {
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
}

function resetForm() {
    appointmentForm.reset();
    delete appointmentForm.dataset.id;
    document.getElementById('statusGroup').style.display = 'none';
    showNotification('Formulário limpo!');
}

function clearFilters() {
    statusFilter.value = 'all';
    document.getElementById('sortType') && (document.getElementById('sortType').value = 'nameAZ');
    currentPage = 1;
    renderAppointments();
    showNotification('Filtros limpos!');
}

// Impressão Unificada
function printAppointments() {
    // Obtém os IDs dos itens selecionados
    const selectedIds = Array.from(document.querySelectorAll('.select-row:checked')).map(cb => cb.dataset.id);
    if (selectedIds.length === 0) {
        showNotification('Nenhum item selecionado para impressão!', true);
        return;
    }

    const selectedAppointments = appointments.filter(app => selectedIds.includes(app.id));
    const printWindow = window.open('', '_blank');

    // Verifica se a janela de impressão foi criada corretamente
    if (!printWindow) {
        showNotification('Erro ao abrir janela de impressão. Verifique bloqueadores de pop-up!', true);
        return;
    }

    try {
        // Modo Lista
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

        // Modo Grid
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

        // Modo Pipeline (não suportado)
        } else {
            printWindow.close();
            showNotification('Impressão não suportada no modo Pipeline!', true);
            return;
        }

        // Fecha o documento e inicia a impressão
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        showNotification(`Impressão iniciada no modo ${currentView === 'list' ? 'Lista' : 'Grid'}!`);

        // Fecha a janela após a impressão
        setTimeout(() => printWindow.close(), 1000);

    } catch (error) {
        console.error('Erro ao gerar impressão:', error);
        errorLogs.push(`[${new Date().toISOString()}] Erro ao gerar impressão: ${error.message}`);
        showNotification('Erro ao gerar impressão: ' + error.message, true);
        printWindow.close();
    }
}
// Funções de Relatórios
function generateReport() {
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

    showNotification('Relatório gerado com sucesso!');
}

function toggleReportView(view) {
    document.getElementById('reportResult').style.display = view === 'list' ? 'block' : 'none';
    document.getElementById('reportGrid').style.display = view === 'grid' ? 'grid' : 'none';
    document.querySelectorAll('#reportsTab .view-mode').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`#reportsTab .view-mode[data-view="${view}"]`).classList.add('active');
    showNotification(`Visualização de relatório alterada para ${view}!`);
}

// Funções de Insights
function generateInsights() {
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

    showNotification('Insights gerados com sucesso!');
}

// Funções de Backup
function backupLocal() {
    const data = { appointments, medicos, users, settings: { currentView, deleteAllPassword, lastSync, theme } };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification('Backup local salvo com sucesso!');
}

function restoreLocal() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            const text = await file.text();
            const data = JSON.parse(text);
            appointments = data.appointments || [];
            medicos = data.medicos || [];
            users = data.users || [];
            const settings = data.settings || {};
            currentView = settings.currentView || 'list';
            deleteAllPassword = settings.deleteAllPassword || '1234';
            lastSync = settings.lastSync || 0;
            theme = settings.theme || {};
            await saveToIndexedDB('appointments', appointments);
            await saveToIndexedDB('medicos', medicos);
            await saveToIndexedDB('users', users);
            await saveToIndexedDB('settings', { currentView, deleteAllPassword, lastSync, theme });
            renderAppointments();
            updateMedicosList();
            updateUsersList();
            applyTheme();
            showNotification('Backup local restaurado com sucesso!');
        }
    };
    input.click();
}

async function backupFirebase() {
    try {
        const data = { appointments, medicos, users, settings: { currentView, deleteAllPassword, lastSync, theme } };
        await setDoc(doc(db, 'backups', `backup_${new Date().toISOString()}`), data);
        showNotification('Backup salvo no Firebase com sucesso!');
    } catch (error) {
        console.error('Erro ao salvar backup no Firebase:', error);
        errorLogs.push(`[${new Date().toISOString()}] Erro ao salvar backup no Firebase: ${error.message}`);
        showNotification('Erro ao salvar backup no Firebase: ' + error.message, true);
    }
}

async function restoreFirebase() {
    try {
        const snapshot = await getDocs(collection(db, 'backups'));
        if (!snapshot.empty) {
            const latestBackup = snapshot.docs[snapshot.docs.length - 1].data();
            appointments = latestBackup.appointments || [];
            medicos = latestBackup.medicos || [];
            users = latestBackup.users || [];
            const settings = latestBackup.settings || {};
            currentView = settings.currentView || 'list';
            deleteAllPassword = settings.deleteAllPassword || '1234';
            lastSync = settings.lastSync || 0;
            theme = settings.theme || {};
            await saveToIndexedDB('appointments', appointments);
            await saveToIndexedDB('medicos', medicos);
            await saveToIndexedDB('users', users);
            await saveToIndexedDB('settings', { currentView, deleteAllPassword, lastSync, theme });
            renderAppointments();
            updateMedicosList();
            updateUsersList();
            applyTheme();
            showNotification('Backup restaurado do Firebase com sucesso!');
        } else {
            showNotification('Nenhum backup encontrado no Firebase!', true);
        }
    } catch (error) {
        console.error('Erro ao restaurar backup do Firebase:', error);
        errorLogs.push(`[${new Date().toISOString()}] Erro ao restaurar backup do Firebase: ${error.message}`);
        showNotification('Erro ao restaurar backup do Firebase: ' + error.message, true);
    }
}

// Funções de Sincronização com Firebase
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

            lastSync = now;
            await saveToIndexedDB('settings', { currentView, deleteAllPassword, lastSync, theme });
            showNotification('Sincronização com Firebase realizada com sucesso!');
        } catch (error) {
            console.error('Erro ao sincronizar com Firebase:', error);
            errorLogs.push(`[${new Date().toISOString()}] Erro ao sincronizar com Firebase: ${error.message}`);
            showNotification('Erro ao sincronizar com Firebase: ' + error.message, true);
        }
    }
}

function mergeData(localData, firebaseData, key) {
    const merged = [...localData];
    firebaseData.forEach(fbItem => {
        const index = merged.findIndex(item => item[key] === fbItem[key]);
        if (index === -1) merged.push(fbItem);
        else merged[index] = { ...merged[index], ...fbItem };
    });
    return merged;
}

async function saveToFirebase(collectionName, data) {
    try {
        await setDoc(doc(db, collectionName, data.id || Date.now().toString()), data);
        console.log(`Dados salvos no Firebase (${collectionName}):`, data);
    } catch (error) {
        console.error(`Erro ao salvar no Firebase (${collectionName}):`, error);
        errorLogs.push(`[${new Date().toISOString()}] Erro ao salvar no Firebase (${collectionName}): ${error.message}`);
        throw error;
    }
}

async function deleteFromFirebase(collectionName, id) {
    try {
        await deleteDoc(doc(db, collectionName, id));
        console.log(`Item excluído do Firebase (${collectionName}):`, id);
    } catch (error) {
        console.error(`Erro ao excluir do Firebase (${collectionName}):`, error);
        errorLogs.push(`[${new Date().toISOString()}] Erro ao excluir do Firebase (${collectionName}): ${error.message}`);
        throw error;
    }
}

async function deleteAllFromFirebase(collectionName) {
    const snapshot = await getDocs(collection(db, collectionName));
    const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
    console.log(`Todos os itens excluídos do Firebase (${collectionName})`);
}

// Funções de IndexedDB
async function saveToIndexedDB(storeName, data) {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('AgendaDB', DB_VERSION);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            const db = request.result;
            const tx = db.transaction(storeName, 'readwrite');
            const store = tx.objectStore(storeName);

            if (storeName === 'settings') {
                store.put({ key: 'settings', ...data });
            } else if (Array.isArray(data)) {
                data.forEach(item => {
                    if (storeName === 'appointments' && !item.id) item.id = Date.now().toString();
                    if (storeName === 'medicos' && !item.nome) item.nome = `Medico_${Date.now()}`;
                    if (storeName === 'users' && !item.username) item.username = `User_${Date.now()}`;
                    store.put(item);
                });
            } else {
                store.put(data);
            }

            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
            db.close();
        };
        request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains('appointments')) db.createObjectStore('appointments', { keyPath: 'id' });
            if (!db.objectStoreNames.contains('medicos')) db.createObjectStore('medicos', { keyPath: 'nome' });
            if (!db.objectStoreNames.contains('users')) db.createObjectStore('users', { keyPath: 'username' });
            if (!db.objectStoreNames.contains('settings')) db.createObjectStore('settings', { keyPath: 'key' });
        };
    });
}

async function loadFromIndexedDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('AgendaDB', DB_VERSION);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            const db = request.result;
            const tx = db.transaction(['appointments', 'medicos', 'users', 'settings'], 'readonly');
            const data = {};
            tx.objectStore('appointments').getAll().onsuccess = (e) => data.appointments = e.target.result;
            tx.objectStore('medicos').getAll().onsuccess = (e) => data.medicos = e.target.result;
            tx.objectStore('users').getAll().onsuccess = (e) => data.users = e.target.result;
            tx.objectStore('settings').get('settings').onsuccess = (e) => {
                const settings = e.target.result || {};
                delete settings.key;
                data.settings = settings;
            };
            tx.oncomplete = () => resolve(data);
            tx.onerror = () => reject(tx.error);
            db.close();
        };
        request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains('appointments')) db.createObjectStore('appointments', { keyPath: 'id' });
            if (!db.objectStoreNames.contains('medicos')) db.createObjectStore('medicos', { keyPath: 'nome' });
            if (!db.objectStoreNames.contains('users')) db.createObjectStore('users', { keyPath: 'username' });
            if (!db.objectStoreNames.contains('settings')) db.createObjectStore('settings', { keyPath: 'key' });
        };
    });
}

// Função de Notificação
function showNotification(message, isError = false) {
    if (!notification) return;
    notification.textContent = message;
    notification.className = 'notification' + (isError ? ' error' : '');
    notification.style.display = 'block';
    notification.style.opacity = '1';
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => notification.style.display = 'none', 500);
    }, 3000);
}

// Navegação para Status
function scrollToStatusSection() {
    pipelineView.scrollIntoView({ behavior: 'smooth' });
}

// Declaração de Funções Globais para o HTML
window.editAppointment = editAppointment;
window.deleteAppointment = deleteAppointment;
window.viewAppointment = viewAppointment;
window.shareAppointment = shareAppointment;
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
window.generateReport = generateReport;
window.toggleReportView = toggleReportView;
window.toggleDetails = toggleDetails;
window.backupLocal = backupLocal;
window.restoreLocal = restoreLocal;
window.backupFirebase = backupFirebase;
window.restoreFirebase = restoreFirebase;
window.addUser = addUser;
window.deleteUser = deleteUser;
window.saveTheme = saveTheme;
window.resetTheme = resetTheme;
window.moveCard = moveCard;

console.log("Script carregado com sucesso!");
