import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getFirestore, collection, addDoc, getDocs, updateDoc, doc, deleteDoc } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

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
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Elementos do DOM
const form = document.getElementById('appointmentForm');
const appointmentsBody = document.getElementById('appointmentsBody');
const cardView = document.getElementById('cardView');
const gridView = document.getElementById('gridView');
const pipelineView = document.getElementById('pipelineView');
const viewModes = document.querySelectorAll('.view-mode');
const selectAllCheckbox = document.getElementById('selectAll');
const notification = document.getElementById('notification');
const statusFilter = document.getElementById('statusFilter');
const statusGroup = document.getElementById('statusGroup');
const reportBody = document.getElementById('reportBody');
const reportGrid = document.getElementById('reportGrid');

// Variáveis Globais
let appointments = [];
let editId = null;
let currentView = 'list';
let medicos = JSON.parse(localStorage.getItem('medicos')) || [];
let deleteAllPassword = localStorage.getItem('deleteAllPassword') || '1234';

// Salvar os dados dos inputs no localStorage
const formFields = ['nomePaciente', 'telefone', 'email', 'nomeMedico', 'localCRM', 'dataConsulta', 'horaConsulta', 'tipoCirurgia', 'procedimentos', 'agendamentoFeitoPor', 'descricao'];
formFields.forEach(field => {
    const element = document.getElementById(field);
    const savedValue = localStorage.getItem(field);
    if (savedValue) element.value = savedValue;
    element.addEventListener('input', () => localStorage.setItem(field, element.value));
});

// Função para exibir notificações
function showNotification(message, isError = false) {
    notification.textContent = message;
    notification.className = `notification${isError ? ' error' : ''}`;
    notification.style.display = 'block';
    notification.style.opacity = '1';
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => notification.style.display = 'none', 500);
    }, 3000);
}

// Evento de envio do formulário
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const dataConsulta = document.getElementById('dataConsulta').value;
    if (!dataConsulta) {
        showNotification('Por favor, insira a data da consulta', true);
        return;
    }

    const appointmentData = {
        nomePaciente: document.getElementById('nomePaciente').value,
        telefone: document.getElementById('telefone').value,
        email: document.getElementById('email').value,
        nomeMedico: document.getElementById('nomeMedico').value,
        localCRM: document.getElementById('localCRM').value,
        dataConsulta: dataConsulta,
        horaConsulta: document.getElementById('horaConsulta').value,
        tipoCirurgia: document.getElementById('tipoCirurgia').value,
        procedimentos: document.getElementById('procedimentos').value,
        agendamentoFeitoPor: document.getElementById('agendamentoFeitoPor').value,
        descricao: document.getElementById('descricao').value,
        status: editId ? document.getElementById('status').value : 'Aguardando Atendimento',
        createdAt: editId ? appointments.find(a => a.id === editId).createdAt : new Date().toISOString()
    };

    try {
        if (editId) {
            const docRef = doc(db, 'agendaunica', editId);
            await updateDoc(docRef, appointmentData);
            showNotification('Agendamento atualizado com sucesso!');
            editId = null;
            statusGroup.style.display = 'none';
        } else {
            await addDoc(collection(db, 'agendaunica'), appointmentData);
            showNotification('Agendamento salvo com sucesso!');
        }
        form.reset();
        formFields.forEach(field => localStorage.removeItem(field));
        loadAppointments();
    } catch (error) {
        console.error('Erro ao salvar agendamento:', error);
        showNotification('Erro ao salvar agendamento: ' + error.message, true);
    }
});

// Função para carregar os agendamentos do Firebase
async function loadAppointments() {
    try {
        const querySnapshot = await getDocs(collection(db, 'agendaunica'));
        appointments = [];
        querySnapshot.forEach((doc) => appointments.push({ id: doc.id, ...doc.data() }));
        appointments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        renderAppointments();
    } catch (error) {
        console.error('Erro ao carregar agendamentos:', error);
        showNotification('Erro ao carregar agendamentos: ' + error.message, true);
    }
}

