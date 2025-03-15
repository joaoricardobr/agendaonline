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
let rememberMe = null;

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

    // Inicializar elementos do DOM
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
    rememberMe = document.getElementById('rememberMe');

    if (notification) {
        showNotification("Firebase inicializado com sucesso!");
    } else {
        console.warn("Elemento de notificação não encontrado!");
    }

    setupEventListeners();

    // Verificar estado de autenticação
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
    if (loginForm) loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        loginUser();
    });
    if (appointmentForm) appointmentForm.addEventListener('submit', saveAppointment);
    if (statusFilter) statusFilter.addEventListener('change', renderAppointments);
    document.getElementById('selectAll')?.addEventListener('change', toggleSelectAll);
    document.querySelectorAll('.view-mode').forEach(btn => btn.addEventListener('click', changeView));
    document.getElementById('allBtn')?.addEventListener('click', () => showTab('allTab'));
    document.getElementById('reportsBtn')?.addEventListener('click', () => showTab('reportsTab'));
    document.getElementById('insightsBtn')?.addEventListener('click', () => showTab('insightsTab'));
    document.getElementById('printBtn')?.addEventListener('click', printAppointments);
    document.getElementById('deleteAllBtn')?.addEventListener('click', openDeleteAllModal);
    document.getElementById('sortFilterBtn')?.addEventListener('click', openSortFilterModal);
    document.getElementById('settingsBtn')?.addEventListener('click', openSettingsModal);
    document.getElementById('resetBtn')?.addEventListener('click', resetForm);
    document.getElementById('exportExcelBtn')?.addEventListener('click', exportToExcel);
    document.getElementById('clearFiltersBtn')?.addEventListener('click', clearFilters);
    document.getElementById('logoutBtn')?.addEventListener('click', logoutUser);

    document.querySelectorAll('.modal-close').forEach(btn => btn.addEventListener('click', () => closeModal(btn.closest('.modal'))));
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal(modal);
        });
    });

    // Configurações
    document.getElementById('saveTheme')?.addEventListener('click', saveTheme);
    document.getElementById('resetTheme')?.addEventListener('click', resetTheme);
}

// Funções de Autenticação
async function loginUser() {
    const email = loginEmail.value.trim();
    const password = loginPassword.value.trim();

    if (!email || !password) {
        showNotification('Por favor, preencha email e senha!', true);
        return;
    }

    console.log("Tentando login com:", { email, password });
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        console.log("Login bem-sucedido:", user);

        if (rememberMe.checked) {
            localStorage.setItem('savedEmail', email);
            localStorage.setItem('savedPassword', password);
            console.log("Credenciais salvas no localStorage.");
        } else {
            localStorage.removeItem('savedEmail');
            localStorage.removeItem('savedPassword');
            console.log("Credenciais removidas do localStorage.");
        }
        showNotification(`Login realizado com sucesso! Bem-vindo, ${user.email}!`);
    } catch (error) {
        console.error('Erro ao fazer login:', error.code, error.message);
        errorLogs.push(`[${new Date().toISOString()}] Erro ao fazer login: ${error.code} - ${error.message}`);
        let errorMessage = 'Erro ao fazer login: ';
        switch (error.code) {
            case 'auth/invalid-email':
                errorMessage += 'Email inválido.';
                break;
            case 'auth/user-not-found':
                errorMessage += 'Usuário não encontrado.';
                break;
            case 'auth/wrong-password':
                errorMessage += 'Senha incorreta.';
                break;
            case 'auth/invalid-credential':
                errorMessage += 'Credenciais inválidas.';
                break;
            case 'auth/too-many-requests':
                errorMessage += 'Muitas tentativas. Tente novamente mais tarde.';
                break;
            default:
                errorMessage += error.message;
        }
        showNotification(errorMessage, true);
    }
}

function loadSavedCredentials() {
    const savedEmail = localStorage.getItem('savedEmail');
    const savedPassword = localStorage.getItem('savedPassword');
    if (savedEmail && savedPassword) {
        loginEmail.value = savedEmail;
        loginPassword.value = savedPassword;
        rememberMe.checked = true;
        console.log("Credenciais carregadas do localStorage:", { savedEmail });
    } else {
        console.log("Nenhuma credencial salva encontrada.");
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

        console.log("Dados carregados:", { appointments, medicos, users, currentView, theme });
        loadFormData();
        updateMedicosList();
        updateUsersList();
        applyTheme();
        renderAppointments();
        showNotification('Aplicação inicializada com sucesso!');
    } catch (error) {
        console.error('Erro ao carregar dados iniciais:', error);
        errorLogs.push(`[${new Date().toISOString()}] Erro ao carregar dados iniciais: ${error.message}`);
        showNotification('Erro ao inicializar: ' + error.message, true);
    }
}

