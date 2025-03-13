import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getFirestore, collection, addDoc, getDocs, updateDoc, doc, deleteDoc, setDoc } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

const firebaseConfig = {
    apiKey: "AIzaSyBxPLohS2xOErPb8FH0cFRnNzxy699KHUM",
    authDomain: "agendaunica-fb0ea.firebaseapp.com",
    projectId: "agendaunica-fb0ea",
    storageBucket: "agendaunica-fb0ea.firebasestorage.app",
    messagingSenderId: "1060358457274",
    appId: "1:1060358457274:web:99f18e2c7e1e889e547f83",
    measurementId: "G-L8C2KQZMH7"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const form = document.getElementById('appointmentForm');
const appointmentsBody = document.getElementById('appointmentsBody');
const cardView = document.getElementById('cardView');
const gridView = document.getElementById('gridView');
const pipelineView = document.getElementById('pipelineView');
const tableView = document.getElementById('appointmentsTable');
const viewModes = document.querySelectorAll('.view-mode');
const selectAllCheckbox = document.getElementById('selectAll');
const printBtn = document.getElementById('printBtn');
const resetBtn = document.getElementById('resetBtn');
const deleteAllBtn = document.getElementById('deleteAllBtn');
const sortFilterBtn = document.getElementById('sortFilterBtn');
const mobileViewToggle = document.getElementById('mobileViewToggle');
const statusFilter = document.getElementById('statusFilter');
const statusGroup = document.getElementById('statusGroup');
const notification = document.getElementById('notification');
const tabs = document.querySelectorAll('.tab');
const searchInput = document.getElementById('searchInput');
const reportBody = document.getElementById('reportBody');

let appointments = [];
let editId = null;
let currentView = 'list';
let medicos = JSON.parse(localStorage.getItem('medicos')) || [];
let deleteAllPassword = localStorage.getItem('deleteAllPassword') || '1234'; // Senha padrão

const formFields = ['nomePaciente', 'telefone', 'nomeMedico', 'dataConsulta', 'horaConsulta', 'tipoCirurgia', 'procedimentos', 'agendamentoFeitoPor', 'descricao'];
formFields.forEach(field => {
    const element = document.getElementById(field);
    const savedValue = localStorage.getItem(field);
    if (savedValue) element.value = savedValue;
    element.addEventListener('input', () => localStorage.setItem(field, element.value));
});

function showNotification(message, isError = false) {
    notification.textContent = message;
    notification.className = 'notification' + (isError ? ' error' : '');
    notification.style.display = 'block';
    notification.style.opacity = '1';
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => notification.style.display = 'none', 500);
    }, 3000);
}

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
        nomeMedico: document.getElementById('nomeMedico').value,
        dataConsulta: dataConsulta,
        horaConsulta: document.getElementById('horaConsulta').value,
        tipoCirurgia: document.getElementById('tipoCirurgia').value,
        procedimentos: document.getElementById('procedimentos').value,
        descricao: document.getElementById('descricao').value,
        agendamentoFeitoPor: document.getElementById('agendamentoFeitoPor').value,
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
        console.error('Error saving appointment:', error);
        showNotification('Erro ao salvar agendamento: ' + error.message, true);
    }
});

async function loadAppointments() {
    try {
        const querySnapshot = await getDocs(collection(db, 'agendaunica'));
        appointments = [];
        querySnapshot.forEach((doc) => appointments.push({ id: doc.id, ...doc.data() }));
        appointments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        renderAppointments();
    } catch (error) {
        console.error('Error loading appointments:', error);
        showNotification('Erro ao carregar agendamentos: ' + error.message, true);
    }
}

function filterAppointments(searchTerm) {
    const term = searchTerm.toLowerCase();
    return appointments.filter(app => {
        return (
            (app.nomePaciente && app.nomePaciente.toLowerCase().includes(term)) ||
            (app.telefone && app.telefone.toLowerCase().includes(term)) ||
            (app.nomeMedico && app.nomeMedico.toLowerCase().includes(term)) ||
            (app.dataConsulta && app.dataConsulta.toLowerCase().includes(term))
        );
    });
}

