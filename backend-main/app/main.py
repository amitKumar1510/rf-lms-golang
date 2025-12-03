from fastapi import FastAPI,Query, HTTPException, status,Request
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from app.api import APIMiddleware
from app.api.routes import users_routes
from app.api.routes.teacher_routes import router as teacher_router
from app.api.routes.student_routes import router as student_router
from app.api.routes.principle_routes import router as principle_router
from app.api.routes.parent_routes import router as parent_router
from app.api.routes.content_routes import router as content_router
from app.templates.send_credentials import MailTemplatesService
from app.config.database import create_tables
from sqlalchemy import orm

app = FastAPI()

app.add_middleware(APIMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

create_tables()
# Configure all mappers to ensure relationships are properly set up
orm.configure_mappers()
@app.get("/health")
def read_root():
    return {"message": "Welcome to LMS Backend :)"} 

@app.post("/send-test-email")
async def send_custom_email():
    return await MailTemplatesService.send_credentials_template(
        email="test.demo@yopmail.com", name="Test User", role="manager", password="Test@1234", created_by="Test Restaurant")

app.include_router(users_routes.router, prefix="/api/users", tags=["Users"])
app.include_router(teacher_router, prefix="/api/teachers", tags=["Teachers"])
app.include_router(student_router, prefix="/api/students", tags=["Students"])
app.include_router(principle_router, prefix="/api/principles", tags=["Principles"])
app.include_router(parent_router, prefix="/api/parents", tags=["Parents"])
app.include_router(content_router, prefix="/api/content", tags=["Content"])
