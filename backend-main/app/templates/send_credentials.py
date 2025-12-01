from app.core.mail_service import MailService


class MailTemplatesService:
    @staticmethod
    async def send_credentials_template(email: str, name: str, role: str, password: str, created_by: str = None):

        role = role.lower()

        subjects = {
            "admin": "Thank You for Registering your restaurant in RMS",
            "manager": f"Your Manager Account has been Created for {created_by} in RMS",
            "waiter": f"Your Waiter Account has been Created for {created_by} in RMS",
            "cook": f"Your Cook Account has been Created for {created_by} in RMS",
        }

        subject = subjects.get(role, "Your RMS Account Details")

        html_message = f"""
        <html><body>
            <h2>🎉 Welcome to {created_by or 'RMS'}! 🎉</h2>
            <p>Hi <strong>{name}</strong>,</p>
            <p>Your <strong>{role.capitalize()}</strong> account has been created successfully.</p>
            
            <p>Your login credentials:</p>
            <ul>
                <li><strong>Email:</strong> {email}</li>
                <li><strong>Password:</strong> {password}</li>
            </ul>

            <p><strong>Note:</strong> This is a temporary password. Please change it immediately after logging in.</p>
            <p>Best regards,<br/>RMS Team, <br> {f'({created_by})' if created_by else ''}</p>
        </body></html>
        """
        await MailService.send_mail(email, subject, html_message)

    @staticmethod
    async def send_otp_template(email: str, otp: str):
        subject = "Your One-Time Password (OTP) for RMS"
        html_message = f"""
        <html><body>
            <h2>Your OTP for RMS</h2>
            <p>Dear {email},</p>
            <p>Your One-Time Password (OTP) is:</p>
            <h3>{otp}</h3>
            <p>This OTP is valid for the next 10 minutes. Please do not share it with anyone.</p>
            <p>Best regards,<br/>RMS Team</p>
        </body></html>
        """
        await MailService.send_mail(email, subject, html_message)

    @staticmethod
    async def send_notif_password_change(email: str):
        subject = "Your RMS Password Has Been Changed"
        html_message = f"""
        <html><body>
            <h2>Password Changed Notification</h2>
            <p>Dear {email},</p>
            <p>This is to inform you that your RMS account password has been changed successfully.</p>
            <p>If you did not initiate this change, please contact support immediately.</p>
            <p>Best regards,<br/>RMS Team</p>
        </body></html>
        """
        await MailService.send_mail(email, subject, html_message)