// Application principale
document.addEventListener('DOMContentLoaded', function() {
    const needInit = fileManager.initializeSampleData();
    if (needInit) {
        showNotification('Données d\'exemple initialisées', 'success');
    }
    
    // Mettre à jour le dashboard seulement si on est sur la page d'accueil
    if (document.getElementById('groupes-count')) {
        updateDashboardStats();
    }
    
    // Ajouter les boutons d'export/import seulement si on est sur la page d'accueil
    if (document.querySelector('header h1') && document.querySelector('header h1').textContent.includes('Centre de Soutien')) {
        addExportImportButtons();
    }
});

function updateDashboardStats() {
    // Vérifier que les éléments existent avant de les manipuler
    const groupesCountElem = document.getElementById('groupes-count');
    const elevesCountElem = document.getElementById('eleves-count');
    const paiementsCountElem = document.getElementById('paiements-count');
    
    if (!groupesCountElem || !elevesCountElem || !paiementsCountElem) {
        return; // Quitter si les éléments n'existent pas
    }
    
    const groupes = fileManager.loadData('groupes.json', []);
    const eleves = fileManager.loadData('eleves.json', []);
    const paiements = fileManager.loadData('paiements.json', []);
    
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
}

function addExportImportButtons() {
    const header = document.querySelector('header');
    if (!header) return;

    // Vérifier si les boutons existent déjà
    if (document.getElementById('export-import-buttons')) return;

    const btnContainer = document.createElement('div');
    btnContainer.id = 'export-import-buttons';
    btnContainer.style.display = 'flex';
    btnContainer.style.gap = '1rem';
    btnContainer.style.marginTop = '1rem';
    btnContainer.style.flexWrap = 'wrap';

    const exportBtn = document.createElement('button');
    exportBtn.textContent = '💾 Exporter Données';
    exportBtn.className = 'btn-secondary';
    exportBtn.onclick = () => {
        fileManager.exportAllData().then(() => {
            showNotification('Données exportées avec succès');
        }).catch(error => {
            showNotification('Erreur lors de l\'export: ' + error.message, 'error');
        });
    };
    
    const importBtn = document.createElement('button');
    importBtn.textContent = '📂 Importer Données';
    importBtn.className = 'btn-secondary';
    importBtn.onclick = () => {
        if (confirm('Voulez-vous importer de nouvelles données ? Les données actuelles seront remplacées.')) {
            fileManager.importAllData().then(() => {
                showNotification('Données importées avec succès - Rechargement...');
                setTimeout(() => location.reload(), 2000);
            }).catch(error => {
                showNotification('Erreur lors de l\'import: ' + error.message, 'error');
            });
        }
    };

    const saveAllBtn = document.createElement('button');
    saveAllBtn.textContent = '💾 Sauvegarder Fichiers';
    saveAllBtn.className = 'btn-secondary';
    saveAllBtn.onclick = () => {
        fileManager.saveAllData().then(() => {
            showNotification('Tous les fichiers sauvegardés avec succès');
        }).catch(error => {
            showNotification('Erreur lors de la sauvegarde: ' + error.message, 'error');
        });
    };

    // NOUVEAU BOUTON : Recharger depuis JSON
    const reloadBtn = document.createElement('button');
    reloadBtn.textContent = '🔄 Recharger JSON';
    reloadBtn.className = 'btn-secondary';
    reloadBtn.onclick = () => {
        if (confirm('Recharger les données depuis les fichiers JSON ? Les modifications non sauvegardées seront perdues.')) {
            fileManager.reloadFromJSON().then(() => {
                showNotification('Données rechargées avec succès - Rechargement...');
                setTimeout(() => location.reload(), 2000);
            }).catch(error => {
                showNotification('Erreur: ' + error.message, 'error');
            });
        }
    };

    btnContainer.appendChild(exportBtn);
    btnContainer.appendChild(importBtn);
    btnContainer.appendChild(saveAllBtn);
    btnContainer.appendChild(reloadBtn);
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
