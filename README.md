# App Présences (minimum portable)

But
- Application minimale pour gérer des présences localement depuis une clé USB.
- Les données sont dans un fichier JSON. Aucun serveur requis.

Comment utiliser
1. Copier tous les fichiers sur votre clé USB.
2. Ouvrir `index.html` dans un navigateur moderne (Chrome/Edge/Firefox).
3. Cliquer sur "Charger JSON" et sélectionner votre fichier JSON (ex. `sample-data.json`).
4. Modifier / ajouter des élèves ou marquer une présence.
5. Cliquer "Sauvegarder JSON" pour télécharger le fichier JSON modifié (enregistrez-le sur la clé).
6. Si besoin, cliquer "Exporter CSV" pour générer un fichier .csv lisible par Excel.
7. Pour réutiliser, charger le JSON sauvegardé la prochaine fois.

Format du fichier JSON
- Array d'objets :
[
  {
    "id": "1",
    "nom": "Dupont",
    "prenom": "Jean",
    "present": false
  }
]

Remarques
- Le navigateur ne peut pas écraser automatiquement un fichier sur la clé sauf via l’API File System Access (limité à certains navigateurs). Ici, on télécharge un nouveau fichier et vous remplacez celui sur la clé manuellement.
- JSON est recommandé pour la conservation des types (booléens), CSV pour ouverture rapide dans des tableurs.
- Licence : MIT
