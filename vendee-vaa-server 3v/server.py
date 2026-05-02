#!/usr/bin/env python3
"""
Vendée Va'a — Serveur de régie v2
====================================
Régie    → http://localhost:8765
Overlay  → http://localhost:8765/overlay

Dépendance : pip install websockets
"""

import asyncio, json, threading, webbrowser, base64, mimetypes
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path
from websockets.server import serve
import websockets

HTTP_PORT = 8765
WS_PORT   = 8766
HOST      = "localhost"
SCRIPT_DIR = Path(__file__).parent
SAVE_FILE  = SCRIPT_DIR / "data.json"

# ─── État par défaut ──────────────────────────────────
DEFAULT_STATE = {
    "teams":    [],   # [str] noms des pirogues inscrites
    "ranking":  [],   # [str] noms ordonnés (index 0 = 1re place)
    "overlay": {
        "mode":    "hidden",   # hidden|classement|arrivee|bandeau_course|equipe|partenaires
        "team":    "",
        "place":   0,
        "showAll": False,
        "sponsor": "",         # nom du partenaire actif (optionnel)
    },
    # Compositions : { "NomEquipe": [{ nom, prenom, age, pays, photo_b64 }, ...] }
    "compositions": {},
    # Partenaires : [{ nom, logo_b64, description }]
    "sponsors": [],
}

# ─── Chargement / sauvegarde ──────────────────────────
def load_state():
    if SAVE_FILE.exists():
        try:
            saved = json.loads(SAVE_FILE.read_text(encoding="utf-8"))
            state = dict(DEFAULT_STATE)
            state.update(saved)
            # S'assurer que les clés manquantes sont présentes
            for k, v in DEFAULT_STATE.items():
                if k not in state:
                    state[k] = v
            ov = dict(DEFAULT_STATE["overlay"])
            ov.update(state.get("overlay", {}))
            state["overlay"] = ov
            print(f"  Données chargées depuis {SAVE_FILE.name}")
            return state
        except Exception as e:
            print(f"  Avertissement : impossible de lire data.json ({e})")
    return dict(DEFAULT_STATE)

def save_state(state):
    try:
        SAVE_FILE.write_text(json.dumps(state, ensure_ascii=False, indent=2), encoding="utf-8")
    except Exception as e:
        print(f"  Erreur sauvegarde : {e}")

state = load_state()
ws_clients: set = set()

# ─── Broadcast ────────────────────────────────────────
async def broadcast(data: dict):
    msg = json.dumps(data)
    dead = set()
    for ws in ws_clients.copy():
        try:
            await ws.send(msg)
        except Exception:
            dead.add(ws)
    ws_clients.difference_update(dead)

async def broadcast_state():
    await broadcast({"type": "full_state", **state})
    save_state(state)

