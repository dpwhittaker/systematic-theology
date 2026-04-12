"""Combined static + API server for the systematic-theology project.

Serves static files from PROJECT_ROOT and handles /api/* routes for
the storyboard editor. Replaces both `python3 -m http.server 8000`
and the former port-8001 save server.

Endpoints:
  GET  /*                       — static files
  PUT  /api/save                — save file + optional git commit
  GET  /api/list-generations    — list version files for an image or audio stem
  POST /api/regenerate-image    — generate a new slide image via SDXL
  POST /api/regenerate-audio    — generate section audio via ElevenLabs
"""

import http.server
import json
import os
import re
import subprocess
import glob as globmod
from urllib.parse import urlparse, parse_qs

PROJECT_ROOT = "/home/david/projects/systematic-theology"
ALLOWED_PREFIXES = ("storyboards/", "handouts/")
BIND = "127.0.0.1"
PORT = 8000


def json_response(handler, data, status=200):
    body = json.dumps(data).encode()
    handler.send_response(status)
    handler.send_header("Content-Type", "application/json")
    handler.end_headers()
    handler.wfile.write(body)


def error_response(handler, status, msg):
    json_response(handler, {"error": msg}, status)


def read_body(handler):
    length = int(handler.headers.get("Content-Length", 0))
    return handler.rfile.read(length)


def safe_path(path):
    """Validate path is within allowed prefixes and has no traversal."""
    path = path.lstrip("/")
    if ".." in path:
        return None
    if not any(path.startswith(p) for p in ALLOWED_PREFIXES):
        return None
    return os.path.join(PROJECT_ROOT, path)


