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

// Inicialização do Firebase
let app, db;
try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    console.log("Firebase inicializado com sucesso!");
} catch (error) {
    console.error("Erro ao inicializar Firebase:", error);
}

// Variáveis Globais
let appointments = [];
let medicos = [];
let users = [];
let currentView = 'list';
let lastSync = 0;
let deleteAllPassword = '1234';
let draggedCard = null;
let theme = {};
let errorLogs = [];

// Elementos do DOM
const appointmentForm = document.getElementById('appointmentForm');
const appointmentsBody = document.getElementById('appointmentsBody');
const gridView = document.getElementById('gridView');
const pipelineView = document.getElementById('pipelineView');
const statusFilter = document.getElementById('statusFilter');
const notification = document.getElementById('notification');
const actionBox = document.getElementById('actionBox');
const medicoModal = document.getElementById('medicoModal');
const deleteAllModal = document.getElementById('deleteAllModal');
const sortFilterModal = document.getElementById('sortFilterModal');
const settingsModal = document.getElementById('settingsModal');
const medicosListDisplay = document.getElementById('medicosListDisplay');
const usersList = document.getElementById('usersList');

// Inicialização
document.addEventListener('DOMContentLoaded', async () => {
    console.log("DOM carregado, iniciando aplicação...");
    await loadInitialData();
    setupEventListeners();
    renderAppointments();

    document.querySelectorAll('.modal-close').forEach(btn => btn.addEventListener('click', () => closeModal(btn.closest('.modal'))));
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal(modal);
        });
    });
});

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
        showNotification('Aplicação inicializada com sucesso!');
    } catch (error) {
        console.error('Erro ao carregar dados iniciais:', error);
        errorLogs.push(`[${new Date().toISOString()}] Erro ao carregar dados iniciais: ${error.message}`);
        showNotification('Erro ao inicializar: ' + error.message, true);
        const cachedData = await loadFromIndexedDB();
        appointments = cachedData.appointments || [];
        medicos = cachedData.medicos || [];
        users = cachedData.users || [{ username: 'admin', password: '1234' }];
        renderAppointments();
    }
}

// Configuração de Listeners
function setupEventListeners() {
    console.log("Configurando eventos...");
    appointmentForm.addEventListener('submit', saveAppointment);
    statusFilter.addEventListener('change', renderAppointments);
    document.getElementById('selectAll').addEventListener('change', toggleSelectAll);
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

    // Configurações
    document.getElementById('saveTheme').addEventListener('click', saveTheme);
    document.getElementById('resetTheme').addEventListener('click', resetTheme);
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
        const columnName = el.querySelector('input')?.dataset.column;
        if (columnName) {
            el.classList.toggle('hidden', !visibleColumns.includes(columnName));
        }
    });

    filteredAppointments.forEach(app => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><input type="checkbox" class="select-row" data-id="${app.id}"></td>
            <td data-column="id">${app.id || '-'}</td>
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
    saveToIndexedDB('settings', { key: 'currentView', value: currentView });
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
    notification.textContent = message;
    notification.className = `notification ${isError ? 'error' : ''}`;
    notification.classList.add('show');
    setTimeout(() => notification.classList.remove('show'), 3000);
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
            lastSync = data.settings?.lastSync || 0;
            theme = data.settings?.theme || {};

            await Promise.all([
                saveToFirebase('appointments', appointments),
                saveToFirebase('medicos', medicos),
                saveToFirebase('users', users),
                saveToFirebase('settings', { key: 'currentView', value: currentView }),
                saveToFirebase('settings', { key: 'deleteAllPassword', value: deleteAllPassword }),
                saveToFirebase('settings', { key: 'theme', value: theme })
            ]);

            await Promise.all([
                saveToIndexedDB('appointments', appointments),
                saveToIndexedDB('medicos', medicos),
                saveToIndexedDB('users', users),
                saveToIndexedDB('settings', { currentView, deleteAllPassword, lastSync, theme })
            ]);

            renderAppointments();
            updateMedicosList();
            updateUsersList();
            applyTheme();
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
        await Promise.all([
            ...appointments.map(appointment => saveToFirebase('appointments', appointment)),
            ...medicos.map(medico => saveToFirebase('medicos', medico)),
            ...users.map(user => saveToFirebase('users', user)),
            saveToFirebase('settings', { key: 'currentView', value: currentView }),
            saveToFirebase('settings', { key: 'deleteAllPassword', value: deleteAllPassword }),
            saveToFirebase('settings', { key: 'theme', value: theme })
        ]);
        showNotification('Backup enviado ao Firebase com sucesso!');
    } catch (error) {
        console.error('Erro ao fazer backup no Firebase:', error);
        errorLogs.push(`[${new Date().toISOString()}] Erro ao fazer backup no Firebase: ${error.message}`);
        showNotification('Erro ao fazer backup: ' + error.message, true);
    }
}

