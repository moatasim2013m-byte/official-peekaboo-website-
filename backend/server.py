"""
Python wrapper that spawns Node.js/Express server and handles Stripe via emergentintegrations.
All business logic runs in Node.js/Express except Stripe which uses Python.
"""
import subprocess
import os
import sys
import atexit
import threading
import time
from fastapi import FastAPI, Request, Response, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import httpx
from pydantic import BaseModel
from typing import Optional, Dict
from dotenv import load_dotenv

load_dotenv()

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
    
    env = os.environ.copy()
    env['PORT'] = str(NODE_PORT)
    
    node_process = subprocess.Popen(
        ['node', 'index.js'],
        cwd=node_app_path,
        stdout=sys.stdout,
        stderr=sys.stderr,
        env=env
    )
    
    time.sleep(2)
    print(f"Node.js server started on internal port {NODE_PORT}")

def stop_node_server():
    global node_process
    if node_process:
        node_process.terminate()
        node_process.wait()
        print("Node.js server stopped")

atexit.register(stop_node_server)
threading.Thread(target=start_node_server, daemon=True).start()

# Stripe integration via emergentintegrations
from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionRequest

stripe_api_key = os.environ.get('STRIPE_API_KEY', 'sk_test_emergent')

class CheckoutRequest(BaseModel):
    type: str
    reference_id: Optional[str] = None
    theme_id: Optional[str] = None
    child_id: Optional[str] = None
    origin_url: str

@app.get("/api/health")
async def health_check():
    """Health check endpoint for connectivity testing"""
    return {"ok": True, "service": "peekaboo-api"}

@app.post("/api/payments/create-checkout")
async def create_checkout(request: Request, checkout_req: CheckoutRequest):
    """Handle Stripe checkout via emergentintegrations"""
    try:
        # Get auth header and forward to Node to validate and get user info
        auth_header = request.headers.get("authorization", "")
        
        # First, validate the user with Node
        async with httpx.AsyncClient() as client:
            user_response = await client.get(
                f"http://localhost:{NODE_PORT}/api/auth/me",
                headers={"Authorization": auth_header},
                timeout=10.0
            )
            if user_response.status_code != 200:
                raise HTTPException(status_code=401, detail="Unauthorized")
            
            user_data = user_response.json()
            user_id = user_data.get("user", {}).get("id", "unknown")
        
        # Get pricing from Node
        amount = 10.00  # Default
        if checkout_req.type == 'hourly':
            async with httpx.AsyncClient() as client:
                settings_resp = await client.get(
                    f"http://localhost:{NODE_PORT}/api/admin/settings",
                    headers={"Authorization": auth_header},
                    timeout=10.0
                )
                if settings_resp.status_code == 200:
                    settings = settings_resp.json().get("settings", {})
                    amount = float(settings.get("hourly_price", 10.00))
        elif checkout_req.type == 'birthday' and checkout_req.theme_id:
            async with httpx.AsyncClient() as client:
                theme_resp = await client.get(
                    f"http://localhost:{NODE_PORT}/api/themes/{checkout_req.theme_id}",
                    timeout=10.0
                )
                if theme_resp.status_code == 200:
                    theme = theme_resp.json().get("theme", {})
                    amount = float(theme.get("price", 100.00))
        elif checkout_req.type == 'subscription' and checkout_req.reference_id:
            async with httpx.AsyncClient() as client:
                plan_resp = await client.get(
                    f"http://localhost:{NODE_PORT}/api/subscriptions/plans/{checkout_req.reference_id}",
                    timeout=10.0
                )
                if plan_resp.status_code == 200:
                    plan = plan_resp.json().get("plan", {})
                    amount = float(plan.get("price", 50.00))
        
        # Build URLs and metadata
        success_url = f"{checkout_req.origin_url}/payment/success?session_id={{CHECKOUT_SESSION_ID}}"
        cancel_url = f"{checkout_req.origin_url}/payment/cancel"
        
        metadata = {
            "type": checkout_req.type,
            "user_id": user_id
        }
        if checkout_req.reference_id:
            if checkout_req.type == 'subscription':
                metadata["plan_id"] = checkout_req.reference_id
            else:
                metadata["slot_id"] = checkout_req.reference_id
        if checkout_req.theme_id:
            metadata["theme_id"] = checkout_req.theme_id
        if checkout_req.child_id:
            metadata["child_id"] = checkout_req.child_id
        
        # Create Stripe checkout session
        host_url = str(request.base_url).rstrip('/')
        webhook_url = f"{host_url}/api/webhook/stripe"
        
        stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url=webhook_url)
        
        checkout_request = CheckoutSessionRequest(
            amount=amount,
            currency="usd",
            success_url=success_url,
            cancel_url=cancel_url,
            metadata=metadata
        )
        
        session = await stripe_checkout.create_checkout_session(checkout_request)
        
        # Store transaction in Node's database
        async with httpx.AsyncClient() as client:
            await client.post(
                f"http://localhost:{NODE_PORT}/api/payments/store-transaction",
                json={
                    "session_id": session.session_id,
                    "user_id": user_id,
                    "amount": amount,
                    "currency": "usd",
                    "type": checkout_req.type,
                    "reference_id": checkout_req.reference_id,
                    "metadata": metadata
                },
                headers={"Authorization": auth_header},
                timeout=10.0
            )
        
        return {"url": session.url, "session_id": session.session_id}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Checkout error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create checkout session: {str(e)}")

@app.get("/api/payments/status/{session_id}")
async def get_checkout_status(request: Request, session_id: str):
    """Get Stripe checkout status via emergentintegrations"""
    try:
        host_url = str(request.base_url).rstrip('/')
        webhook_url = f"{host_url}/api/webhook/stripe"
        
        stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url=webhook_url)
        status = await stripe_checkout.get_checkout_status(session_id)
        
        return {
            "status": status.status,
            "payment_status": status.payment_status,
            "amount_total": status.amount_total,
            "currency": status.currency,
            "metadata": status.metadata,
            "payment_id": f"pi_{session_id[:20]}"  # Placeholder
        }
    except Exception as e:
        print(f"Status check error: {e}")
        raise HTTPException(status_code=500, detail="Failed to get checkout status")

@app.post("/api/webhook/stripe")
async def stripe_webhook(request: Request):
    """Handle Stripe webhooks"""
    try:
        body = await request.body()
        signature = request.headers.get("Stripe-Signature", "")
        
        host_url = str(request.base_url).rstrip('/')
        webhook_url = f"{host_url}/api/webhook/stripe"
        
        stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url=webhook_url)
        event = await stripe_checkout.handle_webhook(body, signature)
        
        return {"received": True, "event_type": event.event_type}
    except Exception as e:
        print(f"Webhook error: {e}")
        return {"received": False, "error": str(e)}

# Proxy all other requests to Node
@app.api_route("/api/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"])
async def proxy_to_node(request: Request, path: str):
    # Skip if it's a Stripe endpoint we handle directly
    if path.startswith("payments/create-checkout") or path.startswith("payments/status/") or path.startswith("webhook/stripe"):
        raise HTTPException(status_code=404, detail="Not found")
    
    try:
        async with httpx.AsyncClient() as client:
            url = f"http://localhost:{NODE_PORT}/api/{path}"
            
            if request.query_params:
                url += f"?{request.query_params}"
            
            headers = dict(request.headers)
            headers.pop("host", None)
            
            body = await request.body()
            
            response = await client.request(
                method=request.method,
                url=url,
                headers=headers,
                content=body,
                timeout=30.0
            )
            
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