// Função para renderizar os agendamentos na tela
function renderAppointments() {
    let filteredAppointments = statusFilter.value === 'all' ? appointments : appointments.filter(app => app.status === statusFilter.value);

    const columnToggles = document.querySelectorAll('.column-toggle');
    const visibleColumns = Array.from(columnToggles).filter(t => t.checked).map(t => t.dataset.column);

    // Renderizar tabela
    appointmentsBody.innerHTML = '';
    filteredAppointments.forEach(app => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><input type="checkbox" class="select-row" data-id="${app.id}"></td>
            ${visibleColumns.includes('nomePaciente') ? `<td>${app.nomePaciente || '-'}</td>` : ''}
            ${visibleColumns.includes('telefone') ? `<td>${app.telefone || '-'}</td>` : ''}
            ${visibleColumns.includes('email') ? `<td>${app.email || '-'}</td>` : ''}
            ${visibleColumns.includes('nomeMedico') ? `<td>${app.nomeMedico || '-'}</td>` : ''}
            ${visibleColumns.includes('localCRM') ? `<td>${app.localCRM || '-'}</td>` : ''}
            ${visibleColumns.includes('dataConsulta') ? `<td>${app.dataConsulta || '-'}</td>` : ''}
            ${visibleColumns.includes('horaConsulta') ? `<td>${app.horaConsulta || '-'}</td>` : ''}
            ${visibleColumns.includes('tipoCirurgia') ? `<td>${app.tipoCirurgia || '-'}</td>` : ''}
            ${visibleColumns.includes('procedimentos') ? `<td>${app.procedimentos || '-'}</td>` : ''}
            ${visibleColumns.includes('agendamentoFeitoPor') ? `<td>${app.agendamentoFeitoPor || '-'}</td>` : ''}
            ${visibleColumns.includes('descricao') ? `<td>${app.descricao || '-'}</td>` : ''}
            ${visibleColumns.includes('status') ? `<td>${app.status || '-'}</td>` : ''}
            <td class="no-print">
                <button class="action-btn edit-btn" onclick="editAppointment('${app.id}')">Editar</button>
                <button class="action-btn share-btn" onclick="shareAppointment('${app.id}')">WhatsApp</button>
                <button class="action-btn view-btn" onclick="viewAppointment('${app.id}')">Visualizar</button>
                <button class="action-btn delete-btn" onclick="deleteAppointment('${app.id}')">Excluir</button>
            </td>
        `;
        appointmentsBody.appendChild(row);
    });

    // Renderizar cards (usado em modo grid ou mobile)
    cardView.innerHTML = '';
    gridView.innerHTML = ''; // Limpa gridView para evitar duplicatas
    filteredAppointments.forEach(app => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <h4>${app.nomePaciente || 'Sem Nome'}</h4>
            ${visibleColumns.includes('telefone') ? `<p>Telefone: ${app.telefone || '-'}</p>` : ''}
            ${visibleColumns.includes('email') ? `<p>Email: ${app.email || '-'}</p>` : ''}
            ${visibleColumns.includes('nomeMedico') ? `<p>Médico: ${app.nomeMedico || '-'}</p>` : ''}
            ${visibleColumns.includes('localCRM') ? `<p>Local CRM: ${app.localCRM || '-'}</p>` : ''}
            ${visibleColumns.includes('dataConsulta') ? `<p>Data: ${app.dataConsulta || '-'}</p>` : ''}
            ${visibleColumns.includes('horaConsulta') ? `<p>Hora: ${app.horaConsulta || '-'}</p>` : ''}
            ${visibleColumns.includes('tipoCirurgia') ? `<p>Tipo Cirurgia: ${app.tipoCirurgia || '-'}</p>` : ''}
            ${visibleColumns.includes('procedimentos') ? `<p>Procedimentos: ${app.procedimentos || '-'}</p>` : ''}
            ${visibleColumns.includes('agendamentoFeitoPor') ? `<p>Feito Por: ${app.agendamentoFeitoPor || '-'}</p>` : ''}
            ${visibleColumns.includes('descricao') ? `<p>Descrição: ${app.descricao || '-'}</p>` : ''}
            ${visibleColumns.includes('status') ? `<p>Status: ${app.status || '-'}</p>` : ''}
            <div class="card-actions">
                <button class="action-btn edit-btn" onclick="editAppointment('${app.id}')">Editar</button>
                <button class="action-btn share-btn" onclick="shareAppointment('${app.id}')">WhatsApp</button>
                <button class="action-btn view-btn" onclick="viewAppointment('${app.id}')">Visualizar</button>
                <button class="action-btn delete-btn" onclick="deleteAppointment('${app.id}')">Excluir</button>
            </div>
        `;
        if (currentView === 'grid' || (currentView === 'list' && window.innerWidth <= 768)) {
            cardView.appendChild(card);
        }
    });

    // Renderizar pipeline
    const columns = document.querySelectorAll('.pipeline-column');
    columns.forEach(column => {
        const status = column.dataset.status;
        const columnContent = column.querySelector('.column-content');
        columnContent.innerHTML = '';

        const statusFiltered = filteredAppointments.filter(app => app.status === status);
        statusFiltered.forEach(app => {
            const card = document.createElement('div');
            card.className = 'card mini-card';
            card.draggable = true;
            card.dataset.id = app.id;
            card.dataset.status = app.status;
            card.innerHTML = `
                <h4>${app.nomePaciente || 'Sem Nome'}</h4>
                <p class="medico">Médico: ${app.nomeMedico || '-'}</p>
                <div class="data">
                    <span class="date">Data: ${app.dataConsulta || '-'}</span>
                    <span class="time">Hora: ${app.horaConsulta || '-'}</span>
                </div>
                <button class="action-btn view-btn" onclick="toggleDetails(this.parentElement)">Mais Detalhes</button>
                <div class="card-details" style="display: none;">
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
                </div>
            `;
            columnContent.appendChild(card);

            card.addEventListener('dragstart', handleDragStart);
            card.addEventListener('dragend', handleDragEnd);
            if (currentView === 'pipeline') {
                card.addEventListener('click', (e) => {
                    if (!e.target.classList.contains('action-btn')) {
                        handleCardClick(e, app.id);
                    }
                });
            }
        });

        column.addEventListener('dragover', handleDragOver);
        column.addEventListener('drop', handleDrop);
    });

    // Controle de visibilidade das visualizações
    const isMobile = window.innerWidth <= 768;
    document.getElementById('appointmentsTable').querySelector('table').style.display = (currentView === 'list' && !isMobile) ? 'table' : 'none';
    cardView.style.display = (currentView === 'grid' || (currentView === 'list' && isMobile)) ? 'grid' : 'none';
    gridView.style.display = 'none'; // Não usamos mais gridView separadamente
    pipelineView.style.display = currentView === 'pipeline' ? 'block' : 'none';
}

