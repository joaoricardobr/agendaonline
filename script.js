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
        users = cachedData.users && cachedData.users.length > 0 ? cachedData.users : [{ username: 'admin', password: '1234' }];
        currentView = cachedData.settings?.currentView || 'list';
        deleteAllPassword = cachedData.settings?.deleteAllPassword || '1234';
        lastSync = cachedData.settings?.lastSync || 0;
        theme = cachedData.settings?.theme || {};
        loadFormData();
        updateMedicosList();
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
        else if (tabId === 'settingsTab') loadSettingsTab();
    } catch (error) {
        console.error('Erro ao mostrar aba:', error);
        errorLogs.push(`[${new Date().toISOString()}] Erro ao mostrar aba: ${error.message}`);
        showNotification('Erro ao mostrar aba: ' + error.message, true);
    }
}

// Função ajustada para carregar a aba de configurações com cards separados
function loadSettingsTab() {
    try {
        settingsCards.innerHTML = '';

        // Card de Personalização de Tema
        const themeCard = document.createElement('div');
        themeCard.className = 'card';
        themeCard.innerHTML = `
            <h4><i class="fas fa-paint-brush"></i> Personalizar Tema</h4>
            <div class="form-group">
                <label>Fundo do Site</label>
                <input type="color" id="bodyBgColor" value="${theme.bodyBgColor || '#f9f9fb'}">
                <input type="text" id="bodyBgColorHex" value="${theme.bodyBgColor || '#f9f9fb'}" placeholder="Código HEX" maxlength="7">
            </div>
            <div class="form-group">
                <label>Fundo dos Cards</label>
                <input type="color" id="cardBgColor" value="${theme.cardBgColor || '#ffffff'}">
                <input type="text" id="cardBgColorHex" value="${theme.cardBgColor || '#ffffff'}" placeholder="Código HEX" maxlength="7">
            </div>
            <div class="form-group">
                <label>Texto</label>
                <input type="color" id="textColor" value="${theme.textColor || '#343a40'}">
                <input type="text" id="textColorHex" value="${theme.textColor || '#343a40'}" placeholder="Código HEX" maxlength="7">
            </div>
            ...

            <div class="form-group">
                <label>Bordas</label>
                <input type="color" id="borderColor" value="${theme.borderColor || '#007bff'}">
                <input type="text" id="borderColorHex" value="${theme.borderColor || '#007bff'}" placeholder="Código HEX" maxlength="7">
            </div>
            <div class="form-group">
                <label>Bordas dos Cards</label>
                <input type="color" id="cardBorderColor" value="${theme.cardBorderColor || '#d1d3e2'}">
                <input type="text" id="cardBorderColorHex" value="${theme.cardBorderColor || '#d1d3e2'}" placeholder="Código HEX" maxlength="7">
            </div>
            <div class="form-group">
                <label>Bordas dos Formulários</label>
                <input type="color" id="formBorderColor" value="${theme.formBorderColor || '#ced4da'}">
                <input type="text" id="formBorderColorHex" value="${theme.formBorderColor || '#ced4da'}" placeholder="Código HEX" maxlength="7">
            </div>
            <div class="card-actions">
                <button class="action-btn view-btn" onclick="saveTheme()">Salvar Tema</button>
                <button class="action-btn delete-btn" onclick="resetTheme()">Restaurar Tema</button>
            </div>
        `;
        settingsCards.appendChild(themeCard);

        // Sincronizar inputs de cor com HEX
        const syncColorInputs = (colorInputId, hexInputId) => {
            const colorInput = document.getElementById(colorInputId);
            const hexInput = document.getElementById(hexInputId);
            colorInput.addEventListener('input', () => hexInput.value = colorInput.value);
            hexInput.addEventListener('input', () => {
                if (/^#[0-9A-Fa-f]{6}$/.test(hexInput.value)) colorInput.value = hexInput.value;
            });
        };
        syncColorInputs('bodyBgColor', 'bodyBgColorHex');
        syncColorInputs('cardBgColor', 'cardBgColorHex');
        syncColorInputs('textColor', 'textColorHex');
        syncColorInputs('borderColor', 'borderColorHex');
        syncColorInputs('cardBorderColor', 'cardBorderColorHex');
        syncColorInputs('formBorderColor', 'formBorderColorHex');

        // Card de Senha para Exclusão
        const passwordCard = document.createElement('div');
        passwordCard.className = 'card';
        passwordCard.innerHTML = `
            <h4><i class="fas fa-lock"></i> Senha para Excluir Tudo</h4>
            <div class="form-group">
                <label>Senha</label>
                <input type="password" id="deleteAllPassword" value="${deleteAllPassword}">
            </div>
            <div class="card-actions">
                <button class="action-btn view-btn" onclick="saveDeletePassword()">Salvar Senha</button>
            </div>
        `;
        settingsCards.appendChild(passwordCard);

        // Card de Limpar IndexedDB
        const clearIndexedDBCard = document.createElement('div');
        clearIndexedDBCard.className = 'card';
        clearIndexedDBCard.innerHTML = `
            <h4><i class="fas fa-trash-restore"></i> Limpar IndexedDB</h4>
            <div class="card-actions">
                <button class="action-btn delete-btn" onclick="clearIndexedDB()">Limpar IndexedDB</button>
            </div>
        `;
        settingsCards.appendChild(clearIndexedDBCard);

        // Card de Logs de Erros
        const logsCard = document.createElement('div');
        logsCard.className = 'card';
        logsCard.innerHTML = `
            <h4><i class="fas fa-exclamation-triangle"></i> Logs de Erros</h4>
            <div class="logs-content" style="max-height: 200px; overflow-y: auto;">
                <ul id="errorLogsList">
                    ${errorLogs.length > 0 ? errorLogs.map(log => `<li>${log}</li>`).join('') : '<li>Nenhum erro registrado.</li>'}
                </ul>
            </div>
            <div class="card-actions">
                <button class="action-btn delete-btn" onclick="clearErrorLogs()">Limpar Logs</button>
            </div>
        `;
        settingsCards.appendChild(logsCard);

        // Card de Backup Local
        const backupLocalCard = document.createElement('div');
        backupLocalCard.className = 'card';
        backupLocalCard.innerHTML = `
            <h4><i class="fas fa-download"></i> Backup Local</h4>
            <div class="card-actions">
                <button class="action-btn view-btn" onclick="backupLocal()">Gerar Backup Local</button>
            </div>
        `;
        settingsCards.appendChild(backupLocalCard);

        // Card de Restauração Local
        const restoreLocalCard = document.createElement('div');
        restoreLocalCard.className = 'card';
        restoreLocalCard.innerHTML = `
            <h4><i class="fas fa-upload"></i> Restaurar Local</h4>
            <div class="card-actions">
                <button class="action-btn view-btn" onclick="restoreLocal()">Importar JSON Local</button>
            </div>
        `;
        settingsCards.appendChild(restoreLocalCard);

        // Card de Backup Firebase
        const backupFirebaseCard = document.createElement('div');
        backupFirebaseCard.className = 'card';
        backupFirebaseCard.innerHTML = `
            <h4><i class="fas fa-cloud-download-alt"></i> Backup Firebase</h4>
            <div class="card-actions">
                <button class="action-btn view-btn" onclick="backupFirebase()">Gerar Backup Firebase</button>
            </div>
        `;
        settingsCards.appendChild(backupFirebaseCard);

        // Card de Restauração Firebase
        const restoreFirebaseCard = document.createElement('div');
        restoreFirebaseCard.className = 'card';
        restoreFirebaseCard.innerHTML = `
            <h4><i class="fas fa-cloud-upload-alt"></i> Restaurar Firebase</h4>
            <div class="card-actions">
                <button class="action-btn view-btn" onclick="restoreFirebase()">Restaurar do Firebase</button>
            </div>
        `;
        settingsCards.appendChild(restoreFirebaseCard);

        // Card de Importação JSON
        const importJsonCard = document.createElement('div');
        importJsonCard.className = 'card';
        importJsonCard.innerHTML = `
            <h4><i class="fas fa-file-import"></i> Importar JSON</h4>
            <div class="card-actions">
                <button class="action-btn view-btn" onclick="importJsonToFirebase()">Importar JSON para Firebase</button>
            </div>
        `;
        settingsCards.appendChild(importJsonCard);

        // Card de Importação Excel
        const importExcelCard = document.createElement('div');
        importExcelCard.className = 'card';
        importExcelCard.innerHTML = `
            <h4><i class="fas fa-file-excel"></i> Importar Excel</h4>
            <div class="card-actions">
                <button class="action-btn view-btn" onclick="importExcelToFirebase()">Importar Excel para Firebase</button>
            </div>
        `;
        settingsCards.appendChild(importExcelCard);

        // Card de Importação TXT
        const importTxtCard = document.createElement('div');
        importTxtCard.className = 'card';
        importTxtCard.innerHTML = `
            <h4><i class="fas fa-file-alt"></i> Importar TXT</h4>
            <div class="card-actions">
                <button class="action-btn view-btn" onclick="importTxtToFirebase()">Importar TXT para Firebase</button>
            </div>
        `;
        settingsCards.appendChild(importTxtCard);

        showNotification('Aba de configurações carregada com sucesso!');
    } catch (error) {
        console.error('Erro ao carregar aba de configurações:', error);
        errorLogs.push(`[${new Date().toISOString()}] Erro ao carregar aba de configurações: ${error.message}`);
        showNotification('Erro ao carregar configurações: ' + error.message, true);
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
        if (index < 0 || index >= medicos.length) {
            showNotification('Médico não encontrado!', true);
            return;
        }
        if (confirm('Tem certeza que deseja excluir este médico?')) {
            const medico = medicos[index];
            if (!medico || !medico.id) {
                showNotification('ID do médico inválido!', true);
                return;
            }
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
            bodyBgColor: document.getElementById('bodyBgColorHex').value,
            cardBgColor: document.getElementById('cardBgColorHex').value,
            textColor: document.getElementById('textColorHex').value,
            borderColor: document.getElementById('borderColorHex').value,
            cardBorderColor: document.getElementById('cardBorderColorHex').value,
            formBorderColor: document.getElementById('formBorderColorHex').value
        };
        await saveToFirebase('settings', { theme, deleteAllPassword, currentView, lastSync });
        await saveToIndexedDB('settings', { currentView, deleteAllPassword, lastSync, theme });
        applyTheme();
        showNotification('Tema salvo com sucesso!');
    } catch (error) {
        console.error('Erro ao salvar tema:', error);
        errorLogs.push(`[${new Date().toISOString()}] Erro ao salvar tema: ${error.message}`);
        showNotification('Erro ao salvar tema: ' + error.message, true);
    }
}

async function resetTheme() {
    try {
        theme = {};
        document.getElementById('bodyBgColor').value = '#f9f9fb';
        document.getElementById('bodyBgColorHex').value = '#f9f9fb';
        document.getElementById('cardBgColor').value = '#ffffff';
        document.getElementById('cardBgColorHex').value = '#ffffff';
        document.getElementById('textColor').value = '#343a40';
        document.getElementById('textColorHex').value = '#343a40';
        document.getElementById('borderColor').value = '#007bff';
        document.getElementById('borderColorHex').value = '#007bff';
        document.getElementById('cardBorderColor').value = '#d1d3e2';
        document.getElementById('cardBorderColorHex').value = '#d1d3e2';
        document.getElementById('formBorderColor').value = '#ced4da';
        document.getElementById('formBorderColorHex').value = '#ced4da';
        await saveToFirebase('settings', { currentView, deleteAllPassword, lastSync, theme });
        await saveToIndexedDB('settings', { currentView, deleteAllPassword, lastSync, theme });
        applyTheme();
        showNotification('Tema restaurado para padrão!');
    } catch (error) {
        console.error('Erro ao resetar tema:', error);
        errorLogs.push(`[${new Date().toISOString()}] Erro ao resetar tema: ${error.message}`);
        showNotification('Erro ao resetar tema: ' + error.message, true);
    }
}

async function saveDeletePassword() {
    try {
        const newPassword = document.getElementById('deleteAllPassword').value;
        if (newPassword) {
            deleteAllPassword = newPassword;
            await saveToFirebase('settings', { theme, deleteAllPassword, currentView, lastSync });
            await saveToIndexedDB('settings', { currentView, deleteAllPassword, lastSync, theme });
            showNotification('Senha para exclusão salva com sucesso!');
        } else {
            showNotification('Por favor, insira uma senha!', true);
        }
    } catch (error) {
        console.error('Erro ao salvar senha de exclusão:', error);
        errorLogs.push(`[${new Date().toISOString()}] Erro ao salvar senha de exclusão: ${error.message}`);
        showNotification('Erro ao salvar senha: ' + error.message, true);
    }
}

function applyTheme() {
    try {
        // Aplicar tema ao body
        document.body.style.backgroundColor = theme.bodyBgColor || '#f9f9fb';
        document.body.style.color = theme.textColor || '#343a40';

        // Aplicar tema aos cards
        document.querySelectorAll('.card, .login-box, .modal-content, .search-card, .form-section, .appointments-section, .insights-card').forEach(card => {
            card.style.backgroundColor = theme.cardBgColor || '#ffffff';
            card.style.borderColor = theme.cardBorderColor || '#d1d3e2';
            card.style.color = theme.textColor || '#343a40';
        });

        // Aplicar tema aos botões
        document.querySelectorAll('button, .control-btn, .view-mode, .action-btn').forEach(btn => {
            if (!btn.classList.contains('delete-btn') && !btn.classList.contains('share-btn') && 
                !btn.classList.contains('edit-btn') && !btn.classList.contains('view-btn')) {
                btn.style.borderColor = theme.borderColor || '#007bff';
            }
        });

        // Aplicar tema aos formulários e inputs
        document.querySelectorAll('.form-group input, .form-group textarea, .form-group select').forEach(form => {
            form.style.borderColor = theme.formBorderColor || '#ced4da';
            form.style.backgroundColor = theme.cardBgColor || '#f8f9fa';
            form.style.color = theme.textColor || '#495057';
        });

        showNotification('Tema aplicado com sucesso!');
    } catch (error) {
        console.error('Erro ao aplicar tema:', error);
        errorLogs.push(`[${new Date().toISOString()}] Erro ao aplicar tema: ${error.message}`);
        showNotification('Erro ao aplicar tema: ' + error.message, true);
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

// Impressão Unificada
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
                        th { background-color: #e9ecef; }
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
        } else {
            printWindow.document.write(`
                <html>
                <head>
                    <title>Impressão - ${currentView === 'grid' ? 'Grid' : 'Pipeline'} de Agendamentos</title>
                    <style>
                        @page { size: landscape; margin: 10mm; }
                        body { font-family: Arial, sans-serif; margin: 0; padding: 10mm; }
                        h1 { text-align: center; font-size: 18px; margin-bottom: 10px; }
                        .card, .mini-card { border: 1px solid #333; padding: 10px; margin: 10px; width: 200px; display: inline-block; vertical-align: top; font-size: 12px; }
                        .card h4, .mini-card h4 { margin: 0 0 5px; font-size: 14px; }
                        .pipeline-column { display: inline-block; vertical-align: top; width: 220px; margin-right: 10px; }
                        .pipeline-column h3 { font-size: 14px; margin-bottom: 5px; }
                    </style>
                </head>
                <body>
                    <h1>${currentView === 'grid' ? 'Grid' : 'Pipeline'} de Agendamentos</h1>
                    ${currentView === 'grid' ? selectedAppointments.map(app => `
                        <div class="card">
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
                        </div>
                    `).join('') : `
                        <div class="pipeline-column">
                            <h3>Aguardando Atendimento</h3>
                            ${selectedAppointments.filter(app => app.status === 'Aguardando Atendimento').map(app => `
                                <div class="mini-card">
                                    <h4>${app.nomePaciente || 'Sem Nome'}</h4>
                                    <p>ID: ${app.id || '-'}</p>
                                    <p>Médico: ${app.nomeMedico || '-'}</p>
                                    <p>Data: ${app.dataConsulta || '-'} às ${app.horaConsulta || '-'}</p>
                                </div>
                            `).join('')}
                        </div>
                        <div class="pipeline-column">
                            <h3>Atendido</h3>
                            ${selectedAppointments.filter(app => app.status === 'Atendido').map(app => `
                                <div class="mini-card">
                                    <h4>${app.nomePaciente || 'Sem Nome'}</h4>
                                    <p>ID: ${app.id || '-'}</p>
                                    <p>Médico: ${app.nomeMedico || '-'}</p>
                                    <p>Data: ${app.dataConsulta || '-'} às ${app.horaConsulta || '-'}</p>
                                </div>
                            `).join('')}
                        </div>
                        <div class="pipeline-column">
                            <h3>Reagendado</h3>
                            ${selectedAppointments.filter(app => app.status === 'Reagendado').map(app => `
                                <div class="mini-card">
                                    <h4>${app.nomePaciente || 'Sem Nome'}</h4>
                                    <p>ID: ${app.id || '-'}</p>
                                    <p>Médico: ${app.nomeMedico || '-'}</p>
                                    <p>Data: ${app.dataConsulta || '-'} às ${app.horaConsulta || '-'}</p>
                                </div>
                            `).join('')}
                        </div>
                        <div class="pipeline-column">
                            <h3>Cancelado</h3>
                            ${selectedAppointments.filter(app => app.status === 'Cancelado').map(app => `
                                <div class="mini-card">
                                    <h4>${app.nomePaciente || 'Sem Nome'}</h4>
                                    <p>ID: ${app.id || '-'}</p>
                                    <p>Médico: ${app.nomeMedico || '-'}</p>
                                    <p>Data: ${app.dataConsulta || '-'} às ${app.horaConsulta || '-'}</p>
                                </div>
                            `).join('')}
                        </div>
                    `}
                </body>
                </html>
            `);
        }

        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        showNotification('Impressão realizada com sucesso!');
    } catch (error) {
        console.error('Erro ao imprimir agendamentos:', error);
        errorLogs.push(`[${new Date().toISOString()}] Erro ao imprimir agendamentos: ${error.message}`);
        showNotification('Erro ao imprimir: ' + error.message, true);
    }
}

// Exportação para Excel
function exportToExcel() {
    try {
        const selectedIds = Array.from(document.querySelectorAll('.select-row:checked')).map(cb => cb.dataset.id);
        const exportData = selectedIds.length > 0 ? appointments.filter(app => selectedIds.includes(app.id)) : appointments;

        if (exportData.length === 0) {
            showNotification('Nenhum dado para exportar!', true);
            return;
        }

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Agendamentos");
        XLSX.writeFile(workbook, "Agendamentos_Exportados.xlsx");
        showNotification('Dados exportados para Excel com sucesso!');
    } catch (error) {
        console.error('Erro ao exportar para Excel:', error);
        errorLogs.push(`[${new Date().toISOString()}] Erro ao exportar para Excel: ${error.message}`);
        showNotification('Erro ao exportar: ' + error.message, true);
    }
}

// Relatórios
function generateReport() {
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
            filteredAppointments = filteredAppointments.filter(app => app.nomeMedico.toLowerCase().includes(reportDoctor.toLowerCase()));
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
    } catch (error) {
        console.error('Erro ao gerar relatório:', error);
        errorLogs.push(`[${new Date().toISOString()}] Erro ao gerar relatório: ${error.message}`);
        showNotification('Erro ao gerar relatório: ' + error.message, true);
    }
}

