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

    // Renderizar os cards
    cardView.innerHTML = '';
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
        cardView.appendChild(card);
    });

    // Renderizar os grids
    gridView.innerHTML = '';
    filteredAppointments.forEach(app => {
        const item = document.createElement('div');
        item.className = 'card';
        item.innerHTML = `
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
                <button class="action-btn delete-btn" onclick="deleteAppointment('${app.id}')">Excluir</button>
            </div>
        `;
        gridView.appendChild(item);
    });

    // Renderizar os pipelines
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

    // Exibe a tabela, cards ou grid conforme a visualização atual
    document.getElementById('appointmentsTable').querySelector('table').style.display = currentView === 'list' && window.innerWidth > 768 ? 'table' : 'none';
    cardView.style.display = currentView === 'grid' || (currentView === 'list' && window.innerWidth <= 768) ? 'grid' : 'none';
    gridView.style.display = currentView === 'grid' ? 'grid' : 'none';
    pipelineView.style.display = currentView === 'pipeline' ? 'grid' : 'none';
}

// Funções de Drag and Drop
let draggedCard = null;

function handleDragStart(e) {
    draggedCard = e.target;
    e.target.classList.add('dragging');
}

function handleDragEnd(e) {
    e.target.classList.remove('dragging');
    draggedCard = null;
}

function handleDragOver(e) {
    e.preventDefault();
}

async function handleDrop(e) {
    e.preventDefault();
    if (draggedCard) {
        const newStatus = e.currentTarget.dataset.status;
        const appointmentId = draggedCard.dataset.id;
        try {
            const docRef = doc(db, 'agendaunica', appointmentId);
            await updateDoc(docRef, { status: newStatus });
            showNotification(`Movido para "${newStatus}" com sucesso!`);
            loadAppointments();
        } catch (error) {
            console.error('Erro ao mover status:', error);
            showNotification('Erro ao mover: ' + error.message, true);
        }
    }
}

// Função para mostrar as opções ao clicar no card no pipeline
function handleCardClick(e, id) {
    if (e.target.classList.contains('action-btn')) return;
    const actionBox = document.getElementById('actionBox');
    actionBox.style.display = 'block';

    const buttons = actionBox.querySelectorAll('button');
    buttons.forEach(btn => {
        btn.onclick = async () => {
            const newStatus = btn.dataset.status;
            try {
                const docRef = doc(db, 'agendaunica', id);
                await updateDoc(docRef, { status: newStatus });
                showNotification(`Movido para "${newStatus}" com sucesso!`);
                actionBox.style.display = 'none';
                loadAppointments();
            } catch (error) {
                console.error('Erro ao mover status:', error);
                showNotification('Erro ao mover: ' + error.message, true);
            }
        };
    });
}

// Funções Globais
window.editAppointment = (id) => {
    const app = appointments.find(a => a.id === id);
    if (app) {
        document.getElementById('nomePaciente').value = app.nomePaciente || '';
        document.getElementById('telefone').value = app.telefone || '';
        document.getElementById('email').value = app.email || '';
        document.getElementById('nomeMedico').value = app.nomeMedico || '';
        document.getElementById('localCRM').value = app.localCRM || '';
        document.getElementById('dataConsulta').value = app.dataConsulta || '';
        document.getElementById('horaConsulta').value = app.horaConsulta || '';
        document.getElementById('tipoCirurgia').value = app.tipoCirurgia || '';
        document.getElementById('procedimentos').value = app.procedimentos || '';
        document.getElementById('agendamentoFeitoPor').value = app.agendamentoFeitoPor || '';
        document.getElementById('descricao').value = app.descricao || '';
        document.getElementById('status').value = app.status || 'Aguardando Atendimento';
        statusGroup.style.display = 'block';
        editId = id;
    }
};

window.deleteAppointment = async (id) => {
    if (confirm('Tem certeza que deseja excluir este agendamento?')) {
        try {
            await deleteDoc(doc(db, 'agendaunica', id));
            showNotification('Agendamento excluído com sucesso!');
            loadAppointments();
        } catch (error) {
            console.error('Erro ao excluir agendamento:', error);
            showNotification('Erro ao excluir agendamento: ' + error.message, true);
        }
    }
};