# ─── WebSocket handler ────────────────────────────────
async def ws_handler(websocket):
    ws_clients.add(websocket)
    await websocket.send(json.dumps({"type": "full_state", **state}))
    try:
        async for raw in websocket:
            try:
                msg = json.loads(raw)
            except json.JSONDecodeError:
                continue
            t = msg.get("type")

            # ── Équipes ──────────────────────────────
            if t == "add_team":
                name = msg.get("name", "").strip()
                if name and name not in state["teams"] and len(state["teams"]) < 60:
                    state["teams"].append(name)
                    if name not in state["compositions"]:
                        state["compositions"][name] = []
                    await broadcast_state()

            elif t == "remove_team":
                name = msg.get("name", "")
                state["teams"] = [x for x in state["teams"] if x != name]
                state["ranking"] = [x for x in state["ranking"] if x != name]
                state["compositions"].pop(name, None)
                if state["overlay"].get("team") == name:
                    state["overlay"]["mode"] = "hidden"
                    state["overlay"]["team"] = ""
                await broadcast_state()

            elif t == "rename_team":
                old = msg.get("old", "")
                new = msg.get("new", "").strip()
                if old in state["teams"] and new and new not in state["teams"]:
                    idx = state["teams"].index(old)
                    state["teams"][idx] = new
                    state["ranking"] = [new if x == old else x for x in state["ranking"]]
                    comp = state["compositions"].pop(old, [])
                    state["compositions"][new] = comp
                    if state["overlay"].get("team") == old:
                        state["overlay"]["team"] = new
                    await broadcast_state()

            # ── Classement ───────────────────────────
            elif t == "set_ranking":
                new_r = msg.get("ranking", [])
                state["ranking"] = [r for r in new_r if r in state["teams"]]
                await broadcast_state()

            elif t == "add_to_ranking":
                name = msg.get("name", "")
                if name in state["teams"] and name not in state["ranking"]:
                    state["ranking"].append(name)
                    await broadcast_state()

            elif t == "remove_from_ranking":
                name = msg.get("name", "")
                if name in state["ranking"]:
                    state["ranking"].remove(name)
                    await broadcast_state()

            # ── Overlay ──────────────────────────────
            elif t == "show_classement":
                state["overlay"] = {"mode": "classement", "team": "", "place": 0, "showAll": True, "sponsor": ""}
                await broadcast_state()

            elif t == "show_banner":
                team  = msg.get("team", "")
                place = int(msg.get("place", 0))
                if team and place > 0:
                    state["overlay"] = {"mode": "arrivee", "team": team, "place": place, "showAll": False, "sponsor": ""}
                    await broadcast_state()

            elif t == "show_bandeau_course":
                team = msg.get("team", "")
                state["overlay"] = {"mode": "bandeau_course", "team": team, "place": 0, "showAll": False, "sponsor": ""}
                await broadcast_state()

            elif t == "show_equipe":
                team = msg.get("team", "")
                state["overlay"] = {"mode": "equipe", "team": team, "place": 0, "showAll": False, "sponsor": ""}
                await broadcast_state()

            elif t == "show_sponsor":
                sponsor = msg.get("sponsor", "")
                state["overlay"] = {"mode": "partenaires", "team": "", "place": 0, "showAll": False, "sponsor": sponsor}
                await broadcast_state()

            elif t == "hide":
                state["overlay"]["mode"] = "hidden"
                state["overlay"]["showAll"] = False
                await broadcast_state()

            # ── Compositions ─────────────────────────
            elif t == "set_composition":
                team = msg.get("team", "")
                members = msg.get("members", [])
                if team in state["teams"]:
                    state["compositions"][team] = members
                    await broadcast_state()

            # ── Sponsors ─────────────────────────────
            elif t == "set_sponsors":
                state["sponsors"] = msg.get("sponsors", [])
                await broadcast_state()

            # ── Sauvegarde manuelle ───────────────────
            elif t == "save":
                save_state(state)
                await websocket.send(json.dumps({"type": "saved"}))

    except websockets.exceptions.ConnectionClosed:
        pass
    finally:
        ws_clients.discard(websocket)

# ─── HTTP handler ─────────────────────────────────────
class Handler(BaseHTTPRequestHandler):
    def log_message(self, *a): pass

    def serve_file(self, filename, ctype="text/html; charset=utf-8"):
        path = SCRIPT_DIR / filename
        if not path.exists():
            self.send_error(404, f"Introuvable : {filename}"); return
        data = path.read_bytes()
        self.send_response(200)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", len(data))
        self.send_header("Cache-Control", "no-cache")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(data)

    def serve_json(self, obj):
        data = json.dumps(obj, ensure_ascii=False).encode()
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", len(data))
        self.send_header("Cache-Control", "no-cache")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(data)

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_POST(self):
        """Upload d'image (photo membre ou logo sponsor)"""
        length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(length)
        try:
            payload = json.loads(body)
            # payload: { context: "member"|"sponsor", filename: str, data: base64str }
            result = {"ok": True, "data": payload.get("data", "")}
            self.serve_json(result)
        except Exception as e:
            self.serve_json({"ok": False, "error": str(e)})

    def do_GET(self):
        path = self.path.split("?")[0].rstrip("/")
        if path in ("", "/regie"):
            self.serve_file("regie.html")
        elif path == "/overlay":
            self.serve_file("overlay.html")
        else:
            self.send_error(404)

def run_http():
    HTTPServer((HOST, HTTP_PORT), Handler).serve_forever()

# ─── Main ─────────────────────────────────────────────
async def main():
    print("=" * 54)
    print("  Vendée Va'a — Serveur de régie v2")
    print("=" * 54)
    print(f"  Régie    →  http://{HOST}:{HTTP_PORT}")
    print(f"  Overlay  →  http://{HOST}:{HTTP_PORT}/overlay")
    print(f"  Données  →  {SAVE_FILE}")
    print("-" * 54)
    print("  Ctrl+C pour arrêter")
    print("=" * 54 + "\n")

    threading.Thread(target=run_http, daemon=True).start()
    webbrowser.open(f"http://{HOST}:{HTTP_PORT}")

    async with serve(ws_handler, HOST, WS_PORT):
        await asyncio.Future()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nServeur arrêté.")