function renderAppointments(searchTerm = '') {
    let filteredAppointments = statusFilter.value === 'all' ? appointments : appointments.filter(app => app.status === statusFilter.value);
    if (searchTerm) {
        filteredAppointments = filterAppointments(searchTerm);
    }

    appointmentsBody.innerHTML = '';
    filteredAppointments.forEach(app => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><input type="checkbox" class="select-row" data-id="${app.id}"></td>
            <td>${app.nomePaciente || '-'}</td>
            <td>${app.telefone || '-'}</td>
            <td>${app.nomeMedico || '-'}</td>
            <td>${app.dataConsulta || '-'}</td>
            <td>${app.horaConsulta || '-'}</td>
            <td>${app.status || '-'}</td>
            <td class="no-print">
                <button class="action-btn edit-btn" onclick="editAppointment('${app.id}')">Editar</button>
                <button class="action-btn share-btn" onclick="shareAppointment('${app.id}')">WhatsApp</button>
                <button class="action-btn view-btn" onclick="viewAppointment('${app.id}')">Visualizar</button>
                <button class="action-btn delete-btn" onclick="deleteAppointment('${app.id}')">Excluir</button>
            </td>
        `;
        appointmentsBody.appendChild(row);
    });

    cardView.innerHTML = '';
    filteredAppointments.forEach(app => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <h4>${app.nomePaciente || 'Sem Nome'}</h4>
            <p>Telefone: ${app.telefone || '-'}</p>
            <p>Médico: ${app.nomeMedico || '-'}</p>
            <p>Data: ${app.dataConsulta || '-'}</p>
            <p>Hora: ${app.horaConsulta || '-'}</p>
            <p>Status: ${app.status || '-'}</p>
            <div class="card-actions">
                <button class="action-btn edit-btn" onclick="editAppointment('${app.id}')">Editar</button>
                <button class="action-btn share-btn" onclick="shareAppointment('${app.id}')">WhatsApp</button>
                <button class="action-btn delete-btn" onclick="deleteAppointment('${app.id}')">Excluir</button>
            </div>
        `;
        cardView.appendChild(card);
    });

    gridView.innerHTML = '';
    filteredAppointments.forEach(app => {
        const item = document.createElement('div');
        item.className = 'card';
        item.innerHTML = `
            <h4>${app.nomePaciente || 'Sem Nome'}</h4>
            <p>Telefone: ${app.telefone || '-'}</p>
            <p>Médico: ${app.nomeMedico || '-'}</p>
            <p>Data: ${app.dataConsulta || '-'}</p>
            <p>Hora: ${app.horaConsulta || '-'}</p>
            <p>Status: ${app.status || '-'}</p>
            <div class="card-actions">
                <button class="action-btn edit-btn" onclick="editAppointment('${app.id}')">Editar</button>
                <button class="action-btn share-btn" onclick="shareAppointment('${app.id}')">WhatsApp</button>
                <button class="action-btn delete-btn" onclick="deleteAppointment('${app.id}')">Excluir</button>
            </div>
        `;
        gridView.appendChild(item);
    });

    const columns = document.querySelectorAll('.pipeline-column');
    columns.forEach(column => {
        const status = column.dataset.status;
        const columnContent = column.querySelector('.column-content');
        columnContent.innerHTML = '';

        const statusFiltered = filteredAppointments.filter(app => app.status === status);
        statusFiltered.forEach(app => {
            const card = document.createElement('div');
            card.className = 'card';
            card.draggable = true;
            card.dataset.id = app.id;
            card.innerHTML = `
                <h4>${app.nomePaciente || 'Sem Nome'}</h4>
                <p>Telefone: ${app.telefone || '-'}</p>
                <p>Médico: ${app.nomeMedico || '-'}</p>
                <p>Data: ${app.dataConsulta || '-'}</p>
                <p>Hora: ${app.horaConsulta || '-'}</p>
                <div class="card-actions">
                    <button class="action-btn edit-btn" onclick="editAppointment('${app.id}')">Editar</button>
                    <button class="action-btn share-btn" onclick="shareAppointment('${app.id}')">WhatsApp</button>
                    <button class="action-btn delete-btn" onclick="deleteAppointment('${app.id}')">Excluir</button>
                </div>
            `;
            columnContent.appendChild(card);

            card.addEventListener('dragstart', handleDragStart);
            card.addEventListener('dragend', handleDragEnd);
            card.addEventListener('touchstart', handleTouchStart, { passive: false });
            card.addEventListener('touchmove', handleTouchMove, { passive: false });
            card.addEventListener('touchend', handleTouchEnd, { passive: false });
            card.addEventListener('click', handleCardClick);
        });

        column.addEventListener('dragover', handleDragOver);
        column.addEventListener('drop', handleDrop);
    });

    if (window.innerWidth > 768) {
        tableView.querySelector('table').style.display = currentView === 'list' ? 'table' : 'none';
        cardView.style.display = 'none';
        gridView.style.display = currentView === 'grid' ? 'grid' : 'none';
        pipelineView.style.display = currentView === 'pipeline' ? 'grid' : 'none';
    } else {
        tableView.querySelector('table').style.display = 'none';
        cardView.style.display = currentView === 'list' ? 'grid' : 'none';
        gridView.style.display = 'none';
        pipelineView.style.display = currentView === 'pipeline' ? 'grid' : 'none';
    }
}