async function restoreFirebase() {
    try {
        await syncLocalWithFirebase();
        showNotification('Dados restaurados do Firebase com sucesso!');
    } catch (error) {
        console.error('Erro ao restaurar do Firebase:', error);
        errorLogs.push(`[${new Date().toISOString()}] Erro ao restaurar do Firebase: ${error.message}`);
        showNotification('Erro ao restaurar: ' + error.message, true);
    }
}

// Integração com Firebase
async function saveToFirebase(collectionName, data) {
    try {
        const cleanedData = {};
        for (const [key, value] of Object.entries(data)) {
            cleanedData[key] = value !== undefined ? value : null;
        }
        const docId = Array.isArray(data) ? data.map(d => d.id || d.nome || d.username) : (data.id || data.nome || data.username || data.key);
        if (Array.isArray(data)) {
            for (const item of data) {
                const docRef = doc(db, collectionName, item.id || item.nome || item.username);
                await setDoc(docRef, item, { merge: true });
            }
        } else {
            const docRef = doc(db, collectionName, docId);
            await setDoc(docRef, cleanedData, { merge: true });
        }
        console.log(`Dados salvos em ${collectionName}:`, cleanedData);
    } catch (error) {
        console.error(`Erro ao salvar em ${collectionName}:`, error);
        errorLogs.push(`[${new Date().toISOString()}] Erro ao salvar em ${collectionName}: ${error.message}`);
        throw error;
    }
}

async function deleteFromFirebase(collectionName, id) {
    try {
        const docRef = doc(db, collectionName, id);
        await deleteDoc(docRef);
        console.log(`Documento excluído de ${collectionName}: ${id}`);
    } catch (error) {
        console.error(`Erro ao excluir de ${collectionName}:`, error);
        errorLogs.push(`[${new Date().toISOString()}] Erro ao excluir de ${collectionName}: ${error.message}`);
        throw error;
    }
}