// Funções de Ações
window.editAppointment = (id) => {
    const appointment = appointments.find(app => app.id === id);
    if (!appointment) return;

    editId = id;
    statusGroup.style.display = 'block';
    formFields.forEach(field => document.getElementById(field).value = appointment[field] || '');
    document.getElementById('status').value = appointment.status;
};

window.shareAppointment = (id) => {
    const appointment = appointments.find(app => app.id === id);
    if (!appointment) return;

    const message = `Agendamento:\nNome: ${appointment.nomePaciente || '-'}\nTelefone: ${appointment.telefone || '-'}\nMédico: ${appointment.nomeMedico || '-'}\nData: ${appointment.dataConsulta || '-'}\nHora: ${appointment.horaConsulta || '-'}\nStatus: ${appointment.status || '-'}`;
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
};

window.viewAppointment = (id) => {
    const appointment = appointments.find(app => app.id === id);
    if (!appointment) return;

    const message = `Detalhes do Agendamento:\nNome: ${appointment.nomePaciente || '-'}\nTelefone: ${appointment.telefone || '-'}\nEmail: ${appointment.email || '-'}\nMédico: ${appointment.nomeMedico || '-'}\nLocal CRM: ${appointment.localCRM || '-'}\nData: ${appointment.dataConsulta || '-'}\nHora: ${appointment.horaConsulta || '-'}\nTipo Cirurgia: ${appointment.tipoCirurgia || '-'}\nProcedimentos: ${appointment.procedimentos || '-'}\nFeito Por: ${appointment.agendamentoFeitoPor || '-'}\nDescrição: ${appointment.descricao || '-'}\nStatus: ${appointment.status || '-'}`;
    alert(message);
};

