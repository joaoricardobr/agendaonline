        // Função para Renderizar Agendamentos
        function renderAppointments() {
            let filteredAppointments = statusFilter.value === 'all' ? appointments : appointments.filter(app => app.status === statusFilter.value);
            const columnToggles = document.querySelectorAll('.column-toggle');
            const visibleColumns = Array.from(columnToggles).filter(t => t.checked).map(t => t.dataset.column);

            appointmentsBody.innerHTML = '';
            cardView.innerHTML = '';
            gridView.innerHTML = '';
            pipelineView.querySelectorAll('.column-content').forEach(content => content.innerHTML = '');

            filteredAppointments.forEach(app => {
                // Tabela
                if (currentView === 'list') {
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
                }

                // Cards (Lista e Grid)
                const cardHTML = `
                    <table>
                        <tr><th>Paciente</th><td>${app.nomePaciente || '-'}</td></tr>
                        ${visibleColumns.includes('telefone') ? `<tr><th>Telefone</th><td>${app.telefone || '-'}</td></tr>` : ''}
                        ${visibleColumns.includes('email') ? `<tr><th>Email</th><td>${app.email || '-'}</td></tr>` : ''}
                        ${visibleColumns.includes('nomeMedico') ? `<tr><th>Médico</th><td>${app.nomeMedico || '-'}</td></tr>` : ''}
                        ${visibleColumns.includes('localCRM') ? `<tr><th>Local CRM</th><td>${app.localCRM || '-'}</td></tr>` : ''}
                        ${visibleColumns.includes('dataConsulta') ? `<tr><th>Data</th><td>${app.dataConsulta || '-'}</td></tr>` : ''}
                        ${visibleColumns.includes('horaConsulta') ? `<tr><th>Hora</th><td>${app.horaConsulta || '-'}</td></tr>` : ''}
                        ${visibleColumns.includes('tipoCirurgia') ? `<tr><th>Tipo Cirurgia</th><td>${app.tipoCirurgia || '-'}</td></tr>` : ''}
                        ${visibleColumns.includes('procedimentos') ? `<tr><th>Procedimentos</th><td>${app.procedimentos || '-'}</td></tr>` : ''}
                        ${visibleColumns.includes('agendamentoFeitoPor') ? `<tr><th>Feito Por</th><td>${app.agendamentoFeitoPor || '-'}</td></tr>` : ''}
                        ${visibleColumns.includes('descricao') ? `<tr><th>Descrição</th><td>${app.descricao || '-'}</td></tr>` : ''}
                        ${visibleColumns.includes('status') ? `<tr><th>Status</th><td>${app.status || '-'}</td></tr>` : ''}
                    </table>
                    <div class="card-actions">
                        <button class="action-btn edit-btn" onclick="editAppointment('${app.id}')">Editar</button>
                        <button class="action-btn share-btn" onclick="shareAppointment('${app.id}')">WhatsApp</button>
                        <button class="action-btn delete-btn" onclick="deleteAppointment('${app.id}')">Excluir</button>
                    </div>
                `;

                if (currentView === 'grid' || (currentView === 'list' && window.innerWidth <= 768)) {
                    const card = document.createElement('div');
                    card.className = 'card';
                    card.innerHTML = cardHTML;
                    currentView === 'grid' ? gridView.appendChild(card) : cardView.appendChild(card);
                }

                // Pipeline
                if (currentView === 'pipeline') {
                    const column = pipelineView.querySelector(`.pipeline-column[data-status="${app.status}"] .column-content`);
                    const miniCard = document.createElement('div');
                    miniCard.className = 'mini-card';
                    miniCard.draggable = true;
                    miniCard.dataset.id = app.id;
                    miniCard.dataset.status = app.status;
                    miniCard.innerHTML = `
                        <h4>${app.nomePaciente || 'Sem Nome'}</h4>
                        <p>Data: ${app.dataConsulta || '-'}</p>
                        <p>Hora: ${app.horaConsulta || '-'}</p>
                        <p>Médico: ${app.nomeMedico || '-'}</p>
                        <div class="card-details">
                            <table>
                                ${visibleColumns.includes('telefone') ? `<tr><th>Telefone</th><td>${app.telefone || '-'}</td></tr>` : ''}
                                ${visibleColumns.includes('email') ? `<tr><th>Email</th><td>${app.email || '-'}</td></tr>` : ''}
                                ${visibleColumns.includes('localCRM') ? `<tr><th>Local CRM</th><td>${app.localCRM || '-'}</td></tr>` : ''}
                                ${visibleColumns.includes('tipoCirurgia') ? `<tr><th>Tipo Cirurgia</th><td>${app.tipoCirurgia || '-'}</td></tr>` : ''}
                                ${visibleColumns.includes('procedimentos') ? `<tr><th>Procedimentos</th><td>${app.procedimentos || '-'}</td></tr>` : ''}
                                ${visibleColumns.includes('agendamentoFeitoPor') ? `<tr><th>Feito Por</th><td>${app.agendamentoFeitoPor || '-'}</td></tr>` : ''}
                                ${visibleColumns.includes('descricao') ? `<tr><th>Descrição</th><td>${app.descricao || '-'}</td></tr>` : ''}
                                ${visibleColumns.includes('status') ? `<tr><th>Status</th><td>${app.status || '-'}</td></tr>` : ''}
                            </table>
                            <div class="card-actions">
                                <button class="action-btn edit-btn" onclick="editAppointment('${app.id}')">Editar</button>
                                <button class="action-btn share-btn" onclick="shareAppointment('${app.id}')">WhatsApp</button>
                                <button class="action-btn delete-btn" onclick="deleteAppointment('${app.id}')">Excluir</button>
                            </div>
                        </div>
                        <button class="action-btn view-btn" onclick="toggleDetails(this.parentElement)">Mais Detalhes</button>
                    `;
                    column.appendChild(miniCard);

                    miniCard.addEventListener('dragstart', handleDragStart);
                    miniCard.addEventListener('dragend', handleDragEnd);
                    miniCard.addEventListener('click', (e) => {
                        if (!e.target.classList.contains('action-btn')) handleCardClick(e, app.id);
                    });
                }
            });

            pipelineView.querySelectorAll('.pipeline-column').forEach(column => {
                column.addEventListener('dragover', handleDragOver);
                column.addEventListener('drop', handleDrop);
            });

            document.getElementById('appointmentsTable').querySelector('table').style.display = currentView === 'list' && window.innerWidth > 768 ? 'table' : 'none';
            cardView.style.display = currentView === 'list' && window.innerWidth <= 768 ? 'block' : 'none';
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
                    console.error('Error updating status:', error);
                    showNotification('Erro ao mover: ' + error.message, true);
                }
            }
        }

        function handleCardClick(e, id) {
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
                        console.error('Error updating status:', error);
                        showNotification('Erro ao mover: ' + error.message, true);
                    }
                };
            });

            document.addEventListener('click', function closeBox(event) {
                if (!actionBox.contains(event.target) && !e.target.closest('.mini-card')) {
                    actionBox.style.display = 'none';
                    document.removeEventListener('click', closeBox);
                }
            }, { once: true });
        }

        // Funções de CRUD
        window.editAppointment = async (id) => {
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
                    console.error('Error deleting appointment:', error);
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

        // Funções de Médicos
        window.openMedicoModal = () => {
            document.getElementById('medicoModal').style.display = 'block';
            closeModalOnClickOutside('medicoModal');
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
                showNotification('Preencha todos os campos', true);
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

        // Funções de Abas
        document.getElementById('allBtn').addEventListener('click', () => {
            document.getElementById('allTab').style.display = 'block';
            document.getElementById('reportsTab').style.display = 'none';
        });

        document.getElementById('reportsBtn').addEventListener('click', () => {
            document.getElementById('allTab').style.display = 'none';
            document.getElementById('reportsTab').style.display = 'block';
        });

        // Função de Impressão
        document.getElementById('printBtn').addEventListener('click', () => {
            const printModal = document.getElementById('printModal');
            printModal.style.display = 'block';
            closeModalOnClickOutside('printModal');

            document.getElementById('printTableBtn').onclick = () => {
                printModal.style.display = 'none';
                document.getElementById('appointmentsTable').querySelector('table').style.display = 'table';
                cardView.style.display = 'none';
                gridView.style.display = 'none';
                pipelineView.style.display = 'none';
                window.print();
                renderAppointments();
            };

            document.getElementById('printCardsBtn').onclick = () => {
                printModal.style.display = 'none';
                document.getElementById('appointmentsTable').querySelector('table').style.display = 'none';
                cardView.style.display = 'block';
                cardView.classList.add('print');
                gridView.style.display = 'none';
                pipelineView.style.display = 'none';
                window.print();
                cardView.classList.remove('print');
                renderAppointments();
            };
        });

        // Funções de Filtros e Controles
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
            closeModalOnClickOutside('deleteAllModal');
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
                    console.error('Error deleting all:', error);
                    showNotification('Erro ao excluir: ' + error.message, true);
                }
            } else {
                showNotification('Senha incorreta', true);
            }
        };

        document.getElementById('sortFilterBtn').addEventListener('click', () => {
            document.getElementById('sortFilterModal').style.display = 'block';
            closeModalOnClickOutside('sortFilterModal');
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

        // Configurações
        document.getElementById('settingsBtn').addEventListener('click', () => {
            document.getElementById('settingsModal').style.display = 'block';
            closeModalOnClickOutside('settingsModal');
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

        // Relatórios
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
                    <table>
                        <tr><th>Paciente</th><td>${app.nomePaciente || '-'}</td></tr>
                        <tr><th>Telefone</th><td>${app.telefone || '-'}</td></tr>
                        <tr><th>Email</th><td>${app.email || '-'}</td></tr>
                        <tr><th>Médico</th><td>${app.nomeMedico || '-'}</td></tr>
                        <tr><th>Local CRM</th><td>${app.localCRM || '-'}</td></tr>
                        <tr><th>Data</th><td>${app.dataConsulta || '-'}</td></tr>
                        <tr><th>Hora</th><td>${app.horaConsulta || '-'}</td></tr>
                        <tr><th>Tipo Cirurgia</th><td>${app.tipoCirurgia || '-'}</td></tr>
                        <tr><th>Procedimentos</th><td>${app.procedimentos || '-'}</td></tr>
                        <tr><th>Feito Por</th><td>${app.agendamentoFeitoPor || '-'}</td></tr>
                        <tr><th>Descrição</th><td>${app.descricao || '-'}</td></tr>
                        <tr><th>Status</th><td>${app.status || '-'}</td></tr>
                    </table>
                `;
                reportGrid.appendChild(card);
            });

            document.getElementById('reportTable').querySelector('table').style.display = currentView === 'list' ? 'table' : 'none';
            reportGrid.style.display = currentView === 'grid' ? 'grid' : 'none';
            showNotification('Relatório gerado com sucesso!');
        };

        // Funções de Interface
        viewModes.forEach(mode => {
            mode.addEventListener('click', () => {
                viewModes.forEach(m => m.classList.remove('active'));
                mode.classList.add('active');
                currentView = mode.dataset.view;
                renderAppointments();
            });
        });

        selectAllCheckbox.addEventListener('change', () => {
            const checkboxes = document.querySelectorAll('.select-row');
            checkboxes.forEach(cb => cb.checked = selectAllCheckbox.checked);
        });

        statusFilter.addEventListener('change', () => renderAppointments());

        document.querySelectorAll('.column-toggle').forEach(toggle => {
            toggle.addEventListener('change', () => renderAppointments());
        });

        function toggleDetails(card) {
            const details = card.querySelector('.card-details');
            details.style.display = details.style.display === 'block' ? 'none' : 'block';
        }

        function closeModalOnClickOutside(modalId) {
            const modal = document.getElementById(modalId);
            document.addEventListener('click', function closeModal(event) {
                if (!modal.contains(event.target) && event.target !== document.getElementById(modalId.replace('Modal', 'Btn'))) {
                    modal.style.display = 'none';
                    document.removeEventListener('click', closeModal);
                }
            }, { once: true });
        }

        // Inicialização
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

        updateMedicosList();
        loadAppointments();
 
