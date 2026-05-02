# Vendée Va'a — Serveur de régie broadcast

## Fichiers
```
vendee-vaa-server/
├── server.py      ← Serveur Python (HTTP + WebSocket)
├── regie.html     ← Panneau de régie (s'ouvre automatiquement)
├── overlay.html   ← Overlay OBS (ne pas ouvrir directement)
├── LANCER.bat     ← Double-clic pour démarrer sur Windows
└── README.md      ← Ce fichier
```

---

## Démarrage

### Windows (le plus simple)
Double-cliquez sur **LANCER.bat**

La régie s'ouvre automatiquement dans votre navigateur.

### macOS / Linux
```bash
pip install websockets
python3 server.py
```

---

## Configuration OBS / StreamLabs OBS

1. Ajoutez une source **Navigateur (Browser Source)**
2. URL : `http://localhost:8765/overlay`
3. Largeur : **1920** — Hauteur : **1080**
4. Cochez **"Fond transparent"** (ou "Allow transparency")
5. Décochez "Actualiser le navigateur quand la scène devient active" (optionnel)

---

## Utilisation de la régie

### Étape 1 — Ajouter les pirogues
Dans la colonne gauche, tapez le nom de chaque pirogue et cliquez **+**

### Étape 2 — Construire le classement
Sélectionnez une pirogue dans le menu déroulant et cliquez **Ajouter** pour l'intégrer au classement.

**Réordonner** : Glissez-déposez les lignes ou utilisez les flèches ↑↓  
**Retirer** : Cliquez ✕ sur la ligne

### Étape 3 — Diffuser
- **Classement** → Bouton "Diffuser" en mode "Classement" → affiche le tableau centré dans OBS
- **Bandeau arrivée** → Sélectionnez pirogue + place → "Afficher bandeau" → bandeau en bas à gauche dans OBS
- **Masquer** → Retire tout de l'écran OBS

---

## Prérequis
- Python 3.8 ou supérieur
- `pip install websockets`

## Ports utilisés
- **8765** : serveur HTTP (régie + overlay)
- **8766** : WebSocket (communication temps réel)

Si ces ports sont déjà utilisés, modifiez `HTTP_PORT` et `WS_PORT` dans `server.py`
