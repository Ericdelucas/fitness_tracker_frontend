/**
 * Aplicação Principal do Fitness Tracker - Versão Avançada
 * Gerencia exercícios dinâmicos, dashboards individuais e navegação
 */

class FitnessTrackerApp {
    constructor() {
        this.currentTab = 'counter';
        this.currentExerciseId = null;
        this.exerciseToRemove = null;
        
        this.init();
    }

    /**
     * Inicializa a aplicação
     */
    init() {
        this.setupEventListeners();
        this.renderExercises();
        this.updateNavigation();
        this.updateAllStats();
        
        console.log('Fitness Tracker Avançado inicializado com sucesso!');
    }

    /**
     * Configura todos os event listeners
     */
    setupEventListeners() {
        // Navegação por abas
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.target.dataset.tab;
                if (tab) {
                    this.switchTab(tab);
                }
            });
        });

        // Dropdown de dashboards
        document.getElementById('tab-dashboards')?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleDropdown();
        });

        // Fechar dropdown ao clicar fora
        document.addEventListener('click', () => {
            this.closeDropdown();
        });

        // Gerenciamento de exercícios
        document.getElementById('add-exercise-btn')?.addEventListener('click', () => {
            this.openModal('add-exercise-modal');
        });

        document.getElementById('manage-exercises-btn')?.addEventListener('click', () => {
            this.openManageExercisesModal();
        });

        // Formulário de adicionar exercício
        document.getElementById('add-exercise-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.addExercise();
        });

        // Confirmação de remoção
        document.getElementById('confirm-remove-btn')?.addEventListener('click', () => {
            this.confirmRemoveExercise();
        });

        // Botões de exportação (mantidos da versão anterior)
        document.getElementById('export-csv')?.addEventListener('click', () => {
            window.exportManager.exportToCSV();
        });

        document.getElementById('export-json')?.addEventListener('click', () => {
            window.exportManager.exportToJSON();
        });

        document.getElementById('clear-data')?.addEventListener('click', () => {
            window.exportManager.clearAllData();
        });

        // Botões de importação
        document.getElementById('import-btn')?.addEventListener('click', () => {
            document.getElementById('import-file').click();
        });

        document.getElementById('import-file')?.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                window.exportManager.importFromFile(e.target.files[0]);
                e.target.value = '';
            }
        });

        document.getElementById('restore-sample')?.addEventListener('click', () => {
            window.exportManager.loadSampleData();
        });

        // Fechar modais com ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });
    }

    /**
     * Renderiza todos os exercícios na aba contador
     */
    renderExercises() {
        // Renderizar layout horizontal
        this.renderExercisesHorizontal();
        
        // Renderizar layout vertical (para compatibilidade)
        this.renderExercisesVertical();
    }

    /**
     * Renderiza exercícios no layout horizontal
     */
    renderExercisesHorizontal() {
        const container = document.getElementById('exercises-horizontal-container');
        if (!container) return;

        const exercises = window.storageManager.getExercises() || {};
        container.innerHTML = '';

        Object.values(exercises).forEach(exercise => {
            const exerciseElement = this.createExerciseElementHorizontal(exercise);
            container.appendChild(exerciseElement);
        });

        // Adicionar event listeners para os botões dos exercícios
        this.setupExerciseEventListeners();
    }

    /**
     * Renderiza exercícios no layout vertical (original)
     */
    renderExercisesVertical() {
        const container = document.getElementById('exercises-container');
        if (!container) return;

        const exercises = window.storageManager.getExercises() || {};
        container.innerHTML = '';

        Object.values(exercises).forEach(exercise => {
            const exerciseElement = this.createExerciseElement(exercise);
            container.appendChild(exerciseElement);
        });
    }

    /**
     * Cria elemento HTML para um exercício
     */
    createExerciseElement(exercise) {
        const div = document.createElement('div');
        div.className = 'exercise-counter';
        div.dataset.exercise = exercise.id;
        
        // Aplicar cor personalizada
        div.style.setProperty('--exercise-color', exercise.color);
        
        div.innerHTML = `
            <div class="exercise-header">
                <div class="exercise-icon-large" style="background: ${exercise.color}20; border: 2px solid ${exercise.color};">
                    ${exercise.icon}
                </div>
                <h2 class="exercise-title" style="color: ${exercise.color};">${exercise.name}</h2>
            </div>
            
            <div class="stats">
                <p>${exercise.name} completos: <span class="completed-count">${exercise.completed || 0}</span></p>
                <p>Repetições: <span class="rep-count">${exercise.repetitions || 0}</span>/5</p>
            </div>
            
            <div class="controls">
                <button class="btn-rep btn-increment" data-action="increment" data-type="repetitions" style="background: linear-gradient(145deg, ${exercise.color}80, ${exercise.color});">+1</button>
                <button class="btn-rep btn-decrement" data-action="decrement" data-type="repetitions" style="background: linear-gradient(145deg, ${exercise.color}60, ${exercise.color}80);">-1</button>
                <input type="number" class="custom-input" placeholder="Qtd" min="1" max="100">
                <button class="btn-add-custom" data-type="repetitions" style="background: linear-gradient(145deg, ${exercise.color}40, ${exercise.color}60);">Adicionar</button>
            </div>

            <div class="controls">
                <button class="btn-complete btn-increment" data-action="increment" data-type="completed" data-amount="1" style="background: linear-gradient(145deg, ${exercise.color}, ${exercise.color}cc);">+1 ${exercise.name} Completo</button>
                <button class="btn-complete btn-decrement" data-action="decrement" data-type="completed" data-amount="1" style="background: linear-gradient(145deg, ${exercise.color}80, ${exercise.color}aa);">-1 ${exercise.name} Completo</button>
            </div>

            <div class="controls">
                <button class="btn-complete btn-increment" data-action="increment" data-type="completed" data-amount="10" style="background: linear-gradient(145deg, ${exercise.color}, ${exercise.color}dd);">+10 ${exercise.name}s Completos</button>
                <button class="btn-complete btn-decrement" data-action="decrement" data-type="completed" data-amount="10" style="background: linear-gradient(145deg, ${exercise.color}70, ${exercise.color}99);">-10 ${exercise.name}s Completos</button>
            </div>
        `;

        // Aplicar cor do exercício ao elemento
        div.style.setProperty('--exercise-color', exercise.color);
        const beforeElement = div.querySelector('::before');
        if (beforeElement) {
            beforeElement.style.background = `linear-gradient(90deg, ${exercise.color}, ${exercise.color}44, ${exercise.color})`;
        }

        return div;
    }

    /**
     * Cria elemento HTML para um exercício no layout horizontal
     */
    createExerciseElementHorizontal(exercise) {
        const div = document.createElement('div');
        div.className = 'exercise-card-horizontal';
        div.dataset.exercise = exercise.id;
        div.dataset.color = this.getColorName(exercise.color);
        
        // Aplicar cor personalizada
        div.style.setProperty('--exercise-color', exercise.color);
        div.style.setProperty('--exercise-color-light', exercise.color + '44');
        
        div.innerHTML = `
            <div class="exercise-header-horizontal">
                <h3>
                    <span class="exercise-icon">${exercise.icon}</span>
                    ${exercise.name.toUpperCase()}
                </h3>
            </div>
            
            <div class="stats-horizontal">
                <div class="stat-item-horizontal">
                    <div class="label">Completos</div>
                    <div class="value completed-count">${exercise.completed || 0}</div>
                </div>
                <div class="stat-item-horizontal">
                    <div class="label">Repetições</div>
                    <div class="value rep-count">${exercise.repetitions || 0}/5</div>
                </div>
            </div>
            
            <div class="controls-horizontal">
                <button class="btn-rep btn-increment" data-action="increment" data-type="repetitions">+1</button>
                <button class="btn-rep btn-decrement" data-action="decrement" data-type="repetitions">-1</button>
                <input type="number" class="custom-input" placeholder="Qtd" min="1" max="100">
                <button class="btn-add-custom" data-type="repetitions">Adicionar</button>
            </div>

            <div class="complete-controls-horizontal">
                <button class="btn-complete btn-increment" data-action="increment" data-type="completed" data-amount="1">+1 Completo</button>
                <button class="btn-complete btn-decrement" data-action="decrement" data-type="completed" data-amount="1">-1 Completo</button>
                <button class="btn-complete btn-increment" data-action="increment" data-type="completed" data-amount="10">+10 Completos</button>
                <button class="btn-complete btn-decrement" data-action="decrement" data-type="completed" data-amount="10">-10 Completos</button>
            </div>
        `;

        return div;
    }

    /**
     * Obtém nome da cor para CSS
     */
    getColorName(hexColor) {
        const colorMap = {
            '#ff0000': 'red',
            '#00ff00': 'green', 
            '#0080ff': 'blue',
            '#ffcc00': 'yellow',
            '#cc00ff': 'purple',
            '#ff8000': 'orange',
            '#00ffff': 'cyan',
            '#ff00aa': 'pink'
        };
        
        return colorMap[hexColor.toLowerCase()] || 'red';
    }

    /**
     * Configura event listeners para botões dos exercícios
     */
    setupExerciseEventListeners() {
        // Botões de incremento/decremento
        document.querySelectorAll('.btn-increment, .btn-decrement').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.handleButtonClick(e);
            });
        });

        // Botões de adicionar quantidade customizada
        document.querySelectorAll('.btn-add-custom').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.handleCustomAdd(e);
            });
        });

        // Inputs customizados (Enter para adicionar)
        document.querySelectorAll('.custom-input').forEach(input => {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    const btn = input.parentElement.querySelector('.btn-add-custom');
                    if (btn) {
                        this.handleCustomAdd({ target: btn });
                    }
                }
            });
        });
    }

    /**
     * Manipula cliques nos botões de exercícios
     */
    handleButtonClick(event) {
        const button = event.target;
        const contador = button.closest('[data-exercise]');
        const exerciseId = contador.dataset.exercise;
        const action = button.dataset.action;
        const type = button.dataset.type;
        const amount = parseInt(button.dataset.amount) || 1;

        const exercises = window.storageManager.getExercises() || {};
        const exercise = exercises[exerciseId];
        
        if (!exercise) return;

        if (action === 'increment') {
            const newValue = window.storageManager.incrementExercise(exerciseId, type, amount);
            this.showToast(`+${amount} ${this.getFieldName(type)} em ${exercise.name}!`, 'success');
        } else if (action === 'decrement') {
            const newValue = window.storageManager.decrementExercise(exerciseId, type, amount);
            this.showToast(`-${amount} ${this.getFieldName(type)} em ${exercise.name}!`, 'info');
        }

        this.updateExerciseDisplay(exerciseId);
        this.updateAllStats();

        // Atualizar gráficos se estiver em dashboard
        if (this.currentTab.startsWith('dashboard')) {
            setTimeout(() => {
                window.chartManager.updateAllCharts();
            }, 100);
        }
    }

    /**
     * Manipula adição de quantidade customizada
     */
    handleCustomAdd(event) {
        const button = event.target;
        const contador = button.closest('[data-exercise]');
        const input = contador.querySelector('.custom-input');
        const exerciseId = contador.dataset.exercise;
        const type = button.dataset.type;
        const amount = parseInt(input.value);

        if (!amount || amount <= 0 || amount > 1000) {
            this.showToast('Digite uma quantidade válida (1-1000)', 'error');
            return;
        }

        const exercises = window.storageManager.getExercises() || {};
        const exercise = exercises[exerciseId];
        
        if (!exercise) return;

        const newValue = window.storageManager.incrementExercise(exerciseId, type, amount);
        this.showToast(`+${amount} ${this.getFieldName(type)} em ${exercise.name}!`, 'success');

        input.value = '';
        this.updateExerciseDisplay(exerciseId);
        this.updateAllStats();

        // Atualizar gráficos se estiver em dashboard
        if (this.currentTab.startsWith('dashboard')) {
            setTimeout(() => {
                window.chartManager.updateAllCharts();
            }, 100);
        }
    }

    /**
     * Atualiza a exibição de um exercício específico
     */
    updateExerciseDisplay(exerciseId) {
        const exercises = window.storageManager.getExercises() || {};
        const exercise = exercises[exerciseId];
        
        if (!exercise) return;

        const contador = document.querySelector(`[data-exercise="${exerciseId}"]`);
        if (!contador) return;

        const completedCount = contador.querySelector('.completed-count');
        const repCount = contador.querySelector('.rep-count');

        if (completedCount) {
            completedCount.textContent = exercise.completed || 0;
        }
        if (repCount) {
            repCount.textContent = exercise.repetitions || 0;
        }
    }

    /**
     * Adiciona novo exercício
     */
    addExercise() {
        const name = document.getElementById('exercise-name').value.trim();
        const color = document.getElementById('exercise-color').value;
        const icon = document.getElementById('exercise-icon').value.trim() || '💪';

        if (!name) {
            this.showToast('Nome do exercício é obrigatório', 'error');
            return;
        }

        if (name.length > 30) {
            this.showToast('Nome muito longo (máximo 30 caracteres)', 'error');
            return;
        }

        const result = window.storageManager.addExercise(name, color, icon);
        
        if (result.success) {
            this.showToast(`Exercício "${name}" adicionado com sucesso!`, 'success');
            this.closeModal('add-exercise-modal');
            this.renderExercises();
            this.updateNavigation();
            this.clearAddExerciseForm();
        } else {
            this.showToast(result.message, 'error');
        }
    }

    /**
     * Abre modal de gerenciar exercícios
     */
    openManageExercisesModal() {
        this.renderExercisesManagementList();
        this.openModal('manage-exercises-modal');
    }

    /**
     * Renderiza lista de exercícios para gerenciamento
     */
    renderExercisesManagementList() {
        const container = document.getElementById('exercises-management-list');
        if (!container) return;

        const exercises = window.storageManager.getExercises() || {};
        container.innerHTML = '';

        Object.values(exercises).forEach(exercise => {
            const div = document.createElement('div');
            div.className = 'exercise-item';
            
            div.innerHTML = `
                <div class="exercise-info">
                    <div class="exercise-icon" style="background: ${exercise.color}20; border: 2px solid ${exercise.color};">
                        ${exercise.icon}
                    </div>
                    <div class="exercise-details">
                        <h4>${exercise.name}</h4>
                        <p>Completos: ${exercise.completed || 0} | Repetições: ${exercise.repetitions || 0}</p>
                    </div>
                    ${exercise.isDefault ? '<span class="default-badge">Padrão</span>' : ''}
                </div>
                <div class="exercise-actions">
                    ${!exercise.isDefault ? `<button class="btn-remove" onclick="app.removeExercise('${exercise.id}')">Remover</button>` : ''}
                </div>
            `;
            
            container.appendChild(div);
        });
    }

    /**
     * Remove exercício
     */
    removeExercise(exerciseId) {
        const exercises = window.storageManager.getExercises() || {};
        const exercise = exercises[exerciseId];
        
        if (!exercise) return;

        this.exerciseToRemove = exerciseId;
        document.getElementById('exercise-to-remove').textContent = exercise.name;
        this.closeModal('manage-exercises-modal');
        this.openModal('confirm-remove-modal');
    }

    /**
     * Confirma remoção do exercício
     */
    confirmRemoveExercise() {
        if (!this.exerciseToRemove) return;

        const exercises = window.storageManager.getExercises() || {};
        const exercise = exercises[this.exerciseToRemove];
        
        const result = window.storageManager.removeExercise(this.exerciseToRemove);
        
        if (result.success) {
            this.showToast(`Exercício "${exercise.name}" removido com sucesso!`, 'success');
            this.closeModal('confirm-remove-modal');
            this.renderExercises();
            this.updateNavigation();
            this.updateAllStats();
        } else {
            this.showToast(result.message, 'error');
        }
        
        this.exerciseToRemove = null;
    }

    /**
     * Atualiza navegação com dashboards dinâmicos
     */
    updateNavigation() {
        const dropdown = document.getElementById('dashboards-dropdown');
        if (!dropdown) return;

        const exercises = window.storageManager.getExercises() || {};
        dropdown.innerHTML = '';

        Object.values(exercises).forEach(exercise => {
            const item = document.createElement('div');
            item.className = 'dropdown-item';
            item.textContent = `${exercise.icon} ${exercise.name}`;
            item.onclick = () => this.switchTab(`dashboard-${exercise.id}`);
            dropdown.appendChild(item);
        });
    }

    /**
     * Troca de aba
     */
    switchTab(tabName) {
        // Remover classe active de todas as abas
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.querySelectorAll('.individual-dashboard').forEach(dashboard => {
            dashboard.classList.remove('active');
        });

        this.currentTab = tabName;
        this.closeDropdown();

        // Ativar aba correspondente
        if (tabName === 'counter') {
            document.getElementById('tab-counter').classList.add('active');
            document.getElementById('counter-section').classList.add('active');
        } else if (tabName === 'dashboard-total') {
            document.getElementById('tab-dashboard-total').classList.add('active');
            document.getElementById('dashboard-total-section').classList.add('active');
            setTimeout(() => {
                window.chartManager.initializeTotalCharts();
            }, 100);
        } else if (tabName === 'reports') {
            document.getElementById('tab-reports').classList.add('active');
            document.getElementById('reports-section').classList.add('active');
            this.loadReportsData();
        } else if (tabName.startsWith('dashboard-')) {
            const exerciseId = tabName.replace('dashboard-', '');
            document.getElementById('tab-dashboards').classList.add('active');
            this.showIndividualDashboard(exerciseId);
        }
    }

    /**
     * Mostra dashboard individual de um exercício
     */
    showIndividualDashboard(exerciseId) {
        const exercises = window.storageManager.getExercises() || {};
        const exercise = exercises[exerciseId];
        
        if (!exercise) return;

        // Criar dashboard se não existir
        let dashboard = document.getElementById(`dashboard-${exerciseId}`);
        if (!dashboard) {
            dashboard = this.createIndividualDashboard(exercise);
            document.getElementById('individual-dashboards').appendChild(dashboard);
        }

        dashboard.classList.add('active');
        this.currentExerciseId = exerciseId;

        // Atualizar estatísticas e gráficos
        setTimeout(() => {
            this.updateIndividualDashboard(exerciseId);
            window.chartManager.initializeIndividualCharts(exerciseId);
        }, 100);
    }

    /**
     * Cria dashboard individual para um exercício
     */
    createIndividualDashboard(exercise) {
        const section = document.createElement('section');
        section.id = `dashboard-${exercise.id}`;
        section.className = 'tab-content individual-dashboard';
        
        section.innerHTML = `
            <div class="dashboard-container">
                <h2 style="color: ${exercise.color};">${exercise.icon} Dashboard - ${exercise.name}</h2>
                
                <div class="stats-overview">
                    <div class="stat-card">
                        <h3 style="color: ${exercise.color};">Hoje</h3>
                        <p class="stat-number" id="${exercise.id}-today">0</p>
                        <p class="stat-label">Exercícios</p>
                    </div>
                    <div class="stat-card">
                        <h3 style="color: ${exercise.color};">Esta Semana</h3>
                        <p class="stat-number" id="${exercise.id}-week">0</p>
                        <p class="stat-label">Exercícios</p>
                    </div>
                    <div class="stat-card">
                        <h3 style="color: ${exercise.color};">Este Mês</h3>
                        <p class="stat-number" id="${exercise.id}-month">0</p>
                        <p class="stat-label">Exercícios</p>
                    </div>
                    <div class="stat-card">
                        <h3 style="color: ${exercise.color};">Sequência</h3>
                        <p class="stat-number" id="${exercise.id}-streak">0</p>
                        <p class="stat-label">Dias</p>
                    </div>
                </div>

                <div class="charts-container">
                    <div class="chart-card">
                        <h3 style="color: ${exercise.color};">Progresso Diário (Últimos 30 dias)</h3>
                        <canvas id="chart-${exercise.id}-daily"></canvas>
                    </div>
                    <div class="chart-card">
                        <h3 style="color: ${exercise.color};">Distribuição Semanal</h3>
                        <canvas id="chart-${exercise.id}-weekly"></canvas>
                    </div>
                </div>

                <div class="detailed-stats">
                    <h3 style="color: ${exercise.color};">Estatísticas Detalhadas</h3>
                    <div id="${exercise.id}-detailed-stats" class="stats-grid">
                        <div class="loading">Carregando estatísticas...</div>
                    </div>
                </div>
            </div>
        `;

        return section;
    }

    /**
     * Atualiza dashboard individual
     */
    updateIndividualDashboard(exerciseId) {
        const stats = window.storageManager.getExerciseStatistics(exerciseId, 30);
        const todayStats = this.getTodayStatsForExercise(exerciseId);
        const weekStats = window.storageManager.getExerciseStatistics(exerciseId, 7);

        // Atualizar cards de estatísticas
        document.getElementById(`${exerciseId}-today`).textContent = todayStats.completed;
        document.getElementById(`${exerciseId}-week`).textContent = weekStats.totalCompleted;
        document.getElementById(`${exerciseId}-month`).textContent = stats.totalCompleted;
        document.getElementById(`${exerciseId}-streak`).textContent = stats.streak;

        // Atualizar estatísticas detalhadas
        const detailedContainer = document.getElementById(`${exerciseId}-detailed-stats`);
        if (detailedContainer) {
            detailedContainer.innerHTML = `
                <div class="stat-item">
                    <strong>Total de exercícios realizados:</strong> ${stats.totalCompleted}
                </div>
                <div class="stat-item">
                    <strong>Total de repetições:</strong> ${stats.totalRepetitions}
                </div>
                <div class="stat-item">
                    <strong>Média diária de exercícios:</strong> ${stats.averageCompletedPerDay}
                </div>
                <div class="stat-item">
                    <strong>Média diária de repetições:</strong> ${stats.averageRepetitionsPerDay}
                </div>
                <div class="stat-item">
                    <strong>Melhor dia:</strong> ${stats.bestDay.date ? `${stats.bestDay.completed} exercícios em ${new Date(stats.bestDay.date).toLocaleDateString('pt-BR')}` : 'Nenhum'}
                </div>
                <div class="stat-item">
                    <strong>Dias ativos:</strong> ${stats.activeDays} de ${stats.totalDays}
                </div>
            `;
        }
    }

    /**
     * Obtém estatísticas de hoje para um exercício específico
     */
    getTodayStatsForExercise(exerciseId) {
        const exercises = window.storageManager.getExercises() || {};
        const exercise = exercises[exerciseId];
        
        return {
            completed: exercise?.completed || 0,
            repetitions: exercise?.repetitions || 0
        };
    }

    /**
     * Atualiza todas as estatísticas
     */
    updateAllStats() {
        this.updateTotalStats();
        if (this.currentExerciseId) {
            this.updateIndividualDashboard(this.currentExerciseId);
        }
    }

    /**
     * Atualiza estatísticas totais
     */
    updateTotalStats() {
        const consolidated = window.storageManager.getConsolidatedStatistics(30);
        const todayTotal = this.getTotalTodayStats();
        const weekTotal = window.storageManager.getConsolidatedStatistics(7);

        // Atualizar cards do dashboard total
        const todayElement = document.getElementById('total-today');
        const weekElement = document.getElementById('total-week');
        const monthElement = document.getElementById('total-month');
        const streakElement = document.getElementById('total-streak');

        if (todayElement) todayElement.textContent = todayTotal.totalExercises;
        if (weekElement) weekElement.textContent = weekTotal.totalExercises;
        if (monthElement) monthElement.textContent = consolidated.totalExercises;
        if (streakElement) streakElement.textContent = consolidated.overallStreak;
    }

    /**
     * Obtém estatísticas totais de hoje
     */
    getTotalTodayStats() {
        const exercises = window.storageManager.getExercises() || {};
        let totalExercises = 0;
        let totalRepetitions = 0;

        Object.values(exercises).forEach(exercise => {
            totalExercises += exercise.completed || 0;
            totalRepetitions += exercise.repetitions || 0;
        });

        return { totalExercises, totalRepetitions };
    }

    /**
     * Carrega dados da aba de relatórios
     */
    loadReportsData() {
        this.updateDetailedStats();
        this.updateDataManagementInfo();
    }

    /**
     * Atualiza estatísticas detalhadas
     */
    updateDetailedStats() {
        const consolidated = window.storageManager.getConsolidatedStatistics(365);
        const content = document.getElementById('detailed-stats-content');
        
        if (!content) return;

        const exercises = window.storageManager.getExercises() || {};

        content.innerHTML = `
            <div class="stats-grid">
                <div class="stat-item">
                    <strong>Total de dias com exercícios:</strong> ${consolidated.totalActiveDays}
                </div>
                <div class="stat-item">
                    <strong>Total de exercícios realizados:</strong> ${consolidated.totalExercises}
                </div>
                <div class="stat-item">
                    <strong>Total de repetições:</strong> ${consolidated.totalRepetitions}
                </div>
                <div class="stat-item">
                    <strong>Média diária de exercícios:</strong> ${consolidated.averageExercisesPerDay}
                </div>
                <div class="stat-item">
                    <strong>Média diária de repetições:</strong> ${consolidated.averageRepetitionsPerDay}
                </div>
                <div class="stat-item">
                    <strong>Sequência geral atual:</strong> ${consolidated.overallStreak} dias
                </div>
                <div class="stat-item">
                    <strong>Exercício mais praticado:</strong> ${consolidated.bestExercise.name || 'Nenhum'} (${consolidated.bestExercise.completed || 0})
                </div>
                <div class="stat-item">
                    <strong>Tipos de exercícios:</strong> ${Object.keys(exercises).length}
                </div>
            </div>
            <div class="exercise-breakdown">
                <h4>Distribuição por Exercício (Últimos 365 dias):</h4>
                <div class="breakdown-grid">
                    ${Object.keys(consolidated.exerciseBreakdown).map(exerciseId => {
                        const exercise = exercises[exerciseId];
                        return `<div class="breakdown-item">
                            <strong>${exercise?.icon} ${exercise?.name}:</strong> ${consolidated.exerciseBreakdown[exerciseId] || 0}
                        </div>`;
                    }).join('')}
                </div>
            </div>
        `;
    }

    /**
     * Atualiza informações de gerenciamento de dados
     */
    updateDataManagementInfo() {
        const usage = window.storageManager.getStorageUsage();
        const settings = window.storageManager.getSettings();
        const exercises = window.storageManager.getExercises() || {};
        const history = window.storageManager.getHistory() || {};
        
        let totalRecords = 0;
        Object.values(history).forEach(exerciseHistory => {
            totalRecords += exerciseHistory.length;
        });

        document.getElementById('storage-usage').textContent = `${usage.kb} KB`;
        document.getElementById('total-exercises').textContent = Object.keys(exercises).length;
        document.getElementById('total-records').textContent = totalRecords;
        
        const lastBackup = settings.lastBackup;
        if (lastBackup) {
            const date = new Date(lastBackup);
            document.getElementById('last-backup').textContent = date.toLocaleDateString('pt-BR');
        } else {
            document.getElementById('last-backup').textContent = 'Nunca';
        }
    }

    /**
     * Gerenciamento de modais
     */
    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('show');
            modal.style.display = 'flex';
        }
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('show');
            setTimeout(() => {
                modal.style.display = 'none';
            }, 300);
        }
    }

    closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('show');
            setTimeout(() => {
                modal.style.display = 'none';
            }, 300);
        });
    }

    /**
     * Gerenciamento de dropdown
     */
    toggleDropdown() {
        const dropdown = document.getElementById('dashboards-dropdown');
        if (dropdown) {
            dropdown.classList.toggle('show');
        }
    }

    closeDropdown() {
        const dropdown = document.getElementById('dashboards-dropdown');
        if (dropdown) {
            dropdown.classList.remove('show');
        }
    }

    /**
     * Limpa formulário de adicionar exercício
     */
    clearAddExerciseForm() {
        document.getElementById('exercise-name').value = '';
        document.getElementById('exercise-color').value = '#ff0000';
        document.getElementById('exercise-icon').value = '';
    }

    /**
     * Obtém nome amigável do campo
     */
    getFieldName(field) {
        const names = {
            repetitions: 'repetições',
            completed: 'exercícios completos'
        };
        return names[field] || field;
    }

    /**
     * Mostra notificação toast
     */
    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;

        container.appendChild(toast);

        // Animar entrada
        setTimeout(() => {
            toast.classList.add('show');
        }, 100);

        // Remover após 3 segundos
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (container.contains(toast)) {
                    container.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }

    /**
     * Obtém resumo da aplicação para debug
     */
    getAppSummary() {
        const exercises = window.storageManager.getExercises();
        const history = window.storageManager.getHistory();
        const consolidated = window.storageManager.getConsolidatedStatistics(30);
        
        return {
            currentTab: this.currentTab,
            currentExerciseId: this.currentExerciseId,
            exercisesCount: Object.keys(exercises || {}).length,
            historyLength: Object.keys(history || {}).length,
            consolidatedStats: consolidated,
            storageUsage: window.storageManager.getStorageUsage()
        };
    }
}

