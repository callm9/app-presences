// Chargeur de fichiers physiques
class FileLoader {
    // Charger un fichier JSON depuis le disque
    static async loadJSONFile(filename) {
        return new Promise((resolve, reject) => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            input.style.display = 'none';
            
            // Stocker la résolution pour l'utiliser dans l'event
            let resolveCallback = resolve;
            let rejectCallback = reject;
            
            const handleFileSelect = (e) => {
                const file = e.target.files[0];
                if (!file) {
                    rejectCallback(new Error('Aucun fichier sélectionné'));
                    return;
                }
                
                // Vérifier que c'est le bon fichier
                if (!file.name.includes(filename.replace('.json', ''))) {
                    console.warn(`⚠️  Attention: Vous avez sélectionné "${file.name}" au lieu de "${filename}"`);
                }
                
                const reader = new FileReader();
                reader.onload = (event) => {
                    try {
                        const data = JSON.parse(event.target.result);
                        console.log(`✅ ${filename} chargé:`, data.length, 'éléments');
                        resolveCallback(data);
                    } catch (error) {
                        rejectCallback(new Error('Fichier JSON invalide: ' + error.message));
                    }
                };
                reader.onerror = () => rejectCallback(new Error('Erreur de lecture du fichier'));
                reader.readAsText(file);
            };
            
            input.addEventListener('change', handleFileSelect, { once: true });
            
            // Annulation (fermeture de la boîte de dialogue)
            const handleCancel = () => {
                setTimeout(() => {
                    if (!input.files || input.files.length === 0) {
                        rejectCallback(new Error('Chargement annulé'));
                    }
                }, 1000);
            };
            
            window.addEventListener('focus', handleCancel, { once: true });
            
            document.body.appendChild(input);
            input.click();
            setTimeout(() => document.body.removeChild(input), 1000);
        });
    }
    
    // Charger un fichier spécifique avec gestion d'erreur
    static async loadSpecificFile(filename, description) {
        try {
            console.log(`📥 Chargement de ${filename}...`);
            const data = await this.loadJSONFile(filename);
            return { success: true, data, filename };
        } catch (error) {
            console.log(`❌ ${filename} non chargé:`, error.message);
            return { success: false, error: error.message, filename };
        }
    }
    
    // Charger tous les fichiers nécessaires
    static async loadAllFiles() {
        const filesToLoad = [
            { filename: 'groupes.json', description: 'groupes' },
            { filename: 'eleves.json', description: 'élèves' },
            { filename: 'paiements.json', description: 'paiements' }
        ];
        
        const results = {
            groupes: null,
            eleves: null,
            paiements: null,
            loadedCount: 0,
            totalFiles: filesToLoad.length
        };
        
        console.log('📁 Début du chargement des fichiers...');
        
        for (const fileInfo of filesToLoad) {
            const result = await this.loadSpecificFile(fileInfo.filename, fileInfo.description);
            
            if (result.success) {
                results[fileInfo.description] = result.data;
                results.loadedCount++;
                
                // Sauvegarder dans le fileManager
                fileManager.saveData(fileInfo.filename, result.data);
            }
        }
        
        console.log(`✅ Chargement terminé: ${results.loadedCount}/${results.totalFiles} fichiers chargés`);
        return results;
    }
    
    // Charger seulement les fichiers manquants
    static async loadMissingFiles() {
        console.log('🔍 Vérification des fichiers manquants...');
        
        const filesToCheck = [
            { filename: 'groupes.json', description: 'groupes' },
            { filename: 'eleves.json', description: 'élèves' },
            { filename: 'paiements.json', description: 'paiements' }
        ];
        
        const missingFiles = [];
        
        for (const fileInfo of filesToCheck) {
            const existingData = fileManager.loadData(fileInfo.filename, []);
            if (existingData.length === 0) {
                missingFiles.push(fileInfo);
                console.log(`⚠️  ${fileInfo.filename}: Données manquantes`);
            } else {
                console.log(`✅ ${fileInfo.filename}: ${existingData.length} éléments`);
            }
        }
        
        if (missingFiles.length > 0) {
            console.log(`📥 ${missingFiles.length} fichiers à charger...`);
            return await this.loadAllFiles();
        } else {
            console.log('✅ Tous les fichiers sont déjà chargés');
            return { loadedCount: 0, totalFiles: 0, allLoaded: true };
        }
    }
    
    // Interface utilisateur pour le chargement
    static async showLoadDialog() {
        return new Promise((resolve) => {
            const dialog = document.createElement('div');
            dialog.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.8);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 10000;
            `;
            
            const content = document.createElement('div');
            content.style.cssText = `
                background: white;
                padding: 2rem;
                border-radius: 10px;
                text-align: center;
                max-width: 500px;
                width: 90%;
            `;
            
            content.innerHTML = `
                <h2>📁 Chargement des Données</h2>
                <p>Veuillez charger vos fichiers de données :</p>
                <div style="text-align: left; margin: 1rem 0;">
                    <div style="margin: 0.5rem 0;">
                        <input type="checkbox" id="load-groupes" checked>
                        <label for="load-groupes">📚 groupes.json (groupes et horaires)</label>
                    </div>
                    <div style="margin: 0.5rem 0;">
                        <input type="checkbox" id="load-eleves" checked>
                        <label for="load-eleves">👨‍🎓 eleves.json (liste des élèves)</label>
                    </div>
                    <div style="margin: 0.5rem 0;">
                        <input type="checkbox" id="load-paiements">
                        <label for="load-paiements">💳 paiements.json (historique des paiements)</label>
                    </div>
                </div>
                <p><small>Les fichiers doivent être au format JSON</small></p>
                <div style="margin-top: 1.5rem;">
                    <button id="start-load" style="padding: 0.75rem 1.5rem; background: #28a745; color: white; border: none; border-radius: 5px; cursor: pointer; margin-right: 1rem;">
                        🚀 Commencer le chargement
                    </button>
                    <button id="cancel-load" style="padding: 0.75rem 1.5rem; background: #6c757d; color: white; border: none; border-radius: 5px; cursor: pointer;">
                        ❌ Annuler
                    </button>
                </div>
            `;
            
            dialog.appendChild(content);
            document.body.appendChild(dialog);
            
            document.getElementById('start-load').onclick = async () => {
                const results = await FileLoader.loadAllFiles();
                document.body.removeChild(dialog);
                resolve(results);
            };
            
            document.getElementById('cancel-load').onclick = () => {
                document.body.removeChild(dialog);
                resolve({ loadedCount: 0, cancelled: true });
            };
        });
    }
}
