// Gestion des présences
let currentGroupeId = null;
let currentMonth = null;
let currentYear = null;

document.addEventListener('DOMContentLoaded', function() {
    populateGroupesSelect();
    setCurrentDate();
});

function setCurrentDate() {
    const now = new Date();
    const monthSelect = document.getElementById('month-select');
    const yearSelect = document.getElementById('year-select');
    
    if (monthSelect) monthSelect.value = now.getMonth() + 1;
    if (yearSelect) yearSelect.value = now.getFullYear();
}

function populateGroupesSelect() {
    const select = document.getElementById('groupe-select');
    if (!select) return;
    
    const groupes = fileManager.loadData('groupes.json', []);
    
    select.innerHTML = '<option value="">Sélectionner un groupe</option>';
    groupes.forEach(groupe => {
        const option = document.createElement('option');
        option.value = groupe.id;
        option.textContent = `Groupe ${groupe.numero} - ${groupe.matiere} (${groupe.professeur})`;
        select.appendChild(option);
    });
}

function loadPresenceData() {
    const groupeSelect = document.getElementById('groupe-select');
    const monthSelect = document.getElementById('month-select');
    const yearSelect = document.getElementById('year-select');
    
    if (!groupeSelect || !monthSelect || !yearSelect) return;
    
    currentGroupeId = groupeSelect.value;
    currentMonth = parseInt(monthSelect.value);
    currentYear = parseInt(yearSelect.value);
    
    if (!currentGroupeId) {
        document.getElementById('no-presence-data').style.display = 'block';
        document.getElementById('presence-sheet').style.display = 'none';
        return;
    }
    
    generatePresenceSheet();
}

function generatePresenceSheet() {
    const groupe = fileManager.loadData('groupes.json', []).find(g => g.id === currentGroupeId);
    const eleves = fileManager.loadData('eleves.json', []).filter(e => e.groupeId === currentGroupeId);
    
    if (!groupe || eleves.length === 0) {
        document.getElementById('no-presence-data').style.display = 'block';
        document.getElementById('presence-sheet').style.display = 'none';
        return;
    }
    
    // Charger les présences existantes
    const existingPresences = fileManager.getPresences(currentGroupeId, currentMonth, currentYear);
    
    document.getElementById('no-presence-data').style.display = 'none';
    document.getElementById('presence-sheet').style.display = 'block';
    
    // Mettre à jour le titre
    document.getElementById('presence-title').textContent = 
        `Feuille de présence - ${getMonthName(currentMonth)} ${currentYear} - Groupe ${groupe.numero} - ${groupe.matiere} - ${groupe.professeur}`;
    
    generateDatesHeader();
    generatePresenceRows(eleves, existingPresences);
}

function generateDatesHeader() {
    const headerRow = document.getElementById('presence-dates-header');
    if (!headerRow) return;
    
    headerRow.innerHTML = '<th>Élève</th>';
    
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
    
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(currentYear, currentMonth - 1, day);
        const dayOfWeek = date.getDay();
        const dayNames = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
        
        const th = document.createElement('th');
        th.innerHTML = `
            <div>${day}</div>
            <small>${dayNames[dayOfWeek]}</small>
        `;
        th.title = `${day}/${currentMonth}/${currentYear}`;
        
        // Colorer les weekends
        if (dayOfWeek === 0 || dayOfWeek === 6) {
            th.style.backgroundColor = '#f8f9fa';
        }
        
        headerRow.appendChild(th);
    }
}

function generatePresenceRows(eleves, existingPresences) {
    const tbody = document.getElementById('presence-tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
    
    eleves.forEach(eleve => {
        const row = document.createElement('tr');
        
        // Cellule nom
        const nameCell = document.createElement('td');
        nameCell.textContent = eleve.nom;
        nameCell.style.textAlign = 'left';
        nameCell.style.fontWeight = '500';
        row.appendChild(nameCell);
        
        // Cellules de présence pour chaque jour
        for (let day = 1; day <= daysInMonth; day++) {
            const dateKey = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
            const isPresent = existingPresences?.presences?.[eleve.id]?.[dateKey] || false;
            
            const presenceCell = document.createElement('td');
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'presence-checkbox';
            checkbox.checked = isPresent;
            checkbox.dataset.eleveId = eleve.id;
            checkbox.dataset.date = dateKey;
            
            presenceCell.appendChild(checkbox);
            row.appendChild(presenceCell);
        }
        
        tbody.appendChild(row);
    });
}

function savePresences() {
    if (!currentGroupeId) {
        alert('Veuillez sélectionner un groupe');
        return;
    }
    
    const checkboxes = document.querySelectorAll('.presence-checkbox');
    const presences = {};
    
    checkboxes.forEach(checkbox => {
        const eleveId = checkbox.dataset.eleveId;
        const date = checkbox.dataset.date;
        
        if (!presences[eleveId]) {
            presences[eleveId] = {};
        }
        
        presences[eleveId][date] = checkbox.checked;
    });
    
    fileManager.savePresences(currentGroupeId, currentMonth, currentYear, presences)
        .then(success => {
            if (success) {
                showNotification('Présences enregistrées avec succès');
            } else {
                showNotification('Erreur lors de l\'enregistrement du fichier', 'error');
            }
        })
        .catch(error => {
            showNotification('Erreur: ' + error.message, 'error');
        });
}

// Fonction pour générer un rapport de présence
function generatePresenceReport() {
    if (!currentGroupeId) {
        alert('Veuillez sélectionner un groupe');
        return;
    }
    
    const eleves = fileManager.loadData('eleves.json', []).filter(e => e.groupeId === currentGroupeId);
    const existingPresences = fileManager.getPresences(currentGroupeId, currentMonth, currentYear);
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
    const groupe = fileManager.loadData('groupes.json', []).find(g => g.id === currentGroupeId);
    
    let report = `Rapport de présence - ${getMonthName(currentMonth)} ${currentYear}\n`;
    report += `Groupe ${groupe.numero} - ${groupe.matiere} - ${groupe.professeur}\n\n`;
    
    eleves.forEach(eleve => {
        let presenceCount = 0;
        let totalDays = 0;
        
        for (let day = 1; day <= daysInMonth; day++) {
            const dateKey = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
            const date = new Date(currentYear, currentMonth - 1, day);
            const dayOfWeek = date.getDay();
            
            // Compter seulement les jours de cours (hors weekends)
            if (dayOfWeek !== 0 && dayOfWeek !== 6) {
                totalDays++;
                if (existingPresences?.presences?.[eleve.id]?.[dateKey]) {
                    presenceCount++;
                }
            }
        }
        
        const tauxPresence = totalDays > 0 ? ((presenceCount / totalDays) * 100).toFixed(1) : 0;
        report += `${eleve.nom}: ${presenceCount}/${totalDays} jours (${tauxPresence}%)\n`;
    });
    
    // Afficher le rapport
    alert(report);
} // ← ICI ÉTAIT L'ACCOLADE MANQUANTE

// Fonction utilitaire pour obtenir le nom du mois
function getMonthName(monthNumber) {
    const months = [
        'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
        'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    return months[monthNumber - 1] || 'Mois inconnu';
}
