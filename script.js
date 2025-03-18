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
let autoBackupInterval = null;

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
let settingsCards = null;
let medicosListDisplay = null;
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
    alert("Erro ao inicializar Firebase. Verifique a configuração.");
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
    settingsCards = document.getElementById('settingsCards');
    medicosListDisplay = document.getElementById('medicosListDisplay');
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
        document.getElementById('settingsBtn')?.addEventListener('click', () => { showTab('settingsTab'); loadSettingsTab(); showNotification('Aba "Configurações" selecionada!'); });
        document.getElementById('printBtn')?.addEventListener('click', printAppointments);
        document.getElementById('deleteAllBtn')?.addEventListener('click', () => { openDeleteAllModal(); showNotification('Modal de exclusão aberto!'); });
        document.getElementById('sortFilterBtn')?.addEventListener('click', () => { openSortFilterModal(); showNotification('Modal de filtros aberto!'); });
        document.getElementById('resetBtn')?.addEventListener('click', () => { resetForm(); showNotification('Formulário resetado!'); });
        document.getElementById('exportExcelBtn')?.addEventListener('click', () => { exportToExcel(); });
        document.getElementById('clearFiltersBtn')?.addEventListener('click', () => { clearFilters(); showNotification('Filtros limpos!'); });
        document.getElementById('logoutBtn')?.addEventListener('click', () => { logoutUser(); showNotification('Logout solicitado!'); });
        document.getElementById('statusFilterBtn')?.addEventListener('click', () => { scrollToStatusSection(); showNotification('Navegando para seção de status!'); });
        if (prevPageBtn) prevPageBtn.addEventListener('click', () => { changePage(-1); showNotification('Página anterior!'); });
        if (nextPageBtn) nextPageBtn.addEventListener('click', () => { changePage(1); showNotification('Próxima página!'); });
        if (itemsPerPageSelect) itemsPerPageSelect.addEventListener('change', () => { itemsPerPage = parseInt(itemsPerPageSelect.value); currentPage = 1; renderAppointments(); showNotification(`Itens por página alterados para ${itemsPerPage}!`); });
        if (selectAllBtn) selectAllBtn.addEventListener('click', toggleSelectAllItems);

        document.getElementById('globalSearch')?.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            filterAppointments(searchTerm);
            showNotification(`Buscando por "${searchTerm}"...`);
        });

        document.getElementById('autoBackupToggle')?.addEventListener('change', (e) => {
            const enabled = e.target.value === 'true';
            toggleAutoBackup(enabled);
            localStorage.setItem('autoBackup', enabled);
            showNotification(`Backup automático ${enabled ? 'ativado' : 'desativado'}!`);
        });

        document.querySelectorAll('.modal-close').forEach(btn => btn.addEventListener('click', () => { closeModal(btn.closest('.modal')); showNotification('Modal fechado!'); }));
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) { closeModal(modal); showNotification('Modal fechado ao clicar fora!'); }
            });
        });
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
        const autoBackupEnabled = localStorage.getItem('autoBackup') !== 'false';
        document.getElementById('autoBackupToggle').value = autoBackupEnabled ? 'true' : 'false';
        toggleAutoBackup(autoBackupEnabled);

        loadFormData();
        updateMedicosList();
        applyTheme();
        renderAppointments();
        generateInsights();
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
        } else {
            appointments.push(appointment);
        }

        await saveToFirebase('appointments', appointment);
        await saveToIndexedDB('appointments', appointments);
        renderAppointments();
        resetForm();
        showNotification('Agendamento salvo com sucesso!');
    } catch (error) {
        console.error('Erro ao salvar agendamento:', error);
        errorLogs.push(`[${new Date().toISOString()}] Erro ao salvar agendamento: ${error.message}`);
        showNotification('Erro ao salvar agendamento: ' + error.message, true);
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
            showNotification('Editando agendamento...');
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
            showNotification('Visualizando agendamento...');
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
            const text = `Agendamento: ${appointment.nomePaciente} - ${appointment.dataConsulta} às ${appointment.horaConsulta} com ${appointment.nomeMedico}`;
            if (navigator.share) {
                navigator.share({ title: 'Agendamento', text }).then(() => showNotification('Agendamento compartilhado!'));
            } else {
                navigator.clipboard.writeText(text).then(() => showNotification('Texto copiado para área de transferência!'));
            }
        }
    } catch (error) {
        console.error('Erro ao compartilhar agendamento:', error);
        errorLogs.push(`[${new Date().toISOString()}] Erro ao compartilhar agendamento: ${error.message}`);
        showNotification('Erro ao compartilhar: ' + error.message, true);
    }
}

