# main.py
from fastapi import FastAPI, Request, Form, HTTPException
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
import openai
import os
from dotenv import load_dotenv
from pydantic import BaseModel

# Load environment variables from .env file
load_dotenv()

# Set up OpenAI API key
openai.api_key = os.getenv("OPENAI_API_KEY")

app = FastAPI(title="Real-Time Translation Service")

# Mount static files directory
app.mount("/static", StaticFiles(directory="static"), name="static")

# Set up Jinja2 templates
templates = Jinja2Templates(directory="templates")

class TranslationRequest(BaseModel):
    text: str
    source_language: str
    target_language: str

@app.get("/", response_class=HTMLResponse)
async def read_root(request: Request):
    """Render the main page"""
    return templates.TemplateResponse("index.html", {"request": request})

@app.post("/translate/")
async def translate_text(translation_request: TranslationRequest):
    """Translate text using GPT-4"""
    try:
        prompt = f"Translate the following text from {translation_request.source_language} to {translation_request.target_language}:\n\n{translation_request.text}"
        
        response = openai.ChatCompletion.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are a professional translator. Provide accurate translations without additional comments."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=1024,
            temperature=0.2
        )
        
        translated_text = response.choices[0].message.content.strip()
        return {"translated_text": translated_text}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Run with: uvicorn main:app --reload