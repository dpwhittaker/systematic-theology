"""Tiny HTTP server that handles PUT requests to save storyboard/handout files.

Runs on port 8001 alongside the main static server on 8000.
Only allows writing to storyboards/ and handouts/ directories.
"""

import http.server
import os

PROJECT_ROOT = "/home/david/projects/systematic-theology"
ALLOWED_PREFIXES = ("storyboards/", "handouts/")


class SaveHandler(http.server.BaseHTTPRequestHandler):
    def do_PUT(self):
        path = self.path.lstrip("/")

        # Security: only allow saving to specific directories
        if not any(path.startswith(p) for p in ALLOWED_PREFIXES):
            self.send_error(403, "Forbidden: can only save to storyboards/ or handouts/")
            return

        # Security: no path traversal
        if ".." in path:
            self.send_error(403, "Forbidden: path traversal")
            return

        full_path = os.path.join(PROJECT_ROOT, path)
        if not os.path.isfile(full_path):
            self.send_error(404, f"File not found: {path}")
            return

        content_length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_length)

        with open(full_path, "wb") as f:
            f.write(body)

        self.send_response(200)
        self.send_header("Content-Type", "text/plain")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(b"OK")

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "PUT, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def log_message(self, format, *args):
        print(f"[save] {args[0]}")


if __name__ == "__main__":
    server = http.server.HTTPServer(("127.0.0.1", 8001), SaveHandler)
    print("Save server listening on http://127.0.0.1:8001")
    server.serve_forever()
