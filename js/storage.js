/**
 * Gerenciador de LocalStorage para o Fitness Tracker - Versão Avançada
 * Suporte a exercícios dinâmicos e dashboards individuais
 */

class StorageManager {
    constructor() {
        this.storageKey = 'fitnessTracker';
        this.exercisesKey = 'fitnessExercises';
        this.historyKey = 'fitnessHistory';
        this.settingsKey = 'fitnessSettings';
        
        // Exercícios padrão
        this.defaultExercises = {
            flexao: {
                id: 'flexao',
                name: 'Flexões',
                color: '#ff0000',
                icon: '💪',
                repetitions: 0,
                completed: 0,
                isDefault: true,
                createdAt: new Date().toISOString()
            },
            abdominal: {
                id: 'abdominal',
                name: 'Abdominais',
                color: '#00ff00',
                icon: '🔥',
                repetitions: 0,
                completed: 0,
                isDefault: true,
                createdAt: new Date().toISOString()
            },
            agachamento: {
                id: 'agachamento',
                name: 'Agachamentos',
                color: '#0000ff',
                icon: '🦵',
                repetitions: 0,
                completed: 0,
                isDefault: true,
                createdAt: new Date().toISOString()
            },
            barra: {
                id: 'barra',
                name: 'Barras',
                color: '#ffff00',
                icon: '🏋️',
                repetitions: 0,
                completed: 0,
                isDefault: true,
                createdAt: new Date().toISOString()
            }
        };
        
        this.initializeData();
    }

    /**
     * Inicializa os dados se não existirem ou migra dados antigos
     */
    initializeData() {
        this.migrateOldData();
        
        if (!this.getExercises()) {
            this.saveExercises(this.defaultExercises);
        }

        if (!this.getHistory()) {
            this.saveHistory({});
        }

        if (!this.getSettings()) {
            const defaultSettings = {
                theme: 'dark',
                autoSave: true,
                notifications: true,
                language: 'pt-br',
                version: '2.0'
            };
            this.saveSettings(defaultSettings);
        }
    }

    /**
     * Migra dados da versão anterior para nova estrutura
     */
    migrateOldData() {
        const oldData = localStorage.getItem(this.storageKey);
        const oldHistory = localStorage.getItem(this.historyKey);
        
        if (oldData && !localStorage.getItem(this.exercisesKey)) {
            try {
                const data = JSON.parse(oldData);
                
                // Migrar exercícios para nova estrutura
                if (data.exercises) {
                    const migratedExercises = {};
                    Object.keys(data.exercises).forEach(key => {
                        const exercise = data.exercises[key];
                        migratedExercises[key] = {
                            id: key,
                            name: this.defaultExercises[key]?.name || key,
                            color: this.defaultExercises[key]?.color || '#ff0000',
                            icon: this.defaultExercises[key]?.icon || '💪',
                            repetitions: exercise.repetitions || 0,
                            completed: exercise.completed || 0,
                            isDefault: true,
                            createdAt: new Date().toISOString()
                        };
                    });
                    this.saveExercises(migratedExercises);
                }
                
                // Migrar histórico para nova estrutura
                if (oldHistory) {
                    const historyData = JSON.parse(oldHistory);
                    const migratedHistory = {};
                    
                    // Agrupar histórico por exercício
                    historyData.forEach(record => {
                        Object.keys(record.exercises || {}).forEach(exerciseId => {
                            if (!migratedHistory[exerciseId]) {
                                migratedHistory[exerciseId] = [];
                            }
                            
                            const existingRecord = migratedHistory[exerciseId].find(r => r.date === record.date);
                            if (existingRecord) {
                                existingRecord.completed += record.exercises[exerciseId] || 0;
                            } else {
                                migratedHistory[exerciseId].push({
                                    date: record.date,
                                    repetitions: 0,
                                    completed: record.exercises[exerciseId] || 0,
                                    sessions: [],
                                    timestamp: record.timestamp || new Date().toISOString()
                                });
                            }
                        });
                    });
                    
                    this.saveHistory(migratedHistory);
                }
                
                console.log('Dados migrados com sucesso para nova versão');
            } catch (error) {
                console.error('Erro ao migrar dados:', error);
            }
        }
    }

    /**
     * Salva exercícios no LocalStorage
     */
    saveExercises(exercises) {
        try {
            localStorage.setItem(this.exercisesKey, JSON.stringify(exercises));
            return true;
        } catch (error) {
            console.error('Erro ao salvar exercícios:', error);
            return false;
        }
    }

    /**
     * Carrega exercícios do LocalStorage
     */
    getExercises() {
        try {
            const exercises = localStorage.getItem(this.exercisesKey);
            return exercises ? JSON.parse(exercises) : null;
        } catch (error) {
            console.error('Erro ao carregar exercícios:', error);
            return null;
        }
    }