// Funções de CRUD
async function saveAppointment(e) {
    e.preventDefault();
    const appointment = {
        id: appointmentForm.dataset.id || Date.now().toString(),
        nomePaciente: document.getElementById('nomePaciente').value || '',
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
    if (index !== -1) appointments[index] = appointment;
    else appointments.push(appointment);

    try {
        await saveToFirebase('appointments', appointment);
        await saveToIndexedDB('appointments', appointments);
        resetForm();
        renderAppointments();
        showNotification('Agendamento salvo com sucesso!');
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
    }
}

function viewAppointment(id) {
    const appointment = appointments.find(a => a.id === id);
    if (appointment) alert(JSON.stringify(appointment, null, 2));
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

// Renderização
function renderAppointments() {
    console.log("Renderizando agendamentos...");
    let filteredAppointments = statusFilter.value === 'all' ? appointments : appointments.filter(app => app.status === statusFilter.value);
    const columnToggles = document.querySelectorAll('.column-toggle');
    const visibleColumns = Array.from(columnToggles).filter(t => t.checked).map(t => t.dataset.column);

    appointmentsBody.innerHTML = '';
    gridView.innerHTML = '';
    pipelineView.querySelectorAll('.column-content').forEach(col => col.innerHTML = '');

    document.querySelectorAll('.table-view th, .table-view td').forEach(el => {
        const columnName = el.querySelector('input')?.dataset.column || el.dataset.column;
        if (columnName) {
            el.classList.toggle('hidden', !visibleColumns.includes(columnName));
        }
    });

    filteredAppointments.forEach(app => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><input type="checkbox" class="select-row" data-id="${app.id}"></td>
            <td data-column="ID">${app.id || '-'}</td>
            <td data-column="nomePaciente">${app.nomePaciente || '-'}</td>
            <td data-column="telefone">${app.telefone || '-'}</td>
            <td data-column="email">${app.email || '-'}</td>
            <td data-column="nomeMedico">${app.nomeMedico || '-'}</td>
            <td data-column="localCRM">${app.localCRM || '-'}</td>
            <td data-column="dataConsulta">${app.dataConsulta || '-'}</td>
            <td data-column="horaConsulta">${app.horaConsulta || '-'}</td>
            <td data-column="tipoCirurgia">${app.tipoCirurgia || '-'}</td>
            <td data-column="procedimentos">${app.procedimentos || '-'}</td>
            <td data-column="agendamentoFeitoPor">${app.agendamentoFeitoPor || '-'}</td>
            <td data-column="descricao">${app.descricao || '-'}</td>
            <td data-column="status">${app.status || '-'}</td>
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

    document.getElementById('appointmentsTable').classList.toggle('active', currentView === 'list');
    gridView.classList.toggle('active', currentView === 'grid');
    pipelineView.classList.toggle('active', currentView === 'pipeline');

    pipelineView.querySelectorAll('.mini-card').forEach(card => {
        card.addEventListener('dragstart', handleDragStart);
        card.addEventListener('dragend', handleDragEnd);
        card.addEventListener('click', (e) => {
            if (!e.target.classList.contains('action-btn')) handleCardClick(e, card.dataset.id);
        });
    });

    pipelineView.querySelectorAll('.pipeline-column').forEach(column => {
        column.addEventListener('dragover', handleDragOver);
        column.addEventListener('drop', handleDrop);
    });
}

// Funções de Visualização
function changeView(e) {
    currentView = e.target.closest('.view-mode').dataset.view;
    document.querySelectorAll('.view-mode').forEach(btn => btn.classList.remove('active'));
    e.target.closest('.view-mode').classList.add('active');
    renderAppointments();
    saveToFirebase('settings', { key: 'currentView', value: currentView });
    saveToIndexedDB('settings', { currentView, deleteAllPassword, lastSync, theme });
    showNotification('Modo de visualização alterado!');
}

function showTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.style.display = 'none');
    document.getElementById(tabId).style.display = 'block';
    if (tabId === 'allTab') renderAppointments();
    else if (tabId === 'insightsTab') generateInsights();
    showNotification(`Aba ${tabId === 'allTab' ? 'Todos' : tabId === 'reportsTab' ? 'Relatórios' : 'Insights'} exibida!`);
}

// Drag and Drop
function handleDragStart(e) {
    draggedCard = e.target;
    e.dataTransfer.setData('text/plain', draggedCard.dataset.id);
}

function handleDragEnd() {
    draggedCard = null;
}

function handleDragOver(e) {
    e.preventDefault();
}

async function handleDrop(e) {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    const newStatus = e.target.closest('.pipeline-column').dataset.status;
    const appointment = appointments.find(a => a.id === id);
    if (appointment) {
        appointment.status = newStatus;
        await saveToFirebase('appointments', appointment);
        await saveToIndexedDB('appointments', appointments);
        renderAppointments();
        showNotification(`Agendamento movido para ${newStatus}!`);
    }
}

function handleCardClick(e, id) {
    actionBox.style.display = 'block';
    actionBox.querySelectorAll('button[data-status]').forEach(btn => {
        btn.onclick = () => moveCard(id, btn.dataset.status);
    });
}

async function moveCard(id, newStatus) {
    const appointment = appointments.find(a => a.id === id);
    if (appointment) {
        appointment.status = newStatus;
        await saveToFirebase('appointments', appointment);
        await saveToIndexedDB('appointments', appointments);
        renderAppointments();
        closeModal(actionBox);
        showNotification(`Agendamento movido para ${newStatus}!`);
    }
}

// Funções Auxiliares
function toggleSelectAll(e) {
    document.querySelectorAll('.select-row').forEach(checkbox => checkbox.checked = e.target.checked);
}

function resetForm() {
    appointmentForm.reset();
    document.getElementById('statusGroup').style.display = 'none';
    delete appointmentForm.dataset.id;
    showNotification('Formulário restaurado!');
}

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

function showNotification(message, isError = false) {
    if (notification) {
        notification.textContent = message;
        notification.className = `notification ${isError ? 'error' : ''}`;
        notification.classList.add('show');
        setTimeout(() => notification.classList.remove('show'), 3000);
    } else {
        console.warn("Notificação não exibida: elemento 'notification' não encontrado.");
    }
}

function closeModal(modal) {
    modal.style.display = 'none';
}

function clearFilters() {
    statusFilter.value = 'all';
    renderAppointments();
    showNotification('Filtros limpos!');
}

// Gestão de Médicos
function openMedicoModal() {
    medicoModal.style.display = 'block';
}

function closeMedicoModal() {
    closeModal(medicoModal);
}

async function saveMedico() {
    const nome = document.getElementById('novoMedicoNome').value || '';
    const crm = document.getElementById('novoMedicoCRM').value || '';
    if (nome && crm) {
        const medico = { nome, crm };
        medicos.push(medico);
        await saveToFirebase('medicos', medico);
        await saveToIndexedDB('medicos', medicos);
        updateMedicosList();
        closeMedicoModal();
        showNotification('Médico cadastrado com sucesso!');
    } else {
        showNotification('Preencha nome e CRM do médico!', true);
    }
}

function updateMedicosList() {
    const datalist = document.getElementById('medicosList');
    datalist.innerHTML = '';
    medicosListDisplay.innerHTML = '';
    medicos.forEach(medico => {
        const option = document.createElement('option');
        option.value = medico.nome;
        datalist.appendChild(option);

        const li = document.createElement('li');
        li.innerHTML = `${medico.nome} (CRM: ${medico.crm}) <button class="delete-medico-btn" onclick="deleteMedico('${medico.nome}')">Excluir</button>`;
        medicosListDisplay.appendChild(li);
    });
}

async function deleteMedico(nome) {
    if (confirm(`Tem certeza que deseja excluir o médico ${nome}?`)) {
        medicos = medicos.filter(m => m.nome !== nome);
        await deleteFromFirebase('medicos', nome);
        await saveToIndexedDB('medicos', medicos);
        updateMedicosList();
        showNotification('Médico excluído com sucesso!');
    }
}

// Gestão de Usuários
function updateUsersList() {
    usersList.innerHTML = '';
    users.forEach(user => {
        const li = document.createElement('li');
        li.innerHTML = `${user.username} <button onclick="deleteUser('${user.username}')">Excluir</button>`;
        usersList.appendChild(li);
    });
}

async function addUser() {
    const username = document.getElementById('newUsername').value || '';
    const password = document.getElementById('newPassword').value || '';
    if (username && password) {
        const user = { username, password };
        users.push(user);
        await saveToFirebase('users', user);
        await saveToIndexedDB('users', users);
        updateUsersList();
        document.getElementById('newUsername').value = '';
        document.getElementById('newPassword').value = '';
        showNotification('Usuário adicionado com sucesso!');
    } else {
        showNotification('Preencha usuário e senha!', true);
    }
}

async function deleteUser(username) {
    if (confirm(`Tem certeza que deseja excluir o usuário ${username}?`)) {
        users = users.filter(u => u.username !== username);
        await deleteFromFirebase('users', username);
        await saveToIndexedDB('users', users);
        updateUsersList();
        showNotification('Usuário excluído com sucesso!');
    }
}

// Backup
async function backupLocal() {
    const data = { appointments, medicos, users, settings: { currentView, deleteAllPassword, lastSync, theme } };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification('Backup local gerado com sucesso!');
}

async function restoreLocal() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
            const text = await file.text();
            const data = JSON.parse(text);
            appointments = data.appointments || [];
            medicos = data.medicos || [];
            users = data.users || [];
            currentView = data.settings?.currentView || 'list';
            deleteAllPassword = data.settings?.deleteAllPassword || '1234';
            lastSync = data.settings?.lastSync || 0;
            theme = data.settings?.theme || {};

            await Promise.all([
                saveToFirebase('appointments', appointments),
                saveToFirebase('medicos', medicos),
                saveToFirebase('users', users),
                saveToFirebase('settings', { key: 'currentView', value: currentView }),
                saveToFirebase('settings', { key: 'deleteAllPassword', value: deleteAllPassword }),
                saveToFirebase('settings', { key: 'lastSync', value: lastSync }),
                saveToFirebase('settings', { key: 'theme', value: theme })
            ]);
            await saveToIndexedDB('appointments', appointments);
            await saveToIndexedDB('medicos', medicos);
            await saveToIndexedDB('users', users);
            await saveToIndexedDB('settings', { currentView, deleteAllPassword, lastSync, theme });

            loadFormData();
            updateMedicosList();
            updateUsersList();
            applyTheme();
            renderAppointments();
            showNotification('Backup restaurado com sucesso!');
        } catch (error) {
            console.error('Erro ao restaurar backup local:', error);
            errorLogs.push(`[${new Date().toISOString()}] Erro ao restaurar backup local: ${error.message}`);
            showNotification('Erro ao restaurar backup: ' + error.message, true);
        }
    };
    input.click();
}

