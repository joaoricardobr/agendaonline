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
const appointmentsGrid = document.getElementById('appointmentsGrid');
const tableView = document.getElementById('appointmentsTable');
const gridView = document.getElementById('appointmentsGrid');
const viewModes = document.querySelectorAll('.view-mode');
const pipelineToggle = document.querySelector('.pipeline-toggle');
const pipelineOptions = document.querySelector('.pipeline-options');
const statusFilter = document.getElementById('statusFilter');
const selectAllCheckbox = document.getElementById('selectAll');
const exportExcelBtn = document.getElementById('exportExcel');
const exportPDFBtn = document.getElementById('exportPDF');

let appointments = [];
let editId = null;

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
    const filteredAppointments = statusFilter.value === 'all' 
        ? appointments 
        : appointments.filter(app => app.status === statusFilter.value);

    // Table view
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

    // Grid view
    appointmentsGrid.innerHTML = '';
    filteredAppointments.forEach(app => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <h3>${app.nomePaciente || 'Sem Nome'}</h3>
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
        appointmentsGrid.appendChild(card);
    });
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

// View toggle
viewModes.forEach(mode => {
    mode.addEventListener('click', () => {
        viewModes.forEach(m => m.classList.remove('active'));
        mode.classList.add('active');
        
        if (mode.dataset.view === 'grid') {
            tableView.style.display = 'none';
            gridView.style.display = 'grid';
        } else {
            tableView.style.display = 'block';
            gridView.style.display = 'none';
        }
    });
});

// Pipeline toggle
pipelineToggle.addEventListener('click', () => {
    pipelineOptions.style.display = pipelineOptions.style.display === 'block' ? 'none' : 'block';
});

// Status filter
statusFilter.addEventListener('change', renderAppointments);

// Select all checkbox
selectAllCheckbox.addEventListener('change', () => {
    const checkboxes = document.querySelectorAll('.select-row');
    checkboxes.forEach(cb => cb.checked = selectAllCheckbox.checked);
});

// Export to Excel
exportExcelBtn.addEventListener('click', () => {
    const selectedAppointments = appointments.filter(app => {
        const checkbox = document.querySelector(`.select-row[data-id="${app.id}"]`);
        return checkbox && checkbox.checked;
    });

    const data = selectedAppointments.length > 0 ? selectedAppointments : appointments;
    
    const ws = XLSX.utils.json_to_sheet(data.map(app => ({
        Paciente: app.nomePaciente,
        Telefone: app.telefone,
        Medico: app.nomeMedico,
        Data: app.dataConsulta,
        Hora: app.horaConsulta,
        Status: app.status
    })));
    
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Agendamentos');
    XLSX.writeFile(wb, 'agendamentos.xlsx');
});

// Export to PDF
exportPDFBtn.addEventListener('click', () => {
    const element = document.querySelector('.appointments-section');
    html2pdf()
        .from(element)
        .save('agendamentos.pdf');
});

// Initial load
loadAppointments();
