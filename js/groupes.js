// Gestion des groupes
let currentEditingGroupId = null;

document.addEventListener('DOMContentLoaded', function() {
    loadGroupes();
    setupGroupForm();
});

function loadGroupes() {
    const groupes = fileManager.loadData('groupes.json', []);
    const tbody = document.getElementById('groupes-tbody');
    
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (groupes.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `<td colspan="6" style="text-align: center; color: #6c757d;">Aucun groupe créé</td>`;
        tbody.appendChild(row);
        return;
    }
    
    groupes.forEach(groupe => {
        const eleves = fileManager.loadData('eleves.json', []).filter(e => e.groupeId === groupe.id);
        const horairesText = groupe.horaires.map(h => 
            `${h.jour} ${h.heureDebut}-${h.heureFin}`
        ).join(', ');
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${groupe.numero}</td>
            <td>${groupe.matiere}</td>
            <td>${groupe.professeur}</td>
            <td>${horairesText}</td>
            <td>${eleves.length} élève(s)</td>
            <td>
                <button class="btn-secondary" onclick="editGroup('${groupe.id}')">Modifier</button>
                <button class="btn-danger" onclick="deleteGroup('${groupe.id}')">Supprimer</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function setupGroupForm() {
    const form = document.getElementById('group-form');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            saveGroup();
        });
    }
}

function openGroupModal(groupId = null) {
    currentEditingGroupId = groupId;
    const modal = document.getElementById('groupModal');
    const title = document.getElementById('modal-group-title');
    
    if (groupId) {
        title.textContent = 'Modifier le Groupe';
        fillGroupForm(groupId);
    } else {
        title.textContent = 'Nouveau Groupe';
        resetGroupForm();
    }
    
    modal.style.display = 'block';
}

function closeGroupModal() {
    const modal = document.getElementById('groupModal');
    modal.style.display = 'none';
    currentEditingGroupId = null;
}

function resetGroupForm() {
    const form = document.getElementById('group-form');
    if (form) {
        form.reset();
        document.getElementById('group-id').value = '';
        document.getElementById('horaires-container').innerHTML = '';
        addHoraire(); // Ajouter un horaire par défaut
    }
}

function fillGroupForm(groupId) {
    const groupes = fileManager.loadData('groupes.json', []);
    const groupe = groupes.find(g => g.id === groupId);
    
    if (!groupe) return;
    
    document.getElementById('group-id').value = groupe.id;
    document.getElementById('group-numero').value = groupe.numero;
    document.getElementById('group-matiere').value = groupe.matiere;
    document.getElementById('group-professeur').value = groupe.professeur;
    
    // Remplir les horaires
    const container = document.getElementById('horaires-container');
    container.innerHTML = '';
    
    groupe.horaires.forEach((horaire, index) => {
        addHoraire(horaire.jour, horaire.heureDebut, horaire.heureFin);
    });
}

function addHoraire(jour = 'L', heureDebut = '16:00', heureFin = '18:00') {
    const container = document.getElementById('horaires-container');
    if (!container) return;
    
    const horaireDiv = document.createElement('div');
    horaireDiv.className = 'horaire-item';
    horaireDiv.innerHTML = `
        <select class="horaire-jour">
            <option value="L" ${jour === 'L' ? 'selected' : ''}>Lundi</option>
            <option value="M" ${jour === 'M' ? 'selected' : ''}>Mardi</option>
            <option value="W" ${jour === 'W' ? 'selected' : ''}>Mercredi</option>
            <option value="J" ${jour === 'J' ? 'selected' : ''}>Jeudi</option>
            <option value="V" ${jour === 'V' ? 'selected' : ''}>Vendredi</option>
            <option value="S" ${jour === 'S' ? 'selected' : ''}>Samedi</option>
            <option value="D" ${jour === 'D' ? 'selected' : ''}>Dimanche</option>
        </select>
        <input type="time" class="horaire-debut" value="${heureDebut}">
        <span>à</span>
        <input type="time" class="horaire-fin" value="${heureFin}">
        <button type="button" class="remove-horaire" onclick="this.parentElement.remove()">×</button>
    `;
    
    container.appendChild(horaireDiv);
}

function saveGroup() {
    const groupes = fileManager.loadData('groupes.json', []);
    
    const horaires = [];
    const horaireItems = document.querySelectorAll('.horaire-item');
    
    horaireItems.forEach(item => {
        const jour = item.querySelector('.horaire-jour').value;
        const heureDebut = item.querySelector('.horaire-debut').value;
        const heureFin = item.querySelector('.horaire-fin').value;
        
        if (jour && heureDebut && heureFin) {
            horaires.push({ jour, heureDebut, heureFin });
        }
    });
    
    if (horaires.length === 0) {
        alert('Veuillez ajouter au moins un horaire');
        return;
    }
    
    const groupData = {
        numero: parseInt(document.getElementById('group-numero').value),
        matiere: document.getElementById('group-matiere').value,
        professeur: document.getElementById('group-professeur').value,
        horaires: horaires
    };
    
    if (currentEditingGroupId) {
        // Modification
        const index = groupes.findIndex(g => g.id === currentEditingGroupId);
        if (index !== -1) {
            groupes[index] = { ...groupes[index], ...groupData };
        }
    } else {
        // Nouveau groupe
        groupData.id = fileManager.generateId();
        groupes.push(groupData);
    }
    
    fileManager.saveData('groupes.json', groupes);
    
    // Sauvegarder physiquement
    fileManager.saveFile('groupes.json', groupes).then(() => {
        showNotification('Groupe enregistré avec succès');
    }).catch(error => {
        showNotification('Groupe enregistré (erreur fichier: ' + error.message + ')', 'error');
    });
    
    loadGroupes();
    closeGroupModal();
}

function editGroup(groupId) {
    openGroupModal(groupId);
}

function deleteGroup(groupId) {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce groupe ? Les élèves associés seront orphelins.')) {
        let groupes = fileManager.loadData('groupes.json', []);
        groupes = groupes.filter(g => g.id !== groupId);
        
        fileManager.saveData('groupes.json', groupes);
        fileManager.saveFile('groupes.json', groupes);
        
        loadGroupes();
        showNotification('Groupe supprimé avec succès');
    }
}
