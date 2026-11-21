#!/usr/bin/env python3
"""Run Seedream 5 Pro jobs and download every returned asset.

Usage:
  python3 run_seedream.py --name source-decomposition --output 06-layer-decomposition/source --input job.json
  python3 run_seedream.py --name background-day --output 01-backgrounds/day --input job.json
"""

from __future__ import annotations

import argparse
import json
import mimetypes
import os
from pathlib import Path
import ssl
import subprocess
import time
from urllib.error import HTTPError
from urllib.parse import urlparse
from urllib.request import Request, urlopen


ROOT = Path(__file__).resolve().parent
API = "https://api.replicate.com/v1/models/bytedance/seedream-5-pro/predictions"


def ssl_context() -> ssl.SSLContext:
    """Use certifi's maintained CA bundle when the local Python bundle is incomplete."""
    try:
        import certifi
    except ImportError:
        return ssl.create_default_context()
    return ssl.create_default_context(cafile=certifi.where())


SSL_CONTEXT = ssl_context()


def load_env(path: Path) -> None:
    if not path.exists():
        return
    for raw in path.read_text().splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


def request_json(url: str, token: str, *, method: str = "GET", body=None):
    command = [
        "curl", "-sS", "--fail-with-body", "--max-time", "120",
        "-X", method, "-H", f"Authorization: Bearer {token}",
        "-H", "Accept: application/json",
    ]
    data = None
    if body is not None:
        data = json.dumps(body)
        command.extend(["-H", "Content-Type: application/json", "-H", "Prefer: wait=60", "--data-binary", "@-"])
    command.append(url)
    result = subprocess.run(command, input=data, text=True, capture_output=True)
    if result.returncode:
        detail = result.stdout.strip() or result.stderr.strip()
        raise RuntimeError(f"Replicate request failed: {detail}")
    return json.loads(result.stdout)


def collect_urls(value, prefix="output"):
    found = []
    if isinstance(value, str) and value.startswith(("https://", "http://")):
        found.append((prefix, value))
    elif isinstance(value, list):
        for index, item in enumerate(value, 1):
            found.extend(collect_urls(item, f"{prefix}_{index:02d}"))
    elif isinstance(value, dict):
        for key, item in value.items():
            safe = "".join(ch if ch.isalnum() or ch in "-_" else "-" for ch in str(key))
            found.extend(collect_urls(item, f"{prefix}_{safe}"))
    return found


def expand_env(value):
    if isinstance(value, str):
        return os.path.expandvars(value)
    if isinstance(value, list):
        return [expand_env(item) for item in value]
    if isinstance(value, dict):
        return {key: expand_env(item) for key, item in value.items()}
    return value


def redact_input(value):
    if isinstance(value, dict):
        return {
            key: (["<source-image-url>"] if key == "image_input" and isinstance(item, list) else redact_input(item))
            for key, item in value.items()
        }
    if isinstance(value, list):
        return [redact_input(item) for item in value]
    return value


def download(url: str, target: Path) -> None:
    result = subprocess.run(
        ["curl", "-sS", "-L", "--fail-with-body", "--max-time", "240", url, "-o", str(target)],
        text=True,
        capture_output=True,
    )
    if result.returncode:
        raise RuntimeError(f"Download failed for {url}: {result.stderr.strip()}")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--name", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--input", type=Path, required=True)
    args = parser.parse_args()

    load_env(ROOT.parents[1] / ".env")
    token = os.environ.get("REPLICATE_API_TOKEN")
    if not token:
        raise SystemExit("REPLICATE_API_TOKEN is missing")
    payload = {"input": expand_env(json.loads(args.input.read_text()))}
    prediction = request_json(API, token, method="POST", body=payload)
    prediction_url = prediction["urls"]["get"]
    while prediction.get("status") not in {"succeeded", "failed", "canceled"}:
        time.sleep(3)
        prediction = request_json(prediction_url, token)

    out_dir = ROOT / args.output
    out_dir.mkdir(parents=True, exist_ok=True)
    record = {
        "name": args.name,
        "id": prediction.get("id"),
        "status": prediction.get("status"),
        "model": "bytedance/seedream-5-pro",
        "input": redact_input(payload["input"]),
        "output": prediction.get("output"),
        "metrics": prediction.get("metrics"),
        "error": prediction.get("error"),
    }
    (out_dir / "prediction.json").write_text(json.dumps(record, indent=2))
    if prediction.get("status") != "succeeded":
        raise SystemExit(f"Prediction {prediction.get('status')}: {prediction.get('error')}")

    urls = collect_urls(prediction.get("output"))
    manifest = []
    for index, (label, url) in enumerate(urls, 1):
        suffix = Path(urlparse(url).path).suffix.lower()
        if suffix not in {".png", ".jpg", ".jpeg", ".webp", ".json", ".zip"}:
            suffix = mimetypes.guess_extension("image/png") or ".png"
        filename = f"{index:02d}_{label}{suffix}"
        download(url, out_dir / filename)
        manifest.append({"file": filename, "label": label})
    (out_dir / "manifest.json").write_text(json.dumps(manifest, indent=2))
    print(json.dumps({"status": "succeeded", "id": prediction.get("id"), "files": len(manifest), "directory": str(out_dir)}))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
