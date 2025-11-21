import os
import google.generativeai as genai
from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from google.protobuf.json_format import MessageToDict # ใช้แปลงค่าจาก Gemini เป็น Dict
from dotenv import load_dotenv

load_dotenv()

GENAI_API_KEY = "AIzaSyB8C-5eReOEy09lk37rNdcWFBewLlKf3MQ" 
genai.configure(api_key=GENAI_API_KEY)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class UserMessage(BaseModel):
    text: str

# --- 2. นิยาม Tool (Function Declaration) ---
# บอก Gemini ว่าเรามีเครื่องมือชื่อ navigate_app
tools_config = [
    {
        "function_declarations": [
            {
                "name": "navigate_app",
                "description": "เปลี่ยนหน้าจอแอปพลิเคชันไปยังหน้า A, B, หรือ C ตามที่ผู้ใช้ต้องการ",
                "parameters": {
                    "type": "OBJECT",
                    "properties": {
                        "destination": {
                            "type": "STRING",
                            "description": "ชื่อหน้าปลายทาง ได้แก่ A, B, C, หรือ Chat",
                            "enum": ["A", "B", "C", "Chat"]
                        }
                    },
                    "required": ["destination"]
                }
            }
        ]
    }
]

model = genai.GenerativeModel(
    model_name='gemini-2.5-flash',
    tools=tools_config,
    system_instruction="คุณเป็น AI Assistant ในแอป. หน้าที่ของคุณคือคุยกับผู้ใช้ และเรียกใช้ฟังก์ชัน navigate_app เมื่อผู้ใช้ต้องการเปลี่ยนหน้า"
)

@app.post("/chat")
async def chat_endpoint(message: UserMessage):
    print(f"User says: {message.text}")
    chat = model.start_chat(enable_automatic_function_calling=False) 

    response = chat.send_message(message.text)
    
    reply_text = ""
    navigate_target = None

    try:
        part = response.candidates[0].content.parts[0]
        
        if part.function_call:
            fc = part.function_call
            if fc.name == "navigate_app":
                args = dict(fc.args) 
                navigate_target = args.get("destination")
                
                reply_text = f"รับทราบครับ! (Gemini สั่งย้ายไปหน้า {navigate_target})"
                print(f"--- Action Detected: Move to {navigate_target} ---")
        else:
            reply_text = part.text
            
    except Exception as e:
        print(f"Error parsing response: {e}")
        reply_text = "ระบบขัดข้องชั่วคราวครับ"

    return {
        "reply": reply_text,
        "navigate_to": navigate_target
    }


# วิธีรัน: uvicorn server:app --host 0.0.0.0 --port 8000 --reload