window.shareAppointment = (id) => {
    const app = appointments.find(a => a.id === id);
    const message = `
        Agendamento:
        Paciente: ${app.nomePaciente || '-'}
        Telefone: ${app.telefone || '-'}
        Email: ${app.email || '-'}
        Médico: ${app.nomeMedico || '-'}
        Local CRM: ${app.localCRM || '-'}
        Data: ${app.dataConsulta || '-'}
        Hora: ${app.horaConsulta || '-'}
        Tipo Cirurgia: ${app.tipoCirurgia || '-'}
        Procedimentos: ${app.procedimentos || '-'}
        Feito Por: ${app.agendamentoFeitoPor || '-'}
        Descrição: ${app.descricao || '-'}
        Status: ${app.status || '-'}
    `.trim();
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`, '_blank');
};

window.viewAppointment = (id) => {
    const app = appointments.find(a => a.id === id);
    alert(`
        Paciente: ${app.nomePaciente || '-'}
        Telefone: ${app.telefone || '-'}
        Email: ${app.email || '-'}
        Médico: ${app.nomeMedico || '-'}
        Local CRM: ${app.localCRM || '-'}
        Data: ${app.dataConsulta || '-'}
        Hora: ${app.horaConsulta || '-'}
        Tipo de Cirurgia: ${app.tipoCirurgia || '-'}
        Procedimentos: ${app.procedimentos || '-'}
        Descrição: ${app.descricao || '-'}
        Agendamento Feito Por: ${app.agendamentoFeitoPor || '-'}
        Status: ${app.status || '-'}
    `);
};

window.openMedicoModal = () => {
    document.getElementById('medicoModal').style.display = 'block';
    updateMedicosListDisplay();
};

window.closeMedicoModal = () => {
    document.getElementById('medicoModal').style.display = 'none';
};

window.saveMedico = () => {
    const nome = document.getElementById('novoMedicoNome').value;
    const crm = document.getElementById('novoMedicoCRM').value;
    if (nome && crm) {
        medicos.push({ nome, crm });
        localStorage.setItem('medicos', JSON.stringify(medicos));
        updateMedicosList();
        updateMedicosListDisplay();
        showNotification('Médico cadastrado com sucesso!');
        document.getElementById('novoMedicoNome').value = '';
        document.getElementById('novoMedicoCRM').value = '';
    } else {
        showNotification('Preencha todos os campos', true);
    }
};

// Função para atualizar a lista de médicos no modal
function updateMedicosListDisplay() {
    const listDisplay = document.getElementById('medicosListDisplay');
    listDisplay.innerHTML = '';
    medicos.forEach((medico, index) => {
        const li = document.createElement('li');
        li.innerHTML = `${medico.nome} - CRM: ${medico.crm}`;
        li.addEventListener('click', () => {
            document.getElementById('nomeMedico').value = medico.nome;
            document.getElementById('localCRM').value = medico.crm;
            closeMedicoModal();
        });

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-medico-btn';
        deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (confirm(`Deseja excluir o médico ${medico.nome}?`)) {
                medicos.splice(index, 1);
                localStorage.setItem('medicos', JSON.stringify(medicos));
                updateMedicosList();
                updateMedicosListDisplay();
                showNotification('Médico excluído com sucesso!');
            }
        });

        li.appendChild(deleteBtn);
        listDisplay.appendChild(li);
    });
    updateMedicosList();
}

// Função para atualizar a lista de médicos no datalist
function updateMedicosList() {
    const datalist = document.getElementById('medicosList');
    datalist.innerHTML = '';
    medicos.forEach(medico => {
        const option = document.createElement('option');
        option.value = medico.nome;
        option.textContent = `${medico.nome} - CRM: ${medico.crm}`;
        datalist.appendChild(option);
    });

    const nomeMedicoInput = document.getElementById('nomeMedico');
    nomeMedicoInput.addEventListener('change', () => {
        const selectedMedico = medicos.find(m => m.nome === nomeMedicoInput.value);
        if (selectedMedico) {
            document.getElementById('localCRM').value = selectedMedico.crm;
        }
    });
}

// Eventos de controle
document.getElementById('allBtn').addEventListener('click', () => {
    document.getElementById('allTab').style.display = 'block';
    document.getElementById('reportsTab').style.display = 'none';
});

document.getElementById('reportsBtn').addEventListener('click', () => {
    document.getElementById('allTab').style.display = 'none';
    document.getElementById('reportsTab').style.display = 'block';
});

document.getElementById('printBtn').addEventListener('click', () => {
    // Esconde todas as visualizações inicialmente
    document.getElementById('appointmentsTable').querySelector('table').style.display = 'none';
    document.getElementById('appointmentsTable').querySelector('table').classList.remove('print');
    cardView.style.display = 'none';
    cardView.classList.remove('print');
    gridView.style.display = 'none';
    gridView.classList.remove('print');
    pipelineView.style.display = 'none';
    pipelineView.classList.remove('print');

    // Mostra a visualização correta com base no modo atual
    if (currentView === 'list') {
        document.getElementById('appointmentsTable').querySelector('table').style.display = 'table';
        document.getElementById('appointmentsTable').querySelector('table').classList.add('print');
    } else if (currentView === 'grid') {
        cardView.style.display = 'grid';
        cardView.classList.add('print');
    } else if (currentView === 'pipeline') {
        pipelineView.style.display = 'grid';
        pipelineView.classList.add('print');
        // Expande todos os detalhes nos cards do pipeline
        document.querySelectorAll('.mini-card .card-details').forEach(details => {
            details.style.display = 'block';
        });
    }

    setTimeout(() => {
        window.print();
        // Após a impressão, reverte para a visualização normal
        renderAppointments();
    }, 100);
});

document.getElementById('statusFilterBtn').addEventListener('click', () => {
    statusFilter.focus();
});

document.getElementById('resetBtn').addEventListener('click', () => {
    statusFilter.value = 'all';
    appointments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    showNotification('Tabela restaurada!');
    renderAppointments();
});

document.getElementById('deleteAllBtn').addEventListener('click', () => {
    document.getElementById('deleteAllModal').style.display = 'block';
});

window.closeDeleteAllModal = () => {
    document.getElementById('deleteAllModal').style.display = 'none';
};

window.confirmDeleteAll = async () => {
    const enteredPassword = document.getElementById('deletePassword').value;
    if (enteredPassword === deleteAllPassword) {
        try {
            const querySnapshot = await getDocs(collection(db, 'agendaunica'));
            for (const docSnap of querySnapshot.docs) {
                await deleteDoc(doc(db, 'agendaunica', docSnap.id));
            }
            showNotification('Todos os agendamentos excluídos!');
            closeDeleteAllModal();
            loadAppointments();
        } catch (error) {
            console.error('Erro ao excluir todos:', error);
            showNotification('Erro ao excluir: ' + error.message, true);
        }
    } else {
        showNotification('Senha incorreta', true);
    }
};

document.getElementById('sortFilterBtn').addEventListener('click', () => {
    document.getElementById('sortFilterModal').style.display = 'block';
});

window.closeSortFilterModal = () => {
    document.getElementById('sortFilterModal').style.display = 'none';
};

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
        case 'month': sortedAppointments.sort((a, b) => new Date(a.dataConsulta || '9999-12-31').getMonth() - new Date(b.dataConsulta || '9999-12-31').getMonth()); break;
        case 'year': sortedAppointments.sort((a, b) => new Date(a.dataConsulta || '9999-12-31').getFullYear() - new Date(b.dataConsulta || '9999-12-31').getFullYear()); break;
    }
    appointments = sortedAppointments;
    renderAppointments();
    closeSortFilterModal();
    showNotification('Filtro aplicado com sucesso!');
};

document.getElementById('clearFiltersBtn').addEventListener('click', () => {
    statusFilter.value = 'all';
    document.getElementById('sortType').value = 'recent';
    appointments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    showNotification('Filtros limpos!');
    renderAppointments();
});

document.getElementById('exportExcelBtn').addEventListener('click', () => {
    const data = appointments.map(app => ({
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
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Agendamentos');
    XLSX.writeFile(wb, 'agendamentos.xlsx');
});

document.getElementById('settingsBtn').addEventListener('click', () => {
    document.getElementById('settingsModal').style.display = 'block';
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
    const backup = JSON.stringify(appointments);
    const blob = new Blob([backup], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'backup_agendamentos.json';
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
                for (const app of data) {
                    await addDoc(collection(db, 'agendaunica'), app);
                }
                showNotification('Backup restaurado com sucesso!');
                loadAppointments();
            } catch (error) {
                showNotification('Erro ao restaurar backup: ' + error.message, true);
            }
        };
        reader.readAsText(file);
    };
    input.click();
});

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

// Função para alternar detalhes no pipeline
window.toggleDetails = (card) => {
    const details = card.querySelector('.card-details');
    details.style.display = details.style.display === 'block' ? 'none' : 'block';
};

// Eventos de visualização
viewModes.forEach(button => {
    button.addEventListener('click', () => {
        viewModes.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        currentView = button.dataset.view;
        renderAppointments();

        // Remove os eventos de clique antigos do pipeline antes de adicionar novos
        if (currentView === 'pipeline') {
            document.querySelectorAll('.mini-card').forEach(card => {
                card.removeEventListener('click', handleCardClick);
                card.addEventListener('click', (e) => {
                    if (!e.target.classList.contains('action-btn')) {
                        handleCardClick(e, card.dataset.id);
                    }
                });
            });
        }
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
