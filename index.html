<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Agenda Consultório Dra Soraya</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" integrity="sha512-iecdLmaskl7CVkqkXNQ/ZH/XLlvWZOJyj7Yy7tcenmpD1ypASozpmT/E0iPtmFIB46ZmdtAc9eNBvH0H/ZpiBw==" crossorigin="anonymous" referrerpolicy="no-referrer" />
    <script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <!-- Tela de Login -->
    <div class="login-container" id="loginContainer">
        <div class="login-box">
            <h2>Agenda Consultório Dra Soraya</h2>
            <p>"Bem-vindo! Você está acessando a agenda da Dra. Soraya. Aqui você pode visualizar e gerenciar os compromissos de forma rápida e prática."</p>
            <form id="loginForm">
                <div class="form-group">
                    <label for="loginEmail">Email</label>
                    <input type="email" id="loginEmail" required placeholder="Digite seu email">
                </div>
                <div class="form-group">
                    <label for="loginPassword">Senha</label>
                    <input type="password" id="loginPassword" required placeholder="Digite sua senha">
                </div>
                <button type="submit">Entrar</button>
            </form>
        </div>
    </div>

    <!-- Conteúdo Principal -->
    <div id="mainContent" style="display: none;">
        <div class="container">
            <header>
                <h1>Agenda Consultório</h1>
                <button class="control-btn" id="logoutBtn" data-tooltip="Sair"><i class="fas fa-sign-out-alt"></i> Sair</button>
            </header>

            <!-- Formulário de Agendamento -->
            <div class="form-section">
                <form id="appointmentForm">
                    <div class="form-grid">
                        <div class="form-group">
                            <label for="nomePaciente"><i class="fas fa-user"></i> Nome do Paciente</label>
                            <input type="text" id="nomePaciente" name="nomePaciente" required>
                        </div>
                        <div class="form-group">
                            <label for="telefone"><i class="fas fa-phone"></i> Telefone</label>
                            <input type="text" id="telefone" name="telefone" placeholder="Opcional: (xx) xxxxx-xxxx">
                        </div>
                        <div class="form-group">
                            <label for="email"><i class="fas fa-envelope"></i> Email</label>
                            <input type="email" id="email" name="email">
                        </div>
                        <div class="form-group">
                            <label for="nomeMedico"><i class="fas fa-user-md"></i> Nome do Médico</label>
                            <div style="position: relative;">
                                <input type="text" id="nomeMedico" name="nomeMedico" list="medicosList" placeholder="Opcional: Nome do médico">
                                <button type="button" class="add-medico-btn" onclick="openMedicoModal()">+</button>
                                <datalist id="medicosList"></datalist>
                            </div>
                        </div>
                        <div class="form-group">
                            <label for="localCRM"><i class="fas fa-id-card"></i> Local do CRM</label>
                            <input type="text" id="localCRM" name="localCRM">
                        </div>
                        <div class="form-group">
                            <label for="dataConsulta"><i class="fas fa-calendar"></i> Data da Consulta</label>
                            <input type="date" id="dataConsulta" name="dataConsulta">
                        </div>
                        <div class="form-group">
                            <label for="horaConsulta"><i class="fas fa-clock"></i> Hora da Consulta</label>
                            <input type="time" id="horaConsulta" name="horaConsulta">
                        </div>
                        <div class="form-group">
                            <label for="tipoCirurgia"><i class="fas fa-syringe"></i> Tipo de Cirurgia</label>
                            <input type="text" id="tipoCirurgia" name="tipoCirurgia" list="cirurgiasList">
                            <datalist id="cirurgiasList">
                                <option value="Prótese de Mamas">
                                <option value="Abdominoplastia">
                                <option value="Lipoaspiração">
                                <option value="Blefaroplastia">
                                <option value="Rinoplastia">
                                <option value="Prótese de Glúteos">
                                <option value="Lifting Facial">
                                <option value="Redução de Mamas">
                            </datalist>
                        </div>
                        <div class="form-group">
                            <label for="procedimentos"><i class="fas fa-tools"></i> Procedimentos</label>
                            <input type="text" id="procedimentos" name="procedimentos" list="procedimentosList">
                            <datalist id="procedimentosList">
                                <option value="Toxina Botulínica">
                                <option value="Ácido Hialurônico">
                                <option value="Peelings Químicos">
                                <option value="Fios Silhouette">
                                <option value="Laser CO2 Fracionado">
                                <option value="Mesoterapia">
                                <option value="Bioplastia">
                                <option value="VIP Lifting">
                                <option value="Carboxiterapia">
                                <option value="Drenagem Linfática">
                                <option value="Massagem Modeladora">
                                <option value="Hidrolipoclasia">
                                <option value="Lipo Enzimática">
                                <option value="Fórmulas Manipuladas">
                                <option value="Microagulhamento">
                                <option value="Medicações">
                                <option value="Limpeza de Pele">
                                <option value="Remodelação Nasal Não Cirúrgica">
                            </datalist>
                        </div>
                        <div class="form-group">
                            <label for="agendamentoFeitoPor"><i class="fas fa-user-tie"></i> Agendamento Feito Por</label>
                            <input type="text" id="agendamentoFeitoPor" name="agendamentoFeitoPor">
                        </div>
                        <div class="form-group" id="statusGroup" style="display: none;">
                            <label for="status"><i class="fas fa-info-circle"></i> Status de Atendimento</label>
                            <select id="status" name="status">
                                <option value="Aguardando Atendimento">Aguardando Atendimento</option>
                                <option value="Atendido">Atendido</option>
                                <option value="Reagendado">Reagendado</option>
                                <option value="Cancelado">Cancelado</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-group full-width">
                        <label for="descricao"><i class="fas fa-notes-medical"></i> Descrição</label>
                        <textarea id="descricao" name="descricao" placeholder="⚕️ Histórico Médico | 💉 Diabetes | 🩺 Hipertensão | 🤧 Alergias | 🌬️ Asma | ❤️ Doenças Cardíacas | 🧠 Epilepsia | ✅ Nenhuma Doença"></textarea>
                    </div>
                    <div class="form-actions">
                        <button type="submit" id="saveButton">Salvar</button>
                        <button type="button" class="control-btn" id="resetBtn" data-tooltip="Limpar Formulário"><i class="fas fa-sync-alt"></i> Limpar Formulário</button>
                    </div>
                </form>
            </div>

            <!-- Controles e Filtros com Barra de Busca -->
            <div class="search-card">
                <div class="header-controls">
                    <button class="control-btn" id="allBtn" data-tooltip="Todos"><i class="fas fa-list-ul"></i> Todos</button>
                    <button class="control-btn" id="reportsBtn" data-tooltip="Relatórios"><i class="fas fa-chart-bar"></i> Relatórios</button>
                    <button class="control-btn" id="insightsBtn" data-tooltip="Insights"><i class="fas fa-lightbulb"></i> Insights</button>
                    <button class="control-btn" id="settingsBtn" data-tooltip="Configurações"><i class="fas fa-cog"></i> Configurações</button>
                    <button class="control-btn" id="printBtn" data-tooltip="Imprimir"><i class="fas fa-print"></i> Imprimir</button>
                    <button class="control-btn" id="statusFilterBtn" data-tooltip="Status"><i class="fas fa-filter"></i> Status</button>
                    <button class="control-btn" id="sortFilterBtn" data-tooltip="Filtros Avançados"><i class="fas fa-sliders-h"></i> Filtros</button>
                    <button class="control-btn" id="clearFiltersBtn" data-tooltip="Limpar Filtros"><i class="fas fa-eraser"></i> Limpar</button>
                    <button class="control-btn delete-all-btn" id="deleteAllBtn" data-tooltip="Excluir Todos"><i class="fas fa-trash-alt"></i> Excluir Tudo</button>
                </div>
                <!-- Barra de Busca Global -->
                <div class="search-bar" style="margin-top: 15px; width: 100%;">
                    <input type="text" id="globalSearch" placeholder="Busca global (pacientes, médicos, telefones, etc.)" style="width: 100%; padding: 12px; border-radius: 10px; border: 1.5px solid #ced4da; font-size: 15px;">
                </div>
            </div>

            <!-- Seção de Agendamentos -->
            <div class="appointments-section">
                <!-- Aba "Todos" -->
                <div id="allTab" class="tab-content">
                    <div class="table-controls">
                        <div class="filters">
                            <select id="statusFilter">
                                <option value="all">Todos os Status</option>
                                <option value="Aguardando Atendimento">Aguardando Atendimento</option>
                                <option value="Atendido">Atendido</option>
                                <option value="Reagendado">Reagendado</option>
                                <option value="Cancelado">Cancelado</option>
                            </select>
                        </div>
                        <button class="view-mode active" data-view="list" data-tooltip="Lista"><i class="fas fa-list"></i> Lista</button>
                        <button class="view-mode" data-view="grid" data-tooltip="Grid"><i class="fas fa-th"></i> Grid</button>
                        <button class="view-mode" data-view="pipeline" data-tooltip="Pipeline"><i class="fas fa-stream"></i> Pipeline</button>
                        <button class="control-btn" id="exportExcelBtn" data-tooltip="Exportar Excel"><i class="fas fa-file-excel"></i> Baixar Excel</button>
                        <button class="control-btn" id="selectAllBtn" data-tooltip="Selecionar Todos"><i class="fas fa-check-square"></i> Selecionar Todos</button>
                    </div>

                    <!-- Visualização em Tabela -->
                    <div id="appointmentsTable" class="table-view active">
                        <table>
                            <thead>
                                <tr>
                                    <th><input type="checkbox" id="selectAll"></th>
                                    <th><input type="checkbox" class="column-toggle" data-column="ID" checked>ID</th>
                                    <th><input type="checkbox" class="column-toggle" data-column="nomePaciente" checked>Paciente</th>
                                    <th><input type="checkbox" class="column-toggle" data-column="telefone" checked>Telefone</th>
                                    <th><input type="checkbox" class="column-toggle" data-column="email" checked>Email</th>
                                    <th><input type="checkbox" class="column-toggle" data-column="nomeMedico" checked>Médico</th>
                                    <th><input type="checkbox" class="column-toggle" data-column="localCRM" checked>Local CRM</th>
                                    <th><input type="checkbox" class="column-toggle" data-column="dataConsulta" checked>Data</th>
                                    <th><input type="checkbox" class="column-toggle" data-column="horaConsulta" checked>Hora</th>
                                    <th><input type="checkbox" class="column-toggle" data-column="tipoCirurgia" checked>Tipo Cirurgia</th>
                                    <th><input type="checkbox" class="column-toggle" data-column="procedimentos" checked>Procedimentos</th>
                                    <th><input type="checkbox" class="column-toggle" data-column="agendamentoFeitoPor" checked>Feito Por</th>
                                    <th><input type="checkbox" class="column-toggle" data-column="descricao" checked>Descrição</th>
                                    <th><input type="checkbox" class="column-toggle" data-column="status" checked>Status</th>
                                    <th class="no-print">Ações</th>
                                </tr>
                            </thead>
                            <tbody id="appointmentsBody"></tbody>
                        </table>
                    </div>

                    <!-- Visualização em Grid -->
                    <div id="gridView" class="grid-view"></div>

                    <!-- Visualização em Pipeline -->
                    <div id="pipelineView" class="pipeline-view">
                        <div class="pipeline-column" data-status="Aguardando Atendimento">
                            <h3>Aguardando Atendimento</h3>
                            <div class="column-content"></div>
                        </div>
                        <div class="pipeline-column" data-status="Atendido">
                            <h3>Atendido</h3>
                            <div class="column-content"></div>
                        </div>
                        <div class="pipeline-column" data-status="Reagendado">
                            <h3>Reagendado</h3>
                            <div class="column-content"></div>
                        </div>
                        <div class="pipeline-column" data-status="Cancelado">
                            <h3>Cancelado</h3>
                            <div class="column-content"></div>
                        </div>
                    </div>

                    <!-- Paginação -->
                    <div class="pagination-controls">
                        <button id="prevPageBtn" disabled><i class="fas fa-chevron-left"></i> Anterior</button>
                        <span id="pageInfo">Página 1 de 1</span>
                        <button id="nextPageBtn" disabled>Próxima <i class="fas fa-chevron-right"></i></button>
                        <select id="itemsPerPage">
                            <option value="5">5 por página</option>
                            <option value="10" selected>10 por página</option>
                            <option value="20">20 por página</option>
                            <option value="50">50 por página</option>
                            <option value="100">100 por página</option>
                        </select>
                    </div>
                </div>

                <!-- Aba "Relatórios" -->
                <div id="reportsTab" class="tab-content" style="display: none;">
                    <div class="form-grid">
                        <div class="form-group">
                            <label for="reportType">Tipo de Relatório</label>
                            <select id="reportType">
                                <option value="all">Todos os Agendamentos</option>
                                <option value="byName">Por Nome (A-Z)</option>
                                <option value="byRecent">Mais Recentes</option>
                                <option value="byOldest">Mais Antigos</option>
                                <option value="byPhone">Por Telefone</option>
                                <option value="byDate">Por Data</option>
                                <option value="byDoctor">Por Médico</option>
                                <option value="byMonth">Por Mês</option>
                                <option value="byYear">Por Ano</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="reportMonth">Mês (se aplicável)</label>
                            <input type="month" id="reportMonth">
                        </div>
                        <div class="form-group">
                            <label for="reportYear">Ano (se aplicável)</label>
                            <input type="number" id="reportYear" placeholder="Ex: 2023">
                        </div>
                        <div class="form-group">
                            <label for="reportDoctor">Médico (se aplicável)</label>
                            <input type="text" id="reportDoctor" list="medicosList">
                        </div>
                    </div>
                    <div class="form-actions">
                        <button onclick="generateReport()">Gerar Relatório</button>
                    </div>
                    <div class="table-controls" style="margin-top: 20px;">
                        <button class="view-mode active" data-view="list" data-tooltip="Lista" onclick="toggleReportView('list')"><i class="fas fa-list"></i> Lista</button>
                        <button class="view-mode" data-view="grid" data-tooltip="Grid" onclick="toggleReportView('grid')"><i class="fas fa-th"></i> Grid</button>
                    </div>
                    <div id="reportResult" class="table-view" style="margin-top: 20px;">
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
                            <tbody id="reportBody"></tbody>
                        </table>
                    </div>
                    <div id="reportGrid" class="grid-view" style="display: none;"></div>
                </div>

                <!-- Aba "Insights" -->
                <div id="insightsTab" class="tab-content" style="display: none;">
                    <h2>Insights</h2>
                    <div id="insightsCards" class="grid-view" style="display: grid;"></div>
                </div>

                <!-- Aba "Configurações" -->
                <div id="settingsTab" class="tab-content" style="display: none;">
                    <h2>Configurações</h2>
                    <div id="settingsCards" class="grid-view" style="display: grid;">
                        <div class="card">
                            <h4><i class="fas fa-paint-brush"></i> Personalizar Tema</h4>
                            <div class="form-group">
                                <label>Cor de Fundo do Body</label>
                                <input type="color" id="bodyBgColor" value="#f9f9fb">
                                <input type="text" id="bodyBgColorHex" value="#f9f9fb">
                            </div>
                            <div class="form-group">
                                <label>Cor de Fundo dos Cards</label>
                                <input type="color" id="cardBgColor" value="#ffffff">
                                <input type="text" id="cardBgColorHex" value="#ffffff">
                            </div>
                            <div class="form-group">
                                <label>Cor do Texto</label>
                                <input type="color" id="textColor" value="#343a40">
                                <input type="text" id="textColorHex" value="#343a40">
                            </div>
                            <div class="form-group">
                                <label>Cor da Borda dos Botões</label>
                                <input type="color" id="borderColor" value="#007bff">
                                <input type="text" id="borderColorHex" value="#007bff">
                            </div>
                            <div class="form-group">
                                <label>Cor da Borda dos Cards</label>
                                <input type="color" id="cardBorderColor" value="#d1d3e2">
                                <input type="text" id="cardBorderColorHex" value="#d1d3e2">
                            </div>
                            <div class="form-group">
                                <label>Cor da Borda dos Formulários</label>
                                <input type="color" id="formBorderColor" value="#ced4da">
                                <input type="text" id="formBorderColorHex" value="#ced4da">
                            </div>
                            <div class="modal-buttons">
                                <button onclick="saveTheme()">Salvar Tema</button>
                                <button onclick="resetTheme()">Restaurar Padrão</button>
                            </div>
                        </div>
                        <!-- Novo Card de Backups -->
                        <div class="card">
                            <h4><i class="fas fa-database"></i> Sistema de Backups</h4>
                            <p>Gerencie backups automáticos e manuais:</p>
                            <div class="form-group">
                                <label>Backup Automático (a cada 4h)</label>
                                <select id="autoBackupToggle">
                                    <option value="true">Ativado</option>
                                    <option value="false">Desativado</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Descrição de Backup (JSON/TXT)</label>
                                <textarea id="backupDescription" placeholder="Cole aqui o código JSON para importar"></textarea>
                            </div>
                            <div class="modal-buttons">
                              <button onclick="saveJsonToFirebase()">Salvar no Firebase</button>
                                <button onclick="backupLocal()">Backup Local</button>
                                <button onclick="restoreLocal()">Restaurar Local</button>
                                <button onclick="backupFirebase()">Backup Firebase</button>
                                <button onclick="restoreFirebase()">Restaurar Firebase</button>
                                <button onclick="importJsonToFirebase()">Importar JSON</button>
                                <button onclick="importExcelToFirebase()">Importar Excel</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Modais -->
            <div class="modal" id="actionBox">
                <div class="modal-content">
                    <span class="modal-close">×</span>
                    <h4>Mover Card Para:</h4>
                    <div class="modal-buttons">
                        <button data-status="Aguardando Atendimento" onclick="moveCard('Aguardando Atendimento')">Aguardando Atendimento</button>
                        <button data-status="Atendido" onclick="moveCard('Atendido')">Atendido</button>
                        <button data-status="Reagendado" onclick="moveCard('Reagendado')">Reagendado</button>
                        <button data-status="Cancelado" onclick="moveCard('Cancelado')">Cancelado</button>
                    </div>
                </div>
            </div>

            <div class="modal" id="medicoModal">
                <div class="modal-content">
                    <span class="modal-close">×</span>
                    <h4><i class="fas fa-user-md"></i> Gerenciar Médicos</h4>
                    <div class="modal-form">
                        <div class="form-group">
                            <label>Nome</label>
                            <input type="text" id="novoMedicoNome">
                        </div>
                        <div class="form-group">
                            <label>CRM</label>
                            <input type="text" id="novoMedicoCRM">
                        </div>
                        <div class="modal-buttons">
                            <button onclick="saveMedico()">Salvar</button>
                            <button onclick="closeMedicoModal()">Cancelar</button>
                        </div>
                    </div>
                    <div class="medicos-list">
                        <ul id="medicosListDisplay"></ul>
                    </div>
                </div>
            </div>

            <div class="modal" id="deleteAllModal">
                <div class="modal-content">
                    <span class="modal-close">×</span>
                    <h4><i class="fas fa-trash-alt"></i> Excluir Tudo</h4>
                    <div class="modal-form">
                        <div class="form-group">
                            <label>Senha</label>
                            <input type="password" id="deletePassword">
                        </div>
                        <div class="modal-buttons">
                            <button onclick="confirmDeleteAll()">Confirmar</button>
                            <button onclick="closeDeleteAllModal()">Cancelar</button>
                        </div>
                    </div>
                </div>
            </div>

            <div class="modal" id="sortFilterModal">
                <div class="modal-content">
                    <span class="modal-close">×</span>
                    <h4><i class="fas fa-sliders-h"></i> Filtros Avançados</h4>
                    <div class="modal-form">
                        <div class="form-group">
                            <label>Ordenar Por</label>
                            <select id="sortType">
                                <option value="nameAZ">Nome (A-Z)</option>
                                <option value="recent">Mais Recentes</option>
                                <option value="oldest">Mais Antigos</option>
                                <option value="phone">Telefone</option>
                                <option value="date">Data</option>
                                <option value="doctor">Médico</option>
                                <option value="month">Mês</option>
                                <option value="year">Ano</option>
                            </select>
                        </div>
                        <div class="modal-buttons">
                            <button onclick="applySortFilter()">Aplicar</button>
                            <button onclick="closeSortFilterModal()">Cancelar</button>
                        </div>
                    </div>
                </div>
            </div>

            <div id="progressModal" class="modal" style="display: none;">
                <div class="modal-content">
                    <h3>Processando...</h3>
                    <div id="progressBar" style="width: 100%; height: 20px; background-color: #e0e0e0; border-radius: 5px; overflow: hidden;">
                        <div id="progressFill" style="width: 0%; height: 100%; background-color: #4caf50; transition: width 0.3s;"></div>
                    </div>
                    <p id="progressText">0%</p>
                </div>
            </div>
            

            <!-- Notificação -->
            <div class="notification" id="notification"></div>

            <!-- Footer -->
            <footer>
                <p>🌟 Desenvolvido por João Ricardo | 📸 <a href="https://instagram.com/joaoricardo.pe" target="_blank">@joaoricardo.pe</a> | 💬 <a href="https://wa.me/5587988063327" target="_blank">WhatsApp</a></p>
            </footer>
        </div>
    </div>

    <script type="module" src="script.js"></script>
</body>
</html>
