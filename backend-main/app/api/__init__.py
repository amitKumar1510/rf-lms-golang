from fastapi import Request, HTTPException,Depends
from typing import Optional, Dict, List
from jose import jwt
from jose.exceptions import ExpiredSignatureError, JWTError
from datetime import datetime
from fastapi.responses import JSONResponse
from app.services.user_service import UserService
from starlette.middleware.base import BaseHTTPMiddleware
from app.config.database import get_db, SessionLocal
from dotenv import load_dotenv
import os
load_dotenv()
secret_key = os.getenv("SECRET_KEY")

class APIMiddleware(BaseHTTPMiddleware):
    def __init__(self, app):
        super().__init__(app)
        self.secret_key = secret_key

    async def dispatch(self, request: Request, call_next):
        try:
            if request.method == "OPTIONS" or self.should_skip_auth(request.url.path):
                return await call_next(request)
            token = await self.get_token(request)
            if not token:
                raise HTTPException(status_code=401, detail="Token not found")

            user = await self.verify_token(token)
            if not user:
                raise HTTPException(status_code=401, detail="Invalid token")
            request.state.user = user
            response = await call_next(request)
            return response

        except HTTPException as e:
            return self.error_response(e.status_code, e.detail)
        except Exception as e:
            return self.error_response(500, str(e))

    def should_skip_auth(self, path: str) -> bool:
        # Add paths that don't need authentication
        skip_paths = [
            "/api/users/public",  # Updated for LMS users
            "/docs",
             "/openapi.json",
            "/health",
        ]
        return any(path.startswith(skip_path) for skip_path in skip_paths)

    async def get_token(self, request: Request) -> Optional[str]:
        auth_header = request.headers.get("Authorization") or request.headers.get("authorization")
        if auth_header:
            parts = auth_header.split()
            if len(parts) == 2 and parts[0].lower() == "bearer":
                return parts[1]
        token = request.cookies.get("auth")
        if token:
            return token
        return None
    
    async def verify_token(self, token: str):
        try:
            payload = jwt.decode(token, secret_key, algorithms=["HS256"])
            userEmail: str = payload.get("sub")
            userRole: str = payload.get("role")
            if userEmail is None or userRole is None:
                print("Payload is None")
                return None

            db = SessionLocal()
            try:
                    return UserService.get_user_by_email(db, userEmail)
            finally:
                db.close()

        except ExpiredSignatureError:
            raise HTTPException(status_code=401, detail="Token has expired")
        except JWTError:
            raise HTTPException(status_code=401, detail="Invalid token")


    def error_response(self, status_code: int, detail: str):
        return JSONResponse(
            status_code=status_code,
            content={
                "status": "error",
                "detail": detail,
                "timestamp": datetime.now().isoformat()
            }
        )