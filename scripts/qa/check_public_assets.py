#!/usr/bin/env python3
"""Fail if the app references a static asset that isn't in ITS OWN public/.

WHY THIS EXISTS
---------------
The monorepo->4-repo split routed frontend/public/v4/illus/*.png to `landing`
only. `frontend` kept the components that reference them and lost the files,
so /login and /signup rendered a broken <Image> and next/image logged:

    ⨯ The requested resource isn't a valid image for /v4/illus/security.png
      received text/html; charset=utf-8

A blob-SHA reconciliation across the whole split did NOT catch it: the bytes
did survive — in the other repo. "Survived somewhere" is the wrong question.
This asks the right one, per repo.

Usage:  python3 scripts/qa/check_public_assets.py [repo_root]
Exit 1 on any missing asset.
"""
from __future__ import annotations

import os
import re
import sys

SKIP_DIRS = {"node_modules", ".next", ".git", ".open-next", ".wrangler", "public", "tests"}
SOURCE_EXT = (".ts", ".tsx", ".js", ".jsx", ".mjs", ".css")

# Root-relative static asset literals: "/v4/illus/security.png", '/fonts/x.woff2', …
ASSET = re.compile(
    r"""['"`](/[A-Za-z0-9_\-./@]+\.(?:png|jpe?g|svg|webp|gif|avif|ico|woff2?|mp4))['"`]"""
)


def main(root: str) -> int:
    public = os.path.join(root, "public")
    if not os.path.isdir(public):
        print(f"check_public_assets: no public/ at {root} — nothing to check.")
        return 0

    refs: dict[str, set[str]] = {}
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
        for fn in filenames:
            if not fn.endswith(SOURCE_EXT):
                continue
            path = os.path.join(dirpath, fn)
            try:
                src = open(path, encoding="utf8", errors="ignore").read()
            except OSError:
                continue
            for asset in ASSET.findall(src):
                refs.setdefault(asset, set()).add(os.path.relpath(path, root))

    missing = {
        a: srcs for a, srcs in refs.items()
        if not os.path.exists(os.path.join(public, a.lstrip("/")))
    }

    print(f"check_public_assets: {len(refs)} distinct asset references, "
          f"{len(missing)} missing from public/")

    if not missing:
        print("check_public_assets: OK")
        return 0

    for asset in sorted(missing):
        print(f"\n  MISSING  {asset}")
        for src in sorted(missing[asset]):
            print(f"           referenced by {src}")
    print("\nEach of these resolves to the 404 HTML page at runtime, not an asset.")
    return 1


if __name__ == "__main__":
    root = sys.argv[1] if len(sys.argv) > 1 else os.path.join(
        os.path.dirname(os.path.abspath(__file__)), "..", ".."
    )
    sys.exit(main(os.path.abspath(root)))
