/**
 * Gerenciador de Exportação e Importação - Versão Avançada
 * Suporte a exercícios dinâmicos e dashboards individuais
 */

class ExportManager {
    constructor() {
        this.version = '2.0';
    }

    /**
     * Exporta dados para CSV
     */
    exportToCSV() {
        try {
            const exercises = window.storageManager.getExercises() || {};
            const history = window.storageManager.getHistory() || {};
            
            let csvContent = 'Data,Exercício,Tipo,Exercícios Completos,Repetições,Total\n';
            
            // Processar histórico de cada exercício
            Object.keys(exercises).forEach(exerciseId => {
                const exercise = exercises[exerciseId];
                const exerciseHistory = history[exerciseId] || [];
                
                exerciseHistory.forEach(record => {
                    const date = new Date(record.date).toLocaleDateString('pt-BR');
                    const completed = record.completed || 0;
                    const repetitions = record.repetitions || 0;
                    const total = completed + (repetitions * 0.2); // Peso para repetições
                    
                    csvContent += `"${date}","${exercise.name}","${exercise.icon}",${completed},${repetitions},${total.toFixed(1)}\n`;
                });
            });
            
            // Adicionar dados atuais
            const today = new Date().toLocaleDateString('pt-BR');
            Object.values(exercises).forEach(exercise => {
                const completed = exercise.completed || 0;
                const repetitions = exercise.repetitions || 0;
                const total = completed + (repetitions * 0.2);
                
                csvContent += `"${today}","${exercise.name}","${exercise.icon}",${completed},${repetitions},${total.toFixed(1)}\n`;
            });
            
            this.downloadFile(csvContent, 'fitness_tracker_dados.csv', 'text/csv');
            this.showToast('Dados exportados para CSV com sucesso!', 'success');
            
            // Atualizar último backup
            this.updateLastBackup();
            
        } catch (error) {
            console.error('Erro ao exportar CSV:', error);
            this.showToast('Erro ao exportar dados para CSV', 'error');
        }
    }

    /**
     * Exporta dados para JSON (backup completo)
     */
    exportToJSON() {
        try {
            const backupData = {
                version: this.version,
                exportDate: new Date().toISOString(),
                exercises: window.storageManager.getExercises(),
                history: window.storageManager.getHistory(),
                settings: window.storageManager.getSettings(),
                statistics: this.generateStatisticsSummary()
            };
            
            const jsonContent = JSON.stringify(backupData, null, 2);
            const fileName = `fitness_tracker_backup_${new Date().toISOString().split('T')[0]}.json`;
            
            this.downloadFile(jsonContent, fileName, 'application/json');
            this.showToast('Backup JSON criado com sucesso!', 'success');
            
            // Atualizar último backup
            this.updateLastBackup();
            
        } catch (error) {
            console.error('Erro ao exportar JSON:', error);
            this.showToast('Erro ao criar backup JSON', 'error');
        }
    }

