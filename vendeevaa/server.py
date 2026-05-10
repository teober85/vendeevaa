#!/usr/bin/env python3
"""
Vendée Va'a — Serveur de régie v3
====================================
Régie    → http://localhost:8765
Overlay  → http://localhost:8765/overlay

Dépendance : pip install websockets
"""

import asyncio, copy, json, os, threading, webbrowser, base64, mimetypes
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path
from websockets.server import serve
import websockets

HTTP_PORT  = 8765
WS_PORT    = 8766
HOST       = os.environ.get("HOST", "0.0.0.0")
SCRIPT_DIR = Path(__file__).parent
DATA_DIR   = Path(os.environ.get("DATA_DIR", str(SCRIPT_DIR)))
SAVE_FILE  = DATA_DIR / "data.json"

# ─── État par défaut ──────────────────────────────────
DEFAULT_STATE = {
    "races": {
        "medium":  {"name": "Medium",           "displayName": "Parcours M", "distance": "", "teams": [], "ranking": [], "teamNumbers": {}},
        "large":   {"name": "Large",            "displayName": "Parcours L", "distance": "", "teams": [], "ranking": [], "teamNumbers": {}},
        "selectif":{"name": "Sélectif National","displayName": "Sélectif",  "distance": "", "teams": [], "ranking": [], "teamNumbers": {}, "enabled": False},
    },
    "overlay": {
        "mode":    "hidden",   # hidden|classement|arrivee|bandeau_course|partenaires
        "race":    "medium",
        "team":    "",
        "place":   0,
        "showAll": False,
        "sponsor": "",
    },
    "courseName": "Jeudi",
    "sponsors": [],
    "colors": {
        "primary":    "#2d6ea8",
        "accent":     "#4490c8",
        "background": "#070e1c",
    },
}

# ─── Chargement / sauvegarde ──────────────────────────
def load_state():
    if SAVE_FILE.exists():
        try:
            saved = json.loads(SAVE_FILE.read_text(encoding="utf-8"))
            state = copy.deepcopy(DEFAULT_STATE)

            # Migration depuis le format v2 (teams/ranking à la racine)
            if "teams" in saved and "races" not in saved:
                state["races"]["medium"]["teams"]   = saved.pop("teams", [])
                state["races"]["medium"]["ranking"] = saved.pop("ranking", [])
                saved.pop("compositions", None)

            # Fusionner les données sauvegardées
            for k, v in saved.items():
                if k == "races":
                    for rid, rdata in v.items():
                        if rid in state["races"]:
                            state["races"][rid].update(rdata)
                        else:
                            state["races"][rid] = rdata
                elif k == "overlay":
                    state["overlay"].update(v)
                else:
                    state[k] = v

            print(f"  Données chargées depuis {SAVE_FILE.name}")
            return state
        except Exception as e:
            print(f"  Avertissement : impossible de lire data.json ({e})")
    return copy.deepcopy(DEFAULT_STATE)

