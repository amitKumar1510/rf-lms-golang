from sqlalchemy.orm import Session
from fastapi import HTTPException, status, Response
from app.models.users import (
    User, School, Address, Subject, Class, ClassSubject, ClassSubjectTeacher, StudentSubjectEnrollment, AcademicSession
)
from app.models.teacher import Teacher, TeacherSubject
from app.models.student import Student, StudentSubject
from app.core.hash import verify_password, hash_password
from app.config.auth import create_access_token
from app.core.utils_functions import generate_id
from datetime import timedelta
from typing import List
from dotenv import load_dotenv
import os
load_dotenv()
DOMAIN = os.getenv("DOMAIN", "localhost")
ACCESS_TOKEN_EXPIRE_HOURS = int(os.getenv("ACCESS_TOKEN_EXPIRE_HOURS", "24"))

class UserService:
    @staticmethod
    def get_user_by_email(db: Session, email: str) -> User:
        """Get user by email"""
        return db.query(User).filter(User.email == email).first()

    @staticmethod
    def get_user_by_id(db: Session, user_id: str) -> User:
        """Get user by ID"""
        return db.query(User).filter(User.id == user_id).first()

    @staticmethod
    def authenticate_user(db: Session, email: str, password: str, role: str = None) -> User:
        """Authenticate user with email and password"""
        user = UserService.get_user_by_email(db, email)

        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )

        # Check if role matches (if role is specified)
        if role and user.role != role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. This account is not a {role}"
            )

        # Verify password
        if not verify_password(password, user.password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )

        # Check if user is active
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is inactive. Please contact administrator"
            )

        return user

    @staticmethod
    def login_user(db: Session, email: str, password: str, role: str = None, response: Response = None):
        """Login user and return token"""
        user = UserService.authenticate_user(db, email, password, role)

        # Create access token
        token_data = {
            "sub": user.email,
            "role": user.role,
            "user_id": user.id
        }

        # Token expires in 24 hours
        access_token = create_access_token(
            data=token_data,
            expires_delta=timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
        )
        token_expiry = timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
        expiry_seconds = int(token_expiry.total_seconds())
        response.set_cookie(
                    key="auth",
                    value=access_token,
                    samesite="Lax",
                    secure=False,
                    max_age=expiry_seconds,
                    expires=expiry_seconds,
                    domain=DOMAIN,
                    path='/'
                )

        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": user,
            "message": f"Login successful. Welcome {user.name}!"
        }

    @staticmethod
    def create_school(db: Session, school_data: dict, admin_id: str) -> School:
        """Create a new school (Admin only)"""
        # Verify admin exists and is admin
        admin = UserService.get_user_by_id(db, admin_id)
        if not admin or admin.role != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only admin can create schools"
            )

        # Generate school ID
        school_id = generate_id(school_data["name"])

        # Format address if provided as object
        address_str = None
        if school_data.get("address"):
            addr = school_data["address"]
            if isinstance(addr, dict):
                # Format structured address into string
                address_parts = []
                if addr.get("street"): address_parts.append(addr["street"])
                if addr.get("city"): address_parts.append(addr["city"])
                if addr.get("state"): address_parts.append(addr["state"])
                if addr.get("country"): address_parts.append(addr["country"])
                if addr.get("postal_code"): address_parts.append(addr["postal_code"])
                address_str = ", ".join(address_parts)
            else:
                # Already a string
                address_str = addr

        # Create school
        school = School(
            id=school_id,
            name=school_data["name"],
            address=address_str,
            phone=school_data.get("phone"),
            email=school_data.get("email"),
            admin_id=admin_id
        )

        db.add(school)
        db.commit()
        db.refresh(school)
        return school

    @staticmethod
    def create_user(db: Session, user_data: dict, created_by: str = None) -> User:
        """Create a new user with role-based authorization"""
        target_role = user_data["role"]

        # Skip authorization for admin creation (public route)
        if target_role != "admin":
            # Get creator's info for authorization
            if not created_by:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Creator is required for non-admin users"
                )

            creator = UserService.get_user_by_id(db, created_by)
            if not creator:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Invalid creator"
                )

            # Check role-based permissions
            creator_role = creator.role

            # Define who can create what
            permissions = {
                "admin": ["school", "subadmin"],  # admin can create schools and subadmins
                "subadmin": ["principle", "teacher", "student", "parent", "subadmin"]  # subadmin can create these roles
            }

            if creator_role not in permissions or target_role not in permissions[creator_role]:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"{creator_role} cannot create {target_role}"
                )

        # Check if email already exists
        existing_user = UserService.get_user_by_email(db, user_data["email"])
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )

        # Handle school assignment for subadmin-created users
        if target_role != "admin" and created_by:
            # For subadmin-created users, ensure they belong to the same school
            if creator_role == "subadmin" and target_role != "subadmin":
                if not user_data.get("school_id"):
                    user_data["school_id"] = creator.school_id
                elif user_data["school_id"] != creator.school_id:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="Cannot create users for different schools"
                    )

            # For subadmin creation by another subadmin, must be same school
            if creator_role == "subadmin" and target_role == "subadmin":
                if not user_data.get("school_id"):
                    user_data["school_id"] = creator.school_id
                elif user_data["school_id"] != creator.school_id:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="Cannot create subadmins for different schools"
                    )

        # Generate user ID
        user_id = generate_id(user_data["name"])

        # Hash password
        hashed_password = hash_password(user_data["password"])

        # Create user object
        user = User(
            id=user_id,
            email=user_data["email"],
            password=hashed_password,
            name=user_data["name"],
            role=user_data["role"],
            school_id=user_data.get("school_id"),
            phone=user_data.get("phone"),
            student_id=user_data.get("student_id"),
            teacher_id=user_data.get("teacher_id"),
            parent_id=user_data.get("parent_id"),
            created_by=created_by
        )

        # Create address if provided
        if user_data.get("address"):
            address_data = user_data["address"]
            address = Address(
                id=generate_id(user_data["name"] + "_address"),
                street=address_data.get("street"),
                city=address_data.get("city"),
                state=address_data.get("state"),
                country=address_data.get("country"),
                postal_code=address_data.get("postal_code"),
                user_id=user_id
            )
            db.add(address)
            user.address = address

        # Create role-specific profile
        if target_role == "teacher" and user_data.get("teacher_data"):
            teacher_data = user_data["teacher_data"]
            teacher = Teacher(
                id=generate_id(user_data["name"] + "_teacher"),
                user_id=user_id,
                qualification=teacher_data.get("qualification"),
                experience_years=teacher_data.get("experience_years"),
                specialization=teacher_data.get("specialization")
            )
            db.add(teacher)

            # Add teacher subjects
            if teacher_data.get("subjects"):
                for subject_data in teacher_data["subjects"]:
                    teacher_subject = TeacherSubject(
                        id=generate_id(f"{user_id}_{subject_data['subject_id']}_teacher"),
                        teacher_id=teacher.id,
                        subject_id=subject_data["subject_id"],
                        is_primary=subject_data.get("is_primary", False),
                        experience_years=subject_data.get("experience_years")
                    )
                    db.add(teacher_subject)

        elif target_role == "student" and user_data.get("student_data"):
            student_data = user_data["student_data"]

            # Validate that class exists and belongs to the same school
            class_obj = db.query(Class).filter(Class.id == student_data["class_id"]).first()
            if not class_obj:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid class ID"
                )
            if class_obj.school_id != user_data.get("school_id"):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Class does not belong to the specified school"
                )

            student = Student(
                id=generate_id(user_data["name"] + "_student"),
                user_id=user_id,
                roll_number=student_data.get("roll_number"),
                date_of_birth=student_data.get("date_of_birth"),
                gender=student_data.get("gender"),
                blood_group=student_data.get("blood_group"),
                class_id=student_data["class_id"],
                admission_date=student_data.get("admission_date"),
                guardian_name=student_data.get("guardian_name"),
                guardian_phone=student_data.get("guardian_phone"),
                guardian_relation=student_data.get("guardian_relation")
            )
            db.add(student)

            # Add student subjects (legacy - for backward compatibility)
            if student_data.get("subjects"):
                for subject_data in student_data["subjects"]:
                    student_subject = StudentSubject(
                        id=generate_id(f"{user_id}_{subject_data['subject_id']}_student"),
                        student_id=student.id,
                        subject_id=subject_data["subject_id"],
                        is_elective=subject_data.get("is_elective", False),
                        priority_order=subject_data.get("priority_order")
                    )
                    db.add(student_subject)

            # Automatically enroll student in all class subjects
            class_subjects = db.query(ClassSubject).filter(ClassSubject.class_id == student_data["class_id"]).all()
            for class_subject in class_subjects:
                enrollment = StudentSubjectEnrollment(
                    id=generate_id(f"{student.id}_{class_subject.id}_enrollment"),
                    student_id=student.id,
                    class_subject_id=class_subject.id,
                    academic_year=class_subject.class_info.academic_year if class_subject.class_info else None
                )
                db.add(enrollment)

        db.add(user)
        db.commit()
        db.refresh(user)
        return user

    @staticmethod
    def get_schools_by_admin(db: Session, admin_id: str):
        """Get all schools created by an admin with their subadmins"""
        admin = UserService.get_user_by_id(db, admin_id)
        if not admin or admin.role != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )

        schools = db.query(School).filter(School.admin_id == admin_id).all()
        
        # Load subadmins for each school
        for school in schools:
            subadmins = db.query(User).filter(
                User.school_id == school.id,
                User.role == "subadmin",
                User.is_deleted == False
            ).all()
            # Attach subadmins to school object (using a custom attribute)
            school.subadmins = subadmins
        
        return schools

    @staticmethod
    def get_users_by_school_and_creator(db: Session, school_id: str, creator_id: str):
        """Get users created by a specific user for a school"""
        creator = UserService.get_user_by_id(db, creator_id)
        if not creator:
            return []

        # Subadmins can only see users from their school
        if creator.role == "subadmin" and creator.school_id != school_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )

        return db.query(User).filter(
            User.school_id == school_id,
            User.created_by == creator_id
        ).all()

    @staticmethod
    def add_subject_to_class(db: Session, class_id: str, subject_data: dict, added_by: str) -> ClassSubject:
        """Add a subject to a class (Subadmin only)"""
        # Verify the user has permission (subadmin of the class's school)
        current_user = UserService.get_user_by_id(db, added_by)
        if current_user.role != "subadmin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only subadmin can add subjects to classes"
            )

        # Verify class exists and belongs to user's school
        class_obj = db.query(Class).filter(Class.id == class_id).first()
        if not class_obj:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Class not found"
            )
        if class_obj.school_id != current_user.school_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )

        # Check if subject is already added to this class
        existing = db.query(ClassSubject).filter(
            ClassSubject.class_id == class_id,
            ClassSubject.subject_id == subject_data["subject_id"]
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Subject already added to this class"
            )

        class_subject = ClassSubject(
            id=generate_id(f"{class_id}_{subject_data['subject_id']}_class_subject"),
            class_id=class_id,
            subject_id=subject_data["subject_id"],
            is_compulsory=subject_data.get("is_compulsory", True),
            credits=subject_data.get("credits")
        )

        db.add(class_subject)
        db.commit()
        db.refresh(class_subject)
        return class_subject

    @staticmethod
    def assign_teacher_to_class_subject(
        db: Session, class_subject_id: str, teacher_data: dict, assigned_by: str
    ) -> ClassSubjectTeacher:
        """Assign a teacher to a class subject (Subadmin only)"""
        # Verify the user has permission (subadmin of the class's school)
        current_user = UserService.get_user_by_id(db, assigned_by)
        if current_user.role != "subadmin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only subadmin can assign teachers to class subjects"
            )

        # Verify class subject exists and belongs to user's school
        class_subject = db.query(ClassSubject).filter(ClassSubject.id == class_subject_id).first()
        if not class_subject:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Class subject not found"
            )
        if class_subject.class_info.school_id != current_user.school_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )

        # Verify teacher exists and belongs to same school
        teacher = db.query(Teacher).filter(Teacher.id == teacher_data["teacher_id"]).first()
        if not teacher:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Teacher not found"
            )
        if teacher.user.school_id != current_user.school_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Teacher does not belong to this school"
            )

        # Check if teacher is already assigned to this class subject
        existing = db.query(ClassSubjectTeacher).filter(
            ClassSubjectTeacher.class_subject_id == class_subject_id,
            ClassSubjectTeacher.teacher_id == teacher_data["teacher_id"],
            ClassSubjectTeacher.is_active == True
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Teacher already assigned to this class subject"
            )

        assignment = ClassSubjectTeacher(
            id=generate_id(f"{class_subject_id}_{teacher_data['teacher_id']}_assignment"),
            class_subject_id=class_subject_id,
            teacher_id=teacher_data["teacher_id"],
            academic_year=teacher_data.get("academic_year")
        )

        db.add(assignment)
        db.commit()
        db.refresh(assignment)
        return assignment

    @staticmethod
    def get_class_subjects(db: Session, class_id: str, user_id: str) -> List[dict]:
        """Get all subjects for a class with teacher assignments"""
        # Verify access permissions
        current_user = UserService.get_user_by_id(db, user_id)
        class_obj = db.query(Class).filter(Class.id == class_id).first()

        if not class_obj:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Class not found"
            )

        # Check permissions based on role
        if current_user.role == "subadmin" and class_obj.school_id != current_user.school_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )

        class_subjects = db.query(ClassSubject).filter(ClassSubject.class_id == class_id).all()
        result = []

        for cs in class_subjects:
            # Get assigned teachers
            assignments = db.query(ClassSubjectTeacher).filter(
                ClassSubjectTeacher.class_subject_id == cs.id,
                ClassSubjectTeacher.is_active == True
            ).all()

            teachers = []
            for assignment in assignments:
                teachers.append({
                    "id": assignment.id,
                    "teacher_id": assignment.teacher_id,
                    "teacher": {
                        "id": assignment.teacher.id,
                        "user_id": assignment.teacher.user_id,
                        "name": assignment.teacher.user.name,
                        "qualification": assignment.teacher.qualification
                    },
                    "academic_year": assignment.academic_year,
                    "assigned_at": assignment.created_at
                })

            result.append({
                "id": cs.id,
                "class_id": cs.class_id,
                "subject_id": cs.subject_id,
                "subject": {
                    "id": cs.subject.id,
                    "name": cs.subject.name,
                    "code": cs.subject.code
                },
                "is_compulsory": cs.is_compulsory,
                "credits": cs.credits,
                "teachers": teachers,
                "created_at": cs.created_at
            })

        return result

    @staticmethod
    def remove_teacher_from_class_subject(
        db: Session, assignment_id: str, removed_by: str
    ) -> bool:
        """Remove a teacher assignment from a class subject (Subadmin only)"""
        # Verify permissions
        current_user = UserService.get_user_by_id(db, removed_by)
        if current_user.role != "subadmin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only subadmin can remove teacher assignments"
            )

        # Find the assignment
        assignment = db.query(ClassSubjectTeacher).filter(ClassSubjectTeacher.id == assignment_id).first()
        if not assignment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Assignment not found"
            )

        # Verify the assignment belongs to user's school
        if assignment.class_subject.class_info.school_id != current_user.school_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )

        # Soft delete - deactivate the assignment
        assignment.is_active = False
        db.commit()

        return True

    @staticmethod
    def remove_subject_from_class(db: Session, class_subject_id: str, removed_by: str) -> bool:
        """Remove a subject from a class (Subadmin only)"""
        # Verify permissions
        current_user = UserService.get_user_by_id(db, removed_by)
        if current_user.role != "subadmin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only subadmin can remove subjects from classes"
            )

        # Find the class subject
        class_subject = db.query(ClassSubject).filter(ClassSubject.id == class_subject_id).first()
        if not class_subject:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Class subject not found"
            )

        # Verify it belongs to user's school
        if class_subject.class_info.school_id != current_user.school_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )

        # Remove all teacher assignments first
        db.query(ClassSubjectTeacher).filter(
            ClassSubjectTeacher.class_subject_id == class_subject_id
        ).delete()

        # Remove the class subject
        db.delete(class_subject)
        db.commit()

        return True

    @staticmethod
    def update_class_subject(db: Session, class_subject_id: str, update_data: dict, updated_by: str) -> ClassSubject:
        """Update a class subject (compulsory status, credits) (Subadmin only)"""
        # Verify permissions
        current_user = UserService.get_user_by_id(db, updated_by)
        if current_user.role != "subadmin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only subadmin can update class subjects"
            )

        # Find the class subject
        class_subject = db.query(ClassSubject).filter(ClassSubject.id == class_subject_id).first()
        if not class_subject:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Class subject not found"
            )

        # Verify it belongs to user's school
        if class_subject.class_info.school_id != current_user.school_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )

        # Update fields
        if "is_compulsory" in update_data and update_data["is_compulsory"] is not None:
            class_subject.is_compulsory = update_data["is_compulsory"]
        if "credits" in update_data:
            class_subject.credits = update_data["credits"]

        db.commit()
        db.refresh(class_subject)
        return class_subject

    @staticmethod
    def create_subject(db: Session, subject_data: dict, school_id: str) -> Subject:
        """Create a new subject for a school (Subadmin only)"""
        # Check if subject code already exists for this school
        existing_subject = db.query(Subject).filter(
            Subject.school_id == school_id,
            ((Subject.code == subject_data["code"]) | (Subject.name == subject_data["name"]))
        ).first()
        if existing_subject:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Subject with this code or name already exists for this school"
            )

        subject = Subject(
            id=generate_id(subject_data["name"] + "_subject"),
            name=subject_data["name"],
            code=subject_data["code"],
            description=subject_data.get("description"),
            school_id=school_id
        )

        db.add(subject)
        db.commit()
        db.refresh(subject)
        return subject

    @staticmethod
    def create_class(db: Session, class_data: dict, school_id: str) -> Class:
        """Create a new class for a school"""
        # Verify school exists
        school = db.query(School).filter(School.id == school_id).first()
        if not school:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="School not found"
            )

        # Check for duplicate class name in the same school
        existing_class = db.query(Class).filter(
            Class.school_id == school_id,
            Class.name == class_data["name"]
        ).first()
        if existing_class:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Class with this name already exists in the school"
            )

        class_obj = Class(
            id=generate_id(f"{school.name}_{class_data['name']}_class"),
            name=class_data["name"],
            grade_level=class_data["grade_level"],
            section=class_data["section"],
            academic_year=class_data.get("academic_session") or class_data.get("academic_year"),  # Use academic_session, fallback to academic_year for backward compatibility
            # academic_session=class_data.get("academic_session") or class_data.get("academic_year"),  # Set both for consistency
            capacity=class_data.get("capacity"),
            school_id=school_id,
            class_teacher_id=class_data.get("class_teacher_id")
        )

        db.add(class_obj)
        db.commit()
        db.refresh(class_obj)
        return class_obj

    @staticmethod
    def update_subject(db: Session, subject_id: str, update_data: dict, updated_by: str) -> Subject:
        """Update a subject (Subadmin only)"""
        current_user = UserService.get_user_by_id(db, updated_by)
        if current_user.role != "subadmin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only subadmin can update subjects"
            )

        subject = db.query(Subject).filter(Subject.id == subject_id).first()
        if not subject:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Subject not found"
            )

        # Verify it belongs to user's school
        if subject.school_id != current_user.school_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )

        # Update fields
        if "name" in update_data:
            subject.name = update_data["name"]
        if "code" in update_data:
            # Check if code already exists
            existing = db.query(Subject).filter(
                Subject.school_id == current_user.school_id,
                Subject.code == update_data["code"],
                Subject.id != subject_id
            ).first()
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Subject code already exists"
                )
            subject.code = update_data["code"]
        if "description" in update_data:
            subject.description = update_data["description"]
        if "is_active" in update_data:
            subject.is_active = update_data["is_active"]

        db.commit()
        db.refresh(subject)
        return subject

    @staticmethod
    def delete_subject(db: Session, subject_id: str, deleted_by: str) -> bool:
        """Delete a subject (soft delete) (Subadmin only)"""
        current_user = UserService.get_user_by_id(db, deleted_by)
        if current_user.role != "subadmin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only subadmin can delete subjects"
            )

        subject = db.query(Subject).filter(Subject.id == subject_id).first()
        if not subject:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Subject not found"
            )

        # Verify it belongs to user's school
        if subject.school_id != current_user.school_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )

        # Soft delete
        subject.is_deleted = True
        subject.is_active = False
        db.commit()
        return True

    @staticmethod
    def get_subjects_by_school(db: Session, school_id: str):
        """Get all active subjects for a specific school"""
        return db.query(Subject).filter(
            Subject.school_id == school_id,
            Subject.is_active == True,
            Subject.is_deleted == False
        ).all()

    @staticmethod
    def update_class(db: Session, class_id: str, update_data: dict, updated_by: str) -> Class:
        """Update a class (Subadmin only)"""
        current_user = UserService.get_user_by_id(db, updated_by)
        if current_user.role != "subadmin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only subadmin can update classes"
            )

        class_obj = db.query(Class).filter(Class.id == class_id).first()
        if not class_obj:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Class not found"
            )

        # Verify it belongs to user's school
        if class_obj.school_id != current_user.school_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )

        # Update fields
        if "name" in update_data:
            # Check if name already exists
            existing = db.query(Class).filter(
                Class.school_id == current_user.school_id,
                Class.name == update_data["name"],
                Class.id != class_id
            ).first()
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Class name already exists"
                )
            class_obj.name = update_data["name"]
        if "grade_level" in update_data:
            class_obj.grade_level = update_data["grade_level"]
        if "section" in update_data:
            class_obj.section = update_data["section"]
        if "academic_session" in update_data:
            class_obj.academic_session = update_data["academic_session"]
            class_obj.academic_year = update_data["academic_session"]  # Keep both in sync for backward compatibility
        elif "academic_year" in update_data:
            # Handle legacy academic_year field
            class_obj.academic_year = update_data["academic_year"]
            # class_obj.academic_session = update_data["academic_year"]  # Keep both in sync
        if "capacity" in update_data:
            class_obj.capacity = update_data["capacity"]
        if "class_teacher_id" in update_data:
            class_obj.class_teacher_id = update_data["class_teacher_id"]
        if "is_active" in update_data:
            class_obj.is_active = update_data["is_active"]

        db.commit()
        db.refresh(class_obj)
        return class_obj

    @staticmethod
    def delete_class(db: Session, class_id: str, deleted_by: str) -> bool:
        """Delete a class (soft delete) (Subadmin only)"""
        current_user = UserService.get_user_by_id(db, deleted_by)
        if current_user.role != "subadmin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only subadmin can delete classes"
            )

        class_obj = db.query(Class).filter(Class.id == class_id).first()
        if not class_obj:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Class not found"
            )

        # Verify it belongs to user's school
        if class_obj.school_id != current_user.school_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )

        # Soft delete
        class_obj.is_deleted = True
        class_obj.is_active = False
        db.commit()
        return True

    @staticmethod
    def get_classes_by_school(db: Session, school_id: str):
        """Get all classes for a school"""
        return db.query(Class).filter(
            Class.school_id == school_id,
            Class.is_active == True
        ).all()

    @staticmethod
    def get_teacher_subjects(db: Session, teacher_user_id: str):
        """Get subjects taught by a teacher"""
        teacher = db.query(Teacher).filter(Teacher.user_id == teacher_user_id).first()
        if not teacher:
            return []

        teacher_subjects = db.query(TeacherSubject).filter(
            TeacherSubject.teacher_id == teacher.id
        ).all()

        return [{
            "subject": subject.subject,
            "is_primary": subject.is_primary,
            "experience_years": subject.experience_years
        } for subject in teacher_subjects]

    @staticmethod
    def get_student_subjects(db: Session, student_user_id: str):
        """Get subjects enrolled by a student"""
        student = db.query(Student).filter(Student.user_id == student_user_id).first()
        if not student:
            return []

        student_subjects = db.query(StudentSubject).filter(
            StudentSubject.student_id == student.id
        ).all()

        return [{
            "subject": subject.subject,
            "is_elective": subject.is_elective,
            "priority_order": subject.priority_order
        } for subject in student_subjects]

    @staticmethod
    def assign_class_teacher(db: Session, class_id: str, teacher_id: str, assigned_by: str) -> Class:
        """Assign a homeroom teacher to a class (Subadmin only)"""
        # Verify permissions
        current_user = UserService.get_user_by_id(db, assigned_by)
        if current_user.role != "subadmin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only subadmin can assign class teachers"
            )

        # Verify class belongs to user's school
        class_obj = db.query(Class).filter(Class.id == class_id).first()
        if not class_obj:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Class not found"
            )
        if class_obj.school_id != current_user.school_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )

        # Verify teacher belongs to same school
        teacher = db.query(Teacher).filter(Teacher.id == teacher_id).first()
        if not teacher:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Teacher not found"
            )
        if teacher.user.school_id != current_user.school_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Teacher does not belong to this school"
            )

        # Assign class teacher
        class_obj.class_teacher_id = teacher_id
        db.commit()
        db.refresh(class_obj)
        return class_obj

    @staticmethod
    def update_class_subject_teacher(
        db: Session, assignment_id: str, update_data: dict, updated_by: str
    ) -> ClassSubjectTeacher:
        """Update teacher assignment details (periods, syllabus completion)"""
        # Verify permissions
        current_user = UserService.get_user_by_id(db, updated_by)
        if current_user.role != "subadmin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only subadmin can update teacher assignments"
            )

        # Find assignment
        assignment = db.query(ClassSubjectTeacher).filter(ClassSubjectTeacher.id == assignment_id).first()
        if not assignment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Assignment not found"
            )

        # Verify assignment belongs to user's school
        if assignment.class_subject.class_info.school_id != current_user.school_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )

        # Update fields
        if "periods_per_week" in update_data:
            assignment.periods_per_week = update_data["periods_per_week"]
        if "syllabus_completion" in update_data:
            assignment.syllabus_completion = update_data["syllabus_completion"]

        db.commit()
        db.refresh(assignment)
        return assignment

    @staticmethod
    def get_class_overview(db: Session, class_id: str, user_id: str) -> dict:
        """Get complete overview of a class (students, subjects, teachers)"""
        # Verify permissions
        current_user = UserService.get_user_by_id(db, user_id)

        class_obj = db.query(Class).filter(Class.id == class_id).first()
        if not class_obj:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Class not found"
            )

        # Check access permissions
        if current_user.role == "subadmin" and class_obj.school_id != current_user.school_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )

        # Get class teacher
        class_teacher = None
        if class_obj.class_teacher:
            class_teacher = {
                "id": class_obj.class_teacher.id,
                "user_id": class_obj.class_teacher.user_id,
                "name": class_obj.class_teacher.user.name,
                "qualification": class_obj.class_teacher.qualification
            }

        # Get subjects and teachers
        subjects_data = UserService.get_class_subjects(db, class_id, user_id)

        # Get students count
        students_count = db.query(Student).filter(
            Student.class_id == class_id,
            Student.user.has(is_active=True)
        ).count()

        return {
            "class": {
                "id": class_obj.id,
                "name": class_obj.name,
                "grade_level": class_obj.grade_level,
                "section": class_obj.section,
                "academic_year": class_obj.academic_year,
                "term": class_obj.term,
                "capacity": class_obj.capacity,
                "class_teacher": class_teacher
            },
            "subjects": subjects_data,
            "students_count": students_count,
            "school": {
                "id": class_obj.school.id,
                "name": class_obj.school.name
            }
        }

    @staticmethod
    def get_teacher_workload(db: Session, teacher_id: str, academic_year: str = None) -> dict:
        """Get teacher's workload (classes and subjects assigned)"""
        teacher = db.query(Teacher).filter(Teacher.id == teacher_id).first()
        if not teacher:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Teacher not found"
            )

        # Get class assignments
        query = db.query(ClassSubjectTeacher).filter(ClassSubjectTeacher.teacher_id == teacher_id)
        if academic_year:
            query = query.filter(ClassSubjectTeacher.academic_year == academic_year)

        assignments = query.all()

        # Group by class
        class_assignments = {}
        total_periods = 0

        for assignment in assignments:
            if assignment.is_active:
                class_id = assignment.class_subject.class_id
                if class_id not in class_assignments:
                    class_assignments[class_id] = {
                        "class_info": {
                            "id": assignment.class_subject.class_info.id,
                            "name": assignment.class_subject.class_info.name,
                            "grade_level": assignment.class_subject.class_info.grade_level,
                            "section": assignment.class_subject.class_info.section
                        },
                        "subjects": []
                    }

                class_assignments[class_id]["subjects"].append({
                    "subject": {
                        "id": assignment.class_subject.subject.id,
                        "name": assignment.class_subject.subject.name,
                        "code": assignment.class_subject.subject.code
                    },
                    "periods_per_week": assignment.periods_per_week,
                    "syllabus_completion": assignment.syllabus_completion
                })

                total_periods += assignment.periods_per_week

        # Check if teacher is a class teacher
        homeroom_classes = db.query(Class).filter(Class.class_teacher_id == teacher_id).all()
        homeroom_info = [{
            "id": cls.id,
            "name": cls.name,
            "grade_level": cls.grade_level,
            "section": cls.section
        } for cls in homeroom_classes]

        return {
            "teacher": {
                "id": teacher.id,
                "user_id": teacher.user_id,
                "name": teacher.user.name,
                "qualification": teacher.qualification,
                "specialization": teacher.specialization
            },
            "total_periods_per_week": total_periods,
            "class_assignments": list(class_assignments.values()),
            "homeroom_classes": homeroom_info,
            "academic_year": academic_year
        }

    @staticmethod
    def create_academic_session(db: Session, session_data: dict, school_id: str) -> AcademicSession:
        """Create a new academic session for a school"""
        # Verify school exists
        school = db.query(School).filter(School.id == school_id).first()
        if not school:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="School not found"
            )

        # Check if session name already exists for this school
        existing = db.query(AcademicSession).filter(
            AcademicSession.name == session_data["name"],
            AcademicSession.school_id == school_id
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Academic session with this name already exists for the school"
            )

        # If this is set as current, unset other current sessions
        if session_data.get("is_current", False):
            db.query(AcademicSession).filter(
                AcademicSession.school_id == school_id,
                AcademicSession.is_current == True
            ).update({"is_current": False})

        session = AcademicSession(
            id=generate_id(f"{school.name}_{session_data['name']}_session"),
            name=session_data["name"],
            start_date=session_data["start_date"],
            end_date=session_data["end_date"],
            is_current=session_data.get("is_current", False),
            school_id=school_id,
            term_count=session_data.get("term_count", 2)
        )

        db.add(session)
        db.commit()
        db.refresh(session)
        return session

    @staticmethod
    def promote_students_to_next_class(
        db: Session, current_class_id: str, next_class_id: str, academic_year: str, promoted_by: str
    ) -> dict:
        """Promote students from current class to next class for new academic session"""
        # Verify permissions
        current_user = UserService.get_user_by_id(db, promoted_by)
        if current_user.role != "subadmin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only subadmin can promote students"
            )

        # Verify classes exist and belong to same school
        current_class = db.query(Class).filter(Class.id == current_class_id).first()
        next_class = db.query(Class).filter(Class.id == next_class_id).first()

        if not current_class or not next_class:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="One or both classes not found"
            )

        if current_class.school_id != next_class.school_id or current_class.school_id != current_user.school_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Classes must belong to the same school"
            )

        # Get all active students in current class
        students = db.query(Student).filter(
            Student.class_id == current_class_id,
            Student.user.has(is_active=True, is_deleted=False)
        ).all()

        promoted_count = 0
        for student in students:
            # Update student's class
            student.class_id = next_class_id

            # Create new enrollments for next class subjects
            next_class_subjects = db.query(ClassSubject).filter(
                ClassSubject.class_id == next_class_id,
                ClassSubject.is_active == True,
                ClassSubject.is_deleted == False
            ).all()

            for class_subject in next_class_subjects:
                # Check if enrollment already exists
                existing = db.query(StudentSubjectEnrollment).filter(
                    StudentSubjectEnrollment.student_id == student.id,
                    StudentSubjectEnrollment.class_subject_id == class_subject.id,
                    StudentSubjectEnrollment.academic_year == academic_year
                ).first()

                if not existing:
                    enrollment = StudentSubjectEnrollment(
                        id=generate_id(f"{student.id}_{class_subject.id}_{academic_year}_enrollment"),
                        student_id=student.id,
                        class_subject_id=class_subject.id,
                        academic_year=academic_year
                    )
                    db.add(enrollment)

            promoted_count += 1

        db.commit()

        return {
            "message": f"Successfully promoted {promoted_count} students from {current_class.name} to {next_class.name}",
            "promoted_students": promoted_count,
            "from_class": current_class.name,
            "to_class": next_class.name,
            "academic_year": academic_year
        }

    @staticmethod
    def activate_deactivate_user(db: Session, user_id: str, is_active: bool, action_by: str) -> User:
        """Activate or deactivate a user account (Subadmin only)"""
        # Verify permissions
        current_user = UserService.get_user_by_id(db, action_by)
        if current_user.role != "subadmin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only subadmin can manage user accounts"
            )

        # Find target user
        target_user = UserService.get_user_by_id(db, user_id)
        if not target_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        # Cannot deactivate admin accounts
        if target_user.role == "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cannot manage admin accounts"
            )

        # Subadmin can only manage users in their school
        if target_user.school_id != current_user.school_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Can only manage users in your school"
            )

        # Update user status
        target_user.is_active = is_active
        db.commit()
        db.refresh(target_user)

        return target_user

    @staticmethod
    def get_subadmins_by_school(db: Session, school_id: str) -> List[User]:
        """Get all subadmins for a school"""
        return db.query(User).filter(
            User.school_id == school_id,
            User.role == "subadmin",
            User.is_deleted == False
        ).all()

    @staticmethod
    def update_user(db: Session, user_id: str, update_data: dict, updated_by: str) -> User:
        """Update a user (Admin can update subadmins, Subadmin can update users in their school)"""
        current_user = UserService.get_user_by_id(db, updated_by)
        if not current_user:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Invalid user"
            )

        target_user = UserService.get_user_by_id(db, user_id)
        if not target_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        # Admin can update subadmins
        # Subadmin can update users in their school (except admins)
        if current_user.role == "admin":
            if target_user.role != "subadmin":
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Admin can only update subadmins"
                )
        elif current_user.role == "subadmin":
            if target_user.role == "admin":
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Cannot update admin accounts"
                )
            if target_user.school_id != current_user.school_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Can only update users in your school"
                )
        else:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )

        # Update fields
        if "name" in update_data and update_data["name"]:
            target_user.name = update_data["name"]
        if "email" in update_data and update_data["email"]:
            # Check if email already exists
            existing_user = UserService.get_user_by_email(db, update_data["email"])
            if existing_user and existing_user.id != user_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email already registered"
                )
            target_user.email = update_data["email"]
        if "phone" in update_data:
            target_user.phone = update_data["phone"]
        if "password" in update_data and update_data["password"]:
            target_user.password = hash_password(update_data["password"])

        # Update address if provided
        if "address" in update_data and update_data["address"]:
            addr_data = update_data["address"]
            if target_user.address:
                # Update existing address
                if "street" in addr_data:
                    target_user.address.street = addr_data.get("street")
                if "city" in addr_data:
                    target_user.address.city = addr_data.get("city")
                if "state" in addr_data:
                    target_user.address.state = addr_data.get("state")
                if "country" in addr_data:
                    target_user.address.country = addr_data.get("country")
                if "postal_code" in addr_data:
                    target_user.address.postal_code = addr_data.get("postal_code")
            else:
                # Create new address
                address = Address(
                    id=generate_id(f"{target_user.name}_address"),
                    user_id=target_user.id,
                    street=addr_data.get("street"),
                    city=addr_data.get("city"),
                    state=addr_data.get("state"),
                    country=addr_data.get("country"),
                    postal_code=addr_data.get("postal_code")
                )
                db.add(address)
                target_user.address = address

        db.commit()
        db.refresh(target_user)
        return target_user

    @staticmethod
    def toggle_school_status(db: Session, school_id: str, is_active: bool, admin_id: str) -> School:
        """Toggle school active status (Admin only)"""
        admin = UserService.get_user_by_id(db, admin_id)
        if not admin or admin.role != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only admin can manage school status"
            )

        school = db.query(School).filter(School.id == school_id).first()
        if not school:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="School not found"
            )

        # Verify admin owns this school
        if school.admin_id != admin_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Can only manage your own schools"
            )

        school.is_active = is_active
        db.commit()
        db.refresh(school)
        return school

    @staticmethod
    def get_sessions_by_school(db: Session, school_id: str) -> List[AcademicSession]:
        """Get all academic sessions for a school"""
        return db.query(AcademicSession).filter(
            AcademicSession.school_id == school_id,
            AcademicSession.is_deleted == False
        ).order_by(AcademicSession.start_date.desc()).all()

    @staticmethod
    def set_current_session(db: Session, session_id: str, school_id: str, set_by: str) -> AcademicSession:
        """Set a session as current for a school"""
        # Verify permissions
        current_user = UserService.get_user_by_id(db, set_by)
        if current_user.role != "subadmin" or current_user.school_id != school_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )

        # Find session
        session = db.query(AcademicSession).filter(
            AcademicSession.id == session_id,
            AcademicSession.school_id == school_id
        ).first()

        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Session not found"
            )

        # Unset other current sessions
        db.query(AcademicSession).filter(
            AcademicSession.school_id == school_id,
            AcademicSession.is_current == True
        ).update({"is_current": False})

        # Set this session as current
        session.is_current = True
        db.commit()
        db.refresh(session)

        return session
