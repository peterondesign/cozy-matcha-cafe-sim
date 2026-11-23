#!/usr/bin/env python3
"""Check game routes, local HTML links, and JavaScript syntax.

Usage:
  python3 tests/check_repo.py
"""
from html.parser import HTMLParser
import os
import subprocess
import sys
from urllib.parse import urlsplit

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
errors = []


class LocalLinks(HTMLParser):
    def __init__(self):
        super().__init__()
        self.urls = []

    def handle_starttag(self, tag, attrs):
        for name, value in attrs:
            if name in ("href", "src") and value:
                self.urls.append(value)


routes = {
    "/": "index.html",
    "/menu/": "menu/index.html",
    "/counter/": "counter/index.html",
    "/grocer/": "grocer/index.html",
    "/park/": "park/index.html",
    "/garden/": "garden/index.html",
    "/new-game/park/": "new-game/park/index.html",
    "/new-game/garden/": "new-game/garden/index.html",
}
for route, relative_path in routes.items():
    if not os.path.isfile(os.path.join(ROOT, relative_path)):
        errors.append(f"{route}: missing {relative_path}")

for current, dirs, names in os.walk(ROOT):
    dirs[:] = [name for name in dirs if name not in (".git", "node_modules")]
    for name in names:
        if not name.endswith(".html"):
            continue
        path = os.path.join(current, name)
        try:
            with open(path, encoding="utf-8") as source:
                parser = LocalLinks()
                parser.feed(source.read())
        except (OSError, UnicodeError) as error:
            errors.append(f"{os.path.relpath(path, ROOT)}: {error}")
            continue
        for value in parser.urls:
            parsed = urlsplit(value)
            if parsed.scheme or value.startswith("//") or not parsed.path:
                continue
            target = os.path.normpath(
                os.path.join(ROOT if parsed.path.startswith("/") else current, parsed.path.lstrip("/"))
            )
            if os.path.isdir(target):
                target = os.path.join(target, "index.html")
            if not os.path.exists(target):
                errors.append(
                    f"{os.path.relpath(path, ROOT)}: broken local link {value}"
                )

for current, dirs, names in os.walk(ROOT):
    dirs[:] = [name for name in dirs if name not in (".git", "node_modules")]
    for name in names:
        path = os.path.join(current, name)
        if name.endswith(".mjs"):
            result = subprocess.run(
                ["node", "--check", path], capture_output=True, text=True
            )
        elif name.endswith(".js"):
            with open(path, encoding="utf-8") as source:
                result = subprocess.run(
                    ["node", "--input-type=module", "--check"],
                    input=source.read(),
                    capture_output=True,
                    text=True,
                )
        else:
            continue
        if result.returncode:
            errors.append(f"{os.path.relpath(path, ROOT)}: JavaScript syntax check failed")

for current, dirs, names in os.walk(ROOT):
    dirs[:] = [name for name in dirs if name not in (".git", "node_modules")]
    for name in names:
        if not (name.startswith("test_") and name.endswith(".mjs")):
            continue
        path = os.path.join(current, name)
        result = subprocess.run(
            ["node", "--test", path], capture_output=True, text=True
        )
        if result.returncode:
            errors.append(
                f"{os.path.relpath(path, ROOT)}: tests failed\n"
                f"{result.stdout}{result.stderr}"
            )

print("\n".join(errors) if errors else f"ok ({len(routes)} routes)")
sys.exit(1 if errors else 0)