async function syncLocalWithFirebase() {
    try {
        console.log("Sincronizando com Firebase...");
        const appointmentsSnapshot = await getDocs(collection(db, 'appointments'));
        const firebaseAppointments = [];
        appointmentsSnapshot.forEach(doc => firebaseAppointments.push({ id: doc.id, ...doc.data() }));
        if (firebaseAppointments.length > 0) {
            appointments = firebaseAppointments;
            await saveToIndexedDB('appointments', appointments);
        } else if (appointments.length > 0) {
            for (const appointment of appointments) await saveToFirebase('appointments', appointment);
        }

        const medicosSnapshot = await getDocs(collection(db, 'medicos'));
        const firebaseMedicos = [];
        medicosSnapshot.forEach(doc => firebaseMedicos.push({ nome: doc.id, ...doc.data() }));
        if (firebaseMedicos.length > 0) {
            medicos = firebaseMedicos;
            await saveToIndexedDB('medicos', medicos);
        } else if (medicos.length > 0) {
            for (const medico of medicos) await saveToFirebase('medicos', medico);
        }

        const usersSnapshot = await getDocs(collection(db, 'users'));
        const firebaseUsers = [];
        usersSnapshot.forEach(doc => firebaseUsers.push({ username: doc.id, ...doc.data() }));
        if (firebaseUsers.length > 0) {
            users = firebaseUsers;
            await saveToIndexedDB('users', users);
        } else if (users.length > 0) {
            for (const user of users) await saveToFirebase('users', user);
        }

        const settingsSnapshot = await getDocs(collection(db, 'settings'));
        const firebaseSettings = {};
        settingsSnapshot.forEach(doc => firebaseSettings[doc.id] = doc.data().value);
        if (Object.keys(firebaseSettings).length > 0) {
            currentView = firebaseSettings.currentView || 'list';
            deleteAllPassword = firebaseSettings.deleteAllPassword || '1234';
            theme = firebaseSettings.theme || {};
            lastSync = Date.now();
            await saveToIndexedDB('settings', { currentView, deleteAllPassword, lastSync, theme });
        } else {
            await saveToFirebase('settings', { key: 'currentView', value: currentView });
            await saveToFirebase('settings', { key: 'deleteAllPassword', value: deleteAllPassword });
            await saveToFirebase('settings', { key: 'theme', value: theme });
        }

        console.log("Sincronização concluída!");
        renderAppointments();
        lastSync = Date.now();
        await saveToIndexedDB('settings', { key: 'lastSync', value: lastSync });
    } catch (error) {
        console.error('Erro ao sincronizar com Firebase:', error);
        errorLogs.push(`[${new Date().toISOString()}] Erro ao sincronizar com Firebase: ${error.message}`);
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
            if (Array.isArray(data)) {
                data.forEach(item => store.put(item));
            } else {
                store.put({ ...data, key: data.key || 'data' });
            }
            transaction.oncomplete = () => {
                db.close();
                resolve();
            };
            transaction.onerror = () => {
                console.error('Erro ao salvar no IndexedDB:', transaction.error);
                errorLogs.push(`[${new Date().toISOString()}] Erro ao salvar no IndexedDB: ${transaction.error}`);
                reject(transaction.error);
            };
        };
        request.onerror = () => {
            console.error('Erro ao abrir IndexedDB:', request.error);
            errorLogs.push(`[${new Date().toISOString()}] Erro ao abrir IndexedDB: ${request.error}`);
            reject(request.error);
        };
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
            const appointmentsStore = transaction.objectStore('appointments');
            const medicosStore = transaction.objectStore('medicos');
            const usersStore = transaction.objectStore('users');
            const settingsStore = transaction.objectStore('settings');

            const data = { appointments: [], medicos: [], users: [], settings: {} };
            appointmentsStore.getAll().onsuccess = (e) => data.appointments = e.target.result || [];
            medicosStore.getAll().onsuccess = (e) => data.medicos = e.target.result || [];
            usersStore.getAll().onsuccess = (e) => data.users = e.target.result || [];
            settingsStore.getAll().onsuccess = (e) => e.target.result.forEach(s => data.settings[s.key] = s.value);

            transaction.oncomplete = () => {
                db.close();
                resolve(data);
            };
            transaction.onerror = () => {
                console.error('Erro ao carregar do IndexedDB:', transaction.error);
                errorLogs.push(`[${new Date().toISOString()}] Erro ao carregar do IndexedDB: ${transaction.error}`);
                reject(transaction.error);
            };
        };
        request.onerror = () => {
            console.error('Erro ao abrir IndexedDB:', request.error);
            errorLogs.push(`[${new Date().toISOString()}] Erro ao abrir IndexedDB: ${request.error}`);
            reject(request.error);
        };
    });
}

