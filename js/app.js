// Application principale
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 Démarrage application');
    
    // Vérifier si des données existent
    const groupes = fileManager.loadData('groupes.json', []);
    const eleves = fileManager.loadData('eleves.json', []);
    
    console.log(`📊 Données actuelles: ${groupes.length} groupes, ${eleves.length} élèves`);
    
    // Si pas de données, proposer le chargement
    if (groupes.length === 0 && eleves.length === 0) {
        console.log('📝 Aucune donnée trouvée - Lancement du chargeur');
        
        try {
            const loadResults = await FileLoader.showLoadDialog();
            
            if (loadResults.cancelled) {
                console.log('❌ Chargement annulé - Utilisation des données exemple');
                fileManager.initializeSampleData();
                showNotification('Données d\'exemple chargées', 'info');
            } else if (loadResults.loadedCount > 0) {
                showNotification(`${loadResults.loadedCount} fichiers chargés avec succès`, 'success');
            }
            
        } catch (error) {
            console.error('Erreur chargement:', error);
            fileManager.initializeSampleData();
            showNotification('Données d\'exemple chargées', 'info');
        }
    } else if (eleves.length < 4 && eleves.length > 0) {
        console.log(`⚠️  Données incomplètes: seulement ${eleves.length} élèves`);
    }
    
    updateDashboardStats();
    
    if (document.querySelector('header h1') && document.querySelector('header h1').textContent.includes('Centre de Soutien')) {
        addExportImportButtons();
    }
});

function updateDashboardStats() {
    const groupesCountElem = document.getElementById('groupes-count');
    const elevesCountElem = document.getElementById('eleves-count');
    const paiementsCountElem = document.getElementById('paiements-count');
    
    if (!groupesCountElem || !elevesCountElem || !paiementsCountElem) {
        return;
    }
    
    const groupes = fileManager.loadData('groupes.json', []);
    const eleves = fileManager.loadData('eleves.json', []);
    const paiements = fileManager.loadData('paiements.json', []);
    
    console.log(`📈 Statistiques réelles: ${groupes.length} groupes, ${eleves.length} élèves, ${paiements.length} paiements`);
    
    // Compter les paiements du mois courant
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    
    const paiementsCeMois = paiements.filter(p => 
        p.mois == currentMonth && p.annee == currentYear
    );
    
    // Mettre à jour l'interface
    groupesCountElem.textContent = groupes.length;
    elevesCountElem.textContent = eleves.length;
    paiementsCountElem.textContent = paiementsCeMois.length;
    
    console.log(`🎯 Dashboard mis à jour: ${groupes.length} groupes, ${eleves.length} élèves, ${paiementsCeMois.length} paiements ce mois`);
}

function addExportImportButtons() {
    const header = document.querySelector('header');
    if (!header) return;

    if (document.getElementById('export-import-buttons')) return;

    const btnContainer = document.createElement('div');
    btnContainer.id = 'export-import-buttons';
    btnContainer.style.display = 'flex';
    btnContainer.style.gap = '1rem';
    btnContainer.style.marginTop = '1rem';
    btnContainer.style.flexWrap = 'wrap';

    // BOUTON CHARGEMENT
    const loadBtn = document.createElement('button');
    loadBtn.textContent = '📁 Charger Données';
    loadBtn.className = 'btn-secondary';
    loadBtn.onclick = async () => {
        const results = await FileLoader.showLoadDialog();
        if (results.loadedCount > 0) {
            showNotification('Données chargées - Rechargement...', 'success');
            setTimeout(() => location.reload(), 2000);
        }
    };

    // BOUTON ACTUALISER
    const refreshBtn = document.createElement('button');
    refreshBtn.textContent = '🔄 Actualiser';
    refreshBtn.className = 'btn-secondary';
    refreshBtn.title = 'Forcer le rechargement des données';
    refreshBtn.onclick = () => {
        localStorage.clear();
        showNotification('Cache vidé - Rechargement...');
        setTimeout(() => location.reload(), 1000);
    };

    const exportBtn = document.createElement('button');
    exportBtn.textContent = '💾 Exporter';
    exportBtn.className = 'btn-secondary';
    exportBtn.onclick = () => {
        fileManager.exportAllData().then(() => {
            showNotification('Données exportées avec succès');
        }).catch(error => {
            showNotification('Erreur export: ' + error.message, 'error');
        });
    };
    
    const importBtn = document.createElement('button');
    importBtn.textContent = '📂 Importer';
    importBtn.className = 'btn-secondary';
    importBtn.onclick = () => {
        if (confirm('Importer de nouvelles données ? Les données actuelles seront remplacées.')) {
            fileManager.importAllData().then(() => {
                showNotification('Données importées - Rechargement...');
                setTimeout(() => location.reload(), 2000);
            }).catch(error => {
                showNotification('Erreur import: ' + error.message, 'error');
            });
        }
    };

    btnContainer.appendChild(loadBtn);
    btnContainer.appendChild(refreshBtn);
    btnContainer.appendChild(exportBtn);
    btnContainer.appendChild(importBtn);
    header.appendChild(btnContainer);
}

// Utilitaires
function formatDate(dateString) {
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR');
    } catch (error) {
        return dateString;
    }
}

function getMonthName(monthNumber) {
    const months = [
        'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
        'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    return months[monthNumber - 1] || 'Mois inconnu';
}

function showNotification(message, type = 'success') {
    // Vérifier si on est dans un environnement navigateur
    if (typeof document === 'undefined') return;
    
    // Créer une notification temporaire
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 2rem;
        background: ${type === 'success' ? '#28a745' : '#dc3545'};
        color: white;
        border-radius: 5px;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        font-weight: 500;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 3000);
}