async function backupFirebase() {
    try {
        const data = { appointments, medicos, users, settings: { currentView, deleteAllPassword, lastSync, theme } };
        await setDoc(doc(db, 'backups', `backup_${new Date().toISOString()}`), data);
        showNotification('Backup no Firebase realizado com sucesso!');
    } catch (error) {
        console.error('Erro ao fazer backup no Firebase:', error);
        errorLogs.push(`[${new Date().toISOString()}] Erro ao fazer backup no Firebase: ${error.message}`);
        showNotification('Erro ao fazer backup no Firebase: ' + error.message, true);
    }
}

async function restoreFirebase() {
    try {
        const snapshot = await getDocs(collection(db, 'backups'));
        if (snapshot.empty) {
            showNotification('Nenhum backup encontrado no Firebase!', true);
            return;
        }
        const latestBackup = snapshot.docs[snapshot.docs.length - 1].data();
        appointments = latestBackup.appointments || [];
        medicos = latestBackup.medicos || [];
        users = latestBackup.users || [];
        currentView = latestBackup.settings?.currentView || 'list';
        deleteAllPassword = latestBackup.settings?.deleteAllPassword || '1234';
        lastSync = latestBackup.settings?.lastSync || 0;
        theme = latestBackup.settings?.theme || {};

        await saveToIndexedDB('appointments', appointments);
        await saveToIndexedDB('medicos', medicos);
        await saveToIndexedDB('users', users);
        await saveToIndexedDB('settings', { currentView, deleteAllPassword, lastSync, theme });

        loadFormData();
        updateMedicosList();
        updateUsersList();
        applyTheme();
        renderAppointments();
        showNotification('Backup restaurado do Firebase com sucesso!');
    } catch (error) {
        console.error('Erro ao restaurar do Firebase:', error);
        errorLogs.push(`[${new Date().toISOString()}] Erro ao restaurar do Firebase: ${error.message}`);
        showNotification('Erro ao restaurar do Firebase: ' + error.message, true);
    }
}