    /**
     * Adiciona um novo exercício
     */
    addExercise(name, color = '#ff0000', icon = '💪') {
        const exercises = this.getExercises() || {};
        const id = this.generateExerciseId(name);
        
        if (exercises[id]) {
            return { success: false, message: 'Exercício já existe' };
        }
        
        exercises[id] = {
            id,
            name,
            color,
            icon,
            repetitions: 0,
            completed: 0,
            isDefault: false,
            createdAt: new Date().toISOString()
        };
        
        this.saveExercises(exercises);
        
        // Inicializar histórico vazio para o novo exercício
        const history = this.getHistory() || {};
        history[id] = [];
        this.saveHistory(history);
        
        return { success: true, exerciseId: id };
    }

    /**
     * Remove um exercício
     */
    removeExercise(exerciseId) {
        const exercises = this.getExercises() || {};
        
        if (!exercises[exerciseId]) {
            return { success: false, message: 'Exercício não encontrado' };
        }
        
        if (exercises[exerciseId].isDefault) {
            return { success: false, message: 'Não é possível remover exercícios padrão' };
        }
        
        // Remover exercício
        delete exercises[exerciseId];
        this.saveExercises(exercises);
        
        // Remover histórico do exercício
        const history = this.getHistory() || {};
        delete history[exerciseId];
        this.saveHistory(history);
        
        return { success: true };
    }

    /**
     * Atualiza dados de um exercício
     */
    updateExercise(exerciseId, field, value) {
        const exercises = this.getExercises() || {};
        
        if (!exercises[exerciseId]) {
            return false;
        }
        
        exercises[exerciseId][field] = Math.max(0, value);
        
        // Limitar repetições a 5
        if (field === 'repetitions') {
            exercises[exerciseId][field] = Math.min(5, exercises[exerciseId][field]);
        }
        
        this.saveExercises(exercises);
        this.updateExerciseHistory(exerciseId);
        return true;
    }

    /**
     * Incrementa um valor de exercício
     */
    incrementExercise(exerciseId, field, amount = 1) {
        const exercises = this.getExercises() || {};
        
        if (!exercises[exerciseId]) {
            return 0;
        }
        
        const currentValue = exercises[exerciseId][field] || 0;
        const newValue = currentValue + amount;
        
        if (field === 'repetitions') {
            exercises[exerciseId][field] = Math.min(5, newValue);
        } else {
            exercises[exerciseId][field] = newValue;
        }
        
        this.saveExercises(exercises);
        this.updateExerciseHistory(exerciseId);
        return exercises[exerciseId][field];
    }

    /**
     * Decrementa um valor de exercício
     */
    decrementExercise(exerciseId, field, amount = 1) {
        const exercises = this.getExercises() || {};
        
        if (!exercises[exerciseId]) {
            return 0;
        }
        
        const currentValue = exercises[exerciseId][field] || 0;
        exercises[exerciseId][field] = Math.max(0, currentValue - amount);
        
        this.saveExercises(exercises);
        this.updateExerciseHistory(exerciseId);
        return exercises[exerciseId][field];
    }

    /**
     * Atualiza o histórico de um exercício específico
     */
    updateExerciseHistory(exerciseId) {
        const exercises = this.getExercises() || {};
        const history = this.getHistory() || {};
        const today = new Date().toISOString().split('T')[0];
        
        if (!exercises[exerciseId]) return;
        
        if (!history[exerciseId]) {
            history[exerciseId] = [];
        }
        
        const exercise = exercises[exerciseId];
        const todayIndex = history[exerciseId].findIndex(record => record.date === today);
        
        const todayRecord = {
            date: today,
            repetitions: exercise.repetitions || 0,
            completed: exercise.completed || 0,
            sessions: [], // Para futuras implementações de sessões
            timestamp: new Date().toISOString()
        };
        
        if (todayIndex >= 0) {
            history[exerciseId][todayIndex] = todayRecord;
        } else {
            history[exerciseId].push(todayRecord);
        }
        
        // Manter apenas os últimos 365 dias
        const oneYearAgo = new Date();
        oneYearAgo.setDate(oneYearAgo.getDate() - 365);
        
        history[exerciseId] = history[exerciseId].filter(record => 
            new Date(record.date) >= oneYearAgo
        );
        
        this.saveHistory(history);
    }

