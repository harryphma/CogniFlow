import google.generativeai as genai
import PyPDF2
import typing_extensions as typing
import os
from dotenv import load_dotenv
import json

class Card(typing.TypedDict):
    question: str
    answer: str

load_dotenv()
api_key = os.getenv("API_KEY")
genai.configure(api_key=api_key)

def parsePDF_to_text(file_name):
    #take an input pdf, convert to text
    text = ""
    with open(file_name, "rb") as file:
        reader = PyPDF2.PdfReader(file)
        for page in reader.pages:
            text += page.extract_text() or ''
    return text

def generate_cards(text):

    # Define the model and prompt
    model = genai.GenerativeModel(
        'gemini-2.0-flash',  
        generation_config={
            "temperature": 0.1,
            "top_p": 0.8,
            "top_k": 40,
        }
    )
    
    prompt = f"""
    You are a JSON generator. Your task is to create exactly 10 flashcards from the given text.
    You must respond with ONLY a JSON array containing exactly 10 objects.
    
    Each object in the array must have exactly these two fields:
    - "question": A clear, concise question about the text
    - "answer": The corresponding answer from the text
    
    Example format:
    [
        {{"question": "What is X?", "answer": "X is Y"}},
        {{"question": "How does Z work?", "answer": "Z works by..."}}
    ]
    
    IMPORTANT:
    1. Respond with ONLY the JSON array - no other text, no explanations
    2. The response must start with [ and end with ]
    3. Use double quotes for all strings
    4. Include exactly 10 flashcards
    5. Each flashcard must be unique
    
    Text to process:
    {text}
    """

    try:
        # Generate the flashcards
        response = model.generate_content(prompt)
        response_text = response.text.strip()
        
        response_text = response_text.replace('```json', '').replace('```', '').strip()
        
        # Ensure the response starts with [ and ends with ]
        if not response_text.startswith('['):
            response_text = '[' + response_text
        if not response_text.endswith(']'):
            response_text = response_text + ']'
            
        # Convert the response text to JSON
        flashcards = json.loads(response_text)
        
        if not isinstance(flashcards, list):
            raise ValueError("Response is not a JSON array")
            
        # Format and validate the flashcards
        formatted_flashcards = []
        for card in flashcards:
            if not isinstance(card, dict):
                continue
            question = card.get("question", "").strip()
            answer = card.get("answer", "").strip()
            if question and answer:
                formatted_flashcards.append({
                    "question": question,
                    "answer": answer
                })
        
        # Ensure we have exactly 10 cards
        if len(formatted_flashcards) != 10:
            raise ValueError(f"Expected 10 cards, got {len(formatted_flashcards)}")
            
        return formatted_flashcards
        
    except json.JSONDecodeError as e:
        print(f"Failed to parse JSON response: {e}")
        print(f"Raw response: {response_text}")
        return []
    except Exception as e:
        print(f"Error generating flashcards: {e}")
        print(f"Raw response: {response_text}")
        return []


