def get_email_template(country: str, url: str):
    country = country.lower()

    if country == "germany":
        return {
            "subject": "Kurze technische Analyse Ihrer Website",
            "body": f"""
Hallo,

wir haben Ihre Website ({url}) technisch analysiert und einige Punkte gefunden,
die Performance, SEO und Ladezeit betreffen.

Falls Sie möchten, erkläre ich Ihnen das kurz und unverbindlich.

Viele Grüße
"""
        }

    if country == "switzerland":
        return {
            "subject": "Quick technical review of your website",
            "body": f"""
Hello,

we analyzed your website ({url}) and noticed a few technical improvements
related to speed and structure.

If you'd like, I can explain this briefly.

Best regards
"""
        }

    if country == "sweden":
        return {
            "subject": "Technical review of your website",
            "body": f"""
Hello,

we ran a technical analysis on your website ({url}) and found
some optimization opportunities.

Let me know if you'd like more details.

Best regards
"""
        }

    # fallback
    return {
        "subject": "Website technical analysis",
        "body": f"""
Hello,

we analyzed your website ({url}) and found some technical points
that could be improved.

Best regards
"""
    }