let draggedCard = null;
let touchCard = null;
let startX, startY;

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
            showNotification(`Card movido para "${newStatus}" com sucesso!`);
            loadAppointments();
        } catch (error) {
            console.error('Error updating status:', error);
            showNotification('Erro ao mover card: ' + error.message, true);
        }
    }
}

function handleTouchStart(e) {
    touchCard = e.target.closest('.card');
    if (!touchCard) return;
    touchCard.classList.add('dragging');
    const touch = e.touches[0];
    startX = touch.clientX;
    startY = touch.clientY;
    e.preventDefault();
}

function handleTouchMove(e) {
    if (!touchCard) return;
    const touch = e.touches[0];
    const deltaX = touch.clientX - startX;
    const deltaY = touch.clientY - startY;
    touchCard.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
    e.preventDefault();
}

async function handleTouchEnd(e) {
    if (!touchCard) return;
    touchCard.classList.remove('dragging');
    touchCard.style.transform = '';
    const touch = e.changedTouches[0];
    const dropTarget = document.elementFromPoint(touch.clientX, touch.clientY);
    const column = dropTarget?.closest('.pipeline-column');
    if (column) {
        const newStatus = column.dataset.status;
        const appointmentId = touchCard.dataset.id;
        try {
            const docRef = doc(db, 'agendaunica', appointmentId);
            await updateDoc(docRef, { status: newStatus });
            showNotification(`Card movido para "${newStatus}" com sucesso!`);
            loadAppointments();
        } catch (error) {
            console.error('Error updating status:', error);
            showNotification('Erro ao mover card: ' + error.message, true);
        }
    }
    touchCard = null;
}

function handleCardClick(e) {
    if (currentView !== 'pipeline' || e.target.classList.contains('action-btn')) return;
    const card = e.target.closest('.card');
    if (!card) return;
    const appointmentId = card.dataset.id;
    const actionBox = document.getElementById('actionBox');
    actionBox.style.display = 'block';

    const buttons = actionBox.querySelectorAll('button');
    buttons.forEach(btn => {
        btn.onclick = async () => {
            const newStatus = btn.dataset.status;
            try {
                const docRef = doc(db, 'agendaunica', appointmentId);
                await updateDoc(docRef, { status: newStatus });
                showNotification(`Card movido para "${newStatus}" com sucesso!`);
                actionBox.style.display = 'none';
                loadAppointments();
            } catch (error) {
                console.error('Error updating status:', error);
                showNotification('Erro ao mover card: ' + error.message, true);
            }
        };
    });

    document.addEventListener('click', function closeBox(event) {
        if (!actionBox.contains(event.target) && !card.contains(event.target)) {
            actionBox.style.display = 'none';
            document.removeEventListener('click', closeBox);
        }
    }, { once: true });
}

window.editAppointment = async (id) => {
    const app = appointments.find(a => a.id === id);
    if (app) {
        document.getElementById('nomePaciente').value = app.nomePaciente || '';
        document.getElementById('telefone').value = app.telefone || '';
        document.getElementById('nomeMedico').value = app.nomeMedico || '';
        document.getElementById('dataConsulta').value = app.dataConsulta || '';
        document.getElementById('horaConsulta').value = app.horaConsulta || '';
        document.getElementById('tipoCirurgia').value = app.tipoCirurgia || '';
        document.getElementById('procedimentos').value = app.procedimentos || '';
        document.getElementById('descricao').value = app.descricao || '';
        document.getElementById('agendamentoFeitoPor').value = app.agendamentoFeitoPor || '';
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
            console.error('Error deleting appointment:', error);
            showNotification('Erro ao excluir agendamento: ' + error.message, true);
        }
    }
};