window.deleteAppointment = async (id) => {
    if (!confirm('Tem certeza que deseja excluir este agendamento?')) return;

    try {
        await deleteDoc(doc(db, 'agendaunica', id));
        showNotification('Agendamento excluído com sucesso!');
        loadAppointments();
    } catch (error) {
        console.error('Erro ao excluir agendamento:', error);
        showNotification('Erro ao excluir agendamento: ' + error.message, true);
    }
};

// Funções de Pipeline
let draggedCard = null;

function handleDragStart(e) {
    draggedCard = e.target;
    setTimeout(() => draggedCard.style.opacity = '0.5', 0);
}

function handleDragEnd() {
    draggedCard.style.opacity = '1';
    draggedCard = null;
}

function handleDragOver(e) {
    e.preventDefault();
}

function handleDrop(e) {
    e.preventDefault();
    if (!draggedCard) return;

    const newStatus = e.currentTarget.dataset.status;
    const id = draggedCard.dataset.id;

    const docRef = doc(db, 'agendaunica', id);
    updateDoc(docRef, { status: newStatus })
        .then(() => {
            showNotification(`Agendamento movido para "${newStatus}" com sucesso!`);
            loadAppointments();
        })
        .catch(error => {
            console.error('Erro ao mover agendamento:', error);
            showNotification('Erro ao mover agendamento: ' + error.message, true);
        });
}

function handleCardClick(e, id) {
    const actionBox = document.getElementById('actionBox');
    actionBox.dataset.id = id;
    actionBox.style.display = 'block';

    actionBox.querySelectorAll('button').forEach(btn => {
        btn.onclick = () => {
            const newStatus = btn.dataset.status;
            const docRef = doc(db, 'agendaunica', id);
            updateDoc(docRef, { status: newStatus })
                .then(() => {
                    showNotification(`Agendamento movido para "${newStatus}" com sucesso!`);
                    actionBox.style.display = 'none';
                    loadAppointments();
                })
                .catch(error => showNotification('Erro ao mover agendamento: ' + error.message, true));
        };
    });
}

// Funções de Médicos
window.openMedicoModal = () => document.getElementById('medicoModal').style.display = 'block';
window.closeMedicoModal = () => document.getElementById('medicoModal').style.display = 'none';

window.saveMedico = () => {
    const nome = document.getElementById('novoMedicoNome').value;
    const crm = document.getElementById('novoMedicoCRM').value;
    if (!nome || !crm) {
        showNotification('Por favor, preencha todos os campos do médico', true);
        return;
    }

    medicos.push({ nome, crm });
    localStorage.setItem('medicos', JSON.stringify(medicos));
    updateMedicosList();
    document.getElementById('novoMedicoNome').value = '';
    document.getElementById('novoMedicoCRM').value = '';
    closeMedicoModal();
    showNotification('Médico cadastrado com sucesso!');
};

function updateMedicosList() {
    const datalist = document.getElementById('medicosList');
    const displayList = document.getElementById('medicosListDisplay');
    datalist.innerHTML = '';
    displayList.innerHTML = '';

    medicos.forEach(medico => {
        const option = document.createElement('option');
        option.value = medico.nome;
        datalist.appendChild(option);

        const li = document.createElement('li');
        li.innerHTML = `${medico.nome} - CRM: ${medico.crm} <button class="delete-medico-btn" onclick="deleteMedico('${medico.nome}')">Excluir</button>`;
        displayList.appendChild(li);
    });
}

