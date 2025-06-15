from fastapi import APIRouter, HTTPException, Body, UploadFile, File, Form, Depends
from fastapi.responses import StreamingResponse
from typing import Optional, List, Dict
import os
import logging
import traceback
import sys
import json
from pydantic import BaseModel
from app.utils.auth_utils import get_current_user

# Import utility functions
from app.utils.tts_utils import generate_speech_from_text, transcribe_speech_from_audio, llm_learner_response, evaluate

# Set up logger
logger = logging.getLogger("tts_router")
logger.setLevel(logging.DEBUG)
handler = logging.StreamHandler(sys.stdout)
handler.setLevel(logging.DEBUG)
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
handler.setFormatter(formatter)
logger.addHandler(handler)

router = APIRouter(
    prefix="/tts",
    tags=["text-to-speech"],
    dependencies=[Depends(get_current_user)]
)

class TTSRequest(BaseModel):
    text: str
    language: Optional[str] = "en"

class STTRequest(BaseModel):
    language_code: Optional[str] = "en-US"
    sample_rate_hertz: Optional[int] = 16000

# @router.get("/generate")
# async def generate_speech_get(text: str, language: Optional[str] = "en"):
#     """
#     Generate speech from text using Google Text-to-Speech (GET version)
#     """
#     return await generate_speech(text, language)

@router.post("/generate")
async def generate_speech_post(request: TTSRequest = Body(...)):
    """
    Generate speech from text using Google Text-to-Speech (POST version)
    """
    text = request.text
    # Sanitize text to prevent JSON string breaking
    # Replace problematic characters and escape sequences
    return await generate_speech(text, request.language)

@router.post("/transcribe")
async def transcribe_speech(
    audio_file: UploadFile = File(...),
    language_code: str = "en-US"
):
    """
    Transcribe speech from audio file using Google Cloud Speech-to-Text API
    """
    try:
        logger.debug(f"Received audio file: {audio_file.filename}, content_type: {audio_file.content_type}")
        
        # Read the uploaded file
        audio_content = await audio_file.read()
        logger.debug(f"Audio content size: {len(audio_content)} bytes")
        
        # Use the utility function for transcription
        transcriptions = await transcribe_speech_from_audio(
            audio_content=audio_content,
            language_code=language_code
        )
        
        return {"transcriptions": transcriptions}
            
    except Exception as e:
        error_msg = f"Error in transcribe_speech: {str(e)}"
        logger.error(error_msg)
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=error_msg)



@router.post("/generate_llm_response")
async def generate_llm_response(
    audio_file: UploadFile = File(...),
    chat_history_json: str = Form(...),  # JSON string representation of List[Dict[str, str]]
    language_code: str = Form("en-US")
):
    """
    Process audio speech and chat history to generate LLM text response
    
    1. Takes audio input and converts to text using speech-to-text
    2. Appends the text to chat history as user message
    3. Gets LLM response as a learner
    4. Returns the LLM text response directly (not as audio)
    """
    try:
        logger.debug(f"Received audio file: {audio_file.filename}, content_type: {audio_file.content_type}")

        
        # Parse the JSON string into a list of message dictionaries
        chat_history = json.loads(chat_history_json)
        print("chat_history: ", type(chat_history), chat_history[0], type(chat_history[0]))
        chat_history = [json.loads(message) for message in chat_history]
        # Validate that chat_history is an array
        if not isinstance(chat_history, list):
            raise HTTPException(status_code=400, detail="chat_history_json must be a JSON array of message objects")
        
        # Convert speech to text
        audio_content = await audio_file.read()
        transcriptions = await transcribe_speech_from_audio(
            audio_content=audio_content,
            language_code=language_code
        )
        
        if not transcriptions:
            raise HTTPException(status_code=400, detail="Could not transcribe audio, please try again")
        
        # Get the best transcription (highest confidence)
        full_transcription = " ".join([t["transcript"] for t in transcriptions])
        
        # Add user message to chat history using full transcription
        chat_history.append({
            "role": "user",
            "content": full_transcription
        })
        
        # Get LLM response
        llm_response = llm_learner_response(chat_history)
        
        # Return the LLM text response and updated chat history
        return {
            "response": llm_response, 
            "transcribed_text": full_transcription,
        }
            
    except json.JSONDecodeError:
        error_msg = "Invalid JSON format for chat_history_json"
        logger.error(error_msg)
        raise HTTPException(status_code=400, detail=error_msg)
    except Exception as e:
        error_msg = f"Error in generate_llm_response: {str(e)}"
        logger.error(error_msg)
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=error_msg)

@router.post("/evaluate")
async def evaluate_response(
    chat_history_json: str = Form(...)
):
    """
    Evaluate the quality of the chat history
    """

    return evaluate(chat_history_json)


async def generate_speech(text: str, language: str):
    """
    Common function to generate speech
    """
    try:
        # Use the utility function for speech generation
        audio_file = await generate_speech_from_text(text, language)
        
        # Create a streaming response
        async def cleanup():
            try:
                os.unlink(audio_file.name)
            except Exception:
                pass  # Ignore cleanup errors
        
        return StreamingResponse(
            audio_file,
            media_type="audio/mpeg",
            background=cleanup
        )
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 