def save_state(state):
    try:
        tmp = SAVE_FILE.with_suffix(".tmp")
        tmp.write_text(json.dumps(state, ensure_ascii=False, indent=2), encoding="utf-8")
        tmp.replace(SAVE_FILE)  # atomique sur Linux/Windows
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
            t       = msg.get("type")
            race_id = msg.get("race", "medium")

            # ── Équipes ──────────────────────────────
            if t == "add_team":
                name = msg.get("name", "").strip()
                if race_id in state["races"]:
                    r = state["races"][race_id]
                    if name and name not in r["teams"] and len(r["teams"]) < 60:
                        r["teams"].append(name)
                        await broadcast_state()

            elif t == "remove_team":
                name = msg.get("name", "")
                if race_id in state["races"]:
                    r = state["races"][race_id]
                    r["teams"]   = [x for x in r["teams"]   if x != name]
                    r["ranking"] = [x for x in r["ranking"] if x != name]
                    if state["overlay"].get("race") == race_id and state["overlay"].get("team") == name:
                        state["overlay"]["mode"] = "hidden"
                        state["overlay"]["team"] = ""
                    await broadcast_state()

            elif t == "rename_team":
                old = msg.get("old", "")
                new = msg.get("new", "").strip()
                if race_id in state["races"]:
                    r = state["races"][race_id]
                    if old in r["teams"] and new and new not in r["teams"]:
                        idx = r["teams"].index(old)
                        r["teams"][idx] = new
                        r["ranking"] = [new if x == old else x for x in r["ranking"]]
                        if state["overlay"].get("race") == race_id and state["overlay"].get("team") == old:
                            state["overlay"]["team"] = new
                        await broadcast_state()

            # ── Classement ───────────────────────────
            elif t == "set_ranking":
                if race_id in state["races"]:
                    r = state["races"][race_id]
                    r["ranking"] = [x for x in msg.get("ranking", []) if x in r["teams"]]
                    await broadcast_state()

            elif t == "add_to_ranking":
                name = msg.get("name", "")
                if race_id in state["races"]:
                    r = state["races"][race_id]
                    if name in r["teams"] and name not in r["ranking"]:
                        r["ranking"].append(name)
                        await broadcast_state()

            elif t == "remove_from_ranking":
                name = msg.get("name", "")
                if race_id in state["races"] and name in state["races"][race_id]["ranking"]:
                    state["races"][race_id]["ranking"].remove(name)
                    await broadcast_state()

            elif t == "set_team_number":
                name   = msg.get("name", "")
                number = str(msg.get("number", "")).strip()
                if race_id in state["races"] and name in state["races"][race_id]["teams"]:
                    r = state["races"][race_id]
                    if "teamNumbers" not in r:
                        r["teamNumbers"] = {}
                    r["teamNumbers"][name] = number
                    await broadcast_state()

            # ── Config course ─────────────────────────
            elif t == "set_race_config":
                if race_id in state["races"]:
                    r = state["races"][race_id]
                    if "distance" in msg:
                        r["distance"] = str(msg["distance"])
                    if "displayName" in msg:
                        r["displayName"] = str(msg["displayName"])
                    if "enabled" in msg and race_id == "selectif":
                        r["enabled"] = bool(msg["enabled"])
                    await broadcast_state()

            elif t == "set_course_name":
                state["courseName"] = str(msg.get("courseName", "")).strip()
                await broadcast_state()

            # ── Overlay ──────────────────────────────
            elif t == "show_classement":
                state["overlay"] = {"mode": "classement", "race": race_id, "team": "", "place": 0, "showAll": True, "sponsor": ""}
                await broadcast_state()

            elif t == "show_banner":
                team  = msg.get("team", "")
                place = int(msg.get("place", 0))
                if team and place > 0:
                    state["overlay"] = {"mode": "arrivee", "race": race_id, "team": team, "place": place, "showAll": False, "sponsor": ""}
                    await broadcast_state()

            elif t == "show_bandeau_course":
                team = msg.get("team", "")
                state["overlay"] = {"mode": "bandeau_course", "race": race_id, "team": team, "place": 0, "showAll": False, "sponsor": ""}
                await broadcast_state()

            elif t == "show_sponsor":
                sponsor = msg.get("sponsor", "")
                state["overlay"] = {"mode": "partenaires", "race": "", "team": "", "place": 0, "showAll": False, "sponsor": sponsor}
                await broadcast_state()

            elif t == "hide":
                state["overlay"]["mode"]    = "hidden"
                state["overlay"]["showAll"] = False
                await broadcast_state()

            # ── Sponsors ─────────────────────────────
            elif t == "set_sponsors":
                state["sponsors"] = msg.get("sponsors", [])
                await broadcast_state()

            # ── Couleurs ──────────────────────────────
            elif t == "set_colors":
                colors = msg.get("colors", {})
                for k in ("primary", "accent", "background"):
                    if k in colors:
                        state["colors"][k] = str(colors[k])
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
        """Upload d'image (logo sponsor)"""
        length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(length)
        try:
            payload = json.loads(body)
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
        elif path.endswith('.css') and '/' not in path.lstrip('/'):
            self.serve_file(path.lstrip('/'), "text/css; charset=utf-8")
        else:
            self.send_error(404)

def run_http():
    HTTPServer((HOST, HTTP_PORT), Handler).serve_forever()

# ─── Main ─────────────────────────────────────────────
async def main():
    print("=" * 54)
    print("  Vendée Va'a — Serveur de régie v3")
    print("=" * 54)
    print(f"  Régie    →  http://localhost:{HTTP_PORT}")
    print(f"  Overlay  →  http://localhost:{HTTP_PORT}/overlay")
    print(f"  Données  →  {SAVE_FILE}")
    print("-" * 54)
    print("  Courses  :  Medium · Large · Sélectif National")
    print("  Ctrl+C pour arrêter")
    print("=" * 54 + "\n")

    threading.Thread(target=run_http, daemon=True).start()
    if not os.environ.get("NO_BROWSER"):
        webbrowser.open(f"http://localhost:{HTTP_PORT}")

    async def auto_save():
        while True:
            await asyncio.sleep(30)
            save_state(state)

    async with serve(ws_handler, HOST, WS_PORT):
        asyncio.create_task(auto_save())
        await asyncio.Future()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nServeur arrêté.")