// Exclusão de Todos os Agendamentos
function openDeleteAllModal() {
    deleteAllModal.style.display = 'block';
}

function closeDeleteAllModal() {
    closeModal(deleteAllModal);
}

async function confirmDeleteAll() {
    const password = document.getElementById('deletePassword').value;
    if (password === deleteAllPassword) {
        try {
            appointments = [];
            await deleteFromFirebase('appointments');
            await saveToIndexedDB('appointments', appointments);
            renderAppointments();
            closeDeleteAllModal();
            showNotification('Todos os agendamentos excluídos com sucesso!');
        } catch (error) {
            console.error('Erro ao excluir todos os agendamentos:', error);
            errorLogs.push(`[${new Date().toISOString()}] Erro ao excluir todos os agendamentos: ${error.message}`);
            showNotification('Erro ao excluir todos: ' + error.message, true);
        }
    } else {
        showNotification('Senha incorreta!', true);
    }
}

// Filtros Avançados
function openSortFilterModal() {
    sortFilterModal.style.display = 'block';
}

function closeSortFilterModal() {
    closeModal(sortFilterModal);
}

function applySortFilter() {
    const sortType = document.getElementById('sortType').value;
    let sortedAppointments = [...appointments];

    switch (sortType) {
        case 'nameAZ':
            sortedAppointments.sort((a, b) => (a.nomePaciente || '').localeCompare(b.nomePaciente || ''));
            break;
        case 'recent':
            sortedAppointments.sort((a, b) => new Date(b.dataConsulta + ' ' + b.horaConsulta) - new Date(a.dataConsulta + ' ' + a.horaConsulta));
            break;
        case 'oldest':
            sortedAppointments.sort((a, b) => new Date(a.dataConsulta + ' ' + a.horaConsulta) - new Date(b.dataConsulta + ' ' + a.horaConsulta));
            break;
        case 'phone':
            sortedAppointments.sort((a, b) => (a.telefone || '').localeCompare(b.telefone || ''));
            break;
        case 'date':
            sortedAppointments.sort((a, b) => (a.dataConsulta || '').localeCompare(b.dataConsulta || ''));
            break;
        case 'doctor':
            sortedAppointments.sort((a, b) => (a.nomeMedico || '').localeCompare(b.nomeMedico || ''));
            break;
        case 'month':
            sortedAppointments.sort((a, b) => new Date(a.dataConsulta).getMonth() - new Date(b.dataConsulta).getMonth());
            break;
        case 'year':
            sortedAppointments.sort((a, b) => new Date(a.dataConsulta).getFullYear() - new Date(b.dataConsulta).getFullYear());
            break;
    }

    appointments = sortedAppointments;
    renderAppointments();
    closeSortFilterModal();
    showNotification('Filtro aplicado com sucesso!');
}