// Renderização de Agendamentos
function renderAppointments(filteredAppointments = appointments) {
    try {
        const status = statusFilter.value;
        let data = status === 'all' ? filteredAppointments : filteredAppointments.filter(a => a.status === status);
        totalPages = Math.ceil(data.length / itemsPerPage);
        const start = (currentPage - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        const paginatedData = data.slice(start, end);

        pageInfo.textContent = `Página ${currentPage} de ${totalPages}`;
        prevPageBtn.disabled = currentPage === 1;
        nextPageBtn.disabled = currentPage === totalPages;

        appointmentsBody.innerHTML = '';
        gridView.innerHTML = '';
        pipelineView.querySelectorAll('.column-content').forEach(col => col.innerHTML = '');

        paginatedData.forEach(appointment => {
            if (currentView === 'list') {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td><input type="checkbox" class="select-row" data-id="${appointment.id}"></td>
                    <td>${appointment.id || '-'}</td>
                    <td>${appointment.nomePaciente || '-'}</td>
                    <td>${appointment.telefone || '-'}</td>
                    <td>${appointment.email || '-'}</td>
                    <td>${appointment.nomeMedico || '-'}</td>
                    <td>${appointment.localCRM || '-'}</td>
                    <td>${appointment.dataConsulta || '-'}</td>
                    <td>${appointment.horaConsulta || '-'}</td>
                    <td>${appointment.tipoCirurgia || '-'}</td>
                    <td>${appointment.procedimentos || '-'}</td>
                    <td>${appointment.agendamentoFeitoPor || '-'}</td>
                    <td>${appointment.descricao || '-'}</td>
                    <td>${appointment.status || '-'}</td>
                    <td class="no-print">
                        <button class="action-btn edit-btn" onclick="editAppointment('${appointment.id}')">Editar</button>
                        <button class="action-btn view-btn" onclick="viewAppointment('${appointment.id}')">Visualizar</button>
                        <button class="action-btn share-btn" onclick="shareAppointment('${appointment.id}')">Compartilhar</button>
                        <button class="action-btn delete-btn" onclick="deleteAppointment('${appointment.id}')">Excluir</button>
                    </td>
                `;
                appointmentsBody.appendChild(row);
            } else if (currentView === 'grid') {
                const card = document.createElement('div');
                card.className = 'card';
                card.innerHTML = `
                    <h4>${appointment.nomePaciente || 'Sem Nome'}</h4>
                    <p>ID: ${appointment.id || '-'}</p>
                    <p>Telefone: ${appointment.telefone || '-'}</p>
                    <p>Email: ${appointment.email || '-'}</p>
                    <p>Médico: ${appointment.nomeMedico || '-'}</p>
                    <p>Local CRM: ${appointment.localCRM || '-'}</p>
                    <p>Data: ${appointment.dataConsulta || '-'}</p>
                    <p>Hora: ${appointment.horaConsulta || '-'}</p>
                    <p>Tipo Cirurgia: ${appointment.tipoCirurgia || '-'}</p>
                    <p>Procedimentos: ${appointment.procedimentos || '-'}</p>
                    <p>Feito Por: ${appointment.agendamentoFeitoPor || '-'}</p>
                    <p>Descrição: ${appointment.descricao || '-'}</p>
                    <p>Status: ${appointment.status || '-'}</p>
                    <div class="card-actions no-print">
                        <button class="action-btn edit-btn" onclick="editAppointment('${appointment.id}')">Editar</button>
                        <button class="action-btn view-btn" onclick="viewAppointment('${appointment.id}')">Visualizar</button>
                        <button class="action-btn share-btn" onclick="shareAppointment('${appointment.id}')">Compartilhar</button>
                        <button class="action-btn delete-btn" onclick="deleteAppointment('${appointment.id}')">Excluir</button>
                    </div>
                `;
                gridView.appendChild(card);
            } else if (currentView === 'pipeline') {
                const column = pipelineView.querySelector(`.pipeline-column[data-status="${appointment.status}"] .column-content`);
                if (column) {
                    const miniCard = document.createElement('div');
                    miniCard.className = 'mini-card';
                    miniCard.dataset.id = appointment.id;
                    miniCard.dataset.status = appointment.status;
                    miniCard.draggable = true;
                    miniCard.innerHTML = `
                        <h4>${appointment.nomePaciente || 'Sem Nome'}</h4>
                        <p>ID: ${appointment.id || '-'}</p>
                        <p>Médico: ${appointment.nomeMedico || '-'}</p>
                        <p>Data: ${appointment.dataConsulta || '-'} às ${appointment.horaConsulta || '-'}</p>
                        <div class="card-actions no-print">
                            <button class="action-btn edit-btn" onclick="editAppointment('${appointment.id}')">Editar</button>
                            <button class="action-btn view-btn" onclick="viewAppointment('${appointment.id}')">Visualizar</button>
                            <button class="action-btn delete-btn" onclick="deleteAppointment('${appointment.id}')">Excluir</button>
                        </div>
                    `;
                    miniCard.addEventListener('dragstart', (e) => { draggedCard = e.target; });
                    column.appendChild(miniCard);
                }
            }
        });

        if (currentView === 'pipeline') {
            pipelineView.querySelectorAll('.pipeline-column').forEach(column => {
                column.addEventListener('dragover', (e) => e.preventDefault());
                column.addEventListener('drop', (e) => {
                    e.preventDefault();
                    const status = column.dataset.status;
                    if (draggedCard) {
                        moveCard(status, draggedCard.dataset.id);
                        draggedCard = null;
                    }
                });
            });
        }

        toggleColumnVisibility();
        document.getElementById('appointmentsTable').classList.toggle('active', currentView === 'list');
        gridView.classList.toggle('active', currentView === 'grid');
        pipelineView.classList.toggle('active', currentView === 'pipeline');
    } catch (error) {
        console.error('Erro ao renderizar agendamentos:', error);
        errorLogs.push(`[${new Date().toISOString()}] Erro ao renderizar agendamentos: ${error.message}`);
        showNotification('Erro ao renderizar agendamentos: ' + error.message, true);
    }
}

// Função de Busca Global
function filterAppointments(searchTerm) {
    try {
        const filtered = appointments.filter(app => 
            (app.nomePaciente?.toLowerCase().includes(searchTerm)) ||
            (app.telefone?.toLowerCase().includes(searchTerm)) ||
            (app.email?.toLowerCase().includes(searchTerm)) ||
            (app.nomeMedico?.toLowerCase().includes(searchTerm)) ||
            (app.localCRM?.toLowerCase().includes(searchTerm)) ||
            (app.dataConsulta?.toLowerCase().includes(searchTerm)) ||
            (app.horaConsulta?.toLowerCase().includes(searchTerm)) ||
            (app.tipoCirurgia?.toLowerCase().includes(searchTerm)) ||
            (app.procedimentos?.toLowerCase().includes(searchTerm)) ||
            (app.agendamentoFeitoPor?.toLowerCase().includes(searchTerm)) ||
            (app.descricao?.toLowerCase().includes(searchTerm)) ||
            (app.status?.toLowerCase().includes(searchTerm))
        );
        renderAppointments(filtered);
        filterMedicos(searchTerm);
    } catch (error) {
        console.error('Erro ao filtrar agendamentos:', error);
        errorLogs.push(`[${new Date().toISOString()}] Erro ao filtrar agendamentos: ${error.message}`);
        showNotification('Erro ao buscar: ' + error.message, true);
    }
}

function filterMedicos(searchTerm) {
    try {
        const filteredMedicos = medicos.filter(medico => 
            (medico.nome?.toLowerCase().includes(searchTerm)) ||
            (medico.crm?.toLowerCase().includes(searchTerm))
        );
        updateMedicosList(filteredMedicos);
    } catch (error) {
        console.error('Erro ao filtrar médicos:', error);
        errorLogs.push(`[${new Date().toISOString()}] Erro ao filtrar médicos: ${error.message}`);
    }
}

// Funções de Interface
function resetForm() {
    appointmentForm.reset();
    delete appointmentForm.dataset.id;
    document.getElementById('statusGroup').style.display = 'none';
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
    if (appointment.id) appointmentForm.dataset.id = appointment.id;
}

function changeView(e) {
    currentView = e.target.closest('.view-mode').dataset.view;
    document.querySelectorAll('.view-mode').forEach(btn => btn.classList.remove('active'));
    e.target.closest('.view-mode').classList.add('active');
    saveToIndexedDB('settings', { currentView, deleteAllPassword, lastSync, theme });
    renderAppointments();
    showNotification(`Visualização alterada para ${currentView}!`);
}

function showTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.style.display = 'none');
    document.getElementById(tabId).style.display = 'block';
}

function toggleSelectAll(e) {
    const checked = e.target.checked;
    document.querySelectorAll('.select-row').forEach(checkbox => checkbox.checked = checked);
}

function toggleSelectAllItems() {
    const allChecked = document.querySelectorAll('.select-row:checked').length === document.querySelectorAll('.select-row').length;
    document.querySelectorAll('.select-row').forEach(checkbox => checkbox.checked = !allChecked);
    document.getElementById('selectAll').checked = !allChecked;
}

function toggleColumnVisibility() {
    document.querySelectorAll('.column-toggle').forEach(toggle => {
        const column = toggle.dataset.column;
        const isVisible = toggle.checked;
        const index = Array.from(document.querySelectorAll('th')).findIndex(th => th.querySelector(`.column-toggle[data-column="${column}"]`));
        if (index !== -1) {
            document.querySelectorAll(`td:nth-child(${index + 1}), th:nth-child(${index + 1})`).forEach(cell => {
                cell.style.display = isVisible ? '' : 'none';
            });
        }
    });
}

function changePage(delta) {
    currentPage += delta;
    renderAppointments();
}

// Funções de Modal
function openMedicoModal() {
    medicoModal.style.display = 'block';
    updateMedicosList();
}

function closeMedicoModal() {
    medicoModal.style.display = 'none';
}

function saveMedico() {
    const nome = document.getElementById('novoMedicoNome').value.trim();
    const crm = document.getElementById('novoMedicoCRM').value.trim();
    if (nome && crm) {
        const medico = { id: Date.now().toString(), nome, crm };
        medicos.push(medico);
        saveToFirebase('medicos', medico);
        saveToIndexedDB('medicos', medicos);
        updateMedicosList();
        document.getElementById('novoMedicoNome').value = '';
        document.getElementById('novoMedicoCRM').value = '';
        showNotification('Médico salvo com sucesso!');
    } else {
        showNotification('Por favor, preencha nome e CRM!', true);
    }
}

function updateMedicosList(filteredMedicos = medicos) {
    const list = document.getElementById('medicosList');
    list.innerHTML = filteredMedicos.map(m => `<option value="${m.nome}">`).join('');
    medicosListDisplay.innerHTML = filteredMedicos.map(m => `
        <li>${m.nome} - ${m.crm} 
            <button class="delete-medico-btn" onclick="deleteMedico('${m.id}')">Excluir</button>
        </li>
    `).join('');
}

function deleteMedico(id) {
    if (confirm('Tem certeza que deseja excluir este médico?')) {
        medicos = medicos.filter(m => m.id !== id);
        deleteFromFirebase('medicos', id);
        saveToIndexedDB('medicos', medicos);
        updateMedicosList();
        showNotification('Médico excluído com sucesso!');
    }
}

function openDeleteAllModal() {
    deleteAllModal.style.display = 'block';
}

function closeDeleteAllModal() {
    deleteAllModal.style.display = 'none';
}

function confirmDeleteAll() {
    const password = document.getElementById('deletePassword').value;
    if (password === deleteAllPassword) {
        appointments = [];
        saveToFirebase('appointments', {});
        saveToIndexedDB('appointments', appointments);
        renderAppointments();
        closeDeleteAllModal();
        showNotification('Todos os agendamentos foram excluídos!');
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
    let sorted = [...appointments];
    switch (sortType) {
        case 'nameAZ': sorted.sort((a, b) => (a.nomePaciente || '').localeCompare(b.nomePaciente || '')); break;
        case 'recent': sorted.sort((a, b) => new Date(b.dataConsulta) - new Date(a.dataConsulta)); break;
        case 'oldest': sorted.sort((a, b) => new Date(a.dataConsulta) - new Date(b.dataConsulta)); break;
        case 'phone': sorted.sort((a, b) => (a.telefone || '').localeCompare(b.telefone || '')); break;
        case 'date': sorted.sort((a, b) => new Date(a.dataConsulta) - new Date(b.dataConsulta)); break;
        case 'doctor': sorted.sort((a, b) => (a.nomeMedico || '').localeCompare(b.nomeMedico || '')); break;
        case 'month': sorted.sort((a, b) => new Date(a.dataConsulta).getMonth() - new Date(b.dataConsulta).getMonth()); break;
        case 'year': sorted.sort((a, b) => new Date(a.dataConsulta).getFullYear() - new Date(b.dataConsulta).getFullYear()); break;
    }
    appointments = sorted;
    renderAppointments();
    closeSortFilterModal();
    showNotification('Ordenação aplicada!');
}

function closeModal(modal) {
    modal.style.display = 'none';
}

function moveCard(status, id = draggedCard?.dataset.id) {
    const appointment = appointments.find(a => a.id === id);
    if (appointment) {
        appointment.status = status;
        saveToFirebase('appointments', appointment);
        saveToIndexedDB('appointments', appointments);
        renderAppointments();
        closeModal(actionBox);
        showNotification(`Card movido para ${status}!`);
    }
}

// Funções de Backup
function toggleAutoBackup(enabled) {
    if (enabled) {
        if (!autoBackupInterval) {
            autoBackupInterval = setInterval(() => {
                backupFirebase();
                showNotification('Backup automático realizado!');
            }, 4 * 60 * 60 * 1000); // 4 horas
        }
    } else {
        if (autoBackupInterval) {
            clearInterval(autoBackupInterval);
            autoBackupInterval = null;
        }
    }
}

async function backupLocal() {
    try {
        const data = { appointments, medicos, settings: { currentView, deleteAllPassword, lastSync, theme } };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `backup_local_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showNotification('Backup local realizado com sucesso!');
    } catch (error) {
        console.error('Erro ao realizar backup local:', error);
        errorLogs.push(`[${new Date().toISOString()}] Erro ao realizar backup local: ${error.message}`);
        showNotification('Erro ao realizar backup: ' + error.message, true);
    }
}

async function restoreLocal() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const data = JSON.parse(event.target.result);
                const existingIds = new Set(appointments.map(a => a.id));
                const newAppointments = data.appointments.filter(app => !existingIds.has(app.id)).map(app => ({
                    id: app.id || Date.now().toString(),
                    nomePaciente: app.nomePaciente || 'Paciente Sem Nome',
                    telefone: app.telefone || '',
                    email: app.email || '',
                    nomeMedico: app.nomeMedico || '',
                    localCRM: app.localCRM || '',
                    dataConsulta: app.dataConsulta || '',
                    horaConsulta: app.horaConsulta || '',
                    tipoCirurgia: app.tipoCirurgia || '',
                    procedimentos: app.procedimentos || '',
                    agendamentoFeitoPor: app.agendamentoFeitoPor || '',
                    descricao: app.descricao || '',
                    status: app.status || 'Aguardando Atendimento'
                }));
                appointments = [...appointments, ...newAppointments];
                medicos = data.medicos || [];
                const settings = data.settings || {};
                currentView = settings.currentView || currentView;
                deleteAllPassword = settings.deleteAllPassword || deleteAllPassword;
                lastSync = settings.lastSync || lastSync;
                theme = settings.theme || theme;

                await saveToIndexedDB('appointments', appointments);
                await saveToIndexedDB('medicos', medicos);
                await saveToIndexedDB('settings', { currentView, deleteAllPassword, lastSync, theme });
                applyTheme();
                renderAppointments();
                updateMedicosList();
                showNotification('Dados restaurados localmente com sucesso!');
            } catch (error) {
                console.error('Erro ao restaurar localmente:', error);
                errorLogs.push(`[${new Date().toISOString()}] Erro ao restaurar localmente: ${error.message}`);
                showNotification('Erro ao restaurar: ' + error.message, true);
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

async function backupFirebase() {
    try {
        const data = await loadFromFirebase();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `backup_firebase_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showNotification('Backup do Firebase realizado com sucesso!');
    } catch (error) {
        console.error('Erro ao realizar backup do Firebase:', error);
        errorLogs.push(`[${new Date().toISOString()}] Erro ao realizar backup do Firebase: ${error.message}`);
        showNotification('Erro ao realizar backup: ' + error.message, true);
    }
}

async function restoreFirebase() {
    try {
        console.log("db antes de restaurar:", db);
        const firebaseData = await loadFromFirebase();
        const progressModal = document.getElementById('progressModal');
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');
        progressModal.style.display = 'block';

        const existingIds = new Set(appointments.map(a => a.id));
        const newAppointments = Object.values(firebaseData.appointments || {}).filter(app => !existingIds.has(app.id)).map(app => ({
            id: app.id || Date.now().toString(),
            nomePaciente: app.nomePaciente || 'Paciente Sem Nome',
            telefone: app.telefone || '',
            email: app.email || '',
            nomeMedico: app.nomeMedico || '',
            localCRM: app.localCRM || '',
            dataConsulta: app.dataConsulta || '',
            horaConsulta: app.horaConsulta || '',
            tipoCirurgia: app.tipoCirurgia || '',
            procedimentos: app.procedimentos || '',
            agendamentoFeitoPor: app.agendamentoFeitoPor || '',
            descricao: app.descricao || '',
            status: app.status || 'Aguardando Atendimento'
        }));
        appointments = [...appointments, ...newAppointments];
        medicos = Object.values(firebaseData.medicos || []);
        const settings = firebaseData.settings || {};
        currentView = settings.currentView || currentView;
        deleteAllPassword = settings.deleteAllPassword || deleteAllPassword;
        lastSync = settings.lastSync || lastSync;
        theme = settings.theme || theme;

        let processed = 0;
        const total = newAppointments.length + medicos.length + 1;

        for (const app of newAppointments) {
            await saveToFirebase('appointments', app);
            processed++;
            const percentage = Math.round((processed / total) * 100);
            progressFill.style.width = `${percentage}%`;
            progressText.textContent = `${percentage}%`;
        }

        for (const medico of medicos) {
            await saveToFirebase('medicos', medico);
            processed++;
            const percentage = Math.round((processed / total) * 100);
            progressFill.style.width = `${percentage}%`;
            progressText.textContent = `${percentage}%`;
        }

        await saveToFirebase('settings', { currentView, deleteAllPassword, lastSync, theme });
        processed++;
        const percentage = Math.round((processed / total) * 100);
        progressFill.style.width = `${percentage}%`;
        progressText.textContent = `${percentage}%`;

        await saveToIndexedDB('appointments', appointments);
        await saveToIndexedDB('medicos', medicos);
        await saveToIndexedDB('settings', { currentView, deleteAllPassword, lastSync, theme });
        applyTheme();
        renderAppointments();
        updateMedicosList();
        generateInsights();

        progressModal.style.display = 'none';
        showNotification('Dados restaurados do Firebase com sucesso!');
    } catch (error) {
        console.error('Erro ao restaurar do Firebase:', error);
        errorLogs.push(`[${new Date().toISOString()}] Erro ao restaurar do Firebase: ${error.message}`);
        showNotification('Erro ao restaurar: ' + error.message, true);
    }
}

async function importJsonToFirebase() {
    try {
        const jsonText = document.getElementById('backupDescription').value.trim();
        if (jsonText) {
            const jsonData = JSON.parse(jsonText);
            if (!jsonData.appointments || !Array.isArray(jsonData.appointments)) {
                throw new Error('O JSON deve conter uma propriedade "appointments" com um array válido.');
            }

            const progressModal = document.getElementById('progressModal');
            const progressFill = document.getElementById('progressFill');
            const progressText = document.getElementById('progressText');
            progressModal.style.display = 'block';

            const existingIds = new Set(appointments.map(a => a.id));
            const newAppointments = jsonData.appointments.filter(app => !existingIds.has(app.id)).map(app => ({
                id: app.id || Date.now().toString(),
                nomePaciente: app.nomePaciente || 'Paciente Sem Nome',
                telefone: app.telefone || '',
                email: app.email || '',
                nomeMedico: app.nomeMedico || '',
                localCRM: app.localCRM || '',
                dataConsulta: app.dataConsulta || '',
                horaConsulta: app.horaConsulta || '',
                tipoCirurgia: app.tipoCirurgia || '',
                procedimentos: app.procedimentos || '',
                agendamentoFeitoPor: app.agendamentoFeitoPor || '',
                descricao: app.descricao || '',
                status: app.status || 'Aguardando Atendimento'
            }));
            appointments = [...appointments, ...newAppointments];

            let processed = 0;
            const total = newAppointments.length;

            for (const app of newAppointments) {
                await saveToFirebase('appointments', app);
                processed++;
                const percentage = Math.round((processed / total) * 100);
                progressFill.style.width = `${percentage}%`;
                progressText.textContent = `${percentage}%`;
            }

            await saveToIndexedDB('appointments', appointments);
            renderAppointments();
            progressModal.style.display = 'none';
            showNotification('JSON importado para Firebase com sucesso!');
            document.getElementById('backupDescription').value = '';
        } else {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            input.onchange = async (e) => {
                const file = e.target.files[0];
                if (!file) return;

                const progressModal = document.getElementById('progressModal');
                const progressFill = document.getElementById('progressFill');
                const progressText = document.getElementById('progressText');
                progressModal.style.display = 'block';

                const reader = new FileReader();
                reader.onload = async (event) => {
                    try {
                        const jsonData = JSON.parse(event.target.result);
                        if (!jsonData.appointments || !Array.isArray(jsonData.appointments)) {
                            throw new Error('O JSON deve conter uma propriedade "appointments" com um array válido.');
                        }

                        const existingIds = new Set(appointments.map(a => a.id));
                        const newAppointments = jsonData.appointments.filter(app => !existingIds.has(app.id)).map(app => ({
                            id: app.id || Date.now().toString(),
                            nomePaciente: app.nomePaciente || 'Paciente Sem Nome',
                            telefone: app.telefone || '',
                            email: app.email || '',
                            nomeMedico: app.nomeMedico || '',
                            localCRM: app.localCRM || '',
                            dataConsulta: app.dataConsulta || '',
                            horaConsulta: app.horaConsulta || '',
                            tipoCirurgia: app.tipoCirurgia || '',
                            procedimentos: app.procedimentos || '',
                            agendamentoFeitoPor: app.agendamentoFeitoPor || '',
                            descricao: app.descricao || '',
                            status: app.status || 'Aguardando Atendimento'
                        }));
                        appointments = [...appointments, ...newAppointments];

                        let processed = 0;
                        const total = newAppointments.length;

                        for (const app of newAppointments) {
                            await saveToFirebase('appointments', app);
                            processed++;
                            const percentage = Math.round((processed / total) * 100);
                            progressFill.style.width = `${percentage}%`;
                            progressText.textContent = `${percentage}%`;
                        }

                        await saveToIndexedDB('appointments', appointments);
                        renderAppointments();
                        progressModal.style.display = 'none';
                        showNotification('JSON importado para Firebase com sucesso!');
                    } catch (error) {
                        console.error('Erro ao processar JSON:', error);
                        errorLogs.push(`[${new Date().toISOString()}] Erro ao processar JSON: ${error.message}`);
                        showNotification('Erro ao importar JSON: ' + error.message, true);
                        progressModal.style.display = 'none';
                    }
                };
                reader.readAsText(file);
            };
            input.click();
        }
    } catch (error) {
        console.error('Erro ao importar JSON:', error);
        errorLogs.push(`[${new Date().toISOString()}] Erro ao importar JSON: ${error.message}`);
        showNotification('Erro ao importar: ' + error.message, true);
    }
}

async function importExcelToFirebase() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx';
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const progressModal = document.getElementById('progressModal');
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');
        progressModal.style.display = 'block';

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const data = new Uint8Array(event.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(sheet);

                const existingIds = new Set(appointments.map(a => a.id));
                const newAppointments = jsonData.filter(app => !existingIds.has(app.id)).map(app => ({
                    id: app.id || Date.now().toString(),
                    nomePaciente: app.nomePaciente || 'Paciente Sem Nome',
                    telefone: app.telefone || '',
                    email: app.email || '',
                    nomeMedico: app.nomeMedico || '',
                    localCRM: app.localCRM || '',
                    dataConsulta: app.dataConsulta || '',
                    horaConsulta: app.horaConsulta || '',
                    tipoCirurgia: app.tipoCirurgia || '',
                    procedimentos: app.procedimentos || '',
                    agendamentoFeitoPor: app.agendamentoFeitoPor || '',
                    descricao: app.descricao || '',
                    status: app.status || 'Aguardando Atendimento'
                }));
                appointments = [...appointments, ...newAppointments];

                let processed = 0;
                const total = newAppointments.length;

                for (const app of newAppointments) {
                    await saveToFirebase('appointments', app);
                    processed++;
                    const percentage = Math.round((processed / total) * 100);
                    progressFill.style.width = `${percentage}%`;
                    progressText.textContent = `${percentage}%`;
                }

                await saveToIndexedDB('appointments', appointments);
                renderAppointments();
                progressModal.style.display = 'none';
                showNotification('Excel importado para Firebase com sucesso!');
            } catch (error) {
                console.error('Erro ao importar Excel:', error);
                errorLogs.push(`[${new Date().toISOString()}] Erro ao importar Excel: ${error.message}`);
                showNotification('Erro ao importar Excel: ' + error.message, true);
                progressModal.style.display = 'none';
            }
        };
        reader.readAsArrayBuffer(file);
    };
    input.click();
}

// Funções de Sincronização
async function saveToFirebase(collectionName, data) {
    try {
        if (!db) {
            console.error("Firestore não está definido!");
            throw new Error('Firestore não inicializado corretamente.');
        }
        console.log(`Salvando em ${collectionName} com ID ${data.id}`);
        await setDoc(doc(db, collectionName, data.id), data);
        lastSync = Date.now();
        await saveToIndexedDB('settings', { currentView, deleteAllPassword, lastSync, theme });
    } catch (error) {
        console.error(`Erro ao salvar em ${collectionName} no Firebase:`, error);
        errorLogs.push(`[${new Date().toISOString()}] Erro ao salvar em ${collectionName} no Firebase: ${error.message}`);
        throw error;
    }
}

async function deleteFromFirebase(collectionName, id) {
    try {
        await deleteDoc(doc(db, collectionName, id));
        lastSync = Date.now();
        await saveToIndexedDB('settings', { currentView, deleteAllPassword, lastSync, theme });
    } catch (error) {
        console.error(`Erro ao excluir de ${collectionName} no Firebase:`, error);
        errorLogs.push(`[${new Date().toISOString()}] Erro ao excluir de ${collectionName} no Firebase: ${error.message}`);
        throw error;
    }
}

async function loadFromFirebase() {
    try {
        const collections = ['appointments', 'medicos', 'settings'];
        const data = {};
        for (const coll of collections) {
            const snapshot = await getDocs(collection(db, coll));
            data[coll] = {};
            snapshot.forEach(doc => {
                data[coll][doc.id] = doc.data();
            });
        }
        return data;
    } catch (error) {
        console.error('Erro ao carregar do Firebase:', error);
        errorLogs.push(`[${new Date().toISOString()}] Erro ao carregar do Firebase: ${error.message}`);
        throw error;
    }
}

async function syncLocalWithFirebase() {
    try {
        const now = Date.now();
        if (now - lastSync > 5 * 60 * 1000) { // 5 minutos
            const firebaseData = await loadFromFirebase();
            const localData = await loadFromIndexedDB();
            const mergedAppointments = { ...localData.appointments, ...firebaseData.appointments };
            appointments = Object.values(mergedAppointments);
            medicos = Object.values(firebaseData.medicos || {});
            const settings = firebaseData.settings || localData.settings || {};
            currentView = settings.currentView || currentView;
            deleteAllPassword = settings.deleteAllPassword || deleteAllPassword;
            lastSync = now;
            theme = settings.theme || theme;

            await saveToIndexedDB('appointments', appointments);
            await saveToIndexedDB('medicos', medicos);
            await saveToIndexedDB('settings', { currentView, deleteAllPassword, lastSync, theme });
            showNotification('Sincronização com Firebase concluída!');
        }
    } catch (error) {
        console.error('Erro ao sincronizar com Firebase:', error);
        errorLogs.push(`[${new Date().toISOString()}] Erro ao sincronizar com Firebase: ${error.message}`);
        showNotification('Erro ao sincronizar: ' + error.message, true);
    }
}

// Funções de IndexedDB
async function saveToIndexedDB(storeName, data) {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('AgendaDB', DB_VERSION);
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('appointments')) {
                db.createObjectStore('appointments', { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains('medicos')) {
                db.createObjectStore('medicos', { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains('settings')) {
                db.createObjectStore('settings', { keyPath: 'id' });
            }
        };
        request.onsuccess = (event) => {
            const db = event.target.result;
            const tx = db.transaction(storeName, 'readwrite');
            const store = tx.objectStore(storeName);
            if (Array.isArray(data)) {
                data.forEach(item => store.put(item));
            } else {
                store.put({ id: 'config', ...data });
            }
            tx.oncomplete = () => {
                db.close();
                resolve();
            };
            tx.onerror = () => reject(tx.error);
        };
        request.onerror = () => reject(request.error);
    });
}

async function loadFromIndexedDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('AgendaDB', DB_VERSION);
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('appointments')) {
                db.createObjectStore('appointments', { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains('medicos')) {
                db.createObjectStore('medicos', { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains('settings')) {
                db.createObjectStore('settings', { keyPath: 'id' });
            }
        };
        request.onsuccess = (event) => {
            const db = event.target.result;
            const tx = db.transaction(['appointments', 'medicos', 'settings'], 'readonly');
            const data = {};
            ['appointments', 'medicos', 'settings'].forEach(storeName => {
                const store = tx.objectStore(storeName);
                const req = store.getAll();
                req.onsuccess = () => {
                    if (storeName === 'settings') {
                        data[storeName] = req.result.find(item => item.id === 'config') || {};
                    } else {
                        data[storeName] = req.result;
                    }
                };
                req.onerror = () => reject(req.error);
            });
            tx.oncomplete = () => {
                db.close();
                resolve(data);
            };
            tx.onerror = () => reject(tx.error);
        };
        request.onerror = () => reject(request.error);
    });
}

// Funções de Relatórios e Insights
function generateReport() {
    const reportType = document.getElementById('reportType').value;
    const reportMonth = document.getElementById('reportMonth').value;
    const reportYear = document.getElementById('reportYear').value;
    const reportDoctor = document.getElementById('reportDoctor').value;

    let filtered = [...appointments];
    if (reportType === 'byName') filtered.sort((a, b) => (a.nomePaciente || '').localeCompare(b.nomePaciente || ''));
    if (reportType === 'byRecent') filtered.sort((a, b) => new Date(b.dataConsulta) - new Date(a.dataConsulta));
    if (reportType === 'byOldest') filtered.sort((a, b) => new Date(a.dataConsulta) - new Date(b.dataConsulta));
    if (reportType === 'byPhone') filtered.sort((a, b) => (a.telefone || '').localeCompare(b.telefone || ''));
    if (reportType === 'byDate') filtered.sort((a, b) => new Date(a.dataConsulta) - new Date(b.dataConsulta));
    if (reportType === 'byDoctor') filtered = filtered.filter(a => a.nomeMedico === reportDoctor);
    if (reportType === 'byMonth') filtered = filtered.filter(a => new Date(a.dataConsulta).toISOString().slice(0, 7) === reportMonth);
    if (reportType === 'byYear') filtered = filtered.filter(a => new Date(a.dataConsulta).getFullYear() == reportYear);

    const reportBody = document.getElementById('reportBody');
    const reportGrid = document.getElementById('reportGrid');
    reportBody.innerHTML = '';
    reportGrid.innerHTML = '';

    filtered.forEach(app => {
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
}

function generateInsights() {
    const insightsCards = document.getElementById('insightsCards');
    insightsCards.innerHTML = '';

    const totalAppointments = appointments.length;
    const byStatus = appointments.reduce((acc, app) => {
        acc[app.status] = (acc[app.status] || 0) + 1;
        return acc;
    }, {});
    const topDoctors = appointments.reduce((acc, app) => {
        acc[app.nomeMedico] = (acc[app.nomeMedico] || 0) + 1;
        return acc;
    }, {});
    const topProcedures = appointments.reduce((acc, app) => {
        if (app.procedimentos) acc[app.procedimentos] = (acc[app.procedimentos] || 0) + 1;
        return acc;
    }, {});

    insightsCards.innerHTML += `
        <div class="insights-card">
            <h4><i class="fas fa-chart-pie"></i> Total de Agendamentos</h4>
            <p>${totalAppointments} agendamentos registrados.</p>
        </div>
        <div class="insights-card">
            <h4><i class="fas fa-info-circle"></i> Status dos Agendamentos</h4>
            <ul>
                ${Object.entries(byStatus).map(([status, count]) => `<li>${status}: ${count}</li>`).join('')}
            </ul>
        </div>
        <div class="insights-card">
            <h4><i class="fas fa-user-md"></i> Médicos mais Ativos</h4>
            <ul>
                ${Object.entries(topDoctors).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([doctor, count]) => `<li>${doctor || 'Sem Médico'}: ${count}</li>`).join('')}
            </ul>
        </div>
        <div class="insights-card">
            <h4><i class="fas fa-tools"></i> Procedimentos Populares</h4>
            <ul>
                ${Object.entries(topProcedures).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([proc, count]) => `<li>${proc}: ${count}</li>`).join('')}
            </ul>
        </div>
        <div class="insights-card error-log-card">
            <h4><i class="fas fa-exclamation-triangle"></i> Logs de Erros</h4>
            <ul>${errorLogs.map(log => `<li>${log}</li>`).join('') || '<li>Nenhum erro registrado.</li>'}</ul>
        </div>
    `;
}

// Funções de Configurações
function loadSettingsTab() {
    document.getElementById('bodyBgColor').value = theme.bodyBgColor || '#f9f9fb';
    document.getElementById('bodyBgColorHex').value = theme.bodyBgColor || '#f9f9fb';
    document.getElementById('cardBgColor').value = theme.cardBgColor || '#ffffff';
    document.getElementById('cardBgColorHex').value = theme.cardBgColor || '#ffffff';
    document.getElementById('textColor').value = theme.textColor || '#343a40';
    document.getElementById('textColorHex').value = theme.textColor || '#343a40';
    document.getElementById('borderColor').value = theme.borderColor || '#007bff';
    document.getElementById('borderColorHex').value = theme.borderColor || '#007bff';
    document.getElementById('cardBorderColor').value = theme.cardBorderColor || '#d1d3e2';
    document.getElementById('cardBorderColorHex').value = theme.cardBorderColor || '#d1d3e2';
    document.getElementById('formBorderColor').value = theme.formBorderColor || '#ced4da';
    document.getElementById('formBorderColorHex').value = theme.formBorderColor || '#ced4da';

    ['bodyBgColor', 'cardBgColor', 'textColor', 'borderColor', 'cardBorderColor', 'formBorderColor'].forEach(id => {
        document.getElementById(id).addEventListener('input', () => {
            document.getElementById(`${id}Hex`).value = document.getElementById(id).value;
            applyTheme({ [id]: document.getElementById(id).value });
        });
        document.getElementById(`${id}Hex`).addEventListener('input', () => {
            document.getElementById(id).value = document.getElementById(`${id}Hex`).value;
            applyTheme({ [id]: document.getElementById(`${id}Hex`).value });
        });
    });
}

function saveTheme() {
    theme = {
        bodyBgColor: document.getElementById('bodyBgColor').value,
        cardBgColor: document.getElementById('cardBgColor').value,
        textColor: document.getElementById('textColor').value,
        borderColor: document.getElementById('borderColor').value,
        cardBorderColor: document.getElementById('cardBorderColor').value,
        formBorderColor: document.getElementById('formBorderColor').value
    };
    saveToIndexedDB('settings', { currentView, deleteAllPassword, lastSync, theme });
    saveToFirebase('settings', { currentView, deleteAllPassword, lastSync, theme });
    applyTheme();
    showNotification('Tema salvo com sucesso!');
}

function resetTheme() {
    theme = {};
    saveToIndexedDB('settings', { currentView, deleteAllPassword, lastSync, theme });
    saveToFirebase('settings', { currentView, deleteAllPassword, lastSync, theme });
    applyTheme();
    loadSettingsTab();
    showNotification('Tema restaurado para o padrão!');
}

function applyTheme(newTheme = theme) {
    document.body.style.backgroundColor = newTheme.bodyBgColor || '#f9f9fb';
    document.querySelectorAll('.card, .form-section, .appointments-section, .search-card, .modal-content').forEach(el => {
        el.style.backgroundColor = newTheme.cardBgColor || '#ffffff';
        el.style.borderColor = newTheme.cardBorderColor || '#d1d3e2';
    });
    document.body.style.color = newTheme.textColor || '#343a40';
    document.querySelectorAll('.control-btn, .view-mode').forEach(btn => {
        btn.style.borderColor = newTheme.borderColor || '#007bff';
    });
    document.querySelectorAll('input, textarea, select').forEach(input => {
        input.style.borderColor = newTheme.formBorderColor || '#ced4da';
    });
}

// Funções de Exportação e Impressão
function exportToExcel() {
    const worksheet = XLSX.utils.json_to_sheet(appointments);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Agendamentos');
    XLSX.writeFile(workbook, `agendamentos_${new Date().toISOString().split('T')[0]}.xlsx`);
    showNotification('Exportação para Excel concluída!');
}

function printAppointments() {
    window.print();
    showNotification('Imprimindo agendamentos...');
}

// Funções de Navegação e Filtros
function scrollToStatusSection() {
    document.querySelector('.filters').scrollIntoView({ behavior: 'smooth' });
}

function clearFilters() {
    statusFilter.value = 'all';
    document.getElementById('globalSearch').value = '';
    currentPage = 1;
    renderAppointments();
}

// Função de Notificação
function showNotification(message, isError = false) {
    if (!notification) return;
    notification.textContent = message;
    notification.classList.toggle('error', isError);
    notification.classList.add('show');
    setTimeout(() => notification.classList.remove('show'), 3000);
}

// Declaração de Funções Globais
window.editAppointment = editAppointment;
window.viewAppointment = viewAppointment;
window.shareAppointment = shareAppointment;
window.deleteAppointment = deleteAppointment;
window.moveCard = moveCard;
window.openMedicoModal = openMedicoModal;
window.closeMedicoModal = closeMedicoModal;
window.saveMedico = saveMedico;
window.deleteMedico = deleteMedico;
window.confirmDeleteAll = confirmDeleteAll;
window.closeDeleteAllModal = closeDeleteAllModal;
window.applySortFilter = applySortFilter;
window.closeSortFilterModal = closeSortFilterModal;
window.generateReport = generateReport;
window.toggleReportView = toggleReportView;
window.saveTheme = saveTheme;
window.resetTheme = resetTheme;
window.backupLocal = backupLocal;
window.restoreLocal = restoreLocal;
window.backupFirebase = backupFirebase;
window.restoreFirebase = restoreFirebase;
window.importJsonToFirebase = importJsonToFirebase;
window.importExcelToFirebase = importExcelToFirebase;

console.log("Script carregado com sucesso!");