function toggleReportView(view) {
    try {
        document.getElementById('reportResult').style.display = view === 'list' ? 'block' : 'none';
        document.getElementById('reportGrid').style.display = view === 'grid' ? 'block' : 'none';
        document.querySelectorAll('#reportsTab .view-mode').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`#reportsTab .view-mode[data-view="${view}"]`).classList.add('active');
        showNotification(`Visualização de relatório alterada para ${view}!`);
    } catch (error) {
        console.error('Erro ao alternar visualização de relatório:', error);
        errorLogs.push(`[${new Date().toISOString()}] Erro ao alternar visualização de relatório: ${error.message}`);
        showNotification('Erro ao alternar visualização: ' + error.message, true);
    }
}

// Insights
function generateInsights() {
    try {
        const insightsCards = document.getElementById('insightsCards');
        insightsCards.innerHTML = '';

        const totalAppointments = appointments.length;
        const byStatus = appointments.reduce((acc, app) => {
            acc[app.status] = (acc[app.status] || 0) + 1;
            return acc;
        }, {});

        const totalCard = document.createElement('div');
        totalCard.className = 'card';
        totalCard.innerHTML = `<h4>Total de Agendamentos</h4><p>${totalAppointments}</p>`;
        insightsCards.appendChild(totalCard);

        for (const [status, count] of Object.entries(byStatus)) {
            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `<h4>${status}</h4><p>${count}</p>`;
            insightsCards.appendChild(card);
        }

        const doctors = appointments.reduce((acc, app) => {
            acc[app.nomeMedico] = (acc[app.nomeMedico] || 0) + 1;
            return acc;
        }, {});
        const topDoctor = Object.entries(doctors).sort((a, b) => b[1] - a[1])[0];
        if (topDoctor) {
            const doctorCard = document.createElement('div');
            doctorCard.className = 'card';
            doctorCard.innerHTML = `<h4>Médico Mais Ativo</h4><p>${topDoctor[0]}: ${topDoctor[1]} agendamentos</p>`;
            insightsCards.appendChild(doctorCard);
        }

       showNotification('Insights gerados com sucesso!');
} catch (error) {
    console.error('Erro ao gerar insights:', error);
    errorLogs.push(`[${new Date().toISOString()}] Erro ao gerar insights: ${error.message}`);
    showNotification(`Erro ao gerar insights: ${error.message}`, true);
}
}

