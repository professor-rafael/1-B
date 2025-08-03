document.addEventListener('DOMContentLoaded', function() {
    // Carrega consultas do localStorage ao iniciar
    let appointments = JSON.parse(localStorage.getItem('consultasMedicas')) || [];
    
    // Elementos do DOM
    const appointmentForm = document.getElementById('appointmentForm');
    const appointmentsList = document.getElementById('appointmentsList');
    const commandInput = document.getElementById('commandInput');
    const promptOutput = document.getElementById('promptOutput');
    
    // Inicialização do sistema
    initSystem();

    // Formulário de agendamento
    appointmentForm.addEventListener('submit', function(e) {
        e.preventDefault();
        handleAppointmentForm();
    });
    
    // Sistema de prompt de comando
    commandInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            const command = commandInput.value.trim();
            if (command) {
                addToPrompt(`> ${command}`, 'command');
                processCommand(command);
                commandInput.value = '';
            }
        }
    });

    // Funções do sistema
    function initSystem() {
        updateAppointmentsList();
        addToPrompt('Sistema de Agendamento Médico iniciado. Digite "help" para comandos.');
    }

    function handleAppointmentForm() {
        // Obter valores do formulário
        const name = document.getElementById('name').value.trim();
        const cpf = document.getElementById('cpf').value.trim();
        const specialty = document.getElementById('specialty').value;
        const date = document.getElementById('date').value;
        const time = document.getElementById('time').value;
        
        // Validar dados
        if (!validateForm(name, cpf, specialty, date, time)) return;
        
        // Criar e salvar consulta
        const appointment = createAppointment(name, cpf, specialty, date, time);
        appointments.push(appointment);
        saveAppointments();
        
        // Feedback e atualização
        showSuccessMessage(name);
        updateAppointmentsList();
        addToPrompt(`Nova consulta agendada: ${specialty} para ${name} em ${formatDate(date)} às ${time}`);
        appointmentForm.reset();
    }

    function validateForm(name, cpf, specialty, date, time) {
        if (!name || !cpf || !specialty || !date || !time) {
            alert('Por favor, preencha todos os campos!');
            return false;
        }
        
        if (!validateCPF(cpf)) {
            alert('CPF inválido! Digite apenas números (11 dígitos).');
            return false;
        }
        
        return true;
    }

    function validateCPF(cpf) {
        const cleanedCPF = cpf.replace(/\D/g, '');
        return cleanedCPF.length === 11;
    }

    function createAppointment(name, cpf, specialty, date, time) {
        return {
            id: Date.now(),
            name,
            cpf: cpf.replace(/\D/g, ''),
            specialty,
            date,
            time,
            timestamp: new Date().toISOString()
        };
    }

    function saveAppointments() {
        localStorage.setItem('consultasMedicas', JSON.stringify(appointments));
    }

    function updateAppointmentsList() {
        if (appointments.length === 0) {
            appointmentsList.innerHTML = '<p class="empty-message">Nenhuma consulta agendada ainda.</p>';
            return;
        }
        
        // Ordena por data mais próxima
        appointments.sort((a, b) => new Date(a.date) - new Date(b.date));
        
        appointmentsList.innerHTML = '';
        
        appointments.forEach(appointment => {
            const appointmentItem = document.createElement('div');
            appointmentItem.className = 'appointment-item';
            appointmentItem.innerHTML = `
                <div>
                    <p><strong>${appointment.name}</strong> (CPF: ${formatCPF(appointment.cpf)})</p>
                    <p>${appointment.specialty} - ${formatDate(appointment.date)} às ${appointment.time}</p>
                    <small>Agendado em: ${formatDateTime(appointment.timestamp)}</small>
                </div>
                <button class="delete-btn" data-id="${appointment.id}">
                    <i class="fas fa-trash-alt"></i> Cancelar
                </button>
            `;
            
            appointmentsList.appendChild(appointmentItem);
        });
        
        // Adicionar eventos aos botões de cancelar
        document.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', function() {
                const id = parseInt(this.getAttribute('data-id'));
                cancelAppointment(id);
            });
        });
    }

    function cancelAppointment(id) {
        const appointmentIndex = appointments.findIndex(a => a.id === id);
        
        if (appointmentIndex !== -1) {
            const appointment = appointments[appointmentIndex];
            if (confirm(`Cancelar consulta de ${appointment.name}?`)) {
                appointments.splice(appointmentIndex, 1);
                saveAppointments();
                updateAppointmentsList();
                addToPrompt(`Consulta cancelada: ${appointment.specialty} para ${appointment.name}`);
            }
        }
    }

    function processCommand(command) {
        const cmd = command.toLowerCase();
        
        if (cmd === 'help') {
            showHelp();
        } 
        else if (cmd === 'clear') {
            clearPrompt();
        } 
        else if (cmd === 'list') {
            listAppointments();
        } 
        else if (cmd === 'stats') {
            showStats();
        }
        else if (cmd.startsWith('search ')) {
            searchAppointments(command.substring(7).toLowerCase());
        }
        else {
            addToPrompt(`Comando não reconhecido: "${command}"`, 'error');
            addToPrompt('Digite "help" para ver os comandos disponíveis');
        }
    }

    function showHelp() {
        addToPrompt('Comandos disponíveis:');
        addToPrompt('help - Mostra esta ajuda');
        addToPrompt('clear - Limpa o terminal');
        addToPrompt('list - Lista consultas agendadas');
        addToPrompt('stats - Mostra estatísticas');
        addToPrompt('search [nome] - Busca consultas por nome');
    }

    function clearPrompt() {
        promptOutput.innerHTML = '<p>Terminal limpo. Digite "help" para ver os comandos.</p>';
    }

    function listAppointments() {
        if (appointments.length === 0) {
            addToPrompt('Nenhuma consulta agendada.');
        } else {
            addToPrompt(`Consultas agendadas (${appointments.length}):`);
            appointments.forEach((app, index) => {
                addToPrompt(`${index + 1}. ${app.name} - ${app.specialty} - ${formatDate(app.date)} ${app.time}`);
            });
        }
    }

    function showStats() {
        addToPrompt('Estatísticas do sistema:');
        addToPrompt(`Total de consultas: ${appointments.length}`);
        
        // Contar por especialidade
        const specialties = {};
        appointments.forEach(app => {
            specialties[app.specialty] = (specialties[app.specialty] || 0) + 1;
        });
        
        addToPrompt('Consultas por especialidade:');
        for (const spec in specialties) {
            addToPrompt(`- ${spec}: ${specialties[spec]}`);
        }
    }

    function searchAppointments(searchTerm) {
        const results = appointments.filter(app => 
            app.name.toLowerCase().includes(searchTerm) ||
            app.specialty.toLowerCase().includes(searchTerm)
        );
        
        if (results.length === 0) {
            addToPrompt(`Nenhuma consulta encontrada para "${searchTerm}"`, 'error');
        } else {
            addToPrompt(`Resultados da busca (${results.length}):`);
            results.forEach((app, index) => {
                addToPrompt(`${index + 1}. ${app.name} - ${app.specialty} - ${formatDate(app.date)} ${app.time}`);
            });
        }
    }

    function showSuccessMessage(name) {
        alert(`Consulta agendada com sucesso para ${name}!`);
    }

    // Funções auxiliares de formatação
    function formatDate(dateString) {
        const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
        return new Date(dateString).toLocaleDateString('pt-BR', options);
    }
    
    function formatDateTime(isoString) {
        const options = { 
            day: '2-digit', 
            month: '2-digit', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        return new Date(isoString).toLocaleDateString('pt-BR', options);
    }
    
    function formatCPF(cpf) {
        return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }

    function addToPrompt(text, type = 'normal') {
        const p = document.createElement('p');
        
        if (type === 'command') {
            p.style.color = '#3498db';
            p.style.fontWeight = 'bold';
        } 
        else if (type === 'error') {
            p.style.color = '#e74c3c';
        }
        
        p.textContent = text;
        promptOutput.appendChild(p);
        promptOutput.scrollTop = promptOutput.scrollHeight;
    }
});