window.shareAppointment = (id) => {
    const app = appointments.find(a => a.id === id);
    const message = `Agendamento:\nPaciente: ${app.nomePaciente || '-'}\nMédico: ${app.nomeMedico || '-'}\nData: ${app.dataConsulta || '-'}\nHora: ${app.horaConsulta || '-'}\nStatus: ${app.status || '-'}`;
    if (app.telefone) {
        window.open(`https://api.whatsapp.com/send?phone=${app.telefone}&text=${encodeURIComponent(message)}`, '_blank');
    } else {
        const phone = prompt('Digite o número do WhatsApp (com DDD):');
        if (phone) window.open(`https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(message)}`, '_blank');
    }
};

window.viewAppointment = (id) => {
    const app = appointments.find(a => a.id === id);
    alert(`
        Paciente: ${app.nomePaciente || '-'}
        Telefone: ${app.telefone || '-'}
        Médico: ${app.nomeMedico || '-'}
        Data: ${app.dataConsulta || '-'}
        Hora: ${app.horaConsulta || '-'}
        Tipo de Cirurgia: ${app.tipoCirurgia || '-'}
        Procedimentos: ${app.procedimentos || '-'}
        Descrição: ${app.descricao || '-'}
        Agendamento Feito Por: ${app.agendamentoFeitoPor || '-'}
        Status: ${app.status || '-'}
    `);
};

// Funções para médicos
window.openMedicoModal = () => {
    document.getElementById('medicoModal').style.display = 'block';
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
        showNotification('Médico cadastrado com sucesso!');
        closeMedicoModal();
        document.getElementById('novoMedicoNome').value = '';
        document.getElementById('novoMedicoCRM').value = '';
    } else {
        showNotification('Por favor, preencha todos os campos', true);
    }
};

function updateMedicosList() {
    const datalist = document.getElementById('medicosList');
    datalist.innerHTML = '';
    medicos.forEach(medico => {
        const option = document.createElement('option');
        option.value = medico.nome;
        option.textContent = `${medico.nome} - CRM: ${medico.crm}`;
        datalist.appendChild(option);
    });
}

// Funções para exclusão de todos
window.openDeleteAllModal = () => {
    if (!deleteAllPassword) {
        showNotification('Defina uma senha padrão primeiro', true);
        return;
    }
    document.getElementById('deleteAllModal').style.display = 'block';
};

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
            showNotification('Todos os agendamentos excluídos com sucesso!');
            closeDeleteAllModal();
            loadAppointments();
        } catch (error) {
            console.error('Error deleting all appointments:', error);
            showNotification('Erro ao excluir todos os agendamentos: ' + error.message, true);
        }
    } else {
        showNotification('Senha incorreta', true);
    }
};

// Funções para filtros avançados
window.openSortFilterModal = () => {
    document.getElementById('sortFilterModal').style.display = 'block';
};

window.closeSortFilterModal = () => {
    document.getElementById('sortFilterModal').style.display = 'none';
};

window.applySortFilter = () => {
    const sortType = document.getElementById('sortType').value;
    let sortedAppointments = [...appointments];

    switch (sortType) {
        case 'nameAZ':
            sortedAppointments.sort((a, b) => (a.nomePaciente || '').localeCompare(b.nomePaciente || ''));
            break;
        case 'recent':
            sortedAppointments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            break;
        case 'oldest':
            sortedAppointments.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
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
            sortedAppointments.sort((a, b) => {
                const dateA = new Date(a.dataConsulta || '9999-12-31');
                const dateB = new Date(b.dataConsulta || '9999-12-31');
                return dateA.getMonth() - dateB.getMonth() || dateA.getFullYear() - dateB.getFullYear();
            });
            break;
        case 'year':
            sortedAppointments.sort((a, b) => new Date(a.dataConsulta || '9999-12-31').getFullYear() - new Date(b.dataConsulta || '9999-12-31').getFullYear());
            break;
    }

    appointments = sortedAppointments;
    renderAppointments(searchInput.value);
    closeSortFilterModal();
    showNotification('Filtro aplicado com sucesso!');
};

