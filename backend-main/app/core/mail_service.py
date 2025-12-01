import aiosmtplib
from email.message import EmailMessage
from fastapi import HTTPException
from dotenv import load_dotenv
import os
from aiosmtplib.errors import SMTPAuthenticationError, SMTPConnectError
load_dotenv()

# safe env reads with defaults and strip
RAW_EMAIL = os.getenv("FROM_EMAIL").strip()
EMAIL_FROM = f"RMS <{RAW_EMAIL}>"
EMAIL_HOST = os.getenv("EMAIL_HOST", "smtp.gmail.com").strip()
EMAIL_PORT = int(os.getenv("EMAIL_PORT", "587").strip())
EMAIL_HOST_USER = os.getenv("EMAIL_HOST_USER", "").strip()
EMAIL_HOST_PASSWORD = os.getenv("EMAIL_HOST_PASSWORD", "").strip()
EMAIL_USE_TLS = os.getenv("EMAIL_USE_TLS", "True").lower().strip() in ("1", "true", "yes")
EMAIL_USE_SSL = os.getenv("EMAIL_USE_SSL", "False").lower().strip() in ("1", "true", "yes")

# # validate required settings early so errors are clear
# if not EMAIL_FROM:
#     raise RuntimeError("Missing EMAIL_FROM or FROM_EMAIL env var")
# if not EMAIL_HOST_USER or not EMAIL_HOST_PASSWORD:
#     raise RuntimeError("Missing EMAIL_HOST_USER or EMAIL_HOST_PASSWORD env vars")

class MailService:
    @staticmethod
    async def send_mail(email: str, subject: str, html_message: str):
        try:
            message = EmailMessage()
            message["From"] = EMAIL_FROM
            message["To"] = email
            message["Subject"] = subject
            message.set_content(html_message, subtype="html")

            # choose start_tls (port 587) or use_tls (port 465)
            start_tls = False
            use_tls = False
            if EMAIL_PORT == 465 or EMAIL_USE_SSL:
                use_tls = True
            elif EMAIL_PORT == 587 or EMAIL_USE_TLS:
                start_tls = True

            await aiosmtplib.send(
                message,
                hostname=EMAIL_HOST,
                port=EMAIL_PORT,
                start_tls=start_tls,
                use_tls=use_tls,
                username=EMAIL_HOST_USER,
                password=EMAIL_HOST_PASSWORD,
            )

            return {"message": "Email sent successfully :)"}

        except SMTPAuthenticationError:
            raise HTTPException(
                status_code=500,
                detail=(
                    "SMTP authentication failed. Check EMAIL_HOST_USER and EMAIL_HOST_PASSWORD. "
                    "If using Gmail enable 2-Step Verification and create an App Password."
                ),
            )
        except SMTPConnectError as e:
            raise HTTPException(status_code=500, detail=f"SMTP connection failed: {e}")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Email sending failed: {str(e)}")




