"""Copy the built extension into Ash's local Lumiverse test install (Extensions -> Import Local).

    python dev/deploy_local.py

Copies dist/, src/, README.md and package.json, plus spindle.json with "dev_mode": true added (never commit that).
The target defaults to <Lumiverse>/data/extensions/lumi_flair/repo next to this checkout; override with LF_INSTALL.
dev/run.py calls this after a full run in which every test passed. Build first: it copies dist/ as it is.
"""
import json, os, shutil, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TARGET = os.environ.get('LF_INSTALL') or os.path.join(os.path.dirname(ROOT), 'extensions', 'lumi_flair', 'repo')


def deploy():
    if not os.path.isdir(TARGET):
        print(f'deploy: no local install at {TARGET}, skipped')
        return
    manifest = json.load(open(os.path.join(ROOT, 'spindle.json'), encoding='utf-8'))
    try:
        old = json.load(open(os.path.join(TARGET, 'spindle.json'), encoding='utf-8')).get('version')
    except (OSError, ValueError):
        old = None
    for d in ('dist', 'src'):
        shutil.rmtree(os.path.join(TARGET, d), ignore_errors=True)
        shutil.copytree(os.path.join(ROOT, d), os.path.join(TARGET, d))
    for f in ('README.md', 'package.json'):
        shutil.copy2(os.path.join(ROOT, f), os.path.join(TARGET, f))
    manifest['dev_mode'] = True
    with open(os.path.join(TARGET, 'spindle.json'), 'w', encoding='utf-8') as fh:
        json.dump(manifest, fh, indent=2, ensure_ascii=False)
        fh.write('\n')
    v = manifest['version']
    print(f'deploy: {old} -> {v} copied to {TARGET}')
    if old == v:
        print(f'deploy: same version {v} as before; fine on a host that keys the cache on the bundle file (current Lumiverse)')
    print('deploy: in Lumiverse click Update, toggle the extension off and on, then Ctrl+Shift+R')


if __name__ == '__main__':
    deploy()
    sys.exit(0)
