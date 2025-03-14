// Importações do Firebase
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getFirestore, collection, getDocs, setDoc, doc, deleteDoc } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

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
let app, db;
let appointments = [];
let medicos = [];
let users = [];
let currentView = 'list';
let deleteAllPassword = '1234';
let draggedCard = null;
let theme = {};
let errorLogs = [];

// Elementos do DOM
const DOM = {
    appointmentForm: document.getElementById('appointmentForm'),
    appointmentsBody: document.getElementById('appointmentsBody'),
    gridView: document.getElementById('gridView'),
    pipelineView: document.getElementById('pipelineView'),
    statusFilter: document.getElementById('statusFilter'),
    notification: document.getElementById('notification'),
    actionBox: document.getElementById('actionBox'),
    medicoModal: document.getElementById('medicoModal'),
    deleteAllModal: document.getElementById('deleteAllModal'),
    sortFilterModal: document.getElementById('sortFilterModal'),
    settingsModal: document.getElementById('settingsModal'),
    medicosListDisplay: document.getElementById('medicosListDisplay'),
    usersList: document.getElementById('usersList'),
    selectAll: document.getElementById('selectAll'),
    saveTheme: document.getElementById('saveTheme'),
    resetTheme: document.getElementById('resetTheme')
};

// Inicialização do Firebase
function initializeFirebase() {
    try {
        app = initializeApp(firebaseConfig);
        db = getFirestore(app);
        console.log("Firebase inicializado com sucesso!");
    } catch (error) {
        console.error("Erro ao inicializar Firebase:", error);
        showNotification("Erro ao inicializar Firebase: " + error.message, true);
    }
}

// Carregamento Inicial
async function init() {
    console.log("Iniciando aplicação...");
    initializeFirebase();
    await loadInitialData();
    setupEventListeners();
    renderAppointments();
}

async function loadInitialData() {
    try {
        const cachedData = await loadFromIndexedDB();
        appointments = cachedData.appointments || [];
        medicos = cachedData.medicos || [];
        users = cachedData.users && cachedData.users.length > 0 ? cachedData.users : [{ username: 'admin', password: '1234' }];
        currentView = cachedData.settings?.currentView || 'list';
        deleteAllPassword = cachedData.settings?.deleteAllPassword || '1234';
        theme = cachedData.settings?.theme || {};
        
        await syncLocalWithFirebase();
        loadFormData();
        updateMedicosList();
        updateUsersList();
        applyTheme();
        showNotification("Aplicação carregada com sucesso!");
    } catch (error) {
        console.error("Erro ao carregar dados iniciais:", error);
        errorLogs.push(`[${new Date().toISOString()}] Erro ao carregar dados iniciais: ${error.message}`);
        showNotification("Erro ao carregar dados: " + error.message, true);
    }
}

// Configuração de Listeners
function setupEventListeners() {
    console.log("Configurando eventos...");
    DOM.appointmentForm.addEventListener('submit', saveAppointment);
    DOM.statusFilter.addEventListener('change', renderAppointments);
    DOM.selectAll.addEventListener('change', toggleSelectAll);
    document.querySelectorAll('.view-mode').forEach(btn => btn.addEventListener('click', changeView));
    document.getElementById('allBtn').addEventListener('click', () => showTab('allTab'));
    document.getElementById('reportsBtn').addEventListener('click', () => showTab('reportsTab'));
    document.getElementById('insightsBtn').addEventListener('click', () => showTab('insightsTab'));
    document.getElementById('printBtn').addEventListener('click', printAppointments);
    document.getElementById('deleteAllBtn').addEventListener('click', openDeleteAllModal);
    document.getElementById('sortFilterBtn').addEventListener('click', openSortFilterModal);
    document.getElementById('settingsBtn').addEventListener('click', openSettingsModal);
    document.getElementById('resetBtn').addEventListener('click', resetForm);
    document.getElementById('exportExcelBtn').addEventListener('click', exportToExcel);
    document.getElementById('clearFiltersBtn').addEventListener('click', clearFilters);

    DOM.saveTheme.addEventListener('click', saveTheme);
    DOM.resetTheme.addEventListener('click', resetTheme);

    document.querySelectorAll('.column-toggle').forEach(checkbox => {
        checkbox.addEventListener('change', renderAppointments);
    });

    document.querySelectorAll('.modal-close').forEach(btn => btn.addEventListener('click', () => closeModal(btn.closest('.modal'))));
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(modal); });
    });
}

