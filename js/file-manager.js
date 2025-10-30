// Gestion des fichiers JSON physiques
class FileManager {
    constructor() {
        this.currentYear = this.getCurrentSchoolYear();
    }

    getCurrentSchoolYear() {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;
        
        if (month >= 9) {
            return `${year}-${year + 1}`;
        } else {
            return `${year - 1}-${year}`;
        }
    }

    // Méthode simplifiée - le vrai chargement se fait dans FileLoader
    async initializeFromFiles() {
        console.log('🔍 Vérification des données...');
        
        const groupes = this.loadData('groupes.json', []);
        const eleves = this.loadData('eleves.json', []);
        const paiements = this.loadData('paiements.json', []);
        
        console.log(`📊 État des données: ${groupes.length} groupes, ${eleves.length} élèves, ${paiements.length} paiements`);
        
        // Si pas de données, retourner false pour déclencher le chargeur
        return groupes.length > 0 || eleves.length > 0;
    }

    // Sauvegarder des données dans un fichier JSON
    async saveFile(filename, data) {
        return new Promise((resolve, reject) => {
            try {
                const jsonString = JSON.stringify(data, null, 2);
                const blob = new Blob([jsonString], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                
                // Stocker aussi dans localStorage comme cache
                localStorage.setItem(filename, jsonString);
                resolve(true);
            } catch (error) {
                reject(error);
            }
        });
    }

    // Charger un fichier JSON
    async loadFile(filename) {
        return new Promise((resolve, reject) => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            
            input.onchange = e => {
                const file = e.target.files[0];
                if (!file) {
                    reject(new Error('Aucun fichier sélectionné'));
                    return;
                }
                
                const reader = new FileReader();
                reader.onload = event => {
                    try {
                        const data = JSON.parse(event.target.result);
                        // Sauvegarder dans localStorage comme cache
                        localStorage.setItem(filename, JSON.stringify(data));
                        resolve(data);
                    } catch (error) {
                        reject(error);
                    }
                };
                reader.onerror = () => reject(new Error('Erreur de lecture du fichier'));
                reader.readAsText(file);
            };
            
            input.click();
        });
    }

    // Charger depuis localStorage ou créer des données par défaut
    loadData(filename, defaultData = null) {
        const stored = localStorage.getItem(filename);
        if (stored) {
            try {
                return JSON.parse(stored);
            } catch (error) {
                console.error(`Erreur parsing ${filename}:`, error);
            }
        }
        return defaultData !== null ? defaultData : [];
    }

    // Sauvegarder dans localStorage
    saveData(filename, data) {
        localStorage.setItem(filename, JSON.stringify(data));
    }

    // Générer le nom du fichier de présence
    getPresenceFileName(groupeId, month, year) {
        const groupes = this.loadData('groupes.json', []);
        const groupe = groupes.find(g => g.id == groupeId);
        if (!groupe) return null;
        
        const monthNames = {
            1: '01-janvier', 2: '02-fevrier', 3: '03-mars', 4: '04-avril', 
            5: '05-mai', 6: '06-juin', 7: '07-juillet', 8: '08-aout', 
            9: '09-septembre', 10: '10-octobre', 11: '11-novembre', 12: '12-decembre'
        };
        
        const profName = groupe.professeur.toLowerCase()
            .replace(/[^a-z0-9]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
            
        return `presence-${year}-${monthNames[month]}-groupe${groupe.numero}-${profName}.json`;
    }

    // Gestion des présences
    getPresences(groupeId, month, year) {
        const filename = this.getPresenceFileName(groupeId, month, year);
        if (!filename) return { groupeId, month, year, presences: {} };
        
        return this.loadData(filename, { groupeId, month, year, presences: {} });
    }

    async savePresences(groupeId, month, year, presences) {
        const filename = this.getPresenceFileName(groupeId, month, year);
        if (!filename) return false;
        
        const data = {
            groupeId,
            month,
            year,
            presences,
            lastUpdate: new Date().toISOString()
        };
        
        // Sauvegarder dans localStorage
        this.saveData(filename, data);
        
        // Sauvegarder physiquement
        try {
            await this.saveFile(filename, data);
            return true;
        } catch (error) {
            console.error('Erreur sauvegarde fichier:', error);
            return false;
        }
    }

    // Données de démonstration
    initializeSampleData() {
        let needInitialization = false;

        if (this.loadData('groupes.json', []).length === 0) {
            const sampleGroupes = [
                {
                    id: this.generateId(),
                    numero: 3,
                    matiere: "Mathématiques",
                    professeur: "Monsieur Chaieb",
                    horaires: [
                        { jour: "L", heureDebut: "16:00", heureFin: "18:00" },
                        { jour: "J", heureDebut: "18:00", heureFin: "20:00" }
                    ]
                }
            ];
            this.saveData('groupes.json', sampleGroupes);
            needInitialization = true;
        }

        if (this.loadData('eleves.json', []).length === 0) {
            const groupes = this.loadData('groupes.json', []);
            if (groupes.length > 0) {
                const sampleEleves = [
                    {
                        id: this.generateId(),
                        nom: "Ahmed Benali",
                        groupeId: groupes[0].id,
                        telephone: "0612345678",
                        mensualite: 300
                    },
                    {
                        id: this.generateId(),
                        nom: "Fatima Zohra",
                        groupeId: groupes[0].id,
                        telephone: "0623456789",
                        mensualite: 300
                    }
                ];
                this.saveData('eleves.json', sampleEleves);
            }
        }

        if (this.loadData('paiements.json', []).length === 0) {
            this.saveData('paiements.json', []);
        }

        return needInitialization;
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Export complet des données
    async exportAllData() {
        const data = {
            groupes: this.loadData('groupes.json', []),
            eleves: this.loadData('eleves.json', []),
            paiements: this.loadData('paiements.json', []),
            exportDate: new Date().toISOString(),
            anneeScolaire: this.currentYear
        };
        
        await this.saveFile(`sauvegarde-complete-${this.currentYear}.json`, data);
    }

    // Import complet des données
    async importAllData() {
        try {
            const data = await this.loadFile('sauvegarde-complete.json');
            
            if (data.groupes) this.saveData('groupes.json', data.groupes);
            if (data.eleves) this.saveData('eleves.json', data.eleves);
            if (data.paiements) this.saveData('paiements.json', data.paiements);
            
            return data;
        } catch (error) {
            console.error('Erreur import:', error);
            throw error;
        }
    }

    // Sauvegarder tous les fichiers principaux
    async saveAllData() {
        const data = {
            groupes: this.loadData('groupes.json', []),
            eleves: this.loadData('eleves.json', []),
            paiements: this.loadData('paiements.json', [])
        };

        for (const [key, value] of Object.entries(data)) {
            await this.saveFile(`${key}.json`, value);
        }
    }
}

// Instance globale
const fileManager = new FileManager();
