#!/usr/bin/env bash
# Point all Nabbi host-nginx vhosts at the project Compose nginx gateway (3020).
# Usage: sudo ./deploy/apply-nginx.sh
set -euo pipefail

CONF=/etc/nginx/sites-available/spotynet-dev.conf
BAK="${CONF}.bak.$(date +%F-%H%M%S)"
GATEWAY=3020

if [[ $EUID -ne 0 ]]; then
  echo "Run with sudo: sudo $0" >&2
  exit 1
fi

cp -a "$CONF" "$BAK"
echo "Backup: $BAK"

python3 - "$CONF" "$GATEWAY" <<'PY'
import re
import sys

path, gateway = sys.argv[1], sys.argv[2]
text = open(path, encoding="utf-8").read()

def patch_server(text: str, server_name: str, new_port: str) -> str:
    pattern = re.compile(
        rf"(server_name\s+{re.escape(server_name)}\s*;.*?proxy_pass\s+http://127\.0\.0\.1:)\d+(\s*;)",
        re.DOTALL,
    )
    new_text, n = pattern.subn(rf"\g<1>{new_port}\2", text, count=1)
    if n != 1:
        raise SystemExit(f"Expected 1 proxy_pass for {server_name}, found {n}")
    return new_text

for host in (
    "nabbi-api-dev.spotynet.com",
    "nabbi-dev.spotynet.com",
    "nabbi-mobile-dev.spotynet.com",
):
    text = patch_server(text, host, gateway)

open(path, "w", encoding="utf-8").write(text)
print(f"Updated nabbi-*-dev proxy_pass → 127.0.0.1:{gateway}")
PY

nginx -t
systemctl reload nginx
echo "nginx reloaded OK"

SETUP=/home/spotynet/projects/apps/setup.txt
if [[ -f "$SETUP" ]]; then
  echo "==> Updating setup.txt BE-U / NABBI section"
  cp -a "$SETUP" "${SETUP}.bak.$(date +%F-%H%M%S)"
  python3 - "$SETUP" <<'PY'
from pathlib import Path
import re
import sys
path = Path(sys.argv[1])
text = path.read_text(encoding="utf-8")
new = """BE-U / NABBI (Docker Compose — per-project nginx)
- Start: cd /home/spotynet/projects/apps/be-u && ./dev.sh
- Project nginx gateway: 127.0.0.1:3020
- API (internal): 3007 — nabbi-api-dev.spotynet.com
- Next.js web (internal): 3008 — nabbi-dev.spotynet.com
- Expo mobile web (internal): 3009 — nabbi-mobile-dev.spotynet.com
- Host nginx proxies ALL three Nabbi domains to http://127.0.0.1:3020
- Apply host nginx: sudo ./deploy/apply-nginx.sh
"""
pat = re.compile(r"BE-U / NABBI\n(?:- .+\n)+")
text2, n = pat.subn(new + "\n", text, count=1)
if n != 1:
    print(f"Warning: setup.txt BE-U section not replaced (matches={n})")
else:
    path.write_text(text2, encoding="utf-8")
    print("Updated setup.txt BE-U / NABBI section")
PY
fi

echo
echo "Verify:"
echo "  curl -I -H 'Host: nabbi-dev.spotynet.com' http://127.0.0.1:3020/"
echo "  curl -I -H 'Host: nabbi-api-dev.spotynet.com' http://127.0.0.1:3020/"
echo "  curl -I -H 'Host: nabbi-mobile-dev.spotynet.com' http://127.0.0.1:3020/"
echo "  curl -skI --resolve nabbi-dev.spotynet.com:443:127.0.0.1 https://nabbi-dev.spotynet.com/"
