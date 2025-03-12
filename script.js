import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getFirestore, collection, addDoc, getDocs, updateDoc, doc, deleteDoc } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

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
const exportExcelBtn = document.getElementById('exportExcel');
const exportPDFBtn = document.getElementById('exportPDF');
const printBtn = document.getElementById('printBtn');
const resetBtn = document.getElementById('resetBtn');
const mobileViewToggle = document.getElementById('mobileViewToggle');
const statusFilter = document.getElementById('statusFilter');
const statusGroup = document.getElementById('statusGroup');
const themeToggle = document.getElementById('themeToggle');
const notification = document.getElementById('notification');

let appointments = [];
let editId = null;
let currentView = 'list';

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
    const appointmentData = {
        nomePaciente: document.getElementById('nomePaciente').value,
        telefone: document.getElementById('telefone').value,
        nomeMedico: document.getElementById('nomeMedico').value,
        dataConsulta: document.getElementById('dataConsulta').value,
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

function renderAppointments() {
    const filteredAppointments = statusFilter.value === 'all' ? appointments : appointments.filter(app => app.status === statusFilter.value);

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
            <td>
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
            <h4><span class="material-icons">person</span>${app.nomePaciente || 'Sem Nome'}</h4>
            <p><span class="material-icons">phone</span>${app.telefone || '-'}</p>
            <p><span class="material-icons">medical_services</span>${app.nomeMedico || '-'}</p>
            <p><span class="material-icons">event</span>${app.dataConsulta || '-'}</p>
            <p><span class="material-icons">schedule</span>${app.horaConsulta || '-'}</p>
            <p><span class="material-icons">assignment</span>${app.status || '-'}</p>
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
            <h4><span class="material-icons">person</span>${app.nomePaciente || 'Sem Nome'}</h4>
            <p><span class="material-icons">phone</span>${app.telefone || '-'}</p>
            <p><span class="material-icons">medical_services</span>${app.nomeMedico || '-'}</p>
            <p><span class="material-icons">event</span>${app.dataConsulta || '-'}</p>
            <p><span class="material-icons">schedule</span>${app.horaConsulta || '-'}</p>
            <p><span class="material-icons">assignment</span>${app.status || '-'}</p>
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

        const filteredAppointments = appointments.filter(app => app.status === status);
        filteredAppointments.forEach(app => {
            const card = document.createElement('div');
            card.className = 'card';
            card.draggable = true;
            card.dataset.id = app.id;
            card.innerHTML = `
                <h4><span class="material-icons">person</span>${app.nomePaciente || 'Sem Nome'}</h4>
                <p><span class="material-icons">phone</span>${app.telefone || '-'}</p>
                <p><span class="material-icons">medical_services</span>${app.nomeMedico || '-'}</p>
                <p><span class="material-icons">event</span>${app.dataConsulta || '-'}</p>
                <p><span class="material-icons">schedule</span>${app.horaConsulta || '-'}</p>
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

viewModes.forEach(mode => {
    mode.addEventListener('click', () => {
        viewModes.forEach(m => m.classList.remove('active'));
        mode.classList.add('active');
        currentView = mode.dataset.view;
        renderAppointments();
    });
});

mobileViewToggle.addEventListener('click', () => {
    if (currentView === 'list') {
        currentView = 'pipeline';
        mobileViewToggle.textContent = 'list';
    } else {
        currentView = 'list';
        mobileViewToggle.textContent = 'view_kanban';
    }
    renderAppointments();
});

selectAllCheckbox.addEventListener('change', () => {
    const checkboxes = document.querySelectorAll('.select-row');
    checkboxes.forEach(cb => cb.checked = selectAllCheckbox.checked);
});

statusFilter.addEventListener('change', renderAppointments);

printBtn.addEventListener('click', () => {
    window.print();
});

resetBtn.addEventListener('click', () => {
    statusFilter.value = 'all';
    showNotification('Tabela restaurada!');
    renderAppointments();
});

exportExcelBtn.addEventListener('click', () => {
    try {
        const selectedAppointments = appointments.filter(app => {
            const checkbox = document.querySelector(`.select-row[data-id="${app.id}"]`);
            return checkbox && checkbox.checked;
        });
        const dataToExport = selectedAppointments.length > 0 ? selectedAppointments : appointments;
        const formattedData = dataToExport.map(app => ({
            Paciente: app.nomePaciente || '-',
            Telefone: app.telefone || '-',
            Medico: app.nomeMedico || '-',
            Data: app.dataConsulta || '-',
            Hora: app.horaConsulta || '-',
            Tipo_Cirurgia: app.tipoCirurgia || '-',
            Procedimentos: app.procedimentos || '-',
            Descricao: app.descricao || '-',
            Agendamento_Feito_Por: app.agendamentoFeitoPor || '-',
            Status: app.status || '-',
            Criado_Em: new Date(app.createdAt).toLocaleString() || '-'
        }));
        const ws = XLSX.utils.json_to_sheet(formattedData);
        ws['!cols'] = [{ wch: 20 }, { wch: 15 }, { wch: 20 }, { wch: 15 }, { wch: 10 }, { wch: 20 }, { wch: 20 }, { wch: 30 }, { wch: 20 }, { wch: 15 }, { wch: 20 }];
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Agendamentos');
        XLSX.writeFile(wb, 'agendamentos.xlsx');
        showNotification('Exportado para Excel com sucesso!');
    } catch (error) {
        console.error('Error exporting to Excel:', error);
        showNotification('Erro ao exportar para Excel: ' + error.message, true);
    }
});

exportPDFBtn.addEventListener('click', () => {
    try {
        const element = currentView === 'list' ? (window.innerWidth > 768 ? tableView.querySelector('table') : cardView) : 
                       currentView === 'grid' ? gridView : pipelineView;
        const opt = {
            margin: 0.2,
            filename: 'agendamentos.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'in', format: 'a4', orientation: 'landscape' }
        };
        html2pdf().set(opt).from(element).save();
        showNotification('Exportado para PDF com sucesso!');
    } catch (error) {
        console.error('Error exporting to PDF:', error);
        showNotification('Erro ao exportar para PDF: ' + error.message, true);
    }
});

themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
});

if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark-mode');
}

loadAppointments();
window.addEventListener('resize', renderAppointments);