    /**
     * Importa dados de arquivo
     */
    importFromFile(file) {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                const content = e.target.result;
                
                if (file.name.endsWith('.json')) {
                    this.importFromJSON(content);
                } else if (file.name.endsWith('.csv')) {
                    this.importFromCSV(content);
                } else {
                    this.showToast('Formato de arquivo não suportado. Use JSON ou CSV.', 'error');
                }
                
            } catch (error) {
                console.error('Erro ao importar arquivo:', error);
                this.showToast('Erro ao importar arquivo. Verifique o formato.', 'error');
            }
        };
        
        reader.readAsText(file);
    }

    /**
     * Importa dados de JSON
     */
    importFromJSON(jsonContent) {
        try {
            const data = JSON.parse(jsonContent);
            
            // Validar estrutura
            if (!data.exercises && !data.exercise) {
                throw new Error('Arquivo JSON inválido: estrutura não reconhecida');
            }
            
            // Confirmar importação
            if (!confirm('Isso substituirá todos os dados atuais. Deseja continuar?')) {
                return;
            }
            
            // Importação de backup completo
            if (data.exercises) {
                const result = window.storageManager.importData(data);
                if (result) {
                    this.showToast('Dados importados com sucesso!', 'success');
                    this.refreshApp();
                } else {
                    this.showToast('Erro ao importar dados', 'error');
                }
            }
            
        } catch (error) {
            console.error('Erro ao processar JSON:', error);
            this.showToast('Erro ao processar arquivo JSON', 'error');
        }
    }

    /**
     * Importa dados de CSV (formato básico)
     */
    importFromCSV(csvContent) {
        try {
            const lines = csvContent.split('\n');
            const header = lines[0].split(',');
            
            // Verificar se é um CSV válido
            if (!header.includes('Data') || !header.includes('Exercício')) {
                throw new Error('Formato CSV inválido');
            }
            
            // Confirmar importação
            if (!confirm('Isso adicionará dados ao histórico existente. Deseja continuar?')) {
                return;
            }
            
            const exercises = window.storageManager.getExercises() || {};
            const history = window.storageManager.getHistory() || {};
            let importedRecords = 0;
            
            for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue;
                
                const values = this.parseCSVLine(line);
                if (values.length < 4) continue;
                
                const [dateStr, exerciseName, , completed, repetitions] = values;
                
                // Encontrar ou criar exercício
                let exerciseId = null;
                for (const [id, exercise] of Object.entries(exercises)) {
                    if (exercise.name === exerciseName) {
                        exerciseId = id;
                        break;
                    }
                }
                
                if (!exerciseId) {
                    // Criar novo exercício
                    const result = window.storageManager.addExercise(exerciseName);
                    if (result.success) {
                        exerciseId = result.exerciseId;
                    } else {
                        continue;
                    }
                }
                
                // Adicionar ao histórico
                if (!history[exerciseId]) {
                    history[exerciseId] = [];
                }
                
                const date = this.parseDate(dateStr);
                if (date) {
                    const dateStr = date.toISOString().split('T')[0];
                    const existingRecord = history[exerciseId].find(r => r.date === dateStr);
                    
                    if (existingRecord) {
                        existingRecord.completed = Math.max(existingRecord.completed || 0, parseInt(completed) || 0);
                        existingRecord.repetitions = Math.max(existingRecord.repetitions || 0, parseInt(repetitions) || 0);
                    } else {
                        history[exerciseId].push({
                            date: dateStr,
                            completed: parseInt(completed) || 0,
                            repetitions: parseInt(repetitions) || 0,
                            sessions: [],
                            timestamp: new Date().toISOString()
                        });
                    }
                    
                    importedRecords++;
                }
            }
            
            window.storageManager.saveHistory(history);
            this.showToast(`${importedRecords} registros importados do CSV!`, 'success');
            this.refreshApp();
            
        } catch (error) {
            console.error('Erro ao importar CSV:', error);
            this.showToast('Erro ao importar arquivo CSV', 'error');
        }
    }

    /**
     * Carrega dados de exemplo
     */
    loadSampleData() {
        try {
            const result = window.storageManager.loadSampleData();
            if (result) {
                this.showToast('Dados de exemplo carregados com sucesso!', 'success');
                this.refreshApp();
            } else {
                this.showToast('Erro ao carregar dados de exemplo', 'error');
            }
        } catch (error) {
            console.error('Erro ao carregar dados de exemplo:', error);
            this.showToast('Erro ao carregar dados de exemplo', 'error');
        }
    }

    /**
     * Limpa todos os dados
     */
    clearAllData() {
        if (confirm('⚠️ ATENÇÃO: Isso irá apagar TODOS os seus dados permanentemente!\n\nTem certeza que deseja continuar?')) {
            try {
                const result = window.storageManager.clearAllData();
                if (result) {
                    this.showToast('Todos os dados foram limpos!', 'success');
                    this.refreshApp();
                } else {
                    this.showToast('Erro ao limpar dados', 'error');
                }
            } catch (error) {
                console.error('Erro ao limpar dados:', error);
                this.showToast('Erro ao limpar dados', 'error');
            }
        }
    }

    /**
     * Gera resumo de estatísticas para backup
     */
    generateStatisticsSummary() {
        const consolidated = window.storageManager.getConsolidatedStatistics(365);
        const exercises = window.storageManager.getExercises() || {};
        
        const summary = {
            totalExercises: Object.keys(exercises).length,
            consolidatedStats: consolidated,
            individualStats: {}
        };
        
        Object.keys(exercises).forEach(exerciseId => {
            summary.individualStats[exerciseId] = window.storageManager.getExerciseStatistics(exerciseId, 365);
        });
        
        return summary;
    }

    /**
     * Atualiza último backup nas configurações
     */
    updateLastBackup() {
        const settings = window.storageManager.getSettings() || {};
        settings.lastBackup = new Date().toISOString();
        window.storageManager.saveSettings(settings);
    }

    /**
     * Faz download de arquivo
     */
    downloadFile(content, fileName, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
    }

    /**
     * Analisa linha CSV considerando aspas
     */
    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        
        result.push(current.trim());
        return result;
    }

    /**
     * Analisa data em diferentes formatos
     */
    parseDate(dateStr) {
        // Remover aspas se houver
        dateStr = dateStr.replace(/"/g, '');
        
        // Tentar diferentes formatos
        const formats = [
            /(\d{1,2})\/(\d{1,2})\/(\d{4})/, // DD/MM/YYYY
            /(\d{4})-(\d{1,2})-(\d{1,2})/, // YYYY-MM-DD
            /(\d{1,2})-(\d{1,2})-(\d{4})/ // DD-MM-YYYY
        ];
        
        for (const format of formats) {
            const match = dateStr.match(format);
            if (match) {
                if (format === formats[1]) { // YYYY-MM-DD
                    return new Date(match[1], match[2] - 1, match[3]);
                } else { // DD/MM/YYYY ou DD-MM-YYYY
                    return new Date(match[3], match[2] - 1, match[1]);
                }
            }
        }
        
        return null;
    }

    /**
     * Atualiza a aplicação após importação
     */
    refreshApp() {
        if (window.app) {
            window.app.renderExercises();
            window.app.updateNavigation();
            window.app.updateAllStats();
            
            // Atualizar gráficos se necessário
            setTimeout(() => {
                if (window.chartManager) {
                    window.chartManager.updateAllCharts();
                }
            }, 500);
        }
        
        // Recarregar página como último recurso
        setTimeout(() => {
            if (confirm('Dados importados! Deseja recarregar a página para garantir que tudo esteja atualizado?')) {
                location.reload();
            }
        }, 1000);
    }

    /**
     * Mostra notificação toast
     */
    showToast(message, type = 'info') {
        if (window.app && typeof window.app.showToast === 'function') {
            window.app.showToast(message, type);
        } else {
            // Fallback para alert se toast não estiver disponível
            alert(message);
        }
    }

    /**
     * Obtém estatísticas de uso de armazenamento
     */
    getStorageStats() {
        return window.storageManager.getStorageUsage();
    }
}

// Instância global do gerenciador de exportação
window.exportManager = new ExportManager();