class Handler(http.server.SimpleHTTPRequestHandler):
    """Extends SimpleHTTPRequestHandler with /api/* routes."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=PROJECT_ROOT, **kwargs)

    # ── Routing ──────────────────────────────────────────────────

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path == "/api/list-generations":
            self._handle_list_generations(parse_qs(parsed.query))
        else:
            super().do_GET()

    def do_PUT(self):
        parsed = urlparse(self.path)
        if parsed.path == "/api/save":
            self._handle_save()
        else:
            self.send_error(405)

    def do_POST(self):
        parsed = urlparse(self.path)
        if parsed.path == "/api/regenerate-image":
            self._handle_regen_image()
        elif parsed.path == "/api/regenerate-audio":
            self._handle_regen_audio()
        else:
            self.send_error(405)

    def do_OPTIONS(self):
        # Not strictly needed for same-origin, but harmless
        self.send_response(200)
        self.end_headers()

    # ── Save + Git Commit ────────────────────────────────────────

    def _handle_save(self):
        try:
            data = json.loads(read_body(self))
        except (json.JSONDecodeError, ValueError):
            return error_response(self, 400, "Invalid JSON")

        path = data.get("path", "")
        content = data.get("content", "")
        do_commit = data.get("commit", False)

        full = safe_path(path)
        if not full:
            return error_response(self, 403, "Forbidden path")

        os.makedirs(os.path.dirname(full), exist_ok=True)
        with open(full, "w", encoding="utf-8") as f:
            f.write(content)

        msg = "Saved"

        if do_commit:
            try:
                subprocess.run(
                    ["git", "add", path],
                    cwd=PROJECT_ROOT, capture_output=True, check=True,
                )
                result = subprocess.run(
                    ["git", "commit", "-m", f"edit: {os.path.basename(path)}"],
                    cwd=PROJECT_ROOT, capture_output=True,
                )
                if result.returncode == 0:
                    msg = "Saved & committed"
                else:
                    stderr = result.stderr.decode().strip()
                    if "nothing to commit" in stderr:
                        msg = "Saved (no changes to commit)"
                    else:
                        msg = f"Saved (commit failed: {stderr[:100]})"
            except Exception as e:
                msg = f"Saved (commit error: {e})"

        json_response(self, {"message": msg})

    # ── List Generations ─────────────────────────────────────────

    def _handle_list_generations(self, params):
        doc_dir = params.get("dir", [""])[0]
        stem = params.get("stem", [""])[0]
        ext = params.get("ext", [""])[0]

        if not stem or not ext:
            return error_response(self, 400, "Missing stem or ext")

        search_dirs = []
        if doc_dir:
            search_dirs.append(os.path.join(PROJECT_ROOT, doc_dir))
            for sub in ("images", "audio"):
                search_dirs.append(os.path.join(PROJECT_ROOT, doc_dir, sub))

        files = []
        for d in search_dirs:
            if not os.path.isdir(d):
                continue
            pattern = os.path.join(d, stem + "*" + ext)
            for f in sorted(globmod.glob(pattern)):
                name = os.path.basename(f)
                if name.startswith(stem):
                    files.append(name)

        def sort_key(name):
            if name == stem + ext:
                return (0, "")
            return (1, name)
        files.sort(key=sort_key)

        json_response(self, {"files": files})

    # ── Regenerate Image ─────────────────────────────────────────

    def _handle_regen_image(self):
        try:
            data = json.loads(read_body(self))
        except (json.JSONDecodeError, ValueError):
            return error_response(self, 400, "Invalid JSON")

        background = data.get("background", "")
        text = data.get("text", "")
        current = data.get("current", "")
        doc_dir = data.get("docDir", "")

        if not background:
            return error_response(self, 400, "Missing background prompt")

        if current:
            base_dir = os.path.join(PROJECT_ROOT, doc_dir, os.path.dirname(current))
            filename = os.path.basename(current)
            stem = re.sub(r'\.v\d+(?=\.[^.]+$)', '', filename)
            name, ext = os.path.splitext(stem)
        else:
            base_dir = os.path.join(PROJECT_ROOT, doc_dir, "images")
            name = "new-slide"
            ext = ".png"

        os.makedirs(base_dir, exist_ok=True)

        existing = globmod.glob(os.path.join(base_dir, name + ".v*" + ext))
        max_ver = 1
        for f in existing:
            m = re.search(r'\.v(\d+)', os.path.basename(f))
            if m:
                max_ver = max(max_ver, int(m.group(1)))
        next_ver = max_ver + 1
        out_filename = f"{name}.v{next_ver:03d}{ext}"
        out_path = os.path.join(base_dir, out_filename)

        script = os.path.join(PROJECT_ROOT, "scripts", "gen_single_slide.py")
        cmd = (
            f'eval "$(grep ^export ~/.bashrc)"; source ~/ml-env/bin/activate && python3 "{script}" '
            f'--bg "{background}" --text "{text}" --out "{out_path}"'
        )

        print(f"[regen-image] Running: {cmd}")
        result = subprocess.run(
            ["bash", "-c", cmd],
            capture_output=True, timeout=60,
        )

        if result.returncode != 0 or not os.path.isfile(out_path):
            err = result.stderr.decode()[:300]
            print(f"[regen-image] Failed: {err}")
            return error_response(self, 500, f"Generation failed: {err}")

        rel_path = os.path.relpath(out_path, os.path.join(PROJECT_ROOT, doc_dir))
        json_response(self, {"path": rel_path})

    # ── Regenerate Audio ─────────────────────────────────────────

    def _handle_regen_audio(self):
        try:
            data = json.loads(read_body(self))
        except (json.JSONDecodeError, ValueError):
            return error_response(self, 400, "Invalid JSON")

        dialogue = data.get("dialogue", [])
        current = data.get("current", "")
        doc_dir = data.get("docDir", "")
        storyboard_path = data.get("storyboardPath", "")
        audio_profile = data.get("audioProfile", "")

        if not dialogue:
            return error_response(self, 400, "No dialogue lines")

        # Determine output format based on TTS engine
        use_gemini = bool(audio_profile)
        default_ext = ".wav" if use_gemini else ".mp3"

        if current:
            base_dir = os.path.join(PROJECT_ROOT, doc_dir, os.path.dirname(current))
            filename = os.path.basename(current)
            stem = re.sub(r'\.v\d+(?=\.[^.]+$)', '', filename)
            name, ext = os.path.splitext(stem)
        else:
            base_dir = os.path.join(PROJECT_ROOT, doc_dir, "audio")
            name = "new-section"
            ext = default_ext

        os.makedirs(base_dir, exist_ok=True)

        existing = globmod.glob(os.path.join(base_dir, name + ".v*" + ext))
        max_ver = 1
        for f in existing:
            m = re.search(r'\.v(\d+)', os.path.basename(f))
            if m:
                max_ver = max(max_ver, int(m.group(1)))
        next_ver = max_ver + 1
        out_filename = f"{name}.v{next_ver:03d}{ext}"
        out_path = os.path.join(base_dir, out_filename)

        if use_gemini:
            # Gemini TTS — voice map gives Gemini voice names, audio profile gives descriptions
            script = os.path.join(PROJECT_ROOT, "scripts", "render_single_section_gemini.py")
            voice_map = self._read_voice_map(storyboard_path)
            # Build speaker config: each speaker gets a voice name + the full audio profile
            speakers = {}
            for spk in voice_map:
                speakers[spk] = {
                    "voice": voice_map[spk],
                    "profile": audio_profile,
                }
            cmd_data = json.dumps({
                "dialogue": dialogue,
                "speakers": speakers,
                "scene": data.get("scene", ""),
                "director": "\n".join(filter(None, [
                    data.get("globalDirector", ""),
                    data.get("sectionDirector", ""),
                ])),
                "output": out_path,
            })
        else:
            # ElevenLabs TTS — use voice map from storyboard comments
            script = os.path.join(PROJECT_ROOT, "scripts", "render_single_section.py")
            voice_map = self._read_voice_map(storyboard_path)
            cmd_data = json.dumps({
                "dialogue": dialogue,
                "voices": voice_map,
                "output": out_path,
            })

        cmd = (
            f'eval "$(grep ^export ~/.bashrc)"; source ~/ml-env/bin/activate && '
            f'python3 "{script}"'
        )

        engine = "Gemini" if use_gemini else "ElevenLabs"
        print(f"[regen-audio] {engine}: {len(dialogue)} lines -> {out_path}")
        result = subprocess.run(
            ["bash", "-c", cmd],
            input=cmd_data.encode(),
            capture_output=True, timeout=300,
        )

        if result.returncode != 0 or not os.path.isfile(out_path):
            err = result.stderr.decode()[:300]
            print(f"[regen-audio] Failed: {err}")
            return error_response(self, 500, f"Generation failed: {err}")

        rel_path = os.path.relpath(out_path, os.path.join(PROJECT_ROOT, doc_dir))
        json_response(self, {"path": rel_path})

    def _read_voice_map(self, storyboard_path):
        full = os.path.join(PROJECT_ROOT, storyboard_path)
        voices = {}
        if os.path.isfile(full):
            with open(full) as f:
                for line in f:
                    m = re.match(r'<!-- voices:\s*(.+?)\s*-->', line)
                    if m:
                        for pair in m.group(1).split(","):
                            pair = pair.strip()
                            if "=" in pair:
                                k, v = pair.split("=", 1)
                                voices[k.strip()] = v.strip()
                        break
        return voices

def log_message(self, format, *args):
        # Quieter logging — skip static file GETs, show API calls
        try:
            msg = str(format) % args if args else str(format)
        except Exception:
            msg = str(args)
        if '/api/' in msg or 'regen' in msg.lower() or 'error' in msg.lower():
            print(f"[server] {msg}")


if __name__ == "__main__":
    server = http.server.HTTPServer((BIND, PORT), Handler)
    print(f"Serving {PROJECT_ROOT} on http://{BIND}:{PORT}")
    print("API routes: /api/save, /api/list-generations, /api/regenerate-image, /api/regenerate-audio")
    server.serve_forever()