def topic_selection(subject):
    """
    Generate flashcards based on a user-provided subject.
    
    Args:
        subject (str): The subject or topic to generate flashcards for (e.g., "Arithmetic")
        
    Returns:
        list: A list of flashcards with question and answer pairs
    """

    # Define the model and prompt
    model = genai.GenerativeModel(
        'gemini-2.0-flash',  
        generation_config={
            "temperature": 0.7,  # Slightly higher temperature for more creative responses
            "top_p": 0.8,
            "top_k": 40,
        }
    )
    
    prompt = f"""
    You are a JSON generator. Your task is to create exactly 10 flashcards about the subject: {subject}.
    You must respond with ONLY a JSON array containing exactly 10 objects.
    
    Each object in the array must have exactly these two fields:
    - "question": A clear, concise question about the subject
    - "answer": The corresponding answer
    
    Example format:
    [
        {{"question": "What is X?", "answer": "X is Y"}},
        {{"question": "How does Z work?", "answer": "Z works by..."}}
    ]
    
    IMPORTANT:
    1. Respond with ONLY the JSON array - no other text, no explanations
    2. The response must start with [ and end with ]
    3. Use double quotes for all strings
    4. Include exactly 10 flashcards
    5. Each flashcard must be unique
    6. Focus on the main concepts of {subject}
    7. Make questions and answers educational and informative
    """

    try:
        # Generate the flashcards
        response = model.generate_content(prompt)
        response_text = response.text.strip()
        
        
        # Clean the response text
        response_text = response_text.replace('```json', '').replace('```', '').strip()
        
        # Ensure the response starts with [ and ends with ]
        if not response_text.startswith('['):
            response_text = '[' + response_text
        if not response_text.endswith(']'):
            response_text = response_text + ']'
            
        # Convert the response text to JSON
        flashcards = json.loads(response_text)
        
        if not isinstance(flashcards, list):
            raise ValueError("Response is not a JSON array")
            
        # Format and validate the flashcards
        formatted_flashcards = []
        for card in flashcards:
            if not isinstance(card, dict):
                continue
            question = card.get("question", "").strip()
            answer = card.get("answer", "").strip()
            if question and answer:
                formatted_flashcards.append({
                    "question": question,
                    "answer": answer
                })
        
        # Ensure we have exactly 10 cards
        if len(formatted_flashcards) != 10:
            raise ValueError(f"Expected 10 cards, got {len(formatted_flashcards)}")
            
        return formatted_flashcards
        
    except json.JSONDecodeError as e:
        print(f"Failed to parse JSON response: {e}")
        print(f"Raw response: {response_text}")
        return []
    except Exception as e:
        print(f"Error generating flashcards: {e}")
        print(f"Raw response: {response_text}")
        return []

def edit_flashcards(flashcards, user_input):
    """
    Edit existing flashcards based on user input using the Gemini API.
    
    Args:
        flashcards (list): The original list of flashcards
        user_input (str): User instructions for modifying the flashcards
        
    Returns:
        list: The updated list of flashcards
    """

    # Define the model and prompt
    model = genai.GenerativeModel(
        'gemini-2.0-flash',  
        generation_config={
            "temperature": 0.3,  # Lower temperature for more consistent edits
            "top_p": 0.8,
            "top_k": 40,
        }
    )
    
    # Convert flashcards to a string representation
    flashcards_str = json.dumps(flashcards, indent=2)
    
    prompt = f"""
    You are a JSON editor. Your task is to modify the following flashcards based on the user's instructions.
    You must respond with ONLY a JSON array containing the modified flashcards.
    
    Current flashcards:
    {flashcards_str}
    
    User instructions:
    {user_input}
    
    IMPORTANT:
    1. Respond with ONLY the JSON array - no other text, no explanations
    2. The response must start with [ and end with ]
    3. Use double quotes for all strings
    4. Maintain the same number of flashcards
    5. Each flashcard must have exactly these two fields: "question" and "answer"
    6. Follow the user's instructions precisely
    7. If the user wants to add new flashcards, add them to the array
    8. If the user wants to remove flashcards, remove them from the array
    9. If the user wants to modify specific flashcards, modify them according to the instructions
    """

    try:
        # Generate the modified flashcards
        response = model.generate_content(prompt)
        response_text = response.text.strip()
        
        # Debug: Print the raw response
        
        # Clean the response text
        response_text = response_text.replace('```json', '').replace('```', '').strip()
        
        # Ensure the response starts with [ and ends with ]
        if not response_text.startswith('['):
            response_text = '[' + response_text
        if not response_text.endswith(']'):
            response_text = response_text + ']'
            
        # Convert the response text to JSON
        modified_flashcards = json.loads(response_text)
        
        if not isinstance(modified_flashcards, list):
            raise ValueError("Response is not a JSON array")
            
        # Format and validate the flashcards
        formatted_flashcards = []
        for card in modified_flashcards:
            if not isinstance(card, dict):
                continue
            question = card.get("question", "").strip()
            answer = card.get("answer", "").strip()
            if question and answer:
                formatted_flashcards.append({
                    "question": question,
                    "answer": answer
                })
        
        return formatted_flashcards
        
    except json.JSONDecodeError as e:
        print(f"Failed to parse JSON response: {e}")
        print(f"Raw response: {response_text}")
        return flashcards  # Return original flashcards if parsing fails
    except Exception as e:
        print(f"Error modifying flashcards: {e}")
        print(f"Raw response: {response_text}")
        return flashcards  # Return original flashcards if any error occurs

