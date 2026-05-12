# Vendée Va'a — Overlay de régie broadcast

Système d'overlay temps réel pour OBS, gérant trois courses simultanées.

## Démarrage

### Docker (recommandé)
```bash
docker compose up -d
```
Régie → http://localhost:8765

### Windows (sans Docker)
Double-cliquez sur `vendee-vaa-server 3v/LANCER.bat`

### macOS / Linux (sans Docker)
```bash
pip install websockets
python3 "vendee-vaa-server 3v/server.py"
```

---

## Structure
```
vendee-vaa-server 3v/
├── server.py       ← Serveur Python (HTTP + WebSocket)
├── regie.html      ← Panneau de régie
├── overlay.html    ← Source OBS (ne pas ouvrir directement)
├── Dockerfile
└── LANCER.bat      ← Démarrage Windows
data/
└── data.json       ← État persisté (monté en volume Docker)
docker-compose.yml
```

---

## OBS

1. Source **Navigateur** → URL : `http://localhost:8765/overlay`
2. Résolution : **1920 × 1080** — Fond transparent activé

---

## Courses gérées

| Identifiant | Nom              | Activé par défaut |
|-------------|------------------|-------------------|
| `medium`    | Medium           | ✓                 |
| `large`     | Large            | ✓                 |
| `selectif`  | Sélectif National| Non (toggle dans la régie) |

Chaque course a ses propres pirogues, classement et distance.

---

## Ports
- **8765** HTTP (régie + overlay)
- **8766** WebSocket
