// Gestion des élèves - VERSION CORRECTE
let currentEditingEleveId = null;

document.addEventListener('DOMContentLoaded', function() {
    console.log('📚 Initialisation module élèves');
    loadEleves();
    setupEleveForm();
    populateGroupesSelect();
});

function loadEleves() {
    // ✅ CORRECT : Charger depuis le fichier JSON, pas de données en dur
    const eleves = fileManager.loadData('eleves.json', []);
    const groupes = fileManager.loadData('groupes.json', []);
    const tbody = document.getElementById('eleves-tbody');
    
    if (!tbody) {
        console.error('Tableau élèves non trouvé');
        return;
    }
    
    tbody.innerHTML = '';
    
    console.log(`👨‍🎓 ${eleves.length} élèves chargés depuis le fichier`);
    
    if (eleves.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `<td colspan="6" style="text-align: center; color: #6c757d;">
            Aucun élève inscrit. Cliquez sur "+ Nouvel Élève" pour commencer.
        </td>`;
        tbody.appendChild(row);
        return;
    }
    
    eleves.forEach(eleve => {
        const groupe = groupes.find(g => g.id === eleve.groupeId);
        const groupeText = groupe ? `Groupe ${groupe.numero} - ${groupe.matiere}` : 'Groupe non trouvé';
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${eleve.id.substr(-6)}</td>
            <td>${eleve.nom}</td>
            <td>${groupeText}</td>
            <td>${eleve.telephone || 'N/A'}</td>
            <td>${eleve.mensualite} DH</td>
            <td>
                <button class="btn-secondary" onclick="editEleve('${eleve.id}')">Modifier</button>
                <button class="btn-danger" onclick="deleteEleve('${eleve.id}')">Supprimer</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function setupEleveForm() {
    const form = document.getElementById('eleve-form');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            saveEleve();
        });
    }
}

function populateGroupesSelect(selectedGroupId = '') {
    const select = document.getElementById('eleve-groupe');
    const selectPaiement = document.getElementById('paiement-eleve');
    const selectFilter = document.getElementById('filter-eleve');
    
    const groupes = fileManager.loadData('groupes.json', []);
    
    // Pour le formulaire élève
    if (select) {
        select.innerHTML = '<option value="">Sélectionner un groupe</option>';
        groupes.forEach(groupe => {
            const option = document.createElement('option');
            option.value = groupe.id;
            option.textContent = `Groupe ${groupe.numero} - ${groupe.matiere} (${groupe.professeur})`;
            if (groupe.id === selectedGroupId) {
                option.selected = true;
            }
            select.appendChild(option);
        });
    }
    
    // Pour le formulaire paiement (si existe)
    if (selectPaiement) {
        const eleves = fileManager.loadData('eleves.json', []);
        selectPaiement.innerHTML = '<option value="">Sélectionner un élève</option>';
        eleves.forEach(eleve => {
            const groupe = groupes.find(g => g.id === eleve.groupeId);
            const option = document.createElement('option');
            option.value = eleve.id;
            option.textContent = `${eleve.nom} - Groupe ${groupe ? groupe.numero : 'N/A'}`;
            option.dataset.mensualite = eleve.mensualite;
            selectPaiement.appendChild(option);
        });
    }
    
    // Pour le filtre paiement (si existe)
    if (selectFilter) {
        const eleves = fileManager.loadData('eleves.json', []);
        selectFilter.innerHTML = '<option value="">Tous les élèves</option>';
        eleves.forEach(eleve => {
            const option = document.createElement('option');
            option.value = eleve.id;
            option.textContent = eleve.nom;
            selectFilter.appendChild(option);
        });
    }
}

function openEleveModal(eleveId = null) {
    currentEditingEleveId = eleveId;
    const modal = document.getElementById('eleveModal');
    const title = document.getElementById('modal-eleve-title');
    
    if (eleveId) {
        title.textContent = 'Modifier l\'Élève';
        fillEleveForm(eleveId);
    } else {
        title.textContent = 'Nouvel Élève';
        resetEleveForm();
    }
    
    modal.style.display = 'block';
}

function closeEleveModal() {
    const modal = document.getElementById('eleveModal');
    modal.style.display = 'none';
    currentEditingEleveId = null;
}

function resetEleveForm() {
    const form = document.getElementById('eleve-form');
    if (form) {
        form.reset();
        document.getElementById('eleve-id').value = '';
        populateGroupesSelect();
    }
}

function fillEleveForm(eleveId) {
    const eleves = fileManager.loadData('eleves.json', []);
    const eleve = eleves.find(e => e.id === eleveId);
    
    if (!eleve) return;
    
    document.getElementById('eleve-id').value = eleve.id;
    document.getElementById('eleve-nom').value = eleve.nom;
    document.getElementById('eleve-telephone').value = eleve.telephone || '';
    document.getElementById('eleve-mensualite').value = eleve.mensualite;
    
    populateGroupesSelect(eleve.groupeId);
}

function saveEleve() {
    const eleves = fileManager.loadData('eleves.json', []);
    
    const eleveData = {
        nom: document.getElementById('eleve-nom').value,
        groupeId: document.getElementById('eleve-groupe').value,
        telephone: document.getElementById('eleve-telephone').value,
        mensualite: parseInt(document.getElementById('eleve-mensualite').value)
    };
    
    if (!eleveData.groupeId) {
        alert('Veuillez sélectionner un groupe');
        return;
    }
    
    if (currentEditingEleveId) {
        // Modification
        const index = eleves.findIndex(e => e.id === currentEditingEleveId);
        if (index !== -1) {
            eleves[index] = { ...eleves[index], ...eleveData };
        }
    } else {
        // Nouvel élève
        eleveData.id = fileManager.generateId();
        eleves.push(eleveData);
    }
    
    fileManager.saveData('eleves.json', eleves);
    
    // Sauvegarder physiquement
    fileManager.saveFile('eleves.json', eleves).then(() => {
        showNotification('Élève enregistré avec succès');
    }).catch(error => {
        showNotification('Élève enregistré (erreur fichier: ' + error.message + ')', 'error');
    });
    
    loadEleves();
    populateGroupesSelect(); // Mettre à jour les selects
    closeEleveModal();
}

function editEleve(eleveId) {
    openEleveModal(eleveId);
}

function deleteEleve(eleveId) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet élève ?')) {
        let eleves = fileManager.loadData('eleves.json', []);
        eleves = eleves.filter(e => e.id !== eleveId);
        
        fileManager.saveData('eleves.json', eleves);
        fileManager.saveFile('eleves.json', eleves);
        
        loadEleves();
        populateGroupesSelect(); // Mettre à jour les selects
        showNotification('Élève supprimé avec succès');
    }
}
