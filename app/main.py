from fastapi import FastAPI,Query, HTTPException, status,Request
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.api import APIMiddleware
from app.api.routes import (
    user_routes,
    admin_route,
    subadmin_route,
    class_route,
    subject_route,
    department_route,
    student_route,
    teacher_route,
    principle_route,
    parent_route,
    module_route,
    submodule_route,
    content_route,
    assignment_route,
    chat_route,
    notification_route,
    ws_route,
)
from app.templates.send_credentials import MailTemplatesService
from app.config.database import create_tables
from sqlalchemy import orm
import os

app = FastAPI()

# Mount static files directory for serving uploaded content
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.add_middleware(APIMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:5173", "http://127.0.0.1:5173"],
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

app.include_router(user_routes.router, prefix="/api/users", tags=["Users"])
app.include_router(admin_route.router, prefix="/api/admin", tags=["Admin"])
app.include_router(subadmin_route.router, prefix="/api/subadmin", tags=["Subadmin"])
app.include_router(class_route.router, prefix="/api/class", tags=["Class"])
app.include_router(subject_route.router, prefix="/api/subject", tags=["Subject"])
app.include_router(department_route.router, prefix="/api/department", tags=["Department"])
app.include_router(student_route.router, prefix="/api/student", tags=["Student"])
app.include_router(teacher_route.router, prefix="/api/teacher", tags=["Teacher"])
app.include_router(principle_route.router, prefix="/api/principle", tags=["Principle"])
app.include_router(parent_route.router, prefix="/api/parent", tags=["Parent"])
app.include_router(module_route.router, prefix="/api/module", tags=["Module"])
app.include_router(submodule_route.router, prefix="/api/submodule", tags=["Submodule"])
app.include_router(content_route.router, prefix="/api/content", tags=["Content"])
app.include_router(assignment_route.router, prefix="/api/assignment", tags=["Assignment"])
app.include_router(chat_route.router, prefix="/api/chat", tags=["Chat"])
app.include_router(notification_route.router, prefix="/api/notification", tags=["Notification"])
app.include_router(ws_route.router)







