import os
import json
import sqlite3
import time
import google.generativeai as genai
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

# 1. Config & AI Setup
load_dotenv()
api_key = os.getenv("GOOGLE_API_KEY")
genai.configure(api_key=api_key)

app = FastAPI()

# 2. CORS Security
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. Database Init
def init_db():
    conn = sqlite3.connect('startup_vault.db')
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS roadmaps 
                 (id INTEGER PRIMARY KEY AUTOINCREMENT, niche TEXT, strategy TEXT, analysis TEXT, tech_stack TEXT)''')
    conn.commit()
    conn.close()

init_db()

# 4. Data Models
class StrategyRequest(BaseModel):
    niche: str

# 5. The Main Logic with Rate-Limit Protection
@app.post("/generate-strategy")
async def generate_strategy(request: StrategyRequest):
    # Try up to 3 times if we hit a "429 Rate Limit"
    for attempt in range(3):
        try:
            model = genai.GenerativeModel('gemini-2.0-flash')
            
            prompt = (
                f"Analyze the startup niche: {request.niche}. "
                "Return ONLY a raw JSON object with keys: 'strategy', 'analysis', 'tech_stack'. "
                "Be specific, professional, and provide deep insights."
            )
            
            response = model.generate_content(prompt)
            raw_text = response.text.strip()
            
            # Clean Markdown if AI includes it
            if "```" in raw_text:
                raw_text = raw_text.split("```")[1].replace("json", "").strip()
                
            data = json.loads(raw_text)
            
            # Save to Local Database
            conn = sqlite3.connect('startup_vault.db')
            c = conn.cursor()
            c.execute("INSERT INTO roadmaps (niche, strategy, analysis, tech_stack) VALUES (?, ?, ?, ?)",
                      (request.niche, data['strategy'], data['analysis'], data['tech_stack']))
            conn.commit()
            conn.close()
            
            return data

        except Exception as e:
            error_msg = str(e)
            # If it's a Rate Limit error, wait and retry
            if "429" in error_msg or "quota" in error_msg.lower():
                print(f"Rate limit hit. Waiting 10s... (Attempt {attempt + 1})")
                time.sleep(10)
                continue
            
            print(f"Error Detail: {e}")
            return {
                "strategy": f"AI Error: {error_msg[:50]}...",
                "analysis": "Please ensure your API key is correct and wait a moment.",
                "tech_stack": "Check the terminal for logs."
            }
    
    return {
        "strategy": "The server is currently busy (Quota limit).",
        "analysis": "Please wait 60 seconds and try again.",
        "tech_stack": "Free tier Gemini limits reached."
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)