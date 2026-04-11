"""Storyboard editing server — save, git commit, list generations, regenerate media.

Runs on port 8001 alongside the main static server on 8000.
Endpoints:
  PUT  /save                — save file + optional git commit
  GET  /list-generations    — list version files for an image or audio stem
  POST /regenerate-image    — generate a new slide image via SDXL
  POST /regenerate-audio    — generate section audio via ElevenLabs
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


def cors_headers(handler):
    handler.send_header("Access-Control-Allow-Origin", "*")
    handler.send_header("Access-Control-Allow-Methods", "GET, PUT, POST, OPTIONS")
    handler.send_header("Access-Control-Allow-Headers", "Content-Type")


def json_response(handler, data, status=200):
    body = json.dumps(data).encode()
    handler.send_response(status)
    handler.send_header("Content-Type", "application/json")
    cors_headers(handler)
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
    full = os.path.join(PROJECT_ROOT, path)
    return full


class Handler(http.server.BaseHTTPRequestHandler):

    def do_OPTIONS(self):
        self.send_response(200)
        cors_headers(self)
        self.end_headers()

    def do_PUT(self):
        parsed = urlparse(self.path)

        if parsed.path == "/save":
            self._handle_save()
        else:
            error_response(self, 404, "Not found")

    def do_GET(self):
        parsed = urlparse(self.path)

        if parsed.path == "/list-generations":
            self._handle_list_generations(parse_qs(parsed.query))
        else:
            error_response(self, 404, "Not found")

    def do_POST(self):
        parsed = urlparse(self.path)

        if parsed.path == "/regenerate-image":
            self._handle_regen_image()
        elif parsed.path == "/regenerate-audio":
            self._handle_regen_audio()
        else:
            error_response(self, 404, "Not found")

    # ── Save + Git Commit ────────────────────────────────────────

    def _handle_save(self):
        try:
            data = json.loads(read_body(self))
        except (json.JSONDecodeError, ValueError):
            error_response(self, 400, "Invalid JSON")
            return

        path = data.get("path", "")
        content = data.get("content", "")
        do_commit = data.get("commit", False)

        full = safe_path(path)
        if not full:
            error_response(self, 403, "Forbidden path")
            return

        # Write file
        os.makedirs(os.path.dirname(full), exist_ok=True)
        with open(full, "w", encoding="utf-8") as f:
            f.write(content)

        msg = "Saved"

        # Git commit
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
        """List files matching stem*.ext in directory.

        Query params: dir (e.g. storyboards/), stem (e.g. pod-intro), ext (e.g. .png)
        Returns: {"files": ["pod-intro.png", "pod-intro.v002.png", ...]}
        """
        doc_dir = params.get("dir", [""])[0]
        stem = params.get("stem", [""])[0]
        ext = params.get("ext", [""])[0]

        if not stem or not ext:
            error_response(self, 400, "Missing stem or ext")
            return

        # Determine the directory to search
        # The stem might include a subdirectory (e.g., "images/pod-intro"), but we
        # receive just the filename stem. The doc_dir tells us the storyboard dir.
        # We need to find the actual directory. Let's search relative to project root
        # using the doc_dir + directory of the files.

        # Try common locations
        search_dirs = []
        if doc_dir:
            search_dirs.append(os.path.join(PROJECT_ROOT, doc_dir))
            # Also try subdirectories (images/, audio/)
            for sub in ("images", "audio"):
                search_dirs.append(os.path.join(PROJECT_ROOT, doc_dir, sub))

        files = []
        for d in search_dirs:
            if not os.path.isdir(d):
                continue
            # Match: stem.ext, stem.v002.ext, stem.v003.ext, etc.
            pattern = os.path.join(d, stem + "*" + ext)
            for f in sorted(globmod.glob(pattern)):
                name = os.path.basename(f)
                # Must start with the stem
                if name.startswith(stem):
                    files.append(name)

        # Sort: original first, then versioned
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
            error_response(self, 400, "Invalid JSON")
            return

        background = data.get("background", "")
        text = data.get("text", "")
        current = data.get("current", "")  # e.g. images/pod-intro.png
        doc_dir = data.get("docDir", "")    # e.g. storyboards/

        if not background:
            error_response(self, 400, "Missing background prompt")
            return

        # Determine output path: next version number
        if current:
            base_dir = os.path.join(PROJECT_ROOT, doc_dir, os.path.dirname(current))
            filename = os.path.basename(current)
            stem = re.sub(r'\.v\d+(?=\.[^.]+$)', '', filename)  # strip .vNNN
            name, ext = os.path.splitext(stem)
        else:
            base_dir = os.path.join(PROJECT_ROOT, doc_dir, "images")
            name = "new-slide"
            ext = ".png"

        os.makedirs(base_dir, exist_ok=True)

        # Find next version number
        existing = globmod.glob(os.path.join(base_dir, name + ".v*" + ext))
        max_ver = 1  # original is implicitly v1
        for f in existing:
            m = re.search(r'\.v(\d+)', os.path.basename(f))
            if m:
                max_ver = max(max_ver, int(m.group(1)))
        next_ver = max_ver + 1
        out_filename = f"{name}.v{next_ver:03d}{ext}"
        out_path = os.path.join(base_dir, out_filename)

        # Build the generation command
        script = os.path.join(PROJECT_ROOT, "scripts", "gen_single_slide.py")
        cmd = (
            f'source ~/ml-env/bin/activate && python3 "{script}" '
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
            error_response(self, 500, f"Generation failed: {err}")
            return

        # Return relative path from doc_dir
        rel_path = os.path.relpath(out_path, os.path.join(PROJECT_ROOT, doc_dir))
        json_response(self, {"path": rel_path})

    # ── Regenerate Audio ─────────────────────────────────────────

    def _handle_regen_audio(self):
        try:
            data = json.loads(read_body(self))
        except (json.JSONDecodeError, ValueError):
            error_response(self, 400, "Invalid JSON")
            return

        dialogue = data.get("dialogue", [])
        current = data.get("current", "")     # e.g. audio/00-introductions.mp3
        doc_dir = data.get("docDir", "")
        storyboard_path = data.get("storyboardPath", "")

        if not dialogue:
            error_response(self, 400, "No dialogue lines")
            return

        # Determine output path: next version number
        if current:
            base_dir = os.path.join(PROJECT_ROOT, doc_dir, os.path.dirname(current))
            filename = os.path.basename(current)
            stem = re.sub(r'\.v\d+(?=\.[^.]+$)', '', filename)
            name, ext = os.path.splitext(stem)
        else:
            base_dir = os.path.join(PROJECT_ROOT, doc_dir, "audio")
            name = "new-section"
            ext = ".mp3"

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

        # Build generation command
        script = os.path.join(PROJECT_ROOT, "scripts", "render_single_section.py")
        dialogue_json = json.dumps(dialogue)
        # Read voice map from the storyboard file
        voice_map = self._read_voice_map(storyboard_path)

        cmd_data = json.dumps({
            "dialogue": dialogue,
            "voices": voice_map,
            "output": out_path,
        })

        cmd = (
            f'source ~/ml-env/bin/activate && '
            f'echo {repr(cmd_data)} | python3 "{script}"'
        )

        print(f"[regen-audio] Running for {len(dialogue)} lines -> {out_path}")
        result = subprocess.run(
            ["bash", "-c", cmd],
            capture_output=True, timeout=180,
        )

        if result.returncode != 0 or not os.path.isfile(out_path):
            err = result.stderr.decode()[:300]
            print(f"[regen-audio] Failed: {err}")
            error_response(self, 500, f"Generation failed: {err}")
            return

        rel_path = os.path.relpath(out_path, os.path.join(PROJECT_ROOT, doc_dir))
        json_response(self, {"path": rel_path})

    def _read_voice_map(self, storyboard_path):
        """Parse <!-- voices: ... --> from storyboard markdown."""
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
        print(f"[save-server] {args[0] if args else ''}")


if __name__ == "__main__":
    server = http.server.HTTPServer(("127.0.0.1", 8001), Handler)
    print("Save server listening on http://127.0.0.1:8001")
    server.serve_forever()