window.deleteMedico = (nome) => {
    medicos = medicos.filter(m => m.nome !== nome);
    localStorage.setItem('medicos', JSON.stringify(medicos));
    updateMedicosList();
    showNotification('Médico excluído com sucesso!');
};

// Funções de Relatórios
window.generateReport = () => {
    const reportType = document.getElementById('reportType').value;
    const reportMonth = document.getElementById('reportMonth').value;
    const reportYear = document.getElementById('reportYear').value;
    const reportDoctor = document.getElementById('reportDoctor').value;
    let filteredAppointments = [...appointments];

    switch (reportType) {
        case 'all': break;
        case 'byName': filteredAppointments.sort((a, b) => (a.nomePaciente || '').localeCompare(b.nomePaciente || '')); break;
        case 'byRecent': filteredAppointments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); break;
        case 'byOldest': filteredAppointments.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)); break;
        case 'byPhone': filteredAppointments.sort((a, b) => (a.telefone || '').localeCompare(b.telefone || '')); break;
        case 'byDate': filteredAppointments.sort((a, b) => (a.dataConsulta || '').localeCompare(b.dataConsulta || '')); break;
        case 'byDoctor':
            if (reportDoctor) filteredAppointments = filteredAppointments.filter(app => app.nomeMedico === reportDoctor);
            filteredAppointments.sort((a, b) => (a.nomeMedico || '').localeCompare(b.nomeMedico || ''));
            break;
        case 'byMonth':
            if (reportMonth) {
                const [year, month] = reportMonth.split('-');
                filteredAppointments = filteredAppointments.filter(app => {
                    const date = new Date(app.dataConsulta);
                    return date.getFullYear() === parseInt(year) && date.getMonth() === parseInt(month) - 1;
                });
            }
            break;
        case 'byYear':
            if (reportYear) filteredAppointments = filteredAppointments.filter(app => new Date(app.dataConsulta).getFullYear() === parseInt(reportYear));
            break;
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

    reportBody.parentElement.style.display = 'block';
    reportGrid.style.display = 'none';
    showNotification('Relatório gerado com sucesso!');
};

// Função para alternar visualização nos relatórios
window.toggleReportView = (view) => {
    const reportTable = document.getElementById('reportResult');
    const reportGrid = document.getElementById('reportGrid');
    const buttons = document.querySelectorAll('#reportsTab .view-mode');

    buttons.forEach(btn => btn.classList.remove('active'));
    document.querySelector(`#reportsTab .view-mode[data-view="${view}"]`).classList.add('active');

    if (view === 'list') {
        reportTable.style.display = 'block';
        reportGrid.style.display = 'none';
    } else if (view === 'grid') {
        reportTable.style.display = 'none';
        reportGrid.style.display = 'grid';
    }
};

// Função para alternar detalhes no pipeline
window.toggleDetails = (card) => {
    const details = card.querySelector('.card-details');
    details.style.display = details.style.display === 'block' ? 'none' : 'block';
};

// Eventos de Controles
document.getElementById('allBtn').addEventListener('click', () => {
    document.getElementById('allTab').style.display = 'block';
    document.getElementById('reportsTab').style.display = 'none';
});

document.getElementById('reportsBtn').addEventListener('click', () => {
    document.getElementById('allTab').style.display = 'none';
    document.getElementById('reportsTab').style.display = 'block';
});

document.getElementById('printBtn').addEventListener('click', () => {
    if (currentView === 'list') {
        document.querySelector('#appointmentsTable table').classList.add('print');
    } else if (currentView === 'grid') {
        cardView.classList.add('print');
    } else if (currentView === 'pipeline') {
        pipelineView.classList.add('print');
    }
    window.print();
    document.querySelector('#appointmentsTable table').classList.remove('print');
    cardView.classList.remove('print');
    pipelineView.classList.remove('print');
});

