// Gestion des paiements
document.addEventListener('DOMContentLoaded', function() {
    loadPaiements();
    setupPaiementForm();
    populateElevesSelect();
});

function loadPaiements(filterEleveId = '') {
    const paiements = fileManager.loadData('paiements.json', []);
    const eleves = fileManager.loadData('eleves.json', []);
    const tbody = document.getElementById('paiements-tbody');
    
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    let filteredPaiements = paiements;
    if (filterEleveId) {
        filteredPaiements = paiements.filter(p => p.eleveId === filterEleveId);
    }
    
    if (filteredPaiements.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `<td colspan="6" style="text-align: center; color: #6c757d;">Aucun paiement enregistré</td>`;
        tbody.appendChild(row);
        return;
    }
    
    filteredPaiements.forEach(paiement => {
        const eleve = eleves.find(e => e.id === paiement.eleveId);
        const eleveNom = eleve ? eleve.nom : 'N/A';
        
        // Déterminer le statut
        const paiementDate = new Date(paiement.date);
        const today = new Date();
        const echeance = new Date(paiement.annee, paiement.mois - 1, 15); // Échéance le 15 du mois
        
        let statut = 'payé';
        let statutClass = 'status-paid';
        
        if (paiementDate > echeance) {
            statut = 'en retard';
            statutClass = 'status-late';
        } else if (paiement.montant < (eleve?.mensualite || 0)) {
            statut = 'partiel';
            statutClass = 'status-pending';
        }
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${formatDate(paiement.date)}</td>
            <td>${eleveNom}</td>
            <td>${getMonthName(paiement.mois)} ${paiement.annee}</td>
            <td>${paiement.montant} DH</td>
            <td><span class="status-badge ${statutClass}">${statut}</span></td>
            <td>
                <button class="btn-danger" onclick="deletePaiement('${paiement.id}')">Supprimer</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function setupPaiementForm() {
    const form = document.getElementById('paiement-form');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            savePaiement();
        });
        
        // Pré-remplir la date du jour
        document.getElementById('paiement-date').valueAsDate = new Date();
        
        // Mettre à jour le montant quand l'élève change
        document.getElementById('paiement-eleve').addEventListener('change', function() {
            updateMontantSuggest();
        });
    }
}

function populateElevesSelect() {
    const select = document.getElementById('paiement-eleve');
    const selectFilter = document.getElementById('filter-eleve');
    const eleves = fileManager.loadData('eleves.json', []);
    const groupes = fileManager.loadData('groupes.json', []);
    
    // Pour le formulaire paiement
    if (select) {
        select.innerHTML = '<option value="">Sélectionner un élève</option>';
        eleves.forEach(eleve => {
            const groupe = groupes.find(g => g.id === eleve.groupeId);
            const option = document.createElement('option');
            option.value = eleve.id;
            option.textContent = `${eleve.nom} - Groupe ${groupe ? groupe.numero : 'N/A'} (${eleve.mensualite} DH/mois)`;
            option.dataset.mensualite = eleve.mensualite;
            select.appendChild(option);
        });
    }
    
    // Pour le filtre
    if (selectFilter) {
        selectFilter.innerHTML = '<option value="">Tous les élèves</option>';
        eleves.forEach(eleve => {
            const option = document.createElement('option');
            option.value = eleve.id;
            option.textContent = eleve.nom;
            selectFilter.appendChild(option);
        });
        
        selectFilter.addEventListener('change', function() {
            loadPaiements(this.value);
        });
    }
}

function updateMontantSuggest() {
    const eleveSelect = document.getElementById('paiement-eleve');
    const montantInput = document.getElementById('paiement-montant');
    
    if (!eleveSelect || !montantInput) return;
    
    const selectedOption = eleveSelect.options[eleveSelect.selectedIndex];
    
    if (selectedOption && selectedOption.dataset.mensualite) {
        montantInput.placeholder = `Mensualité: ${selectedOption.dataset.mensualite} DH`;
        montantInput.value = selectedOption.dataset.mensualite;
    }
}

function openPaiementModal() {
    const modal = document.getElementById('paiementModal');
    modal.style.display = 'block';
    updateMontantSuggest();
}

