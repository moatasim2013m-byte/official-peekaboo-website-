"""
Python wrapper that spawns Node.js/Express server on port 8001.
Uses FastAPI as a proxy to satisfy uvicorn requirements while 
the actual business logic runs in Node.js/Express.
"""
import subprocess
import os
import sys
import signal
import atexit
import threading
import time
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
import httpx

app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Node process management
node_process = None
NODE_PORT = 8002  # Internal Node port

def start_node_server():
    global node_process
    node_app_path = os.path.join(os.path.dirname(__file__), 'node-app')
    
    # Set environment variables for Node
    env = os.environ.copy()
    env['PORT'] = str(NODE_PORT)
    
    node_process = subprocess.Popen(
        ['node', 'index.js'],
        cwd=node_app_path,
        stdout=sys.stdout,
        stderr=sys.stderr,
        env=env
    )
    
    # Wait for Node to start
    time.sleep(2)
    print(f"Node.js server started on internal port {NODE_PORT}")

def stop_node_server():
    global node_process
    if node_process:
        node_process.terminate()
        node_process.wait()
        print("Node.js server stopped")

# Register cleanup
atexit.register(stop_node_server)

# Start Node server in background thread
threading.Thread(target=start_node_server, daemon=True).start()

# Proxy all requests to Node
@app.api_route("/api/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"])
async def proxy_to_node(request: Request, path: str):
    try:
        async with httpx.AsyncClient() as client:
            # Build the URL
            url = f"http://localhost:{NODE_PORT}/api/{path}"
            
            # Get query params
            if request.query_params:
                url += f"?{request.query_params}"
            
            # Get headers (excluding host)
            headers = dict(request.headers)
            headers.pop("host", None)
            
            # Get body
            body = await request.body()
            
            # Make request to Node
            response = await client.request(
                method=request.method,
                url=url,
                headers=headers,
                content=body,
                timeout=30.0
            )
            
            # Return response
            return Response(
                content=response.content,
                status_code=response.status_code,
                headers=dict(response.headers),
                media_type=response.headers.get("content-type")
            )
    except httpx.ConnectError:
        return Response(
            content='{"error": "Backend service unavailable"}',
            status_code=503,
            media_type="application/json"
        )
    except Exception as e:
        return Response(
            content=f'{{"error": "{str(e)}"}}',
            status_code=500,
            media_type="application/json"
        )

@app.get("/")
async def root():
    return {"message": "Peekaboo API Gateway"}
