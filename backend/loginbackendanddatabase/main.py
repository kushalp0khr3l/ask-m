import os
from fastapi import FastAPI, HTTPException, Header
from supabase import create_client, Client
from dotenv import load_dotenv
from pathlib import Path
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# Load environment variables
env_path = Path('.') / '.env'
load_dotenv(dotenv_path=env_path)

from fastapi.middleware.cors import CORSMiddleware

# AI Orchestrator Imports
from ai_orchestrator.api.routes import router as ai_router
from ai_orchestrator.cache.static_cache import StaticCache

app = FastAPI()

@app.on_event("startup")
def startup_event():
    print("DEBUG: Starting AI Orchestrator Cache...")
    cache = StaticCache()
    cache.load()
    app.state.static_cache = cache
    print("DEBUG: AI Orchestrator Ready")

# Enable CORS (Cross-Origin Resource Sharing)
ALLOWED_ORIGINS = os.environ.get("ALLOWED_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Supabase Configuration
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    print("WARNING: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not found in environment variables.")

# Create Supabase client with Service Role key (to bypass RLS for administrative tasks)
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

@app.get("/")
async def root():
    return {"message": "Python Backend is Running"}

async def send_welcome_email(email: str, name: str):
    """
    Sends a real Welcome Email using Gmail SMTP with detailed logging.
    """
    smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", 587))
    smtp_user = os.getenv("SMTP_USER")
    smtp_pass = os.getenv("SMTP_PASS")

    print(f"DEBUG: SMTP Config - Host: {smtp_host}, Port: {smtp_port}, User: {smtp_user}, Pass loaded: {'Yes' if smtp_pass else 'No'}")

    if not smtp_user or not smtp_pass:
        print("DEBUG: SMTP credentials missing in .env file. Skipping email.")
        return False

    try:
        print(f"DEBUG: Preparing email for {email}...")
        msg = MIMEMultipart()
        msg['From'] = smtp_user
        msg['To'] = email
        msg['Subject'] = "Welcome to Ask-M!"

        body = f"""
        Hello {name},

        Welcome to Ask-M! Your account has been successfully created.
        You can now use our Kathmandu University syllabus-tailored chatbot and summarizer.

        Best regards,
        The Ask-M Team
        """
        msg.attach(MIMEText(body, 'plain'))

        print(f"DEBUG: Connecting to {smtp_host}:{smtp_port}...")
        if smtp_port == 465:
            # Use SSL for port 465
            server_context = smtplib.SMTP_SSL(smtp_host, smtp_port, timeout=10)
        else:
            # Use STARTTLS for port 587
            server_context = smtplib.SMTP(smtp_host, smtp_port, timeout=10)

        with server_context as server:
            server.set_debuglevel(1)
            if smtp_port != 465:
                print("DEBUG: Starting TLS...")
                server.starttls()
            
            print(f"DEBUG: Logging in as {smtp_user}...")
            server.login(smtp_user, smtp_pass)
            print("DEBUG: Sending message...")
            server.send_message(msg)
            
        print(f"DEBUG: Welcome email sent successfully to {email}")
        return True
    except smtplib.SMTPAuthenticationError:
        print("ERROR: SMTP Authentication Failed. Check your email and App Password.")
        return False
    except smtplib.SMTPConnectError:
        print("ERROR: Could not connect to the SMTP server. Check host/port and firewall.")
        return False
    except Exception as e:
        print(f"ERROR: General failure sending email: {type(e).__name__}: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

@app.post("/auth/verify")
async def verify_user(authorization: str = Header(None)):
    """
    Receives a JWT from the frontend, verifies it with Supabase,
    and ensures the user exists in the 'profiles' table without overwriting data.
    """
    print("DEBUG: Sync request received at /auth/verify")
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Authorization Header")
    
    token = authorization.replace("Bearer ", "")
    
    try:
        user_response = supabase.auth.get_user(token)
        user = user_response.user
        if not user:
            raise HTTPException(status_code=401, detail="Invalid token")

        metadata = user.user_metadata or {}
        user_id = user.id
        email = user.email
        full_name = metadata.get("full_name") or metadata.get("name", "")
        avatar_url = metadata.get("avatar_url") or metadata.get("picture", "")

        # 3. Sync with 'profiles' table - FIXED: Don't overwrite existing phone/address/etc.
        existing = supabase.table("profiles").select("*").eq("id", user_id).execute()
        
        profile_data = {
            "id": user_id,
            "email": email,
            "full_name": full_name,
            "avatar_url": avatar_url
        }
        
        if not existing.data:
            # FIRST LOGIN: Create profile and send welcome email
            print(f"DEBUG: New user detected: {email}. Sending welcome email...")
            supabase.table("profiles").insert(profile_data).execute()
            await send_welcome_email(email, full_name or "New User")
        else:
            # SUBSEQUENT LOGINS: Sync metadata only if it differs from database
            # This prevents stale metadata from overwriting custom updates in the database
            db_profile = existing.data[0]
            print(f"DEBUG: Syncing metadata for existing user: {email}")
            
            update_payload = {"updated_at": "now()"}
            should_update = False

            # Only update if metadata is present AND different from what's in DB
            if full_name and full_name != db_profile.get("full_name"):
                update_payload["full_name"] = full_name
                should_update = True
                
            if avatar_url and avatar_url != db_profile.get("avatar_url"):
                update_payload["avatar_url"] = avatar_url
                should_update = True
                
            if should_update:
                print(f"DEBUG: Metadata differs from DB for {email}, updating...")
                supabase.table("profiles").update(update_payload).eq("id", user_id).execute()
            else:
                print(f"DEBUG: Metadata for {email} matches DB or is empty, skipping update.")
        
        return {
            "status": "success",
            "message": "User verified and synchronized",
            "user": {"id": user_id, "email": email}
        }

    except Exception as e:
        print(f"Verification Error: {str(e)}")
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")

# Chat & History Endpoints 

@app.get("/chats")
async def get_chats(authorization: str = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Authorization Header")
    
    token = authorization.replace("Bearer ", "")
    user = supabase.auth.get_user(token).user
    if not user:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    response = supabase.table("chats").select("*").eq("user_id", user.id).order("updated_at", desc=True).execute()
    return response.data

@app.post("/chats")
async def create_chat(payload: dict, authorization: str = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Authorization Header")
    
    token = authorization.replace("Bearer ", "")
    user = supabase.auth.get_user(token).user
    if not user:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    chat_data = {
        "user_id": user.id,
        "title": payload.get("title", "New Chat")
    }
    response = supabase.table("chats").insert(chat_data).execute()
    return response.data[0]

@app.get("/chats/{chat_id}/messages")
async def get_messages(chat_id: str, authorization: str = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Authorization Header")
    
    token = authorization.replace("Bearer ", "")
    user = supabase.auth.get_user(token).user
    if not user:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    # Ensure chat belongs to user
    chat = supabase.table("chats").select("user_id").eq("id", chat_id).execute()
    if not chat.data or chat.data[0]["user_id"] != user.id:
        raise HTTPException(status_code=403, detail="Forbidden")

    response = supabase.table("messages").select("*").eq("chat_id", chat_id).order("created_at", desc=False).execute()
    return response.data

@app.post("/chats/{chat_id}/messages")
async def add_message(chat_id: str, payload: dict, authorization: str = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Authorization Header")
    
    token = authorization.replace("Bearer ", "")
    user = supabase.auth.get_user(token).user
    if not user:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    # Ensure chat belongs to user
    chat = supabase.table("chats").select("user_id").eq("id", chat_id).execute()
    if not chat.data or chat.data[0]["user_id"] != user.id:
        raise HTTPException(status_code=403, detail="Forbidden")

    message_data = {
        "chat_id": chat_id,
        "user_id": user.id,
        "role": payload.get("role"),
        "content": payload.get("content"),
        "metadata": payload.get("metadata", {})
    }
    
    response = supabase.table("messages").insert(message_data).execute()
    
    # Update chat timestamp
    supabase.table("chats").update({"updated_at": "now()"}).eq("id", chat_id).execute()
    
    return response.data[0]

# Include AI Routes
app.include_router(ai_router)
