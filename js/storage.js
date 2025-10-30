class StorageManager {
    constructor() {
        this.currentYear = this.getCurrentSchoolYear();
    }

    getCurrentSchoolYear() {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;
        
        // Si on est après août, l'année scolaire commence cette année
        // Sinon, elle a commencé l'année précédente
        if (month >= 9) {
            return `${year}-${year + 1}`;
        } else {
            return `${year - 1}-${year}`;
        }
    }

    // Groupes
    getGroupes() {
        const data = localStorage.getItem('groupes');
        return data ? JSON.parse(data) : [];
    }

    saveGroupes(groupes) {
        localStorage.setItem('groupes', JSON.stringify(groupes));
    }

    // Élèves
    getEleves() {
        const data = localStorage.getItem('eleves');
        return data ? JSON.parse(data) : [];
    }

    saveEleves(eleves) {
        localStorage.setItem('eleves', JSON.stringify(eleves));
    }

    // Paiements
    getPaiements() {
        const data = localStorage.getItem('paiements');
        return data ? JSON.parse(data) : [];
    }

    savePaiements(paiements) {
        localStorage.setItem('paiements', JSON.stringify(paiements));
    }

    // Présences
    getPresenceFileName(groupeId, month, year) {
        const groupe = this.getGroupes().find(g => g.id == groupeId);
        if (!groupe) return null;
        
        const monthNames = {
            1: 'janvier', 2: 'février', 3: 'mars', 4: 'avril', 5: 'mai', 6: 'juin',
            7: 'juillet', 8: 'août', 9: 'septembre', 10: 'octobre', 11: 'novembre', 12: 'décembre'
        };
        
        return `presence-${year}-${month}-groupe${groupe.numero}-${groupe.professeur.toLowerCase().replace(' ', '-')}.json`;
    }

    getPresences(groupeId, month, year) {
        const fileName = this.getPresenceFileName(groupeId, month, year);
        if (!fileName) return null;
        
        const data = localStorage.getItem(`presence_${fileName}`);
        return data ? JSON.parse(data) : null;
    }

    savePresences(groupeId, month, year, presences) {
        const fileName = this.getPresenceFileName(groupeId, month, year);
        if (!fileName) return false;
        
        const data = {
            groupeId,
            month,
            year,
            presences,
            lastUpdate: new Date().toISOString()
        };
        
        localStorage.setItem(`presence_${fileName}`, JSON.stringify(data));
        return true;
    }

    // Génération d'ID unique
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Données de démonstration
    initializeSampleData() {
        if (this.getGroupes().length === 0) {
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
            this.saveGroupes(sampleGroupes);
        }

        if (this.getEleves().length === 0) {
            const groupes = this.getGroupes();
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
                this.saveEleves(sampleEleves);
            }
        }
    }
}

// Instance globale
const storage = new StorageManager();
