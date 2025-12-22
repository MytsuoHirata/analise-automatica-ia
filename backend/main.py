from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
import aiosmtplib
from email.message import EmailMessage
import os
from dotenv import load_dotenv
from email_templates import get_email_template
import re
import requests
from bs4 import BeautifulSoup

def extract_email(url: str):
    try:
        r = requests.get(url, timeout=8, headers={
            "User-Agent": "Mozilla/5.0"
        })
        soup = BeautifulSoup(r.text, "html.parser")

        # mailto
        for a in soup.select("a[href^=mailto]"):
            email = a.get("href").replace("mailto:", "").strip()
            if "@" in email:
                return email

        # texto geral
        text = soup.get_text()
        match = re.search(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+", text)
        if match:
            return match.group(0)

    except:
        return None

    return None

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

SMTP_HOST = os.getenv("SMTP_HOST")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
SMTP_USER = os.getenv("SMTP_USER")
SMTP_PASS = os.getenv("SMTP_PASS")
FROM_EMAIL = os.getenv("FROM_EMAIL")

class EmailRequest(BaseModel):
    to: EmailStr
    subject: str
    body: str

@app.post("/send-email")
async def send_email(data: EmailRequest):
    msg = EmailMessage()
    msg["From"] = FROM_EMAIL
    msg["To"] = data.to
    msg["Subject"] = data.subject
    msg.set_content(data.body)

    try:
        await aiosmtplib.send(
            msg,
            hostname=SMTP_HOST,
            port=SMTP_PORT,
            start_tls=True,
            username=SMTP_USER,
            password=SMTP_PASS,
        )
        return {"status": "sent"}
    except Exception as e:
        return {"status": "error", "error": str(e)}
class SmartEmailRequest(BaseModel):
    to: EmailStr
    url: str
    country: str

@app.post("/send-smart-email")
async def send_smart_email(data: SmartEmailRequest):
    template = get_email_template(data.country, data.url)

    msg = EmailMessage()
    msg["From"] = FROM_EMAIL
    msg["To"] = data.to
    msg["Subject"] = template["subject"]
    msg.set_content(template["body"])

    try:
        await aiosmtplib.send(
            msg,
            hostname=SMTP_HOST,
            port=SMTP_PORT,
            start_tls=True,
            username=SMTP_USER,
            password=SMTP_PASS,
        )
        return {"status": "sent"}
    except Exception as e:
        return {"status": "error", "error": str(e)}