function closePaiementModal() {
    const modal = document.getElementById('paiementModal');
    modal.style.display = 'none';
    const form = document.getElementById('paiement-form');
    if (form) {
        form.reset();
        document.getElementById('paiement-date').valueAsDate = new Date();
    }
}

function savePaiement() {
    const paiements = fileManager.loadData('paiements.json', []);
    const eleves = fileManager.loadData('eleves.json', []);
    
    const eleveId = document.getElementById('paiement-eleve').value;
    const eleve = eleves.find(e => e.id === eleveId);
    
    if (!eleve) {
        alert('Veuillez sélectionner un élève');
        return;
    }
    
    const paiementData = {
        id: fileManager.generateId(),
        eleveId: eleveId,
        mois: parseInt(document.getElementById('paiement-mois').value),
        annee: parseInt(document.getElementById('paiement-annee').value),
        montant: parseInt(document.getElementById('paiement-montant').value),
        date: document.getElementById('paiement-date').value
    };
    
    // Vérifier si un paiement existe déjà pour ce mois
    const existingPaiement = paiements.find(p => 
        p.eleveId === eleveId && 
        p.mois === paiementData.mois && 
        p.annee === paiementData.annee
    );
    
    if (existingPaiement && !confirm('Un paiement existe déjà pour ce mois. Voulez-vous le remplacer ?')) {
        return;
    }
    
    // Supprimer l'ancien paiement s'il existe
    const filteredPaiements = paiements.filter(p => 
        !(p.eleveId === eleveId && p.mois === paiementData.mois && p.annee === paiementData.annee)
    );
    
    filteredPaiements.push(paiementData);
    
    fileManager.saveData('paiements.json', filteredPaiements);
    
    // Sauvegarder physiquement
    fileManager.saveFile('paiements.json', filteredPaiements).then(() => {
        showNotification('Paiement enregistré avec succès');
    }).catch(error => {
        showNotification('Paiement enregistré (erreur fichier: ' + error.message + ')', 'error');
    });
    
    loadPaiements();
    closePaiementModal();
}

function deletePaiement(paiementId) {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce paiement ?')) {
        let paiements = fileManager.loadData('paiements.json', []);
        paiements = paiements.filter(p => p.id !== paiementId);
        
        fileManager.saveData('paiements.json', paiements);
        fileManager.saveFile('paiements.json', paiements);
        
        loadPaiements();
        showNotification('Paiement supprimé avec succès');
    }
}

// Fonction pour générer un rapport des impayés
function generateImpayesReport() {
    const eleves = fileManager.loadData('eleves.json', []);
    const paiements = fileManager.loadData('paiements.json', []);
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    
    let report = 'Rapport des impayés - ' + new Date().toLocaleDateString('fr-FR') + '\n\n';
    let hasImpayes = false;
    let totalImpayes = 0;
    
    eleves.forEach(eleve => {
        let eleveImpayes = '';
        let eleveTotal = 0;
        
        // Vérifier les paiements des 3 derniers mois
        for (let i = 0; i < 3; i++) {
            const targetMonth = currentMonth - i <= 0 ? 12 + (currentMonth - i) : currentMonth - i;
            const targetYear = currentMonth - i <= 0 ? currentYear - 1 : currentYear;
            
            const paiement = paiements.find(p => 
                p.eleveId === eleve.id && 
                p.mois === targetMonth && 
                p.annee === targetYear
            );
            
            if (!paiement || paiement.montant < eleve.mensualite) {
                hasImpayes = true;
                const moisManquant = getMonthName(targetMonth);
                const manquant = paiement ? eleve.mensualite - paiement.montant : eleve.mensualite;
                eleveImpayes += `  - ${moisManquant} ${targetYear}: ${manquant} DH\n`;
                eleveTotal += manquant;
            }
        }
        
        if (eleveImpayes) {
            report += `${eleve.nom}:\n${eleveImpayes}  Total: ${eleveTotal} DH\n\n`;
            totalImpayes += eleveTotal;
        }
    });
    
    if (!hasImpayes) {
        report += '✅ Aucun impayé détecté pour les 3 derniers mois.';
    } else {
        report += `💰 TOTAL IMPAYÉS: ${totalImpayes} DH`;
    }
    
    alert(report);
}
