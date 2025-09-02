/**
 * Gerenciador de Gráficos para o Fitness Tracker - Versão Avançada
 * Suporte a dashboards individuais e gráficos consolidados
 */

class ChartManager {
    constructor() {
        this.charts = new Map();
        this.colors = {
            flexao: '#ff0000',
            abdominal: '#00ff00', 
            agachamento: '#0000ff',
            barra: '#ffff00',
            primary: '#ff0000',
            secondary: '#ffffff',
            background: 'rgba(255, 0, 0, 0.1)',
            grid: 'rgba(255, 255, 255, 0.1)'
        };
        
        // Configurações padrão para todos os gráficos
        Chart.defaults.color = '#ffffff';
        Chart.defaults.borderColor = 'rgba(255, 255, 255, 0.1)';
        Chart.defaults.backgroundColor = 'rgba(255, 0, 0, 0.1)';
    }

    /**
     * Inicializa gráficos do dashboard total
     */
    initializeTotalCharts() {
        this.createTotalComparisonChart();
        this.createTotalPieChart();
        this.createTotalProgressChart();
    }

    /**
     * Inicializa gráficos de um dashboard individual
     */
    initializeIndividualCharts(exerciseId) {
        this.createIndividualDailyChart(exerciseId);
        this.createIndividualWeeklyChart(exerciseId);
    }