// Função global para fechar modais (usada no HTML)
function closeModal(modalId) {
    if (window.app) {
        window.app.closeModal(modalId);
    }
}

// CSS adicional para estatísticas detalhadas (mantido da versão anterior)
const additionalCSS = `
.stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 15px;
    margin-bottom: 20px;
}

.stat-item {
    background: rgba(255, 255, 255, 0.05);
    padding: 15px;
    border-radius: 8px;
    border-left: 4px solid #ff0000;
}

.exercise-breakdown {
    margin-top: 20px;
}

.exercise-breakdown h4 {
    color: #ff0000;
    margin-bottom: 15px;
}

.breakdown-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 10px;
}

.breakdown-item {
    background: rgba(255, 255, 255, 0.03);
    padding: 10px;
    border-radius: 6px;
    border-left: 3px solid #ff0000;
}
`;

// Adicionar CSS adicional
const style = document.createElement('style');
style.textContent = additionalCSS;
document.head.appendChild(style);

// Inicializar aplicação quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    window.app = new FitnessTrackerApp();
});

// Salvar dados antes de fechar a página
window.addEventListener('beforeunload', () => {
    console.log('Salvando dados antes de fechar...');
});

// Debug: Expor funções úteis no console
window.fitnessDebug = {
    getAppSummary: () => window.app?.getAppSummary(),
    clearData: () => window.storageManager?.clearAllData(),
    loadSample: () => window.exportManager?.loadSampleData(),
    exportData: () => window.storageManager?.exportData(),
    addExercise: (name, color, icon) => window.storageManager?.addExercise(name, color, icon),
    removeExercise: (id) => window.storageManager?.removeExercise(id)
};

