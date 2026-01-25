"""
Python wrapper that spawns Node.js/Express server on port 8001.
No business logic here - just starts Node and forwards stdout/stderr.
"""
import subprocess
import sys
import os

def main():
    node_app_path = os.path.join(os.path.dirname(__file__), 'node-app')
    
    process = subprocess.Popen(
        ['node', 'index.js'],
        cwd=node_app_path,
        stdout=sys.stdout,
        stderr=sys.stderr,
        env={**os.environ}
    )
    
    try:
        process.wait()
    except KeyboardInterrupt:
        process.terminate()
        process.wait()

if __name__ == '__main__':
    main()