// Funções de CRUD
async function saveAppointment(e) {
    e.preventDefault();
    const appointment = {
        id: DOM.appointmentForm.dataset.id || Date.now().toString(),
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
        showNotification('Erro ao salvar: ' + error.message, true);
    }
}

async function deleteAppointment(id) {
    if (!confirm('Tem certeza que deseja excluir este agendamento?')) return;
    try {
        appointments = appointments.filter(a => a.id !== id);
        await deleteFromFirebase('appointments', id);
        await saveToIndexedDB('appointments', appointments);
        renderAppointments();
        showNotification('Agendamento excluído com sucesso!');
    } catch (error) {
        console.error('Erro ao excluir agendamento:', error);
        showNotification('Erro ao excluir: ' + error.message, true);
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
        window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
    }
}

// Renderização
function renderAppointments() {
    console.log("Renderizando agendamentos...");
    const filteredAppointments = DOM.statusFilter.value === 'all' ? appointments : appointments.filter(app => app.status === DOM.statusFilter.value);
    const visibleColumns = Array.from(document.querySelectorAll('.column-toggle'))
        .filter(t => t.checked)
        .map(t => t.dataset.column);

    DOM.appointmentsBody.innerHTML = '';
    DOM.gridView.innerHTML = '';
    DOM.pipelineView.querySelectorAll('.column-content').forEach(col => col.innerHTML = '');

    document.querySelectorAll('.table-view th').forEach(th => {
        const columnName = th.querySelector('input')?.dataset.column;
        if (columnName) th.style.display = visibleColumns.includes(columnName) ? '' : 'none';
    });

    filteredAppointments.forEach(app => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><input type="checkbox" class="select-row" data-id="${app.id}"></td>
            <td data-column="id" style="display: ${visibleColumns.includes('id') ? '' : 'none'}">${app.id || '-'}</td>
            <td data-column="nomePaciente" style="display: ${visibleColumns.includes('nomePaciente') ? '' : 'none'}">${app.nomePaciente || '-'}</td>
            <td data-column="telefone" style="display: ${visibleColumns.includes('telefone') ? '' : 'none'}">${app.telefone || '-'}</td>
            <td data-column="email" style="display: ${visibleColumns.includes('email') ? '' : 'none'}">${app.email || '-'}</td>
            <td data-column="nomeMedico" style="display: ${visibleColumns.includes('nomeMedico') ? '' : 'none'}">${app.nomeMedico || '-'}</td>
            <td data-column="localCRM" style="display: ${visibleColumns.includes('localCRM') ? '' : 'none'}">${app.localCRM || '-'}</td>
            <td data-column="dataConsulta" style="display: ${visibleColumns.includes('dataConsulta') ? '' : 'none'}">${app.dataConsulta || '-'}</td>
            <td data-column="horaConsulta" style="display: ${visibleColumns.includes('horaConsulta') ? '' : 'none'}">${app.horaConsulta || '-'}</td>
            <td data-column="tipoCirurgia" style="display: ${visibleColumns.includes('tipoCirurgia') ? '' : 'none'}">${app.tipoCirurgia || '-'}</td>
            <td data-column="procedimentos" style="display: ${visibleColumns.includes('procedimentos') ? '' : 'none'}">${app.procedimentos || '-'}</td>
            <td data-column="agendamentoFeitoPor" style="display: ${visibleColumns.includes('agendamentoFeitoPor') ? '' : 'none'}">${app.agendamentoFeitoPor || '-'}</td>
            <td data-column="descricao" style="display: ${visibleColumns.includes('descricao') ? '' : 'none'}">${app.descricao || '-'}</td>
            <td data-column="status" style="display: ${visibleColumns.includes('status') ? '' : 'none'}">${app.status || '-'}</td>
            <td class="no-print">
                <button class="action-btn edit-btn" onclick="editAppointment('${app.id}')">Editar</button>
                <button class="action-btn share-btn" onclick="shareAppointment('${app.id}')">WhatsApp</button>
                <button class="action-btn view-btn" onclick="viewAppointment('${app.id}')">Visualizar</button>
                <button class="action-btn delete-btn" onclick="deleteAppointment('${app.id}')">Excluir</button>
            </td>
        `;
        DOM.appointmentsBody.appendChild(row);

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
        DOM.gridView.appendChild(card);

        const column = DOM.pipelineView.querySelector(`.pipeline-column[data-status="${app.status}"] .column-content`);
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

    DOM.appointmentsTable.classList.toggle('active', currentView === 'list');
    DOM.gridView.classList.toggle('active', currentView === 'grid');
    DOM.pipelineView.classList.toggle('active', currentView === 'pipeline');

    DOM.pipelineView.querySelectorAll('.mini-card').forEach(card => {
        card.addEventListener('dragstart', handleDragStart);
        card.addEventListener('dragend', handleDragEnd);
        card.addEventListener('click', (e) => {
            if (!e.target.classList.contains('action-btn')) handleCardClick(e, card.dataset.id);
        });
    });

    DOM.pipelineView.querySelectorAll('.pipeline-column').forEach(column => {
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
    saveToIndexedDB('settings', { currentView, deleteAllPassword, theme });
}

function showTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.style.display = 'none');
    document.getElementById(tabId).style.display = 'block';
    if (tabId === 'allTab') renderAppointments();
    else if (tabId === 'insightsTab') generateInsights();
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
    }
}

function handleCardClick(e, id) {
    DOM.actionBox.style.display = 'block';
    DOM.actionBox.querySelectorAll('button[data-status]').forEach(btn => {
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
        closeModal(DOM.actionBox);
    }
}

// Funções Auxiliares
function toggleSelectAll(e) {
    document.querySelectorAll('.select-row').forEach(checkbox => checkbox.checked = e.target.checked);
}

function resetForm() {
    DOM.appointmentForm.reset();
    document.getElementById('statusGroup').style.display = 'none';
    delete DOM.appointmentForm.dataset.id;
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
    DOM.appointmentForm.dataset.id = appointment.id || '';
}

function showNotification(message, isError = false) {
    DOM.notification.textContent = message;
    DOM.notification.className = `notification ${isError ? 'error' : ''}`;
    DOM.notification.classList.add('show');
    setTimeout(() => DOM.notification.classList.remove('show'), 3000);
}

function closeModal(modal) {
    modal.style.display = 'none';
}

function clearFilters() {
    DOM.statusFilter.value = 'all';
    renderAppointments();
    showNotification('Filtros limpos!');
}

// Gestão de Médicos
function openMedicoModal() {
    DOM.medicoModal.style.display = 'block';
}

function closeMedicoModal() {
    closeModal(DOM.medicoModal);
}

async function saveMedico() {
    const nome = document.getElementById('novoMedicoNome').value || '';
    const crm = document.getElementById('novoMedicoCRM').value || '';
    if (!nome || !crm) return showNotification('Preencha nome e CRM!', true);
    
    const medico = { nome, crm };
    medicos.push(medico);
    await saveToFirebase('medicos', medico);
    await saveToIndexedDB('medicos', medicos);
    updateMedicosList();
    closeMedicoModal();
    showNotification('Médico cadastrado com sucesso!');
}

function updateMedicosList() {
    const datalist = document.getElementById('medicosList');
    datalist.innerHTML = '';
    DOM.medicosListDisplay.innerHTML = '';
    medicos.forEach(medico => {
        const option = document.createElement('option');
        option.value = medico.nome;
        datalist.appendChild(option);

        const li = document.createElement('li');
        li.innerHTML = `${medico.nome} (CRM: ${medico.crm}) <button class="delete-medico-btn" onclick="deleteMedico('${medico.nome}')">Excluir</button>`;
        DOM.medicosListDisplay.appendChild(li);
    });
}

async function deleteMedico(nome) {
    if (!confirm(`Tem certeza que deseja excluir o médico ${nome}?`)) return;
    medicos = medicos.filter(m => m.nome !== nome);
    await deleteFromFirebase('medicos', nome);
    await saveToIndexedDB('medicos', medicos);
    updateMedicosList();
    showNotification('Médico excluído com sucesso!');
}

// Gestão de Usuários
function updateUsersList() {
    DOM.usersList.innerHTML = '';
    users.forEach(user => {
        const li = document.createElement('li');
        li.innerHTML = `${user.username} <button onclick="deleteUser('${user.username}')">Excluir</button>`;
        DOM.usersList.appendChild(li);
    });
}

async function addUser() {
    const username = document.getElementById('newUsername').value || '';
    const password = document.getElementById('newPassword').value || '';
    if (!username || !password) return showNotification('Preencha usuário e senha!', true);
    
    const user = { username, password };
    users.push(user);
    await saveToFirebase('users', user);
    await saveToIndexedDB('users', users);
    updateUsersList();
    document.getElementById('newUsername').value = '';
    document.getElementById('newPassword').value = '';
    showNotification('Usuário adicionado com sucesso!');
}

async function deleteUser(username) {
    if (!confirm(`Tem certeza que deseja excluir o usuário ${username}?`)) return;
    users = users.filter(u => u.username !== username);
    await deleteFromFirebase('users', username);
    await saveToIndexedDB('users', users);
    updateUsersList();
    showNotification('Usuário excluído com sucesso!');
}

// Backup
async function backupLocal() {
    const data = { appointments, medicos, users, settings: { currentView, deleteAllPassword, theme } };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification('Backup local realizado com sucesso!');
}

async function restoreLocal() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
        try {
            const file = e.target.files[0];
            const text = await file.text();
            const data = JSON.parse(text);
            appointments = data.appointments || [];
            medicos = data.medicos || [];
            users = data.users || [];
            currentView = data.settings?.currentView || 'list';
            deleteAllPassword = data.settings?.deleteAllPassword || '1234';
            theme = data.settings?.theme || {};

            await Promise.all([
                saveToIndexedDB('appointments', appointments),
                saveToIndexedDB('medicos', medicos),
                saveToIndexedDB('users', users),
                saveToIndexedDB('settings', { currentView, deleteAllPassword, theme })
            ]);

            renderAppointments();
            updateMedicosList();
            updateUsersList();
            applyTheme();
            showNotification('Backup restaurado com sucesso!');
        } catch (error) {
            console.error('Erro ao restaurar backup local:', error);
            showNotification('Erro ao restaurar backup: ' + error.message, true);
        }
    };
    input.click();
}

async function backupFirebase() {
    try {
        await Promise.all([
            ...appointments.map(app => saveToFirebase('appointments', app)),
            ...medicos.map(med => saveToFirebase('medicos', med)),
            ...users.map(user => saveToFirebase('users', user)),
            saveToFirebase('settings', { key: 'currentView', value: currentView }),
            saveToFirebase('settings', { key: 'deleteAllPassword', value: deleteAllPassword }),
            saveToFirebase('settings', { key: 'theme', value: theme })
        ]);
        showNotification('Backup enviado ao Firebase com sucesso!');
    } catch (error) {
        console.error('Erro ao fazer backup no Firebase:', error);
        showNotification('Erro ao fazer backup: ' + error.message, true);
    }
}

async function restoreFirebase() {
    try {
        await syncLocalWithFirebase();
        showNotification('Dados restaurados do Firebase com sucesso!');
    } catch (error) {
        console.error('Erro ao restaurar do Firebase:', error);
        showNotification('Erro ao restaurar: ' + error.message, true);
    }
}

// Integração com Firebase
async function saveToFirebase(collectionName, data) {
    if (!db) return;
    try {
        const docId = data.id || data.nome || data.username || data.key;
        const docRef = doc(db, collectionName, docId);
        await setDoc(docRef, data, { merge: true });
        console.log(`Dados salvos em ${collectionName}:`, data);
    } catch (error) {
        console.error(`Erro ao salvar em ${collectionName}:`, error);
        throw error;
    }
}

async function deleteFromFirebase(collectionName, id) {
    if (!db) return;
    try {
        const docRef = doc(db, collectionName, id);
        await deleteDoc(docRef);
        console.log(`Documento excluído de ${collectionName}: ${id}`);
    } catch (error) {
        console.error(`Erro ao excluir de ${collectionName}:`, error);
        throw error;
    }
}

async function syncLocalWithFirebase() {
    if (!db) return;
    try {
        const appointmentsSnapshot = await getDocs(collection(db, 'appointments'));
        const firebaseAppointments = [];
        appointmentsSnapshot.forEach(doc => firebaseAppointments.push({ id: doc.id, ...doc.data() }));
        if (firebaseAppointments.length > 0) appointments = firebaseAppointments;

        const medicosSnapshot = await getDocs(collection(db, 'medicos'));
        const firebaseMedicos = [];
        medicosSnapshot.forEach(doc => firebaseMedicos.push({ nome: doc.id, ...doc.data() }));
        if (firebaseMedicos.length > 0) medicos = firebaseMedicos;

        const usersSnapshot = await getDocs(collection(db, 'users'));
        const firebaseUsers = [];
        usersSnapshot.forEach(doc => firebaseUsers.push({ username: doc.id, ...doc.data() }));
        if (firebaseUsers.length > 0) users = firebaseUsers;

        const settingsSnapshot = await getDocs(collection(db, 'settings'));
        const firebaseSettings = {};
        settingsSnapshot.forEach(doc => firebaseSettings[doc.id] = doc.data().value);
        if (Object.keys(firebaseSettings).length > 0) {
            currentView = firebaseSettings.currentView || 'list';
            deleteAllPassword = firebaseSettings.deleteAllPassword || '1234';
            theme = firebaseSettings.theme || {};
        }

        await Promise.all([
            saveToIndexedDB('appointments', appointments),
            saveToIndexedDB('medicos', medicos),
            saveToIndexedDB('users', users),
            saveToIndexedDB('settings', { currentView, deleteAllPassword, theme })
        ]);

        renderAppointments();
        console.log("Sincronização com Firebase concluída!");
    } catch (error) {
        console.error('Erro ao sincronizar com Firebase:', error);
        throw error;
    }
}

// IndexedDB
async function saveToIndexedDB(storeName, data) {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('ClinicDB', 1);
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('appointments')) db.createObjectStore('appointments', { keyPath: 'id' });
            if (!db.objectStoreNames.contains('medicos')) db.createObjectStore('medicos', { keyPath: 'nome' });
            if (!db.objectStoreNames.contains('users')) db.createObjectStore('users', { keyPath: 'username' });
            if (!db.objectStoreNames.contains('settings')) db.createObjectStore('settings', { keyPath: 'key' });
        };
        request.onsuccess = (event) => {
            const db = event.target.result;
            const transaction = db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            if (Array.isArray(data)) data.forEach(item => store.put(item));
            else store.put({ ...data, key: data.key || 'data' });
            transaction.oncomplete = () => db.close() || resolve();
            transaction.onerror = () => reject(transaction.error);
        };
        request.onerror = (event) => reject(event.target.error);
    });
}

async function loadFromIndexedDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('ClinicDB', 1);
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('appointments')) db.createObjectStore('appointments', { keyPath: 'id' });
            if (!db.objectStoreNames.contains('medicos')) db.createObjectStore('medicos', { keyPath: 'nome' });
            if (!db.objectStoreNames.contains('users')) db.createObjectStore('users', { keyPath: 'username' });
            if (!db.objectStoreNames.contains('settings')) db.createObjectStore('settings', { keyPath: 'key' });
        };
        request.onsuccess = (event) => {
            const db = event.target.result;
            const transaction = db.transaction(['appointments', 'medicos', 'users', 'settings'], 'readonly');
            const data = { appointments: [], medicos: [], users: [], settings: {} };

            transaction.objectStore('appointments').getAll().onsuccess = (e) => data.appointments = e.target.result || [];
            transaction.objectStore('medicos').getAll().onsuccess = (e) => data.medicos = e.target.result || [];
            transaction.objectStore('users').getAll().onsuccess = (e) => data.users = e.target.result || [];
            transaction.objectStore('settings').getAll().onsuccess = (e) => {
                e.target.result.forEach(s => data.settings[s.key] = s.value);
            };

            transaction.oncomplete = () => db.close() || resolve(data);
            transaction.onerror = () => reject(transaction.error);
        };
        request.onerror = (event) => reject(event.target.error);
    });
}

// Impressão
function printAppointments() {
    const visibleColumns = Array.from(document.querySelectorAll('.column-toggle'))
        .filter(t => t.checked)
        .map(t => t.dataset.column);

    const tempTable = document.createElement('table');
    const thead = document.createElement('thead');
    const tbody = document.createElement('tbody');

    const headerRow = document.createElement('tr');
    visibleColumns.forEach(col => {
        const th = document.createElement('th');
        th.textContent = document.querySelector(`.column-toggle[data-column="${col}"]`).parentElement.textContent.trim();
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);

    appointments.forEach(app => {
        const row = document.createElement('tr');
        visibleColumns.forEach(col => {
            const td = document.createElement('td');
            td.textContent = app[col] || '-';
            row.appendChild(td);
        });
        tbody.appendChild(row);
    });

    tempTable.appendChild(thead);
    tempTable.appendChild(tbody);

    const printContainer = document.createElement('div');
    printContainer.className = 'print-container';
    printContainer.appendChild(tempTable);
    document.body.appendChild(printContainer);

    const style = document.createElement('style');
    style.textContent = `
        @media print {
            body * { visibility: hidden; }
            .print-container, .print-container * { visibility: visible; }
            .print-container { position: absolute; left: 0; top: 0; width: 100%; }
            table { width: 100%; border-collapse: collapse; font-size: 10pt; }
            th, td { padding: 5px; border: 1px solid #1e40af; }
        }
    `;
    document.head.appendChild(style);

    window.print();

    document.body.removeChild(printContainer);
    document.head.removeChild(style);
}

// Exportação para Excel
function exportToExcel() {
    const ws = XLSX.utils.json_to_sheet(appointments.map(app => ({
        ID: app.id,
        Paciente: app.nomePaciente,
        Telefone: app.telefone,
        Email: app.email,
        Médico: app.nomeMedico,
        'Local CRM': app.localCRM,
        Data: app.dataConsulta,
        Hora: app.horaConsulta,
        'Tipo Cirurgia': app.tipoCirurgia,
        Procedimentos: app.procedimentos,
        'Feito Por': app.agendamentoFeitoPor,
        Descrição: app.descricao,
        Status: app.status
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Agendamentos');
    XLSX.writeFile(wb, `agendamentos_${new Date().toISOString().split('T')[0]}.xlsx`);
    showNotification('Exportado para Excel com sucesso!');
}

// Relatórios
function generateReport() {
    const reportType = document.getElementById('reportType').value;
    const reportMonth = document.getElementById('reportMonth').value;
    const reportYear = document.getElementById('reportYear').value;
    const reportDoctor = document.getElementById('reportDoctor').value;

    let filteredAppointments = [...appointments];
    if (reportType === 'byName') filteredAppointments.sort((a, b) => a.nomePaciente.localeCompare(b.nomePaciente));
    else if (reportType === 'byRecent') filteredAppointments.sort((a, b) => new Date(b.dataConsulta) - new Date(a.dataConsulta));
    else if (reportType === 'byOldest') filteredAppointments.sort((a, b) => new Date(a.dataConsulta) - new Date(b.dataConsulta));
    else if (reportType === 'byPhone') filteredAppointments.sort((a, b) => a.telefone.localeCompare(b.telefone));
    else if (reportType === 'byDate') filteredAppointments.sort((a, b) => new Date(a.dataConsulta) - new Date(b.dataConsulta));
    else if (reportType === 'byDoctor') filteredAppointments.sort((a, b) => a.nomeMedico.localeCompare(b.nomeMedico));
    else if (reportType === 'byMonth' && reportMonth) {
        const [year, month] = reportMonth.split('-');
        filteredAppointments = filteredAppointments.filter(app => app.dataConsulta.startsWith(`${year}-${month}`));
    } else if (reportType === 'byYear' && reportYear) {
        filteredAppointments = filteredAppointments.filter(app => app.dataConsulta.startsWith(reportYear));
    }
    if (reportDoctor) filteredAppointments = filteredAppointments.filter(app => app.nomeMedico === reportDoctor);

    const reportBody = document.getElementById('reportBody');
    const reportGrid = document.getElementById('reportGrid');
    reportBody.innerHTML = '';
    reportGrid.innerHTML = '';

    filteredAppointments.forEach(app => {
        reportBody.innerHTML += `
            <tr>
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
        `;
        reportGrid.innerHTML += `
            <div class="card">
                <h4>${app.nomePaciente || 'Sem Nome'}</h4>
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
            </div>
        `;
    });
    showNotification('Relatório gerado com sucesso!');
}

function toggleReportView(view) {
    document.querySelectorAll('#reportsTab .view-mode').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`#reportsTab .view-mode[data-view="${view}"]`).classList.add('active');
    document.getElementById('reportResult').style.display = view === 'list' ? 'block' : 'none';
    document.getElementById('reportGrid').style.display = view === 'grid' ? 'grid' : 'none';
}

// Insights
function generateInsights() {
    const insightsCards = document.getElementById('insightsCards');
    insightsCards.innerHTML = '';

    const totalAppointments = appointments.length;
    const byStatus = appointments.reduce((acc, app) => { acc[app.status] = (acc[app.status] || 0) + 1; return acc; }, {});
    const byDoctor = appointments.reduce((acc, app) => { acc[app.nomeMedico] = (acc[app.nomeMedico] || 0) + 1; return acc; }, {});
    const mostCommonProcedures = appointments.reduce((acc, app) => {
        app.procedimentos.split(',').forEach(proc => {
            if (proc.trim()) acc[proc.trim()] = (acc[proc.trim()] || 0) + 1;
        });
        return acc;
    }, {});

    insightsCards.innerHTML = `
        <div class="insights-card"><h4>Total de Agendamentos</h4><p>${totalAppointments} agendamentos registrados.</p></div>
        <div class="insights-card"><h4>Agendamentos por Status</h4><ul>${Object.entries(byStatus).map(([s, c]) => `<li>${s}: ${c}</li>`).join('')}</ul></div>
        <div class="insights-card"><h4>Agendamentos por Médico</h4><ul>${Object.entries(byDoctor).map(([d, c]) => `<li>${d || 'Sem Médico'}: ${c}</li>`).join('')}</ul></div>
        <div class="insights-card"><h4>Procedimentos Mais Comuns</h4><ul>${Object.entries(mostCommonProcedures).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([p, c]) => `<li>${p}: ${c}</li>`).join('')}</ul></div>
        <div class="insights-card error-log-card"><h4>Logs de Erros</h4><ul>${errorLogs.length ? errorLogs.map(log => `<li>${log}</li>`).join('') : '<li>Nenhum erro</li>'}</ul></div>
    `;
}

// Exclusão em Massa
function openDeleteAllModal() {
    DOM.deleteAllModal.style.display = 'block';
}

function closeDeleteAllModal() {
    closeModal(DOM.deleteAllModal);
}

async function confirmDeleteAll() {
    const password = document.getElementById('deletePassword').value;
    if (password !== deleteAllPassword) return showNotification('Senha incorreta!', true);
    
    try {
        appointments = [];
        await saveToIndexedDB('appointments', appointments);
        renderAppointments();
        closeDeleteAllModal();
        showNotification('Todos os agendamentos foram excluídos!');
    } catch (error) {
        console.error('Erro ao excluir todos:', error);
        showNotification('Erro ao excluir: ' + error.message, true);
    }
}

// Filtros Avançados
function openSortFilterModal() {
    DOM.sortFilterModal.style.display = 'block';
}

function closeSortFilterModal() {
    closeModal(DOM.sortFilterModal);
}

function applySortFilter() {
    const sortType = document.getElementById('sortType').value;
    let sortedAppointments = [...appointments];

    if (sortType === 'nameAZ') sortedAppointments.sort((a, b) => a.nomePaciente.localeCompare(b.nomePaciente));
    else if (sortType === 'recent') sortedAppointments.sort((a, b) => new Date(b.dataConsulta) - new Date(a.dataConsulta));
    else if (sortType === 'oldest') sortedAppointments.sort((a, b) => new Date(a.dataConsulta) - new Date(b.dataConsulta));
    else if (sortType === 'phone') sortedAppointments.sort((a, b) => a.telefone.localeCompare(b.telefone));
    else if (sortType === 'date') sortedAppointments.sort((a, b) => new Date(a.dataConsulta) - new Date(b.dataConsulta));
    else if (sortType === 'doctor') sortedAppointments.sort((a, b) => a.nomeMedico.localeCompare(b.nomeMedico));
    else if (sortType === 'month') sortedAppointments.sort((a, b) => a.dataConsulta.slice(0, 7).localeCompare(b.dataConsulta.slice(0, 7)));
    else if (sortType === 'year') sortedAppointments.sort((a, b) => a.dataConsulta.slice(0, 4).localeCompare(b.dataConsulta.slice(0, 4)));

    appointments = sortedAppointments;
    renderAppointments();
    closeSortFilterModal();
    showNotification('Filtro aplicado com sucesso!');
}

// Configurações e Tema
function openSettingsModal() {
    DOM.settingsModal.style.display = 'block';
    document.getElementById('bodyBgColor').value = theme.bodyBgColor || '#f0f4f8';
    document.getElementById('cardBgColor').value = theme.cardBgColor || '#ffffff';
    document.getElementById('formBgColor').value = theme.formBgColor || '#ffffff';
    document.getElementById('textColor').value = theme.textColor || '#1f2937';
    document.getElementById('borderColor').value = theme.borderColor || '#1e40af';
    document.getElementById('deleteAllPassword').value = '';
}

async function saveTheme() {
    theme = {
        bodyBgColor: document.getElementById('bodyBgColor').value,
        cardBgColor: document.getElementById('cardBgColor').value,
        formBgColor: document.getElementById('formBgColor').value,
        textColor: document.getElementById('textColor').value,
        borderColor: document.getElementById('borderColor').value
    };
    const newPassword = document.getElementById('deleteAllPassword').value;
    if (newPassword) deleteAllPassword = newPassword;

    await saveToIndexedDB('settings', { currentView, deleteAllPassword, theme });
    applyTheme();
    showNotification('Tema salvo com sucesso!');
}

function applyTheme() {
    document.body.style.backgroundColor = theme.bodyBgColor || '#f0f4f8';
    document.querySelectorAll('.card, .form-section, .appointments-section, .search-card, .modal-content')
        .forEach(el => el.style.backgroundColor = theme.cardBgColor || '#ffffff');
    document.querySelector('.form-section').style.backgroundColor = theme.formBgColor || '#ffffff';
    document.body.style.color = theme.textColor || '#1f2937';
    document.querySelectorAll('input, select, textarea, .search-card, .form-section, .appointments-section, .modal-content, table')
        .forEach(el => el.style.borderColor = theme.borderColor || '#1e40af');
}

async function resetTheme() {
    theme = {};
    deleteAllPassword = '1234';
    await saveToIndexedDB('settings', { currentView, deleteAllPassword, theme });
    applyTheme();
    showNotification('Tema restaurado para o padrão!');
}

// Detalhes nos Mini-Cards
function toggleDetails(card) {
    const details = card.querySelector('.card-details');
    details.style.display = details.style.display === 'none' ? 'block' : 'none';
}

// Inicialização
document.addEventListener('DOMContentLoaded', init);
