from fastapi import APIRouter, UploadFile, HTTPException, Form, Request, Depends, Body
from typing import Optional, List, Dict, Any
from app.utils.auth_utils import get_current_user
import os
import tempfile
import json
from app.utils.gemini_utils import generate_cards, parsePDF_to_text, topic_selection, edit_flashcards
from typing import List, Dict, Any, Optional

router = APIRouter(
    prefix="/gemini",
    tags=["gemini"],
    dependencies=[Depends(get_current_user)]
)


@router.post("/auto")
async def auto_generate(request: Request, file: UploadFile, current_user = Depends(get_current_user)):
    # Check if the file is a PDF
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="File must be a PDF")
    
    try:
        # Create a temporary file to store the uploaded PDF
        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as temp_file:
            # Write the uploaded file content to the temporary file
            content = await file.read()
            temp_file.write(content)
            temp_file_path = temp_file.name
        
        # Parse PDF to text
        text = parsePDF_to_text(temp_file_path)
        
        # Generate flashcards
        cards = generate_cards(text)
        if not cards:
            raise HTTPException(status_code=500, detail="Failed to generate flashcards")

        # Save flashcards to session
        save_flashcards_to_session(request, "auto", cards)
        
        # Clean up the temporary file
        os.unlink(temp_file_path)

        user_id = current_user.user.id if hasattr(current_user, 'user') else current_user.id
        
        response_data = {
            "cards": cards,
            "user_id": user_id
        }
        return response_data
        
    except Exception as e:
        # Clean up the temporary file in case of error
        if 'temp_file_path' in locals():
            os.unlink(temp_file_path)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/manual")
async def manual_generate(request: Request, subject: str = Form(...), current_user = Depends(get_current_user)):
    try:
        #print(f"Received subject: {subject}")
        #print(f"Current user: {current_user}")  # Debug current_user object
        
        # Generate flashcards based on the subject
        cards = topic_selection(subject)
        #print(f"Generated cards: {cards}")  # Debug cards
        
        if not cards:
            raise HTTPException(status_code=500, detail="Failed to generate flashcards")
        
        # Save flashcards to session
        save_flashcards_to_session(request, "manual", cards)
        
        user_id = current_user.user.id if hasattr(current_user, 'user') else current_user.id
        #print(f"User ID: {user_id}")  # Debug user_id
            
        response_data = {
            "cards": cards,
            "user_id": user_id
        }
        #print(f"Response data: {response_data}")  # Debug response
        return response_data
        
    except Exception as e:
        print(f"Error in manual_generate: {str(e)}")  # Debug any errors
        import traceback
        print(traceback.format_exc())  # Print full error traceback
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/edit")
async def edit_flashcards_endpoint(
    request: Request,
    user_input: str = Form(...),
    current_flashcards: str = Form(...)  # Changed from optional to required parameter
):
    """
    Edit flashcards based on user input.
    
    Args:
        user_input (str): User instructions for modifying the flashcards
        current_flashcards (str): JSON string of current flashcards from Zustand store
        
    Returns:
        dict: A dictionary containing the updated flashcards
    """
    try:
        # Parse the current flashcards from the request
        try:
            flashcards = json.loads(current_flashcards)
            print(f"Using {len(flashcards)} flashcards from frontend request")
        except json.JSONDecodeError:
            print("Invalid flashcards JSON format from frontend")
            raise HTTPException(status_code=400, detail="Invalid flashcards JSON format")
        
        # If no valid flashcards were provided, return an error
        if not flashcards:
            raise HTTPException(status_code=400, detail="No flashcards provided to edit")
        
        # Match the parameter order with utils.py implementation
        updated_flashcards = edit_flashcards(flashcards, user_input)
        
        return updated_flashcards
        
    except Exception as e:
        print(f"Error editing flashcards: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Helper function to get flashcards from session
def get_flashcards_from_session(request: Request, flashcard_type: str) -> List[Dict[str, str]]:
    """Get flashcards from session or return empty list if not found"""
    if "flashcards" not in request.session:
        request.session["flashcards"] = {}
    
    if flashcard_type not in request.session["flashcards"]:
        request.session["flashcards"][flashcard_type] = []
    
    return request.session["flashcards"][flashcard_type]

# Helper function to save flashcards to session
def save_flashcards_to_session(request: Request, flashcard_type: str, flashcards: List[Dict[str, str]]):
    """Save flashcards to session"""
    if "flashcards" not in request.session:
        request.session["flashcards"] = {}
    
    request.session["flashcards"][flashcard_type] = flashcards