    /**
     * Obtém estatísticas de um exercício específico
     */
    getExerciseStatistics(exerciseId, days = 30) {
        const history = this.getHistory() || {};
        const exerciseHistory = history[exerciseId] || [];
        
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        
        const periodHistory = exerciseHistory.filter(record => 
            new Date(record.date) >= cutoffDate
        );
        
        const stats = {
            totalDays: periodHistory.length,
            totalCompleted: periodHistory.reduce((sum, record) => sum + (record.completed || 0), 0),
            totalRepetitions: periodHistory.reduce((sum, record) => sum + (record.repetitions || 0), 0),
            averageCompletedPerDay: 0,
            averageRepetitionsPerDay: 0,
            bestDay: { date: null, completed: 0 },
            streak: this.calculateExerciseStreak(exerciseId),
            activeDays: periodHistory.filter(record => (record.completed || 0) > 0).length
        };
        
        if (stats.totalDays > 0) {
            stats.averageCompletedPerDay = (stats.totalCompleted / stats.totalDays).toFixed(1);
            stats.averageRepetitionsPerDay = (stats.totalRepetitions / stats.totalDays).toFixed(1);
        }
        
        // Encontrar melhor dia
        periodHistory.forEach(record => {
            if ((record.completed || 0) > stats.bestDay.completed) {
                stats.bestDay = {
                    date: record.date,
                    completed: record.completed || 0
                };
            }
        });
        
        return stats;
    }

    /**
     * Calcula sequência de um exercício específico
     */
    calculateExerciseStreak(exerciseId) {
        const history = this.getHistory() || {};
        const exerciseHistory = (history[exerciseId] || []).sort((a, b) => new Date(b.date) - new Date(a.date));
        
        let streak = 0;
        const today = new Date().toISOString().split('T')[0];
        
        for (let i = 0; i < exerciseHistory.length; i++) {
            const record = exerciseHistory[i];
            const expectedDate = new Date();
            expectedDate.setDate(expectedDate.getDate() - i);
            const expectedDateStr = expectedDate.toISOString().split('T')[0];
            
            if (record.date === expectedDateStr && (record.completed || 0) > 0) {
                streak++;
            } else if (record.date === expectedDateStr && (record.completed || 0) === 0) {
                break;
            } else if (record.date !== expectedDateStr) {
                break;
            }
        }
        
        return streak;
    }

    /**
     * Obtém estatísticas consolidadas de todos os exercícios
     */
    getConsolidatedStatistics(days = 30) {
        const exercises = this.getExercises() || {};
        const exerciseIds = Object.keys(exercises);
        
        const consolidated = {
            totalExercises: 0,
            totalRepetitions: 0,
            totalActiveDays: 0,
            exerciseBreakdown: {},
            bestExercise: { id: null, name: null, completed: 0 },
            overallStreak: 0,
            averageExercisesPerDay: 0,
            averageRepetitionsPerDay: 0
        };
        
        const allDates = new Set();
        
        exerciseIds.forEach(exerciseId => {
            const stats = this.getExerciseStatistics(exerciseId, days);
            consolidated.totalExercises += stats.totalCompleted;
            consolidated.totalRepetitions += stats.totalRepetitions;
            consolidated.exerciseBreakdown[exerciseId] = stats.totalCompleted;
            
            if (stats.totalCompleted > consolidated.bestExercise.completed) {
                consolidated.bestExercise = {
                    id: exerciseId,
                    name: exercises[exerciseId].name,
                    completed: stats.totalCompleted
                };
            }
            
            // Coletar todas as datas ativas
            const history = this.getHistory() || {};
            const exerciseHistory = history[exerciseId] || [];
            exerciseHistory.forEach(record => {
                if ((record.completed || 0) > 0) {
                    allDates.add(record.date);
                }
            });
        });
        
        consolidated.totalActiveDays = allDates.size;
        consolidated.overallStreak = this.calculateOverallStreak();
        
        if (consolidated.totalActiveDays > 0) {
            consolidated.averageExercisesPerDay = (consolidated.totalExercises / consolidated.totalActiveDays).toFixed(1);
            consolidated.averageRepetitionsPerDay = (consolidated.totalRepetitions / consolidated.totalActiveDays).toFixed(1);
        }
        
        return consolidated;
    }

    /**
     * Calcula sequência geral (qualquer exercício)
     */
    calculateOverallStreak() {
        const exercises = this.getExercises() || {};
        const history = this.getHistory() || {};
        const exerciseIds = Object.keys(exercises);
        
        let streak = 0;
        const today = new Date();
        
        for (let i = 0; i < 365; i++) {
            const checkDate = new Date(today);
            checkDate.setDate(checkDate.getDate() - i);
            const dateStr = checkDate.toISOString().split('T')[0];
            
            let hasActivity = false;
            
            exerciseIds.forEach(exerciseId => {
                const exerciseHistory = history[exerciseId] || [];
                const dayRecord = exerciseHistory.find(record => record.date === dateStr);
                if (dayRecord && (dayRecord.completed || 0) > 0) {
                    hasActivity = true;
                }
            });
            
            if (hasActivity) {
                streak++;
            } else {
                break;
            }
        }
        
        return streak;
    }

