// Import Firebase functions
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getFirestore, collection, addDoc, getDocs, updateDoc, doc, deleteDoc } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBxPLohS2xOErPb8FH0cFRnNzxy699KHUM",
    authDomain: "agendaunica-fb0ea.firebaseapp.com",
    projectId: "agendaunica-fb0ea",
    storageBucket: "agendaunica-fb0ea.firebasestorage.app",
    messagingSenderId: "1060358457274",
    appId: "1:1060358457274:web:99f18e2c7e1e889e547f83",
    measurementId: "G-L8C2KQZMH7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// DOM Elements
const form = document.getElementById('appointmentForm');
const appointmentsBody = document.getElementById('appointmentsBody');
const gridView = document.getElementById('gridView');
const pipelineView = document.getElementById('pipelineView');
const tableView = document.getElementById('appointmentsTable');
const viewModes = document.querySelectorAll('.view-mode');
const selectAllCheckbox = document.getElementById('selectAll');
const exportExcelBtn = document.getElementById('exportExcel');
const exportPDFBtn = document.getElementById('exportPDF');
const mobileViewToggle = document.getElementById('mobileViewToggle');

let appointments = [];
let editId = null;
let currentView = 'list'; // Track current view (list, grid, or pipeline)

// Persist form data in localStorage
const formFields = ['nomePaciente', 'telefone', 'nomeMedico', 'dataConsulta', 'horaConsulta', 'tipoCirurgia', 'procedimentos', 'agendamentoFeitoPor', 'descricao'];
formFields.forEach(field => {
    const element = document.getElementById(field);
    // Load saved data
    const savedValue = localStorage.getItem(field);
    if (savedValue) element.value = savedValue;
    // Save on input
    element.addEventListener('input', () => {
        localStorage.setItem(field, element.value);
    });
});

// Form submission
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
        status: 'Aguardando Atendimento',
        createdAt: new Date().toISOString()
    };

    try {
        if (editId) {
            const docRef = doc(db, 'agendaunica', editId);
            await updateDoc(docRef, appointmentData);
            editId = null;
        } else {
            await addDoc(collection(db, 'agendaunica'), appointmentData);
        }
        form.reset();
        formFields.forEach(field => localStorage.removeItem(field)); // Clear localStorage after save
        loadAppointments();
    } catch (error) {
        console.error('Error saving appointment:', error);
        alert('Erro ao salvar agendamento: ' + error.message);
    }
});

// Load appointments
async function loadAppointments() {
    try {
        const querySnapshot = await getDocs(collection(db, 'agendaunica'));
        appointments = [];
        querySnapshot.forEach((doc) => {
            appointments.push({ id: doc.id, ...doc.data() });
        });
        appointments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        renderAppointments();
    } catch (error) {
        console.error('Error loading appointments:', error);
        alert('Erro ao carregar agendamentos: ' + error.message);
    }
}

// Render appointments
function renderAppointments() {
    // Table view
    appointmentsBody.innerHTML = '';
    appointments.forEach(app => {
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

    // Grid view
    gridView.innerHTML = '';
    appointments.forEach(app => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <h4>${app.nomePaciente || 'Sem Nome'}</h4>
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
        gridView.appendChild(card);
    });

    // Pipeline view (cards in columns)
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
                <h4>${app.nomePaciente || 'Sem Nome'}</h4>
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

            // Drag-and-drop events
            card.addEventListener('dragstart', handleDragStart);
            card.addEventListener('dragend', handleDragEnd);
        });

        // Allow dropping into columns
        column.addEventListener('dragover', handleDragOver);
        column.addEventListener('drop', handleDrop);
    });
}

// Drag-and-drop handlers
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
            loadAppointments();
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Erro ao atualizar status: ' + error.message);
        }
    }
}

// Edit appointment
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
        
        editId = id;
    }
};

// Delete appointment
window.deleteAppointment = async (id) => {
    if (confirm('Tem certeza que deseja excluir este agendamento?')) {
        try {
            await deleteDoc(doc(db, 'agendaunica', id));
            loadAppointments();
        } catch (error) {
            console.error('Error deleting appointment:', error);
            alert('Erro ao excluir agendamento: ' + error.message);
        }
    }
};

// Share appointment
window.shareAppointment = (id) => {
    const app = appointments.find(a => a.id === id);
    const message = `Agendamento:\nPaciente: ${app.nomePaciente || '-'}\nMédico: ${app.nomeMedico || '-'}\nData: ${app.dataConsulta || '-'}\nHora: ${app.horaConsulta || '-'}\nStatus: ${app.status || '-'}`;
    
    if (app.telefone) {
        window.open(`https://api.whatsapp.com/send?phone=${app.telefone}&text=${encodeURIComponent(message)}`, '_blank');
    } else {
        const phone = prompt('Digite o número do WhatsApp (com DDD):');
        if (phone) {
            window.open(`https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(message)}`, '_blank');
        }
    }
};

// View appointment
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

// View toggle for desktop
viewModes.forEach(mode => {
    mode.addEventListener('click', () => {
        viewModes.forEach(m => m.classList.remove('active'));
        mode.classList.add('active');
        currentView = mode.dataset.view;
        
        tableView.style.display = currentView === 'list' ? 'block' : 'none';
        gridView.style.display = currentView === 'grid' ? 'grid' : 'none';
        pipelineView.style.display = currentView === 'pipeline' ? 'grid' : 'none';
    });
});

// Mobile view toggle
mobileViewToggle.addEventListener('click', () => {
    if (currentView === 'list') {
        currentView = 'grid';
        mobileViewToggle.textContent = 'list';
        tableView.style.display = 'none';
        gridView.style.display = 'grid';
        pipelineView.style.display = 'none';
    } else if (currentView === 'grid') {
        currentView = 'pipeline';
        mobileViewToggle.textContent = 'view_kanban';
        tableView.style.display = 'none';
        gridView.style.display = 'none';
        pipelineView.style.display = 'grid';
    } else {
        currentView = 'list';
        mobileViewToggle.textContent = 'grid_view';
        tableView.style.display = 'block';
        gridView.style.display = 'none';
        pipelineView.style.display = 'none';
    }
});

// Select all checkbox
selectAllCheckbox.addEventListener('change', () => {
    const checkboxes = document.querySelectorAll('.select-row');
    checkboxes.forEach(cb => cb.checked = selectAllCheckbox.checked);
});

// Export to Excel
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
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Agendamentos');
        XLSX.writeFile(wb, 'agendamentos.xlsx');
    } catch (error) {
        console.error('Error exporting to Excel:', error);
        alert('Erro ao exportar para Excel: ' + error.message);
    }
});

// Export to PDF
exportPDFBtn.addEventListener('click', () => {
    try {
        const element = currentView === 'list' ? tableView : currentView === 'grid' ? gridView : pipelineView;
        const opt = {
            margin: 1,
            filename: 'agendamentos.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
        };

        html2pdf().from(element).set(opt).save();
    } catch (error) {
        console.error('Error exporting to PDF:', error);
        alert('Erro ao exportar para PDF: ' + error.message);
    }
});

// Initial load
loadAppointments();