// Relatórios e Insights
function generateReport() {
    const reportType = document.getElementById('reportType').value;
    const reportBody = document.getElementById('reportBody');
    const reportGrid = document.getElementById('reportGrid');
    let filteredAppointments = [...appointments];

    if (reportType === 'byName') filteredAppointments.sort((a, b) => a.nomePaciente.localeCompare(b.nomePaciente));
    else if (reportType === 'byRecent') filteredAppointments.sort((a, b) => new Date(b.dataConsulta) - new Date(a.dataConsulta));
    else if (reportType === 'byOldest') filteredAppointments.sort((a, b) => new Date(a.dataConsulta) - new Date(b.dataConsulta));
    else if (reportType === 'byPhone') filteredAppointments.sort((a, b) => a.telefone.localeCompare(b.telefone));
    else if (reportType === 'byDate') filteredAppointments.sort((a, b) => a.dataConsulta.localeCompare(b.dataConsulta));
    else if (reportType === 'byDoctor') {
        const doctor = document.getElementById('reportDoctor').value;
        filteredAppointments = filteredAppointments.filter(a => a.nomeMedico === doctor);
    } else if (reportType === 'byMonth') {
        const month = document.getElementById('reportMonth').value;
        filteredAppointments = filteredAppointments.filter(a => a.dataConsulta.startsWith(month));
    } else if (reportType === 'byYear') {
        const year = document.getElementById('reportYear').value;
        filteredAppointments = filteredAppointments.filter(a => a.dataConsulta.startsWith(year));
    }

    reportBody.innerHTML = '';
    reportGrid.innerHTML = '';
    filteredAppointments.forEach(app => {
        const row = document.createElement('tr');
        row.innerHTML = `
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
            <p>Data: ${app.dataConsulta || '-'}</p>
            <p>Hora: ${app.horaConsulta || '-'}</p>
            <p>Status: ${app.status || '-'}</p>
        `;
        reportGrid.appendChild(card);
    });
}

function toggleReportView(view) {
    document.querySelectorAll('#reportsTab .view-mode').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`#reportsTab .view-mode[data-view="${view}"]`).classList.add('active');
    document.getElementById('reportResult').style.display = view === 'list' ? 'block' : 'none';
    document.getElementById('reportGrid').style.display = view === 'grid' ? 'grid' : 'none';
}

function generateInsights() {
    const insightsCards = document.getElementById('insightsCards');
    insightsCards.innerHTML = '';

    const totalAppointments = appointments.length;
    const statusCount = { 'Aguardando Atendimento': 0, 'Atendido': 0, 'Reagendado': 0, 'Cancelado': 0 };
    appointments.forEach(app => statusCount[app.status]++);

    const doctorCount = {};
    appointments.forEach(app => doctorCount[app.nomeMedico] = (doctorCount[app.nomeMedico] || 0) + 1);
    const topDoctors = Object.entries(doctorCount).sort((a, b) => b[1] - a[1]).slice(0, 5);

    const insights = [
        {
            title: '<i class="fas fa-calendar-check"></i> Total de Agendamentos',
            content: `<p>${totalAppointments} agendamentos registrados.</p>`
        },
        {
            title: '<i class="fas fa-chart-pie"></i> Status dos Agendamentos',
            content: `<canvas id="statusChart" height="150"></canvas>`
        },
        {
            title: '<i class="fas fa-user-md"></i> Médicos Mais Ativos',
            content: `<ul>${topDoctors.map(([name, count]) => `<li>${name}: ${count} agendamentos</li>`).join('')}</ul>`
        },
        {
            title: '<i class="fas fa-database"></i> Dados do Firebase',
            content: `
                <p>Agendamentos: ${appointments.length}</p>
                <p>Médicos: ${medicos.length}</p>
                <p>Usuários: ${users.length}</p>
                <p>Última sincronização: ${new Date(lastSync).toLocaleString()}</p>
            `
        },
        {
            title: '<i class="fas fa-hdd"></i> Dados do IndexedDB',
            content: `<p>Tamanho estimado: ${JSON.stringify({ appointments, medicos, users }).length / 1024} KB</p>`
        },
        {
            title: '<i class="fas fa-exclamation-triangle"></i> Logs de Erros',
            content: `<div class="error-log-card">${errorLogs.length > 0 ? errorLogs.join('<br>') : 'Nenhum erro registrado.'}</div>`
        }
    ];

    insights.forEach(insight => {
        const card = document.createElement('div');
        card.className = 'insights-card';
        card.innerHTML = `<h4>${insight.title}</h4>${insight.content}`;
        insightsCards.appendChild(card);
    });

    // Gráfico de Status
    const ctx = document.getElementById('statusChart').getContext('2d');
    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: Object.keys(statusCount),
            datasets: [{
                data: Object.values(statusCount),
                backgroundColor: ['#fef9c3', '#dcfce7', '#dbeafe', '#fee2e2'],
                borderColor: ['#facc15', '#22c55e', '#3b82f6', '#ef4444'],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });
}

