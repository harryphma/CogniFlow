from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from app.routers.tts import router as tts_router
from app.routers.gemini import router as gemini_router
from app.routers.auth import router as auth_router
from starlette.middleware.sessions import SessionMiddleware
import secrets


app = FastAPI()

app.add_middleware(
    SessionMiddleware,
    secret_key=secrets.token_urlsafe(32)  # Generate a random secret key
)

# Include routers
app.include_router(tts_router, prefix="/api")
app.include_router(gemini_router, prefix="/api")
app.include_router(auth_router, prefix="/api")
@app.get("/")
def root():
    return {"message": "Hello World hehe"}


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Or specify the allowed origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)