document.getElementById('exportExcelBtn').addEventListener('click', () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(appointments.map(app => ({
        'Nome do Paciente': app.nomePaciente,
        'Telefone': app.telefone,
        'Email': app.email,
        'Médico': app.nomeMedico,
        'Local CRM': app.localCRM,
        'Data': app.dataConsulta,
        'Hora': app.horaConsulta,
        'Tipo Cirurgia': app.tipoCirurgia,
        'Procedimentos': app.procedimentos,
        'Feito Por': app.agendamentoFeitoPor,
        'Descrição': app.descricao,
        'Status': app.status
    })));
    XLSX.utils.book_append_sheet(wb, ws, 'Agendamentos');
    XLSX.writeFile(wb, 'agendamentos.xlsx');
});

document.getElementById('deleteAllBtn').addEventListener('click', () => {
    document.getElementById('deleteAllModal').style.display = 'block';
});

window.confirmDeleteAll = async () => {
    const password = document.getElementById('deletePassword').value;
    if (password !== deleteAllPassword) {
        showNotification('Senha incorreta!', true);
        return;
    }

    try {
        const querySnapshot = await getDocs(collection(db, 'agendaunica'));
        const batch = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(batch);
        showNotification('Todos os agendamentos foram excluídos!');
        document.getElementById('deleteAllModal').style.display = 'none';
        loadAppointments();
    } catch (error) {
        showNotification('Erro ao excluir todos os agendamentos: ' + error.message, true);
    }
};

window.closeDeleteAllModal = () => document.getElementById('deleteAllModal').style.display = 'none';

document.getElementById('resetBtn').addEventListener('click', () => {
    form.reset();
    formFields.forEach(field => localStorage.removeItem(field));
    editId = null;
    statusGroup.style.display = 'none';
    showNotification('Formulário restaurado!');
});

document.getElementById('sortFilterBtn').addEventListener('click', () => document.getElementById('sortFilterModal').style.display = 'block');
window.closeSortFilterModal = () => document.getElementById('sortFilterModal').style.display = 'none';

window.applySortFilter = () => {
    const sortType = document.getElementById('sortType').value;
    let sortedAppointments = [...appointments];

    switch (sortType) {
        case 'nameAZ': sortedAppointments.sort((a, b) => (a.nomePaciente || '').localeCompare(b.nomePaciente || '')); break;
        case 'recent': sortedAppointments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); break;
        case 'oldest': sortedAppointments.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)); break;
        case 'phone': sortedAppointments.sort((a, b) => (a.telefone || '').localeCompare(b.telefone || '')); break;
        case 'date': sortedAppointments.sort((a, b) => (a.dataConsulta || '').localeCompare(b.dataConsulta || '')); break;
        case 'doctor': sortedAppointments.sort((a, b) => (a.nomeMedico || '').localeCompare(b.nomeMedico || '')); break;
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
};

document.getElementById('clearFiltersBtn').addEventListener('click', () => {
    statusFilter.value = 'all';
    appointments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    renderAppointments();
    showNotification('Filtros limpos!');
});

document.getElementById('settingsBtn').addEventListener('click', (e) => {
    e.stopPropagation();
    document.getElementById('settingsModal').style.display = 'block';
});

document.addEventListener('click', (e) => {
    const settingsModal = document.getElementById('settingsModal');
    const settingsBtn = document.getElementById('settingsBtn');
    if (settingsModal.style.display === 'block' && !settingsModal.contains(e.target) && !settingsBtn.contains(e.target)) {
        settingsModal.style.display = 'none';
    }
});

document.getElementById('saveTheme').addEventListener('click', () => {
    const bodyBgColor = document.getElementById('bodyBgColor').value;
    const cardBgColor = document.getElementById('cardBgColor').value;
    const formBgColor = document.getElementById('formBgColor').value;
    const textColor = document.getElementById('textColor').value;
    const borderColor = document.getElementById('borderColor').value;
    const newPassword = document.getElementById('deleteAllPassword').value;

    document.body.style.backgroundColor = bodyBgColor;
    document.querySelectorAll('.card, .search-card, .form-section, .appointments-section, .action-box').forEach(el => {
        el.style.backgroundColor = cardBgColor;
        el.style.borderColor = borderColor;
    });
    document.querySelector('.form-section').style.backgroundColor = formBgColor;
    document.body.style.color = textColor;
    document.querySelectorAll('input, select, textarea').forEach(el => el.style.borderColor = borderColor);

    if (newPassword) {
        deleteAllPassword = newPassword;
        localStorage.setItem('deleteAllPassword', newPassword);
    }

    localStorage.setItem('theme', JSON.stringify({ bodyBgColor, cardBgColor, formBgColor, textColor, borderColor }));
    showNotification('Tema salvo com sucesso!');
    document.getElementById('settingsModal').style.display = 'none';
});