// Funções para relatórios
window.generateReport = () => {
    const reportType = document.getElementById('reportType').value;
    const reportMonth = document.getElementById('reportMonth').value;
    const reportYear = document.getElementById('reportYear').value;
    const reportDoctor = document.getElementById('reportDoctor').value;
    let filteredAppointments = [...appointments];

    switch (reportType) {
        case 'all':
            break;
        case 'byName':
            filteredAppointments.sort((a, b) => (a.nomePaciente || '').localeCompare(b.nomePaciente || ''));
            break;
        case 'byRecent':
            filteredAppointments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            break;
        case 'byOldest':
            filteredAppointments.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
            break;
        case 'byPhone':
            filteredAppointments.sort((a, b) => (a.telefone || '').localeCompare(b.telefone || ''));
            break;
        case 'byDate':
            filteredAppointments.sort((a, b) => (a.dataConsulta || '').localeCompare(b.dataConsulta || ''));
            break;
        case 'byDoctor':
            if (reportDoctor) {
                filteredAppointments = filteredAppointments.filter(app => app.nomeMedico === reportDoctor);
            }
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
            if (reportYear) {
                filteredAppointments = filteredAppointments.filter(app => new Date(app.dataConsulta).getFullYear() === parseInt(reportYear));
            }
            break;
    }

    reportBody.innerHTML = '';
    filteredAppointments.forEach(app => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${app.nomePaciente || '-'}</td>
            <td>${app.telefone || '-'}</td>
            <td>${app.nomeMedico || '-'}</td>
            <td>${app.dataConsulta || '-'}</td>
            <td>${app.horaConsulta || '-'}</td>
            <td>${app.status || '-'}</td>
        `;
        reportBody.appendChild(row);
    });

    document.getElementById('reportResult').querySelector('table').style.display = 'table';
    showNotification('Relatório gerado com sucesso!');
};

viewModes.forEach(mode => {
    mode.addEventListener('click', () => {
        viewModes.forEach(m => m.classList.remove('active'));
        mode.classList.add('active');
        currentView = mode.dataset.view;
        renderAppointments(searchInput.value);
    });
});

mobileViewToggle.addEventListener('click', () => {
    if (currentView === 'list') {
        currentView = 'pipeline';
        mobileViewToggle.textContent = 'Lista';
    } else {
        currentView = 'list';
        mobileViewToggle.textContent = 'Pipeline';
    }
    renderAppointments(searchInput.value);
});

selectAllCheckbox.addEventListener('change', () => {
    const checkboxes = document.querySelectorAll('.select-row');
    checkboxes.forEach(cb => cb.checked = selectAllCheckbox.checked);
});

statusFilter.addEventListener('change', () => renderAppointments(searchInput.value));

printBtn.addEventListener('click', () => {
    if (currentView === 'list' && window.innerWidth > 768) {
        tableView.querySelector('table').style.display = 'table';
        cardView.style.display = 'none';
        gridView.style.display = 'none';
        pipelineView.style.display = 'none';
    } else if (currentView === 'grid') {
        tableView.querySelector('table').style.display = 'none';
        cardView.style.display = 'none';
        gridView.classList.add('print');
        gridView.style.display = 'grid';
        pipelineView.style.display = 'none';
    } else if (currentView === 'pipeline') {
        tableView.querySelector('table').style.display = 'none';
        cardView.style.display = 'none';
        gridView.style.display = 'none';
        pipelineView.classList.add('print');
        pipelineView.style.display = 'grid';
    } else {
        tableView.querySelector('table').style.display = 'none';
        cardView.classList.add('print');
        cardView.style.display = 'grid';
        gridView.style.display = 'none';
        pipelineView.style.display = 'none';
    }
    window.print();
    gridView.classList.remove('print');
    cardView.classList.remove('print');
    pipelineView.classList.remove('print');
});

resetBtn.addEventListener('click', () => {
    statusFilter.value = 'all';
    searchInput.value = '';
    appointments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    showNotification('Tabela restaurada!');
    renderAppointments();
});

deleteAllBtn.addEventListener('click', openDeleteAllModal);

sortFilterBtn.addEventListener('click', openSortFilterModal);

tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        document.getElementById(`${tab.dataset.tab}Tab`).classList.add('active');
    });
});

searchInput.addEventListener('input', () => {
    renderAppointments(searchInput.value);
});

searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        searchInput.value = '';
        renderAppointments();
    }
});

updateMedicosList();
loadAppointments();
window.addEventListener('resize', () => renderAppointments(searchInput.value));
