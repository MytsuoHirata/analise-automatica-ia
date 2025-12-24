from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests
from bs4 import BeautifulSoup
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os

# ==========================
#   FASTAPI APP
# ==========================
app = FastAPI()

# CORS – obrigatório para funcionar na Vercel
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================
#   MODELS
# ==========================

class AnalyzeRequest(BaseModel):
    url: str


class EmailRequest(BaseModel):
    to: str
    url: str
    country: str


# ==========================
#   EMAIL CONFIG (Railway)
# ==========================

SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
SMTP_USER = os.getenv("SMTP_USER")
SMTP_PASS = os.getenv("SMTP_PASS")
FROM_EMAIL = os.getenv("FROM_EMAIL", SMTP_USER)


# =====================================
#    COUNTRY DETECTION (basic)
# =====================================

def detect_country_from_url(url: str):
    url = url.lower()
    if ".no" in url:
        return "Norway"
    if ".se" in url:
        return "Sweden"
    if ".fi" in url:
        return "Finland"
    if ".dk" in url:
        return "Denmark"
    if ".de" in url:
        return "Germany"
    if ".ch" in url:
        return "Switzerland"
    if ".at" in url:
        return "Austria"
    if ".nl" in url:
        return "Netherlands"
    if ".be" in url:
        return "Belgium"
    return "Unknown"


# =====================================
#        SITE ANALYSIS CORE
# =====================================

def analyze_site(url: str):
    logs = []

    try:
        response = requests.get(url, timeout=6)
        logs.append(f"[+] status code: {response.status_code}")
    except:
        return ["❌ site unreachable"], "Unknown"

    soup = BeautifulSoup(response.text, "html.parser")

    # Títulos
    title = soup.title.string if soup.title else "none"
    logs.append(f"[+] title: {title}")

    # Meta description
    desc = soup.find("meta", attrs={"name": "description"})
    if desc and desc.get("content"):
        logs.append("[+] meta description ok")
    else:
        logs.append("⚠️ no meta description found")

    # Performance warnings
    if "script" in response.text and len(response.text) > 5_000_000:
        logs.append("⚠️ page size too large")

    # Country via URL
    country = detect_country_from_url(url)
    logs.append(f"[+] detected country: {country}")

    return logs, country


# =====================================
#        EMAIL TEMPLATES POR PAÍS
# =====================================

def generate_email(country: str, url: str):
    country = country.lower()

    if country == "norway":
        subject = "Forbedring av nettstedet ditt"
        body = f"""
Hei! Jeg analyserte nettstedet ditt ({url}) og fant noen problemer som kan forbedre resultater og hastigheten.
Hvis du vil, kan jeg sende deg en full rapport :)  
        """

    elif country == "sweden":
        subject = "Förbättring av din webbplats"
        body = f"""
Hej! Jag analyserade din webbplats ({url}) och hittade några punkter som kan förbättras.
Vill du ha en full rapport? :)
        """

    elif country == "germany":
        subject = "Analyse Ihrer Website"
        body = f"""
Hallo! Ich habe Ihre Website ({url}) analysiert und einige Verbesserungsmöglichkeiten gefunden.
Möchten Sie einen vollständigen Bericht erhalten? :)
        """

    else:
        subject = "Website Analysis"
        body = f"""
Hi! I analyzed your website ({url}) and found a few issues that can be improved.
If you want, I can send a full free report :)
        """

    return subject, body


# =====================================
#             SEND EMAIL
# =====================================

def send_email(to: str, subject: str, body: str):
    msg = MIMEMultipart()
    msg["From"] = FROM_EMAIL
    msg["To"] = to
    msg["Subject"] = subject

    msg.attach(MIMEText(body, "plain"))

    try:
        server = smtplib.SMTP(SMTP_HOST, SMTP_PORT)
        server.starttls()
        server.login(SMTP_USER, SMTP_PASS)
        server.sendmail(FROM_EMAIL, to, msg.as_string())
        server.quit()
        return True

    except Exception as e:
        print("Email error:", e)
        return False


# =====================================
#          ROUTES
# =====================================

@app.get("/")
def root():
    return {"status": "backend online"}


@app.post("/analyze")
def analyze(data: AnalyzeRequest):
    logs, country = analyze_site(data.url)
    return {"logs": logs, "country": country}


@app.post("/send-smart-email")
def smart_email(data: EmailRequest):
    subject, body = generate_email(data.country, data.url)

    ok = send_email(
        to=data.to,
        subject=subject,
        body=body,
    )

    return {"sent": ok, "subject": subject}