// Backup e Restauração
function backupLocal() {
    try {
        const data = { appointments, medicos, users, settings: { currentView, deleteAllPassword, lastSync, theme } };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `backup_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showNotification('Backup local gerado com sucesso!');
    } catch (error) {
        console.error('Erro ao gerar backup local:', error);
        errorLogs.push(`[${new Date().toISOString()}] Erro ao gerar backup local: ${error.message}`);
        showNotification('Erro ao gerar backup local: ' + error.message, true);
    }
}

function restoreLocal() {
    try {
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
                    applyTheme();
                    showNotification('Dados restaurados localmente com sucesso!');
                } catch (error) {
                    console.error('Erro ao restaurar backup local:', error);
                    errorLogs.push(`[${new Date().toISOString()}] Erro ao restaurar backup local: ${error.message}`);
                    showNotification('Erro ao restaurar backup local: ' + error.message, true);
                }
            };
            reader.readAsText(file);
        };
        input.click();
    } catch (error) {
        console.error('Erro ao iniciar restauração local:', error);
        errorLogs.push(`[${new Date().toISOString()}] Erro ao iniciar restauração local: ${error.message}`);
        showNotification('Erro ao iniciar restauração: ' + error.message, true);
    }
}

async function backupFirebase() {
    try {
        const data = { appointments, medicos, users, settings: { currentView, deleteAllPassword, lastSync, theme } };
        await saveToFirebase('backup', { data, timestamp: new Date().toISOString() });
        showNotification('Backup enviado ao Firebase com sucesso!');
    } catch (error) {
        console.error('Erro ao gerar backup no Firebase:', error);
        errorLogs.push(`[${new Date().toISOString()}] Erro ao gerar backup no Firebase: ${error.message}`);
        showNotification('Erro ao gerar backup no Firebase: ' + error.message, true);
    }
}

async function restoreFirebase() {
    try {
        const docRef = doc(db, 'backup', 'data');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const data = docSnap.data().data;
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
            applyTheme();
            showNotification('Dados restaurados do Firebase com sucesso!');
        } else {
            showNotification('Nenhum backup encontrado no Firebase!', true);
        }
    } catch (error) {
        console.error('Erro ao restaurar do Firebase:', error);
        errorLogs.push(`[${new Date().toISOString()}] Erro ao restaurar do Firebase: ${error.message}`);
        showNotification('Erro ao restaurar do Firebase: ' + error.message, true);
    }
}

// Nova função para importar TXT para Firebase
async function importTxtToFirebase() {
    try {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.txt';
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
                    const text = event.target.result;
                    const lines = text.split('\n').filter(line => line.trim() !== '');
                    const existingIds = new Set(appointments.map(a => a.id));
                    const newAppointments = [];

                    lines.forEach((line, index) => {
                        const fields = line.split(';');
                        if (fields.length >= 1) {
                            const appointment = {
                                id: fields[0] || Date.now().toString() + index,
                                nomePaciente: fields[1] || 'Paciente Sem Nome',
                                telefone: fields[2] || '',
                                email: fields[3] || '',
                                nomeMedico: fields[4] || '',
                                localCRM: fields[5] || '',
                                dataConsulta: fields[6] || '',
                                horaConsulta: fields[7] || '',
                                tipoCirurgia: fields[8] || '',
                                procedimentos: fields[9] || '',
                                agendamentoFeitoPor: fields[10] || '',
                                descricao: fields[11] || '',
                                status: fields[12] || 'Aguardando Atendimento'
                            };
                            if (!existingIds.has(appointment.id)) {
                                newAppointments.push(appointment);
                            }
                        }
                    });

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
                    showNotification('Dados TXT importados e mesclados no Firebase com sucesso!');
                } catch (error) {
                    console.error('Erro ao processar TXT:', error);
                    errorLogs.push(`[${new Date().toISOString()}] Erro ao processar TXT: ${error.message}`);
                    showNotification('Erro ao importar TXT: ' + error.message, true);
                    progressModal.style.display = 'none';
                }
            };
            reader.onerror = () => {
                showNotification('Erro ao ler o arquivo TXT!', true);
                progressModal.style.display = 'none';
            };
            reader.readAsText(file);
        };
        input.click();
    } catch (error) {
        console.error('Erro ao importar TXT para Firebase:', error);
        errorLogs.push(`[${new Date().toISOString()}] Erro ao importar TXT para Firebase: ${error.message}`);
        showNotification('Erro ao importar: ' + error.message, true);
    }
}

async function importJsonToFirebase() {
    try {
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
                    const data = JSON.parse(event.target.result);
                    const newAppointments = data.appointments || [];
                    const existingIds = new Set(appointments.map(a => a.id));
                    const uniqueAppointments = newAppointments.filter(app => !existingIds.has(app.id));

                    appointments = [...appointments, ...uniqueAppointments];
                    let processed = 0;
                    const total = uniqueAppointments.length;

                    for (const app of uniqueAppointments) {
                        await saveToFirebase('appointments', app);
                        processed++;
                        const percentage = Math.round((processed / total) * 100);
                        progressFill.style.width = `${percentage}%`;
                        progressText.textContent = `${percentage}%`;
                    }

                    await saveToIndexedDB('appointments', appointments);
                    renderAppointments();
                    progressModal.style.display = 'none';
                    showNotification('Dados JSON importados para Firebase com sucesso!');
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
    } catch (error) {
        console.error('Erro ao importar JSON para Firebase:', error);
        errorLogs.push(`[${new Date().toISOString()}] Erro ao importar JSON para Firebase: ${error.message}`);
        showNotification('Erro ao importar JSON: ' + error.message, true);
    }
}

async function importExcelToFirebase() {
    try {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.xlsx, .xls';
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
                    const sheetName = workbook.SheetNames[0];
                    const sheet = workbook.Sheets[sheetName];
                    const jsonData = XLSX.utils.sheet_to_json(sheet);
                    const existingIds = new Set(appointments.map(a => a.id));
                    const newAppointments = [];

                    jsonData.forEach((row, index) => {
                        const appointment = {
                            id: row.id || Date.now().toString() + index,
                            nomePaciente: row.nomePaciente || 'Paciente Sem Nome',
                            telefone: row.telefone || '',
                            email: row.email || '',
                            nomeMedico: row.nomeMedico || '',
                            localCRM: row.localCRM || '',
                            dataConsulta: row.dataConsulta || '',
                            horaConsulta: row.horaConsulta || '',
                            tipoCirurgia: row.tipoCirurgia || '',
                            procedimentos: row.procedimentos || '',
                            agendamentoFeitoPor: row.agendamentoFeitoPor || '',
                            descricao: row.descricao || '',
                            status: row.status || 'Aguardando Atendimento'
                        };
                        if (!existingIds.has(appointment.id)) {
                            newAppointments.push(appointment);
                        }
                    });

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
                    showNotification('Dados Excel importados para Firebase com sucesso!');
                } catch (error) {
                    console.error('Erro ao processar Excel:', error);
                    errorLogs.push(`[${new Date().toISOString()}] Erro ao processar Excel: ${error.message}`);
                    showNotification('Erro ao importar Excel: ' + error.message, true);
                    progressModal.style.display = 'none';
                }
            };
            reader.readAsArrayBuffer(file);
        };
        input.click();
    } catch (error) {
        console.error('Erro ao importar Excel para Firebase:', error);
        errorLogs.push(`[${new Date().toISOString()}] Erro ao importar Excel para Firebase: ${error.message}`);
        showNotification('Erro ao importar Excel: ' + error.message, true);
    }
}

// IndexedDB
async function saveToIndexedDB(storeName, data) {
    try {
        const dbRequest = indexedDB.open('AgendaUnicaDB', DB_VERSION);
        return new Promise((resolve, reject) => {
            dbRequest.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains('appointments')) db.createObjectStore('appointments', { keyPath: 'id' });
                if (!db.objectStoreNames.contains('medicos')) db.createObjectStore('medicos', { keyPath: 'id' });
                if (!db.objectStoreNames.contains('users')) db.createObjectStore('users', { keyPath: 'username' });
                if (!db.objectStoreNames.contains('settings')) db.createObjectStore('settings', { keyPath: 'key' });
            };

            dbRequest.onsuccess = (event) => {
                const db = event.target.result;
                const transaction = db.transaction([storeName], 'readwrite');
                const store = transaction.objectStore(storeName);

                if (Array.isArray(data)) {
                    data.forEach(item => store.put(item));
                } else {
                    store.put({ key: storeName, value: data });
                }

                transaction.oncomplete = () => {
                    db.close();
                    resolve();
                };
                transaction.onerror = () => reject(transaction.error);
            };

            dbRequest.onerror = () => reject(dbRequest.error);
        });
    } catch (error) {
        console.error('Erro ao salvar no IndexedDB:', error);
        errorLogs.push(`[${new Date().toISOString()}] Erro ao salvar no IndexedDB: ${error.message}`);
        throw error;
    }
}

async function loadFromIndexedDB() {
    try {
        const dbRequest = indexedDB.open('AgendaUnicaDB', DB_VERSION);
        return new Promise((resolve, reject) => {
            dbRequest.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains('appointments')) db.createObjectStore('appointments', { keyPath: 'id' });
                if (!db.objectStoreNames.contains('medicos')) db.createObjectStore('medicos', { keyPath: 'id' });
                if (!db.objectStoreNames.contains('users')) db.createObjectStore('users', { keyPath: 'username' });
                if (!db.objectStoreNames.contains('settings')) db.createObjectStore('settings', { keyPath: 'key' });
            };

            dbRequest.onsuccess = (event) => {
                const db = event.target.result;
                const transaction = db.transaction(['appointments', 'medicos', 'users', 'settings'], 'readonly');
                const appointmentsStore = transaction.objectStore('appointments');
                const medicosStore = transaction.objectStore('medicos');
                const usersStore = transaction.objectStore('users');
                const settingsStore = transaction.objectStore('settings');

                const data = { appointments: [], medicos: [], users: [], settings: {} };

                appointmentsStore.getAll().onsuccess = (e) => data.appointments = e.target.result;
                medicosStore.getAll().onsuccess = (e) => data.medicos = e.target.result;
                usersStore.getAll().onsuccess = (e) => data.users = e.target.result;
                settingsStore.get('settings').onsuccess = (e) => data.settings = e.target.result?.value || {};

                transaction.oncomplete = () => {
                    db.close();
                    resolve(data);
                };
                transaction.onerror = () => reject(transaction.error);
            };

            dbRequest.onerror = () => reject(dbRequest.error);
        });
    } catch (error) {
        console.error('Erro ao carregar do IndexedDB:', error);
        errorLogs.push(`[${new Date().toISOString()}] Erro ao carregar do IndexedDB: ${error.message}`);
        throw error;
    }
}

async function clearIndexedDB() {
    try {
        const dbRequest = indexedDB.open('AgendaUnicaDB', DB_VERSION);
        return new Promise((resolve, reject) => {
            dbRequest.onsuccess = (event) => {
                const db = event.target.result;
                const transaction = db.transaction(['appointments', 'medicos', 'users', 'settings'], 'readwrite');
                transaction.objectStore('appointments').clear();
                transaction.objectStore('medicos').clear();
                transaction.objectStore('users').clear();
                transaction.objectStore('settings').clear();

                transaction.oncomplete = () => {
                    db.close();
                    appointments = [];
                    medicos = [];
                    users = [];
                    theme = {};
                    renderAppointments();
                    updateMedicosList();
                    applyTheme();
                    showNotification('IndexedDB limpo com sucesso!');
                    resolve();
                };
                transaction.onerror = () => reject(transaction.error);
            };

            dbRequest.onerror = () => reject(dbRequest.error);
        });
    } catch (error) {
        console.error('Erro ao limpar IndexedDB:', error);
        errorLogs.push(`[${new Date().toISOString()}] Erro ao limpar IndexedDB: ${error.message}`);
        showNotification('Erro ao limpar IndexedDB: ' + error.message, true);
    }
}

// Firebase
async function saveToFirebase(collectionName, data) {
    try {
        if (!data.id && collectionName !== 'settings' && collectionName !== 'backup') {
            throw new Error('ID não fornecido para salvar no Firebase');
        }
        const docRef = doc(db, collectionName, collectionName === 'settings' || collectionName === 'backup' ? collectionName : data.id);
        await setDoc(docRef, data, { merge: true });
        lastSync = Date.now();
        console.log(`Dados salvos no Firebase (${collectionName}):`, data);
    } catch (error) {
        console.error('Erro ao salvar no Firebase:', error);
        errorLogs.push(`[${new Date().toISOString()}] Erro ao salvar no Firebase: ${error.message}`);
        throw error;
    }
}

async function deleteFromFirebase(collectionName, id) {
    try {
        const docRef = doc(db, collectionName, id);
        await deleteDoc(docRef);
        console.log(`Item excluído do Firebase (${collectionName}): ${id}`);
    } catch (error) {
        console.error('Erro ao excluir do Firebase:', error);
        errorLogs.push(`[${new Date().toISOString()}] Erro ao excluir do Firebase: ${error.message}`);
        throw error;
    }
}

async function deleteAllFromFirebase(collectionName) {
    try {
        const querySnapshot = await getDocs(collection(db, collectionName));
        const batch = writeBatch(db);
        querySnapshot.forEach((doc) => batch.delete(doc.ref));
        await batch.commit();
        console.log(`Todos os itens excluídos do Firebase (${collectionName})`);
    } catch (error) {
        console.error('Erro ao excluir todos do Firebase:', error);
        errorLogs.push(`[${new Date().toISOString()}] Erro ao excluir todos do Firebase: ${error.message}`);
        throw error;
    }
}

async function syncLocalWithFirebase() {
    try {
        const collections = ['appointments', 'medicos', 'users', 'settings'];
        for (const collectionName of collections) {
            const querySnapshot = await getDocs(collection(db, collectionName));
            const firebaseData = [];
            querySnapshot.forEach(doc => firebaseData.push(doc.data()));

            if (collectionName === 'appointments') appointments = firebaseData;
            else if (collectionName === 'medicos') medicos = firebaseData;
            else if (collectionName === 'users') users = firebaseData;
            else if (collectionName === 'settings' && firebaseData.length > 0) {
                const settings = firebaseData[0];
                currentView = settings.currentView || 'list';
                deleteAllPassword = settings.deleteAllPassword || '1234';
                lastSync = settings.lastSync || 0;
                theme = settings.theme || {};
            }

            await saveToIndexedDB(collectionName, collectionName === 'settings' ? { currentView, deleteAllPassword, lastSync, theme } : firebaseData);
        }
        console.log('Sincronização com Firebase concluída!');
        showNotification('Sincronização com Firebase concluída!');
    } catch (error) {
        console.error('Erro ao sincronizar com Firebase:', error);
        errorLogs.push(`[${new Date().toISOString()}] Erro ao sincronizar com Firebase: ${error.message}`);
        showNotification('Erro ao sincronizar com Firebase: ' + error.message, true);
    }
}

// Notificações
function showNotification(message, isError = false) {
    try {
        if (!notification) return;
        notification.textContent = message;
        notification.className = `notification ${isError ? 'error' : 'success'}`;
        notification.style.display = 'block';
        setTimeout(() => notification.style.display = 'none', 3000);
        console.log(`Notificação: ${message}`);
    } catch (error) {
        console.error('Erro ao exibir notificação:', error);
        errorLogs.push(`[${new Date().toISOString()}] Erro ao exibir notificação: ${error.message}`);
    }
}

// Limpar Logs
function clearErrorLogs() {
    try {
        errorLogs = [];
        const errorLogsList = document.getElementById('errorLogsList');
        if (errorLogsList) {
            errorLogsList.innerHTML = '<li>Nenhum erro registrado.</li>';
        }
        showNotification('Logs de erros limpos com sucesso!');
    } catch (error) {
        console.error('Erro ao limpar logs:', error);
        errorLogs.push(`[${new Date().toISOString()}] Erro ao limpar logs: ${error.message}`);
        showNotification('Erro ao limpar logs: ' + error.message, true);
    }
}

// Navegação
function scrollToStatusSection() {
    try {
        const section = document.getElementById('statusFilter');
        if (section) {
            section.scrollIntoView({ behavior: 'smooth' });
            showNotification('Rolando para a seção de status!');
        }
    } catch (error) {
        console.error('Erro ao rolar para seção de status:', error);
        errorLogs.push(`[${new Date().toISOString()}] Erro ao rolar para seção de status: ${error.message}`);
        showNotification('Erro ao rolar: ' + error.message, true);
    }
}

// Exposição de Funções Globais
window.editAppointment = editAppointment;
window.deleteAppointment = deleteAppointment;
window.viewAppointment = viewAppointment;
window.shareAppointment = shareAppointment;
window.changeView = changeView;
window.showTab = showTab;
window.toggleDetails = toggleDetails;
window.moveCard = moveCard;
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
window.saveTheme = saveTheme;
window.resetTheme = resetTheme;
window.saveDeletePassword = saveDeletePassword;
window.backupLocal = backupLocal;
window.restoreLocal = restoreLocal;
window.backupFirebase = backupFirebase;
window.restoreFirebase = restoreFirebase;
window.importJsonToFirebase = importJsonToFirebase;
window.importExcelToFirebase = importExcelToFirebase;
window.importTxtToFirebase = importTxtToFirebase;
window.clearIndexedDB = clearIndexedDB;
window.clearErrorLogs = clearErrorLogs;
window.scrollToStatusSection = scrollToStatusSection;
window.generateReport = generateReport;
window.toggleReportView = toggleReportView;

console.log("Aplicação JavaScript carregada com sucesso!");