document.getElementById('resetTheme').addEventListener('click', () => {
    document.body.style.backgroundColor = '#f0f4f8';
    document.querySelectorAll('.card, .search-card, .form-section, .appointments-section, .action-box').forEach(el => {
        el.style.backgroundColor = '#ffffff';
        el.style.borderColor = '#1e40af';
    });
    document.querySelector('.form-section').style.backgroundColor = '#ffffff';
    document.body.style.color = '#1f2937';
    document.querySelectorAll('input, select, textarea').forEach(el => el.style.borderColor = '#1e40af');

    localStorage.removeItem('theme');
    showNotification('Tema restaurado!');
    document.getElementById('settingsModal').style.display = 'none';
});

document.getElementById('backupData').addEventListener('click', () => {
    const backupData = JSON.stringify({ appointments, medicos });
    const blob = new Blob([backupData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'backup-agendamentos.json';
    a.click();
    URL.revokeObjectURL(url);
    showNotification('Backup realizado com sucesso!');
});

document.getElementById('restoreBackup').addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const data = JSON.parse(event.target.result);
                appointments = data.appointments || [];
                medicos = data.medicos || [];
                localStorage.setItem('medicos', JSON.stringify(medicos));

                const batch = appointments.map(app => {
                    if (app.id) return updateDoc(doc(db, 'agendaunica', app.id), app);
                    return addDoc(collection(db, 'agendaunica'), app);
                });
                await Promise.all(batch);

                loadAppointments();
                updateMedicosList();
                showNotification('Backup restaurado com sucesso!');
            } catch (error) {
                showNotification('Erro ao restaurar backup: ' + error.message, true);
            }
        };
        reader.readAsText(file);
    };
    input.click();
});

// Eventos de visualização
viewModes.forEach(button => {
    button.addEventListener('click', () => {
        viewModes.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        currentView = button.dataset.view;
        renderAppointments();
    });
});

// Evento para selecionar todas as linhas
selectAllCheckbox.addEventListener('change', () => {
    document.querySelectorAll('.select-row').forEach(cb => cb.checked = selectAllCheckbox.checked);
});

// Evento para filtrar por status
statusFilter.addEventListener('change', renderAppointments);

// Evento para alternar colunas visíveis
document.querySelectorAll('.column-toggle').forEach(toggle => {
    toggle.addEventListener('change', () => {
        const column = toggle.dataset.column;
        const cells = document.querySelectorAll(`td:nth-child(${Array.from(toggle.parentElement.parentElement.children).indexOf(toggle.parentElement) + 1})`);
        cells.forEach(cell => cell.style.display = toggle.checked ? '' : 'none');
        renderAppointments();
    });
});

// Carregar tema salvo
const savedTheme = JSON.parse(localStorage.getItem('theme'));
if (savedTheme) {
    document.body.style.backgroundColor = savedTheme.bodyBgColor;
    document.querySelectorAll('.card, .search-card, .form-section, .appointments-section, .action-box').forEach(el => {
        el.style.backgroundColor = savedTheme.cardBgColor;
        el.style.borderColor = savedTheme.borderColor;
    });
    document.querySelector('.form-section').style.backgroundColor = savedTheme.formBgColor;
    document.body.style.color = savedTheme.textColor;
    document.querySelectorAll('input, select, textarea').forEach(el => el.style.borderColor = savedTheme.borderColor);
}

// Inicializar a aplicação
loadAppointments();
updateMedicosList();
