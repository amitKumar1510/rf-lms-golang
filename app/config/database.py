from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv
load_dotenv()

# use psycopg2 sync driver
DATABASE_URL = os.getenv("POSTGRES_URL")
# print("Database URL:", DATABASE_URL)
engine = create_engine(DATABASE_URL)

# keep ORM objects usable after commit so FastAPI/Pydantic can read attributes
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine, expire_on_commit=False)
 
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def create_tables():
    # Import models in dependency order to ensure relationships are properly configured
    from app.models import users, teacher, student, principle

    # Import individual models to register them with SQLAlchemy
    # Import base models first
    from app.models.users import User, Address, School

    # Import subject-related models
    from app.models.users import Subject, Department

    # Import class-related models
    from app.models.users import Class, ClassSubject, ClassSubjectTeacher, StudentSubjectEnrollment, AcademicSession

    # Import content models (must be imported after Subject)
    from app.models.content import Module, Submodule, Content

    # Import grade and attendance models
    from app.models.grade import StudentGrade
    from app.models.attendance import StudentAttendance

    # Import assignment models
    from app.models.assignment import Assignment, AssignmentQuestion, AssignmentSubmission

    # Import role-specific models
    from app.models.teacher import Teacher, TeacherSubject, TeacherDepartment
    # from app.models.student import Student, StudentSubject
    from app.models.student import Student
    from app.models.principle import Principle
    from app.models.student import StudentsParent

    Base.metadata.create_all(bind=engine)