    /**
     * Gera ID único para exercício
     */
    generateExerciseId(name) {
        const baseId = name.toLowerCase()
            .replace(/[^a-z0-9]/g, '_')
            .replace(/_+/g, '_')
            .replace(/^_|_$/g, '');
        
        const exercises = this.getExercises() || {};
        let id = baseId;
        let counter = 1;
        
        while (exercises[id]) {
            id = `${baseId}_${counter}`;
            counter++;
        }
        
        return id;
    }

    /**
     * Salva histórico no LocalStorage
     */
    saveHistory(history) {
        try {
            localStorage.setItem(this.historyKey, JSON.stringify(history));
            return true;
        } catch (error) {
            console.error('Erro ao salvar histórico:', error);
            return false;
        }
    }

    /**
     * Carrega histórico do LocalStorage
     */
    getHistory() {
        try {
            const history = localStorage.getItem(this.historyKey);
            return history ? JSON.parse(history) : null;
        } catch (error) {
            console.error('Erro ao carregar histórico:', error);
            return {};
        }
    }

    /**
     * Salva configurações no LocalStorage
     */
    saveSettings(settings) {
        try {
            localStorage.setItem(this.settingsKey, JSON.stringify(settings));
            return true;
        } catch (error) {
            console.error('Erro ao salvar configurações:', error);
            return false;
        }
    }

    /**
     * Carrega configurações do LocalStorage
     */
    getSettings() {
        try {
            const settings = localStorage.getItem(this.settingsKey);
            return settings ? JSON.parse(settings) : null;
        } catch (error) {
            console.error('Erro ao carregar configurações:', error);
            return null;
        }
    }

    /**
     * Exporta todos os dados para backup
     */
    exportData() {
        return {
            exercises: this.getExercises(),
            history: this.getHistory(),
            settings: this.getSettings(),
            exportDate: new Date().toISOString(),
            version: '2.0'
        };
    }

    /**
     * Importa dados de backup
     */
    importData(backupData) {
        try {
            if (backupData.exercises) {
                this.saveExercises(backupData.exercises);
            }
            if (backupData.history) {
                this.saveHistory(backupData.history);
            }
            if (backupData.settings) {
                this.saveSettings(backupData.settings);
            }
            return true;
        } catch (error) {
            console.error('Erro ao importar dados:', error);
            return false;
        }
    }

    /**
     * Limpa todos os dados
     */
    clearAllData() {
        try {
            localStorage.removeItem(this.exercisesKey);
            localStorage.removeItem(this.historyKey);
            localStorage.removeItem(this.settingsKey);
            // Manter dados antigos para compatibilidade
            this.initializeData();
            return true;
        } catch (error) {
            console.error('Erro ao limpar dados:', error);
            return false;
        }
    }

    /**
     * Calcula uso de armazenamento
     */
    getStorageUsage() {
        try {
            const exercises = JSON.stringify(this.getExercises());
            const history = JSON.stringify(this.getHistory());
            const settings = JSON.stringify(this.getSettings());
            
            const totalBytes = (exercises.length + history.length + settings.length) * 2;
            const totalKB = (totalBytes / 1024).toFixed(2);
            
            return {
                bytes: totalBytes,
                kb: totalKB,
                mb: (totalKB / 1024).toFixed(2)
            };
        } catch (error) {
            console.error('Erro ao calcular uso de armazenamento:', error);
            return { bytes: 0, kb: '0', mb: '0' };
        }
    }

    /**
     * Carrega dados de exemplo para demonstração
     */
    loadSampleData() {
        const exercises = this.getExercises() || {};
        const sampleHistory = {};
        const today = new Date();
        
        // Gerar dados de exemplo para cada exercício
        Object.keys(exercises).forEach(exerciseId => {
            sampleHistory[exerciseId] = [];
            
            for (let i = 29; i >= 0; i--) {
                const date = new Date(today);
                date.setDate(date.getDate() - i);
                const dateStr = date.toISOString().split('T')[0];
                
                const completed = Math.floor(Math.random() * 15) + 5;
                const repetitions = Math.floor(Math.random() * 5);
                
                sampleHistory[exerciseId].push({
                    date: dateStr,
                    repetitions,
                    completed,
                    sessions: [],
                    timestamp: date.toISOString()
                });
            }
        });
        
        this.saveHistory(sampleHistory);
        
        // Atualizar dados atuais com valores do último dia
        Object.keys(exercises).forEach(exerciseId => {
            const lastDay = sampleHistory[exerciseId][sampleHistory[exerciseId].length - 1];
            exercises[exerciseId].repetitions = Math.floor(Math.random() * 5);
            exercises[exerciseId].completed = lastDay.completed;
        });
        
        this.saveExercises(exercises);
        return true;
    }
}

// Instância global do gerenciador de storage
window.storageManager = new StorageManager();