// Configurações de Tema
function openSettingsModal() {
    settingsModal.style.display = 'block';
    document.getElementById('bodyBgColor').value = theme.bodyBgColor || '#f0f4f8';
    document.getElementById('cardBgColor').value = theme.cardBgColor || '#ffffff';
    document.getElementById('formBgColor').value = theme.formBgColor || '#ffffff';
    document.getElementById('textColor').value = theme.textColor || '#343a40';
    document.getElementById('borderColor').value = theme.borderColor || '#007bff';
}

function saveTheme() {
    theme = {
        bodyBgColor: document.getElementById('bodyBgColor').value,
        cardBgColor: document.getElementById('cardBgColor').value,
        formBgColor: document.getElementById('formBgColor').value,
        textColor: document.getElementById('textColor').value,
        borderColor: document.getElementById('borderColor').value
    };
    deleteAllPassword = document.getElementById('deleteAllPassword').value || deleteAllPassword;
    applyTheme();
    saveToFirebase('settings', { key: 'theme', value: theme });
    saveToFirebase('settings', { key: 'deleteAllPassword', value: deleteAllPassword });
    saveToIndexedDB('settings', { currentView, deleteAllPassword, lastSync, theme });
    closeModal(settingsModal);
    showNotification('Tema salvo com sucesso!');
}

function resetTheme() {
    theme = {
        bodyBgColor: '#f0f4f8',
        cardBgColor: '#ffffff',
        formBgColor: '#ffffff',
        textColor: '#343a40',
        borderColor: '#007bff'
    };
    document.getElementById('bodyBgColor').value = theme.bodyBgColor;
    document.getElementById('cardBgColor').value = theme.cardBgColor;
    document.getElementById('formBgColor').value = theme.formBgColor;
    document.getElementById('textColor').value = theme.textColor;
    document.getElementById('borderColor').value = theme.borderColor;
    applyTheme();
    saveToFirebase('settings', { key: 'theme', value: theme });
    saveToIndexedDB('settings', { currentView, deleteAllPassword, lastSync, theme });
    showNotification('Tema restaurado para padrão!');
}

