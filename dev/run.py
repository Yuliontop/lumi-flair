"""Run one or more dev tests/tools with dev/out as the working directory.

    python dev/run.py                       # every test in dev/tests
    python dev/run.py test_custom_sounds.py # one test (or a tool from dev/tools, with its arguments)
    python dev/run.py effect_frames.py blackhole

Needs the mock server running:  python -m http.server 8765 -d dev/mock
(override the address with LF_BASE=http://host:port)
"""
import os, re, subprocess, sys
sys.stdout.reconfigure(encoding='utf-8')  # the tests print arrows; cp1252 can't when the output goes to a file

DEV = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(DEV, 'out')
os.makedirs(OUT, exist_ok=True)


def find(name):
    for d in ('tests', 'tools'):
        p = os.path.join(DEV, d, name)
        if os.path.exists(p):
            return p
    sys.exit(f'no such test/tool: {name}')


if len(sys.argv) > 1:
    jobs = [[find(sys.argv[1])] + sys.argv[2:]]
else:
    jobs = [[os.path.join(DEV, 'tests', f)] for f in sorted(os.listdir(os.path.join(DEV, 'tests'))) if f.startswith('test_')]

failed = []
for job in jobs:
    name = os.path.basename(job[0])
    print(f'\n=== {name} {" ".join(job[1:])}', flush=True)
    # UTF-8 both ways: on Windows the default (cp1252) can't decode what the tests print
    r = subprocess.run([sys.executable] + job, cwd=OUT, capture_output=True, text=True, timeout=300,
                       encoding='utf-8', errors='replace', env={**os.environ, 'PYTHONIOENCODING': 'utf-8'})
    print(r.stdout.rstrip())
    # Tests print what they observed; any non-empty "errors [...]" (page errors / console errors) is a failure.
    bad = r.returncode != 0 or re.search(r"errors \[(?!\])", r.stdout) is not None
    if r.returncode != 0:
        print(r.stderr[-2000:])
    if bad:
        failed.append(name)
print('\n' + ('All passed.' if not failed else f'FAILED: {", ".join(failed)}'))
# A full run that passed goes straight into the local Lumiverse install.
if not failed and len(sys.argv) == 1:
    from deploy_local import deploy
    deploy()
sys.exit(1 if failed else 0)