// Impressão
function printAppointments() {
    if (currentView === 'list') {
        document.getElementById('appointmentsTable').classList.add('print');
        document.getElementById('gridView').classList.remove('print');
    } else if (currentView === 'grid') {
        document.getElementById('gridView').classList.add('print');
        document.getElementById('appointmentsTable').classList.remove('print');
    }
    window.print();
    document.getElementById('appointmentsTable').classList.remove('print');
    document.getElementById('gridView').classList.remove('print');
}

// Exportação para Excel
function exportToExcel() {
    const data = appointments.map(app => ({
        ID: app.id || '',
        Paciente: app.nomePaciente || '',
        Telefone: app.telefone || '',
        Email: app.email || '',
        Médico: app.nomeMedico || '',
        'Local CRM': app.localCRM || '',
        Data: app.dataConsulta || '',
        Hora: app.horaConsulta || '',
        'Tipo Cirurgia': app.tipoCirurgia || '',
        Procedimentos: app.procedimentos || '',
        'Feito Por': app.agendamentoFeitoPor || '',
        Descrição: app.descricao || '',
        Status: app.status || ''
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Agendamentos');
    XLSX.writeFile(wb, `agendamentos_${new Date().toISOString().split('T')[0]}.xlsx`);
    showNotification('Exportação para Excel concluída!');
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
    if (sortType === 'nameAZ') sortedAppointments.sort((a, b) => a.nomePaciente.localeCompare(b.nomePaciente));
    else if (sortType === 'recent') sortedAppointments.sort((a, b) => new Date(b.dataConsulta) - new Date(a.dataConsulta));
    else if (sortType === 'oldest') sortedAppointments.sort((a, b) => new Date(a.dataConsulta) - new Date(b.dataConsulta));
    else if (sortType === 'phone') sortedAppointments.sort((a, b) => a.telefone.localeCompare(b.telefone));
    else if (sortType === 'date') sortedAppointments.sort((a, b) => a.dataConsulta.localeCompare(b.dataConsulta));
    else if (sortType === 'doctor') sortedAppointments.sort((a, b) => a.nomeMedico.localeCompare(b.nomeMedico));
    else if (sortType === 'month') sortedAppointments.sort((a, b) => a.dataConsulta.slice(0, 7).localeCompare(b.dataConsulta.slice(0, 7)));
    else if (sortType === 'year') sortedAppointments.sort((a, b) => a.dataConsulta.slice(0, 4).localeCompare(b.dataConsulta.slice(0, 4)));
    appointments = sortedAppointments;
    renderAppointments();
    closeSortFilterModal();
}

// Configurações
function openSettingsModal() {
    document.getElementById('deleteAllPassword').value = deleteAllPassword;
    settingsModal.style.display = 'block';
}

async function saveTheme() {
    try {
        theme = {
            bodyBgColor: document.getElementById('bodyBgColor').value,
            cardBgColor: document.getElementById('cardBgColor').value,
            formBgColor: document.getElementById('formBgColor').value,
            textColor: document.getElementById('textColor').value,
            borderColor: document.getElementById('borderColor').value
        };
        applyTheme();
        await saveToFirebase('settings', { key: 'theme', value: theme });
        await saveToIndexedDB('settings', { key: 'theme', value: theme });
        showNotification('Tema salvo com sucesso!');
    } catch (error) {
        console.error('Erro ao salvar tema:', error);
        errorLogs.push(`[${new Date().toISOString()}] Erro ao salvar tema: ${error.message}`);
        showNotification('Erro ao salvar tema: ' + error.message, true);
    }
}

function applyTheme() {
    document.body.style.backgroundColor = theme.bodyBgColor || '#f0f4f8';
    document.querySelectorAll('.card, .search-card, .appointments-section, .form-section').forEach(el => {
        el.style.backgroundColor = theme.cardBgColor || '#ffffff';
        el.style.borderColor = theme.borderColor || '#1e40af';
    });
    document.querySelector('.form-section').style.backgroundColor = theme.formBgColor || '#ffffff';
    document.body.style.color = theme.textColor || '#1f2937';
}

async function resetTheme() {
    try {
        theme = {};
        applyTheme();
        await saveToFirebase('settings', { key: 'theme', value: theme });
        await saveToIndexedDB('settings', { key: 'theme', value: theme });
        showNotification('Tema restaurado para o padrão!');
    } catch (error) {
        console.error('Erro ao restaurar tema:', error);
        errorLogs.push(`[${new Date().toISOString()}] Erro ao restaurar tema: ${error.message}`);
        showNotification('Erro ao restaurar tema: ' + error.message, true);
    }
}

// Exclusão de Todos
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
            await saveToFirebase('appointments', appointments);
            await saveToIndexedDB('appointments', appointments);
            const querySnapshot = await getDocs(collection(db, 'appointments'));
            await Promise.all(querySnapshot.docs.map(doc => deleteDoc(doc.ref)));
            renderAppointments();
            closeDeleteAllModal();
            showNotification('Todos os agendamentos foram excluídos!');
        } catch (error) {
            console.error('Erro ao excluir todos:', error);
            errorLogs.push(`[${new Date().toISOString()}] Erro ao excluir todos: ${error.message}`);
            showNotification('Erro ao excluir todos: ' + error.message, true);
        }
    } else {
        showNotification('Senha incorreta!', true);
    }
}