    /**
     * Cria gráfico de comparação total entre exercícios
     */
    createTotalComparisonChart() {
        const ctx = document.getElementById('totalComparisonChart');
        if (!ctx) return;

        // Destruir gráfico existente se houver
        const existingChart = this.charts.get('totalComparison');
        if (existingChart) {
            existingChart.destroy();
        }

        const exercises = window.storageManager.getExercises() || {};
        const consolidated = window.storageManager.getConsolidatedStatistics(30);

        const labels = [];
        const data = [];
        const backgroundColors = [];

        Object.keys(exercises).forEach(exerciseId => {
            const exercise = exercises[exerciseId];
            const count = consolidated.exerciseBreakdown[exerciseId] || 0;
            
            labels.push(exercise.name);
            data.push(count);
            backgroundColors.push(exercise.color || this.colors.primary);
        });

        const chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Exercícios Realizados',
                    data: data,
                    backgroundColor: backgroundColors.map(color => `${color}80`),
                    borderColor: backgroundColors,
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderColor: this.colors.primary,
                        borderWidth: 1
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            color: '#ffffff',
                            font: {
                                size: 12
                            }
                        },
                        grid: {
                            color: this.colors.grid
                        }
                    },
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: '#ffffff',
                            font: {
                                size: 12
                            }
                        },
                        grid: {
                            color: this.colors.grid
                        }
                    }
                },
                animation: {
                    duration: 1000,
                    easing: 'easeInOutQuart'
                }
            }
        });

        this.charts.set('totalComparison', chart);
    }

    /**
     * Cria gráfico de pizza total
     */
    createTotalPieChart() {
        const ctx = document.getElementById('totalPieChart');
        if (!ctx) return;

        // Destruir gráfico existente se houver
        const existingChart = this.charts.get('totalPie');
        if (existingChart) {
            existingChart.destroy();
        }

        const exercises = window.storageManager.getExercises() || {};
        const consolidated = window.storageManager.getConsolidatedStatistics(30);

        const labels = [];
        const data = [];
        const backgroundColors = [];

        Object.keys(exercises).forEach(exerciseId => {
            const exercise = exercises[exerciseId];
            const count = consolidated.exerciseBreakdown[exerciseId] || 0;
            
            if (count > 0) {
                labels.push(`${exercise.icon} ${exercise.name}`);
                data.push(count);
                backgroundColors.push(exercise.color || this.colors.primary);
            }
        });

        // Se não há dados, mostrar gráfico vazio
        if (data.length === 0) {
            labels.push('Nenhum exercício registrado');
            data.push(1);
            backgroundColors.push('#666666');
        }

        const chart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: backgroundColors,
                    borderColor: '#ffffff',
                    borderWidth: 2,
                    hoverBorderWidth: 3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#ffffff',
                            font: {
                                size: 12,
                                weight: 'bold'
                            },
                            padding: 20
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderColor: this.colors.primary,
                        borderWidth: 1,
                        callbacks: {
                            label: function(context) {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((context.parsed / total) * 100).toFixed(1);
                                return `${context.label}: ${context.parsed} (${percentage}%)`;
                            }
                        }
                    }
                },
                animation: {
                    duration: 1500,
                    easing: 'easeInOutQuart'
                }
            }
        });

        this.charts.set('totalPie', chart);
    }

    /**
     * Cria gráfico de progresso total
     */
    createTotalProgressChart() {
        const ctx = document.getElementById('totalProgressChart');
        if (!ctx) return;

        // Destruir gráfico existente se houver
        const existingChart = this.charts.get('totalProgress');
        if (existingChart) {
            existingChart.destroy();
        }

        const exercises = window.storageManager.getExercises() || {};
        const last30Days = this.getLast30DaysConsolidated();

        const datasets = [];

        Object.keys(exercises).forEach(exerciseId => {
            const exercise = exercises[exerciseId];
            const exerciseData = last30Days.map(day => day.exercises[exerciseId] || 0);
            
            datasets.push({
                label: `${exercise.icon} ${exercise.name}`,
                data: exerciseData,
                borderColor: exercise.color || this.colors.primary,
                backgroundColor: `${exercise.color || this.colors.primary}20`,
                borderWidth: 2,
                fill: false,
                tension: 0.4
            });
        });

        const chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: last30Days.map(day => this.formatDateShort(day.date)),
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: '#ffffff',
                            font: {
                                size: 12,
                                weight: 'bold'
                            }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderColor: this.colors.primary,
                        borderWidth: 1
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            color: '#ffffff',
                            font: {
                                size: 10
                            },
                            maxRotation: 45
                        },
                        grid: {
                            color: this.colors.grid
                        }
                    },
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: '#ffffff',
                            font: {
                                size: 12
                            }
                        },
                        grid: {
                            color: this.colors.grid
                        }
                    }
                },
                animation: {
                    duration: 1200,
                    easing: 'easeInOutQuart'
                }
            }
        });

        this.charts.set('totalProgress', chart);
    }

    /**
     * Cria gráfico diário individual para um exercício
     */
    createIndividualDailyChart(exerciseId) {
        const ctx = document.getElementById(`chart-${exerciseId}-daily`);
        if (!ctx) return;

        // Destruir gráfico existente se houver
        const existingChart = this.charts.get(`${exerciseId}-daily`);
        if (existingChart) {
            existingChart.destroy();
        }

        const exercises = window.storageManager.getExercises() || {};
        const exercise = exercises[exerciseId];
        if (!exercise) return;

        const history = window.storageManager.getHistory() || {};
        const exerciseHistory = history[exerciseId] || [];
        const last30Days = this.getLast30DaysForExercise(exerciseHistory);

        const chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: last30Days.map(day => this.formatDateShort(day.date)),
                datasets: [{
                    label: 'Exercícios Completos',
                    data: last30Days.map(day => day.completed || 0),
                    borderColor: exercise.color,
                    backgroundColor: `${exercise.color}20`,
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: exercise.color,
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }, {
                    label: 'Repetições',
                    data: last30Days.map(day => day.repetitions || 0),
                    borderColor: `${exercise.color}80`,
                    backgroundColor: `${exercise.color}10`,
                    borderWidth: 2,
                    fill: false,
                    tension: 0.4,
                    pointBackgroundColor: `${exercise.color}80`,
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 1,
                    pointRadius: 3,
                    pointHoverRadius: 5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: '#ffffff',
                            font: {
                                size: 12,
                                weight: 'bold'
                            }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderColor: exercise.color,
                        borderWidth: 1
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            color: '#ffffff',
                            font: {
                                size: 10
                            },
                            maxRotation: 45
                        },
                        grid: {
                            color: this.colors.grid
                        }
                    },
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: '#ffffff',
                            font: {
                                size: 12
                            }
                        },
                        grid: {
                            color: this.colors.grid
                        }
                    }
                },
                animation: {
                    duration: 1000,
                    easing: 'easeInOutQuart'
                }
            }
        });

        this.charts.set(`${exerciseId}-daily`, chart);
    }

    /**
     * Cria gráfico semanal individual para um exercício
     */
    createIndividualWeeklyChart(exerciseId) {
        const ctx = document.getElementById(`chart-${exerciseId}-weekly`);
        if (!ctx) return;

        // Destruir gráfico existente se houver
        const existingChart = this.charts.get(`${exerciseId}-weekly`);
        if (existingChart) {
            existingChart.destroy();
        }

        const exercises = window.storageManager.getExercises() || {};
        const exercise = exercises[exerciseId];
        if (!exercise) return;

        const history = window.storageManager.getHistory() || {};
        const exerciseHistory = history[exerciseId] || [];
        const weeklyData = this.getWeeklyDataForExercise(exerciseHistory);

        const chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'],
                datasets: [{
                    label: 'Exercícios por Dia da Semana',
                    data: weeklyData,
                    backgroundColor: `${exercise.color}80`,
                    borderColor: exercise.color,
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: '#ffffff',
                            font: {
                                size: 12,
                                weight: 'bold'
                            }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderColor: exercise.color,
                        borderWidth: 1
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            color: '#ffffff',
                            font: {
                                size: 12
                            }
                        },
                        grid: {
                            color: this.colors.grid
                        }
                    },
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: '#ffffff',
                            font: {
                                size: 12
                            }
                        },
                        grid: {
                            color: this.colors.grid
                        }
                    }
                },
                animation: {
                    duration: 1000,
                    easing: 'easeInOutQuart'
                }
            }
        });

        this.charts.set(`${exerciseId}-weekly`, chart);
    }

    /**
     * Obtém dados consolidados dos últimos 30 dias
     */
    getLast30DaysConsolidated() {
        const result = [];
        const today = new Date();
        const exercises = window.storageManager.getExercises() || {};
        const history = window.storageManager.getHistory() || {};
        
        for (let i = 29; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            
            const dayData = {
                date: dateStr,
                exercises: {}
            };
            
            Object.keys(exercises).forEach(exerciseId => {
                const exerciseHistory = history[exerciseId] || [];
                const dayRecord = exerciseHistory.find(record => record.date === dateStr);
                dayData.exercises[exerciseId] = dayRecord?.completed || 0;
            });
            
            result.push(dayData);
        }
        
        return result;
    }

    /**
     * Obtém dados dos últimos 30 dias para um exercício específico
     */
    getLast30DaysForExercise(exerciseHistory) {
        const result = [];
        const today = new Date();
        
        for (let i = 29; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            
            const dayData = exerciseHistory.find(record => record.date === dateStr);
            result.push(dayData || {
                date: dateStr,
                completed: 0,
                repetitions: 0
            });
        }
        
        return result;
    }

    /**
     * Obtém dados semanais para um exercício (distribuição por dia da semana)
     */
    getWeeklyDataForExercise(exerciseHistory) {
        const weeklyTotals = [0, 0, 0, 0, 0, 0, 0]; // Dom, Seg, Ter, Qua, Qui, Sex, Sáb
        
        exerciseHistory.forEach(record => {
            const date = new Date(record.date);
            const dayOfWeek = date.getDay();
            weeklyTotals[dayOfWeek] += record.completed || 0;
        });
        
        return weeklyTotals;
    }

    /**
     * Atualiza todos os gráficos
     */
    updateAllCharts() {
        // Atualizar gráficos totais se estiverem visíveis
        if (document.getElementById('dashboard-total-section')?.classList.contains('active')) {
            this.initializeTotalCharts();
        }
        
        // Atualizar gráfico individual se estiver visível
        const exercises = window.storageManager.getExercises() || {};
        Object.keys(exercises).forEach(exerciseId => {
            const dashboard = document.getElementById(`dashboard-${exerciseId}`);
            if (dashboard?.classList.contains('active')) {
                this.initializeIndividualCharts(exerciseId);
            }
        });
    }

    /**
     * Atualiza cor de um exercício em todos os gráficos
     */
    updateExerciseColor(exerciseId, newColor) {
        this.colors[exerciseId] = newColor;
        this.updateAllCharts();
    }

    /**
     * Remove gráficos de um exercício removido
     */
    removeExerciseCharts(exerciseId) {
        const dailyChart = this.charts.get(`${exerciseId}-daily`);
        const weeklyChart = this.charts.get(`${exerciseId}-weekly`);
        
        if (dailyChart) {
            dailyChart.destroy();
            this.charts.delete(`${exerciseId}-daily`);
        }
        
        if (weeklyChart) {
            weeklyChart.destroy();
            this.charts.delete(`${exerciseId}-weekly`);
        }
        
        // Atualizar gráficos totais para remover o exercício
        this.initializeTotalCharts();
    }

    /**
     * Formata data para exibição
     */
    formatDate(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleDateString('pt-BR', { 
            day: '2-digit', 
            month: '2-digit' 
        });
    }

    /**
     * Formata data de forma abreviada
     */
    formatDateShort(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleDateString('pt-BR', { 
            day: '2-digit' 
        });
    }

    /**
     * Obtém nome amigável do exercício
     */
    getExerciseName(exerciseKey) {
        const exercises = window.storageManager.getExercises() || {};
        return exercises[exerciseKey]?.name || exerciseKey;
    }

    /**
     * Destrói todos os gráficos
     */
    destroyAllCharts() {
        this.charts.forEach(chart => {
            if (chart && typeof chart.destroy === 'function') {
                chart.destroy();
            }
        });
        this.charts.clear();
    }

    /**
     * Redimensiona todos os gráficos
     */
    resizeAllCharts() {
        this.charts.forEach(chart => {
            if (chart && typeof chart.resize === 'function') {
                chart.resize();
            }
        });
    }

    /**
     * Obtém estatísticas de um gráfico específico
     */
    getChartStats(chartId) {
        const chart = this.charts.get(chartId);
        if (!chart) return null;
        
        return {
            type: chart.config.type,
            datasets: chart.data.datasets.length,
            dataPoints: chart.data.labels.length,
            visible: chart.canvas.style.display !== 'none'
        };
    }

    /**
     * Exporta dados de gráfico para imagem
     */
    exportChartAsImage(chartId) {
        const chart = this.charts.get(chartId);
        if (!chart) return null;
        
        return chart.toBase64Image();
    }
}

// Instância global do gerenciador de gráficos
window.chartManager = new ChartManager();

// Redimensionar gráficos quando a janela for redimensionada
window.addEventListener('resize', () => {
    if (window.chartManager) {
        setTimeout(() => {
            window.chartManager.resizeAllCharts();
        }, 100);
    }
});

// Atualizar cores dos gráficos quando exercícios forem modificados
window.addEventListener('exerciseUpdated', (event) => {
    if (window.chartManager && event.detail) {
        const { exerciseId, color } = event.detail;
        if (color) {
            window.chartManager.updateExerciseColor(exerciseId, color);
        }
    }
});

// Remover gráficos quando exercício for removido
window.addEventListener('exerciseRemoved', (event) => {
    if (window.chartManager && event.detail) {
        const { exerciseId } = event.detail;
        window.chartManager.removeExerciseCharts(exerciseId);
    }
});

