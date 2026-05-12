# Vendée Va'a — Serveur de régie v3

## Panneau de régie

### Classement
Trois sous-onglets : **Medium**, **Large**, **Sélectif**.

Pour chaque course :
- Renseigner la **distance** (champ en haut, Entrée ou OK)
- Ajouter/retirer des pirogues
- Construire le classement (glisser-déposer ou flèches ↑↓)
- Diffuser sur OBS via la colonne droite

Le **Sélectif National** dispose d'un bouton Activer/Désactiver — il n'apparaît dans aucun écran tant qu'il est désactivé.

### En course
Liste toutes les pirogues des courses actives, groupées par course. Cliquez pour sélectionner, puis diffusez le bandeau pleine largeur.

### Partenaires
Ajoutez logos et descriptions, diffusez en carte centrée.

---

## Diffusion OBS

| Action | Résultat à l'écran |
|--------|--------------------|
| Envoyer le classement | Tableau centré avec le nom de la course |
| Bandeau arrivée | Bandeau bas-gauche avec place + pirogue |
| Bandeau en course | Bandeau pleine largeur bas |
| Partenaire | Carte centrée logo + description |
| Masquer | Efface tout |

---

## Démarrage

**Docker** (depuis la racine du projet) :
```bash
docker compose up -d
```

**Local** :
```bash
pip install websockets
python3 server.py
```

---

## Ports
- **8765** HTTP
- **8766** WebSocket

## Données
`data.json` est créé automatiquement au premier lancement (dans le dossier `data/` en Docker, à côté de `server.py` en local).