// Detalhes no Pipeline
function toggleDetails(card) {
    const details = card.querySelector('.card-details');
    details.style.display = details.style.display === 'none' ? 'block' : 'none';
}

// Exportar Funções Globais
window.editAppointment = editAppointment;
window.deleteAppointment = deleteAppointment;
window.shareAppointment = shareAppointment;
window.viewAppointment = viewAppointment;
window.openMedicoModal = openMedicoModal;
window.closeMedicoModal = closeMedicoModal;
window.saveMedico = saveMedico;
window.deleteMedico = deleteMedico;
window.addUser = addUser;
window.deleteUser = deleteUser;
window.generateReport = generateReport;
window.toggleReportView = toggleReportView;
window.backupLocal = backupLocal;
window.restoreLocal = restoreLocal;
window.backupFirebase = backupFirebase;
window.restoreFirebase = restoreFirebase;
window.openDeleteAllModal = openDeleteAllModal;
window.closeDeleteAllModal = closeDeleteAllModal;
window.confirmDeleteAll = confirmDeleteAll;
window.openSortFilterModal = openSortFilterModal;
window.closeSortFilterModal = closeSortFilterModal;
window.applySortFilter = applySortFilter;
window.openSettingsModal = openSettingsModal;
window.saveTheme = saveTheme;
window.resetTheme = resetTheme;
window.toggleDetails = toggleDetails;