function applyTheme() {
    document.body.style.backgroundColor = theme.bodyBgColor || '#f0f4f8';
    document.querySelectorAll('.card, .form-section, .appointments-section, .search-card, .modal-content, .login-box').forEach(el => {
        el.style.backgroundColor = theme.cardBgColor || '#ffffff';
    });
    document.querySelector('.form-section').style.backgroundColor = theme.formBgColor || '#ffffff';
    document.body.style.color = theme.textColor || '#343a40';
    document.querySelectorAll('input, textarea, select, button').forEach(el => {
        el.style.borderColor = theme.borderColor || '#007bff';
    });
}

// Relatórios
async function generateReport() {
    const reportType = document.getElementById('reportType').value;
    const reportMonth = document.getElementById('reportMonth').value;
    const reportYear = document.getElementById('reportYear').value;
    const reportDoctor = document.getElementById('reportDoctor').value;

    let filteredAppointments = [...appointments];
    if (reportMonth) {
        const [year, month] = reportMonth.split('-');
        filteredAppointments = filteredAppointments.filter(a => {
            const date = new Date(a.dataConsulta);
            return date.getFullYear() === parseInt(year) && date.getMonth() === parseInt(month) - 1;
        });
    }
    if (reportYear) {
        filteredAppointments = filteredAppointments.filter(a => new Date(a.dataConsulta).getFullYear() === parseInt(reportYear));
    }
    if (reportDoctor) {
        filteredAppointments = filteredAppointments.filter(a => a.nomeMedico === reportDoctor);
    }

    switch (reportType) {
        case 'byName':
            filteredAppointments.sort((a, b) => (a.nomePaciente || '').localeCompare(b.nomePaciente || ''));
            break;
        case 'byRecent':
            filteredAppointments.sort((a, b) => new Date(b.dataConsulta + ' ' + b.horaConsulta) - new Date(a.dataConsulta + ' ' + a.horaConsulta));
            break;
        case 'byOldest':
            filteredAppointments.sort((a, b) => new Date(a.dataConsulta + ' ' + a.horaConsulta) - new Date(b.dataConsulta + ' ' + a.horaConsulta));
            break;
        case 'byPhone':
            filteredAppointments.sort((a, b) => (a.telefone || '').localeCompare(b.telefone || ''));
            break;
        case 'byDate':
            filteredAppointments.sort((a, b) => (a.dataConsulta || '').localeCompare(b.dataConsulta || ''));
            break;
        case 'byDoctor':
            filteredAppointments.sort((a, b) => (a.nomeMedico || '').localeCompare(b.nomeMedico || ''));
            break;
        case 'byMonth':
            filteredAppointments.sort((a, b) => new Date(a.dataConsulta).getMonth() - new Date(b.dataConsulta).getMonth());
            break;
        case 'byYear':
            filteredAppointments.sort((a, b) => new Date(a.dataConsulta).getFullYear() - new Date(b.dataConsulta).getFullYear());
            break;
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
    showNotification(`Visualização de relatório alterada para ${view === 'list' ? 'Lista' : 'Grid'}!`);
}

// Insights
function generateInsights() {
    const insightsCards = document.getElementById('insightsCards');
    insightsCards.innerHTML = '';

    const totalAppointments = appointments.length;
    const byStatus = appointments.reduce((acc, app) => {
        acc[app.status] = (acc[app.status] || 0) + 1;
        return acc;
    }, {});
    const byDoctor = appointments.reduce((acc, app) => {
        acc[app.nomeMedico] = (acc[app.nomeMedico] || 0) + 1;
        return acc;
    }, {});
    const recentAppointments = appointments.filter(a => new Date(a.dataConsulta) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length;

    const totalCard = document.createElement('div');
    totalCard.className = 'insights-card';
    totalCard.innerHTML = `<h4><i class="fas fa-calendar-check"></i> Total de Agendamentos</h4><p>${totalAppointments} agendamentos registrados.</p>`;
    insightsCards.appendChild(totalCard);

    const statusCard = document.createElement('div');
    statusCard.className = 'insights-card';
    statusCard.innerHTML = `<h4><i class="fas fa-chart-pie"></i> Agendamentos por Status</h4><ul>${Object.entries(byStatus).map(([status, count]) => `<li>${status}: ${count}</li>`).join('')}</ul>`;
    insightsCards.appendChild(statusCard);

    const doctorCard = document.createElement('div');
    doctorCard.className = 'insights-card';
    doctorCard.innerHTML = `<h4><i class="fas fa-user-md"></i> Agendamentos por Médico</h4><ul>${Object.entries(byDoctor).map(([doctor, count]) => `<li>${doctor || 'Sem Médico'}: ${count}</li>`).join('')}</ul>`;
    insightsCards.appendChild(doctorCard);

    const recentCard = document.createElement('div');
    recentCard.className = 'insights-card';
    recentCard.innerHTML = `<h4><i class="fas fa-clock"></i> Agendamentos Recentes</h4><p>${recentAppointments} agendamentos nos últimos 7 dias.</p>`;
    insightsCards.appendChild(recentCard);

    const errorCard = document.createElement('div');
    errorCard.className = 'insights-card error-log-card';
    errorCard.innerHTML = `<h4><i class="fas fa-exclamation-triangle"></i> Logs de Erros</h4><ul>${errorLogs.length ? errorLogs.map(log => `<li>${log}</li>`).join('') : '<li>Nenhum erro registrado.</li>'}</ul>`;
    insightsCards.appendChild(errorCard);

    showNotification('Insights gerados com sucesso!');
}

// Impressão
function printAppointments() {
    // Filtra os agendamentos com base no filtro de status atual
    let selectedAppointments = statusFilter.value === 'all' ? appointments : appointments.filter(app => app.status === statusFilter.value);

    // Verifica se há agendamentos para imprimir
    if (selectedAppointments.length === 0) {
        showNotification('Nenhum agendamento para imprimir!', true);
        return;
    }

    // Cria uma nova janela para impressão
    const printWindow = window.open('', '_blank');

    // Verifica o modo de visualização atual e ajusta o formato da impressão
    if (currentView === 'list') {
        // Impressão em Tabela (Lista)
        printWindow.document.write(`
            <html>
            <head>
                <title>Impressão - Lista de Agendamentos</title>
                <style>
                    @page { size: landscape; margin: 5mm; }
                    body { font-family: Arial, sans-serif; margin: 0; padding: 5mm; }
                    h1 { text-align: center; font-size: 18px; margin-bottom: 10px; }
                    table { width: 100%; border-collapse: collapse; font-size: 12px; }
                    th, td { border: 1px solid #333; padding: 8px; text-align: left; }
                    th { background-color: #e9ecef; font-weight: bold; }
                    tr:nth-child(even) { background-color: #f9f9f9; }
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
        // Impressão em Cards (Grid)
        printWindow.document.write(`
            <html>
            <head>
                <title>Impressão - Grid de Agendamentos</title>
                <style>
                    @page { size: landscape; margin: 5mm; }
                    body { font-family: Arial, sans-serif; margin: 0; padding: 5mm; }
                    h1 { text-align: center; font-size: 18px; margin-bottom: 10px; }
                    .card-container { display: flex; flex-wrap: wrap; gap: 10px; }
                    .card { border: 1px solid #333; padding: 10px; width: 250px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); background-color: #fff; }
                    .card h4 { font-size: 14px; margin-bottom: 8px; color: #007bff; }
                    .card p { font-size: 12px; margin: 4px 0; }
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
        // Modo pipeline não é suportado para impressão
        printWindow.close();
        showNotification('Impressão não suportada no modo Pipeline!', true);
        return;
    }

    // Finaliza e imprime a janela
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();

    // Exibe notificação de sucesso
    showNotification(`Impressão iniciada no modo ${currentView === 'list' ? 'Lista' : 'Grid'}!`);
}

// Exportação para Excel
function exportToExcel() {
    const ws = XLSX.utils.json_to_sheet(appointments.map(app => ({
        ID: app.id || '-',
        Paciente: app.nomePaciente || '-',
        Telefone: app.telefone || '-',
        Email: app.email || '-',
        Médico: app.nomeMedico || '-',
        'Local CRM': app.localCRM || '-',
        Data: app.dataConsulta || '-',
        Hora: app.horaConsulta || '-',
        'Tipo Cirurgia': app.tipoCirurgia || '-',
        Procedimentos: app.procedimentos || '-',
        'Feito Por': app.agendamentoFeitoPor || '-',
        Descrição: app.descricao || '-',
        Status: app.status || '-'
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Agendamentos');
    XLSX.writeFile(wb, `agendamentos_${new Date().toISOString()}.xlsx`);
    showNotification('Exportação para Excel concluída!');
}

// IndexedDB
async function saveToIndexedDB(storeName, data) {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('AgendaUnicaDB', 1);
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            db.createObjectStore('appointments', { keyPath: 'id' });
            db.createObjectStore('medicos', { keyPath: 'nome' });
            db.createObjectStore('users', { keyPath: 'username' });
            db.createObjectStore('settings', { keyPath: 'key' });
        };
        request.onsuccess = (event) => {
            const db = event.target.result;
            const tx = db.transaction(storeName, 'readwrite');
            const store = tx.objectStore(storeName);
            if (Array.isArray(data)) {
                data.forEach(item => store.put(item));
            } else {
                store.put({ key: storeName, value: data });
            }
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
            db.close();
        };
        request.onerror = () => reject(request.error);
    });
}

async function loadFromIndexedDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('AgendaUnicaDB', 1);
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            db.createObjectStore('appointments', { keyPath: 'id' });
            db.createObjectStore('medicos', { keyPath: 'nome' });
            db.createObjectStore('users', { keyPath: 'username' });
            db.createObjectStore('settings', { keyPath: 'key' });
        };
        request.onsuccess = (event) => {
            const db = event.target.result;
            const tx = db.transaction(['appointments', 'medicos', 'users', 'settings'], 'readonly');
            const data = {};
            const stores = ['appointments', 'medicos', 'users', 'settings'];
            let completed = 0;

            stores.forEach(storeName => {
                const store = tx.objectStore(storeName);
                const getRequest = store.getAll();
                getRequest.onsuccess = () => {
                    if (storeName === 'settings') {
                        data[storeName] = getRequest.result.reduce((acc, item) => {
                            acc[item.key] = item.value;
                            return acc;
                        }, {});
                    } else {
                        data[storeName] = getRequest.result;
                    }
                    completed++;
                    if (completed === stores.length) {
                        db.close();
                        resolve(data);
                    }
                };
                getRequest.onerror = () => reject(getRequest.error);
            });
        };
        request.onerror = () => reject(request.error);
    });
}

// Firebase
async function saveToFirebase(collectionName, data) {
    if (Array.isArray(data)) {
        const batch = db.batch();
        data.forEach(item => {
            const ref = doc(db, collectionName, item.id || item.nome || item.username || item.key);
            batch.set(ref, item);
        });
        await batch.commit();
    } else {
        await setDoc(doc(db, collectionName, data.id || data.nome || data.username || data.key), data);
    }
}

async function deleteFromFirebase(collectionName, id) {
    if (id) {
        await deleteDoc(doc(db, collectionName, id));
    } else {
        const snapshot = await getDocs(collection(db, collectionName));
        const batch = db.batch();
        snapshot.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
    }
}

async function syncLocalWithFirebase() {
    if (Date.now() - lastSync < 60000) return; // Sincroniza a cada 1 minuto
    try {
        const snapshot = await getDocs(collection(db, 'appointments'));
        const firebaseAppointments = snapshot.docs.map(doc => doc.data());
        appointments = firebaseAppointments.length > appointments.length ? firebaseAppointments : appointments;

        const medicosSnapshot = await getDocs(collection(db, 'medicos'));
        const firebaseMedicos = medicosSnapshot.docs.map(doc => doc.data());
        medicos = firebaseMedicos.length > medicos.length ? firebaseMedicos : medicos;

        const usersSnapshot = await getDocs(collection(db, 'users'));
        const firebaseUsers = usersSnapshot.docs.map(doc => doc.data());
        users = firebaseUsers.length > users.length ? firebaseUsers : users;

        await saveToIndexedDB('appointments', appointments);
        await saveToIndexedDB('medicos', medicos);
        await saveToIndexedDB('users', users);
        lastSync = Date.now();
        await saveToFirebase('settings', { key: 'lastSync', value: lastSync });
        await saveToIndexedDB('settings', { currentView, deleteAllPassword, lastSync, theme });
        console.log("Sincronização com Firebase concluída!");
        showNotification('Sincronização com Firebase concluída!');
    } catch (error) {
        console.error('Erro ao sincronizar com Firebase:', error);
        errorLogs.push(`[${new Date().toISOString()}] Erro ao sincronizar com Firebase: ${error.message}`);
        showNotification('Erro ao sincronizar com Firebase: ' + error.message, true);
    }
}

// Função para toggle de detalhes no pipeline
function toggleDetails(card) {
    const details = card.querySelector('.card-details');
    if (details) {
        details.style.display = details.style.display === 'none' ? 'block' : 'none';
    }
}

// Tornar funções globais
window.editAppointment = editAppointment;
window.deleteAppointment = deleteAppointment;
window.shareAppointment = shareAppointment;
window.viewAppointment = viewAppointment;
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
window.backupLocal = backupLocal;
window.restoreLocal = restoreLocal;
window.backupFirebase = backupFirebase;
window.restoreFirebase = restoreFirebase;
window.addUser = addUser;
window.deleteUser = deleteUser;
window.toggleDetails = toggleDetails;
