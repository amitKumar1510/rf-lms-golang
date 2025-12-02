from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from sqlalchemy.orm import Session
from app.config.database import get_db
from app.schemas.user import (
    LoginRequest, LoginResponse, UserResponse, UserCreate, UserUpdate, SchoolCreate, SchoolResponse,
    SubjectBase, SubjectResponse, ClassBase, ClassResponse, TeacherResponse, StudentResponse,
    ClassSubjectBase, ClassSubjectUpdate, ClassSubjectResponse, ClassSubjectTeacherBase, ClassSubjectTeacherResponse,
    StudentSubjectEnrollmentResponse, TeacherUserCreate, StudentUserCreate, PrincipleUserCreate
)
from app.schemas.teacher import TeacherCreate
from typing import Optional
from datetime import datetime
from app.models.users import School, StudentSubjectEnrollment
from app.models.teacher import Teacher
from app.models.student import Student
from app.services.user_service import UserService
from app.core.utils_functions import generate_id
from typing import List

router = APIRouter()


# Public routes (no authentication required)
@router.post("/public/logout", tags=["Authentication"])
async def logout(response: Response):
    """
    Logout endpoint - clears authentication cookie
    """
    from dotenv import load_dotenv
    import os
    load_dotenv()
    DOMAIN = os.getenv("DOMAIN", "localhost")
    
    # Clear the auth cookie
    response.delete_cookie(
        key="auth",
        domain=DOMAIN,
        path='/',
        samesite="Lax",
        secure=False
    )
    
    return {"message": "Logged out successfully"}


@router.post("/public/login", response_model=LoginResponse, tags=["Authentication"])
async def login(login_data: LoginRequest, response: Response, db: Session = Depends(get_db)):
    """
    Universal login endpoint for all user types
    Roles: admin, subadmin, principle, teacher, student, parent
    """
    try:
        result = UserService.login_user(
            db=db,
            email=login_data.email,
            password=login_data.password,
            role=login_data.role,  # Optional role filter
            response=response  # Pass response for cookie setting
        )
        # Convert user to dict for proper Pydantic validation
        user = result["user"]
        user_dict = {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "role": user.role,
            "school_id": user.school_id if user.school_id else None,
            "phone": user.phone,
            "student_id": user.student_id if user.student_id else None,
            "teacher_id": user.teacher_id if user.teacher_id else None,
            "is_active": user.is_active,
            "is_verified": user.is_verified,
            "created_at": user.created_at,
            "address": {
                "street": user.address.street if user.address else None,
                "city": user.address.city if user.address else None,
                "state": user.address.state if user.address else None,
                "country": user.address.country if user.address else None,
                "postal_code": user.address.postal_code if user.address else None,
            } if user.address else None
        }

        return LoginResponse(
            access_token=result["access_token"],
            token_type=result["token_type"],
            user=UserResponse(**user_dict),
            message=result["message"]
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Login failed: {str(e)}"
        )


@router.post("/public/create-admin", response_model=UserResponse, tags=["Authentication"])
async def create_admin(admin_data: UserCreate, db: Session = Depends(get_db)):
    """
    Create an admin user (public route for initial setup)
    This route should be used carefully and can be disabled in production
    """
    try:
        # Force role to admin
        admin_data.role = "admin"

        # Create admin user without requiring created_by (since this is a public route)
        admin = UserService.create_user(
            db=db,
            user_data=admin_data.model_dump(),
            created_by=None  # No creator for initial admin
        )

        # Convert to dict for proper Pydantic validation
        admin_dict = {
            "id": admin.id,
            "email": admin.email,
            "name": admin.name,
            "role": admin.role,
            "school_id": admin.school_id,
            "phone": admin.phone,
            "student_id": admin.student_id,
            "teacher_id": admin.teacher_id,
            "is_active": admin.is_active,
            "is_verified": admin.is_verified,
            "created_at": admin.created_at,
            "address": {
                "street": admin.address.street if admin.address else None,
                "city": admin.address.city if admin.address else None,
                "state": admin.address.state if admin.address else None,
                "country": admin.address.country if admin.address else None,
                "postal_code": admin.address.postal_code if admin.address else None,
            } if admin.address else None
        }

        return UserResponse(**admin_dict)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create admin: {str(e)}"
        )


# Single login route for all user roles


# Subject and Class Management Routes (Admin only)
@router.post("/schools/{school_id}/subjects", response_model=SubjectResponse, tags=["Subadmin - Subjects"])
async def create_subject(
    school_id: str,
    subject_data: SubjectBase,
    request: Request,
    db: Session = Depends(get_db)
):
    """Create a new subject for a school (Subadmin only)"""
    current_user = get_current_user(request)

    # Only subadmin of this school can create subjects
    if current_user["role"] != "subadmin" or current_user["school_id"] != school_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only subadmin of this school can create subjects"
        )

    try:
        subject = UserService.create_subject(db, subject_data.model_dump(), school_id)
        return SubjectResponse.model_validate(subject)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create subject: {str(e)}"
        )


@router.get("/schools/{school_id}/subjects", response_model=List[SubjectResponse], tags=["Subadmin - Subjects"])
async def get_school_subjects(
    school_id: str,
    request: Request,
    db: Session = Depends(get_db)
):
    """Get all active subjects for a school"""
    current_user = get_current_user(request)

    # Check permissions - admin can see all, subadmin only their school
    if current_user["role"] not in ["admin", "subadmin"] or (
        current_user["role"] == "subadmin" and current_user["school_id"] != school_id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )

    try:
        subjects = UserService.get_subjects_by_school(db, school_id)
        return [SubjectResponse.model_validate(subject) for subject in subjects]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch subjects: {str(e)}"
        )


@router.put("/schools/{school_id}/subjects/{subject_id}", response_model=SubjectResponse, tags=["Subadmin - Subjects"])
async def update_subject(
    school_id: str,
    subject_id: str,
    subject_data: SubjectBase,
    request: Request,
    db: Session = Depends(get_db)
):
    """Update a subject (Subadmin only)"""
    current_user = get_current_user(request)

    if current_user["role"] != "subadmin" or current_user["school_id"] != school_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only subadmin of this school can update subjects"
        )

    try:
        subject = UserService.update_subject(
            db=db,
            subject_id=subject_id,
            update_data=subject_data.model_dump(),
            updated_by=current_user["user_id"]
        )
        return SubjectResponse.model_validate(subject)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update subject: {str(e)}"
        )


@router.delete("/schools/{school_id}/subjects/{subject_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Subadmin - Subjects"])
async def delete_subject(
    school_id: str,
    subject_id: str,
    request: Request,
    db: Session = Depends(get_db)
):
    """Delete a subject (Subadmin only)"""
    current_user = get_current_user(request)

    if current_user["role"] != "subadmin" or current_user["school_id"] != school_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only subadmin of this school can delete subjects"
        )

    try:
        UserService.delete_subject(
            db=db,
            subject_id=subject_id,
            deleted_by=current_user["user_id"]
        )
        return None
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete subject: {str(e)}"
        )


@router.post("/schools/{school_id}/classes", response_model=ClassResponse, tags=["Subadmin - Classes"])
async def create_class(
    school_id: str,
    class_data: ClassBase,
    request: Request,
    db: Session = Depends(get_db)
):
    """Create a new class for a school (Subadmin only)"""
    current_user = get_current_user(request)

    # Verify the subadmin belongs to this school
    if current_user["role"] != "subadmin" or current_user["school_id"] != school_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Only subadmin of this school can create classes"
        )

    try:
        class_obj = UserService.create_class(db, class_data.model_dump(), school_id)
        return ClassResponse.model_validate(class_obj)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create class: {str(e)}"
        )


@router.get("/schools/{school_id}", response_model=SchoolResponse, tags=["Subadmin - Schools"])
async def get_school(
    school_id: str,
    request: Request,
    db: Session = Depends(get_db)
):
    """Get school details (Subadmin can view their own school)"""
    current_user = get_current_user(request)

    # Verify access to school (subadmin only their school)
    if current_user["role"] not in ["admin", "subadmin"] or (
        current_user["role"] == "subadmin" and current_user["school_id"] != school_id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )

    try:
        school = db.query(School).filter(School.id == school_id).first()
        if not school:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="School not found"
            )
        
        # Load subadmins for the school
        subadmins = UserService.get_subadmins_by_school(db, school_id)
        subadmin_responses = []
        for subadmin in subadmins:
            subadmin_dict = {
                "id": subadmin.id,
                "email": subadmin.email,
                "name": subadmin.name,
                "role": subadmin.role,
                "school_id": subadmin.school_id,
                "phone": subadmin.phone,
                "student_id": subadmin.student_id,
                "teacher_id": subadmin.teacher_id,
                "is_active": subadmin.is_active,
                "is_verified": subadmin.is_verified,
                "created_at": subadmin.created_at,
                "address": {
                    "street": subadmin.address.street if subadmin.address else None,
                    "city": subadmin.address.city if subadmin.address else None,
                    "state": subadmin.address.state if subadmin.address else None,
                    "country": subadmin.address.country if subadmin.address else None,
                    "postal_code": subadmin.address.postal_code if subadmin.address else None,
                } if subadmin.address else None
            }
            subadmin_responses.append(UserResponse(**subadmin_dict))

        school_dict = {
            "id": school.id,
            "name": school.name,
            "address": school.address,
            "phone": school.phone,
            "email": school.email,
            "is_active": school.is_active,
            "admin_id": school.admin_id,
            "created_at": school.created_at,
            "subadmins": subadmin_responses
        }

        return SchoolResponse(**school_dict)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch school: {str(e)}"
        )


@router.get("/schools/{school_id}/classes", response_model=List[ClassResponse], tags=["Subadmin - Classes"])
async def get_school_classes(
    school_id: str,
    request: Request,
    db: Session = Depends(get_db),
    include_student_count: bool = False
):
    """Get all classes for a school with optional student count"""
    current_user = get_current_user(request)

    # Verify access to school (subadmin only their school)
    if current_user["role"] not in ["admin", "subadmin"] or (
        current_user["role"] == "subadmin" and current_user["school_id"] != school_id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )

    try:
        from app.models.student import Student
        classes = UserService.get_classes_by_school(db, school_id)
        class_responses = []
        for class_obj in classes:
            try:
                # Get student count if requested
                student_count = 0
                if include_student_count:
                    student_count = db.query(Student).filter(
                        Student.class_id == class_obj.id,
                        Student.is_active == True,
                        Student.is_deleted == False
                    ).count()
                
                # Ensure academic_session is set from academic_year if needed
                if not class_obj.academic_session and class_obj.academic_year:
                    class_obj.academic_session = class_obj.academic_year
                elif not class_obj.academic_year and class_obj.academic_session:
                    class_obj.academic_year = class_obj.academic_session
                
                class_dict = {
                    "id": class_obj.id,
                    "name": class_obj.name,
                    "grade_level": class_obj.grade_level,
                    "section": class_obj.section,
                    "academic_session": class_obj.academic_session or class_obj.academic_year,
                    "academic_year": class_obj.academic_year or class_obj.academic_session,
                    "capacity": class_obj.capacity,
                    "class_teacher_id": class_obj.class_teacher_id,
                    "term": class_obj.term,
                    "school_id": class_obj.school_id,
                    "is_active": class_obj.is_active,
                    "created_at": class_obj.created_at
                }
                
                # Add student_count to dict if requested
                if include_student_count:
                    class_dict["student_count"] = student_count
                    class_dict["available_seats"] = (class_obj.capacity or 0) - student_count
                
                class_response = ClassResponse(**class_dict)
                class_responses.append(class_response)
            except Exception as e:
                # Log the error but continue with other classes
                print(f"Error validating class {class_obj.id}: {str(e)}")
                # Create a basic response manually
                class_responses.append(ClassResponse(
                    id=class_obj.id,
                    name=class_obj.name,
                    grade_level=class_obj.grade_level,
                    section=class_obj.section,
                    academic_session=class_obj.academic_session or class_obj.academic_year,
                    academic_year=class_obj.academic_year or class_obj.academic_session,
                    capacity=class_obj.capacity,
                    class_teacher_id=class_obj.class_teacher_id,
                    term=class_obj.term,
                    school_id=class_obj.school_id,
                    is_active=class_obj.is_active,
                    created_at=class_obj.created_at
                ))
        return class_responses
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch classes: {str(e)}"
        )


@router.put("/schools/{school_id}/classes/{class_id}", response_model=ClassResponse, tags=["Subadmin - Classes"])
async def update_class(
    school_id: str,
    class_id: str,
    class_data: ClassBase,
    request: Request,
    db: Session = Depends(get_db)
):
    """Update a class (Subadmin only)"""
    current_user = get_current_user(request)

    if current_user["role"] != "subadmin" or current_user["school_id"] != school_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only subadmin of this school can update classes"
        )

    try:
        class_obj = UserService.update_class(
            db=db,
            class_id=class_id,
            update_data=class_data.model_dump(),
            updated_by=current_user["user_id"]
        )
        return ClassResponse.model_validate(class_obj)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update class: {str(e)}"
        )


@router.delete("/schools/{school_id}/classes/{class_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Subadmin - Classes"])
async def delete_class(
    school_id: str,
    class_id: str,
    request: Request,
    db: Session = Depends(get_db)
):
    """Delete a class (Subadmin only)"""
    current_user = get_current_user(request)

    if current_user["role"] != "subadmin" or current_user["school_id"] != school_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only subadmin of this school can delete classes"
        )

    try:
        UserService.delete_class(
            db=db,
            class_id=class_id,
            deleted_by=current_user["user_id"]
        )
        return None
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete class: {str(e)}"
        )


# Class Subject Management Routes (Subadmin only)
@router.post("/classes/{class_id}/subjects", response_model=ClassSubjectResponse, tags=["Subadmin - Class Subjects"])
async def add_subject_to_class(
    class_id: str,
    subject_data: ClassSubjectBase,
    request: Request,
    db: Session = Depends(get_db)
):
    """Add a subject to a class (Subadmin only)"""
    current_user = get_current_user(request)

    if current_user["role"] != "subadmin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only subadmin can add subjects to classes"
        )

    try:
        class_subject = UserService.add_subject_to_class(
            db, class_id, subject_data.model_dump(), current_user["user_id"]
        )

        # Get teachers for this class subject (initially empty)
        teachers = []

        response_data = {
            "id": class_subject.id,
            "class_id": class_subject.class_id,
            "subject_id": class_subject.subject_id,
            "subject": {
                "id": class_subject.subject.id,
                "name": class_subject.subject.name,
                "code": class_subject.subject.code
            },
            "is_compulsory": class_subject.is_compulsory,
            "credits": class_subject.credits,
            "teachers": teachers,
            "created_at": class_subject.created_at
        }

        return ClassSubjectResponse(**response_data)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to add subject to class: {str(e)}"
        )


@router.get("/classes/{class_id}/subjects", response_model=List[ClassSubjectResponse], tags=["Subadmin - Class Subjects"])
async def get_class_subjects(
    class_id: str,
    request: Request,
    db: Session = Depends(get_db)
):
    """Get all subjects for a class with teacher assignments"""
    current_user = get_current_user(request)

    try:
        subjects = UserService.get_class_subjects(db, class_id, current_user["user_id"])
        return [ClassSubjectResponse(**subject) for subject in subjects]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch class subjects: {str(e)}"
        )


@router.put("/classes/subjects/{class_subject_id}", response_model=ClassSubjectResponse, tags=["Subadmin - Class Subjects"])
async def update_class_subject(
    class_subject_id: str,
    update_data: ClassSubjectUpdate,
    request: Request,
    db: Session = Depends(get_db)
):
    """Update a class subject (compulsory status, credits) (Subadmin only)"""
    current_user = get_current_user(request)

    try:
        class_subject = UserService.update_class_subject(
            db=db,
            class_subject_id=class_subject_id,
            update_data=update_data.model_dump(exclude_unset=True),
            updated_by=current_user["user_id"]
        )
        
        # Get assigned teachers
        from app.models.users import ClassSubjectTeacher
        assignments = db.query(ClassSubjectTeacher).filter(
            ClassSubjectTeacher.class_subject_id == class_subject.id,
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

        # Serialize the response manually
        response_dict = {
            "id": class_subject.id,
            "class_id": class_subject.class_id,
            "subject_id": class_subject.subject_id,
            "subject": {
                "id": class_subject.subject.id,
                "name": class_subject.subject.name,
                "code": class_subject.subject.code,
                "description": class_subject.subject.description
            },
            "is_compulsory": class_subject.is_compulsory,
            "credits": class_subject.credits,
            "teachers": teachers,
            "created_at": class_subject.created_at
        }
        
        return ClassSubjectResponse(**response_dict)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update class subject: {str(e)}"
        )


@router.delete("/classes/subjects/{class_subject_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Subadmin - Class Subjects"])
async def remove_subject_from_class(
    class_subject_id: str,
    request: Request,
    db: Session = Depends(get_db)
):
    """Remove a subject from a class (Subadmin only)"""
    current_user = get_current_user(request)

    try:
        UserService.remove_subject_from_class(db, class_subject_id, current_user["user_id"])
        return {"message": "Subject removed from class successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to remove subject from class: {str(e)}"
        )


# Teacher Assignment Routes (Subadmin only)
@router.post("/class-subjects/{class_subject_id}/teachers", response_model=ClassSubjectTeacherResponse, tags=["Subadmin - Teacher Assignments"])
async def assign_teacher_to_class_subject(
    class_subject_id: str,
    teacher_data: ClassSubjectTeacherBase,
    request: Request,
    db: Session = Depends(get_db)
):
    """Assign a teacher to a class subject (Subadmin only)"""
    current_user = get_current_user(request)

    if current_user["role"] != "subadmin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only subadmin can assign teachers to class subjects"
        )

    try:
        assignment = UserService.assign_teacher_to_class_subject(
            db, class_subject_id, teacher_data.model_dump(), current_user["user_id"]
        )

        response_data = {
            "id": assignment.id,
            "class_subject_id": assignment.class_subject_id,
            "teacher_id": assignment.teacher_id,
            "teacher": {
                "id": assignment.teacher.id,
                "user_id": assignment.teacher.user_id,
                "name": assignment.teacher.user.name,
                "qualification": assignment.teacher.qualification
            },
            "academic_year": assignment.academic_year,
            "periods_per_week": assignment.periods_per_week if assignment.periods_per_week is not None else 1,
            "syllabus_completion": assignment.syllabus_completion if assignment.syllabus_completion is not None else 0,
            "is_active": assignment.is_active,
            "created_at": assignment.created_at,
            "updated_at": assignment.updated_at
        }

        return ClassSubjectTeacherResponse(**response_data)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to assign teacher to class subject: {str(e)}"
        )


@router.delete("/class-subject-teachers/{assignment_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Subadmin - Teacher Assignments"])
async def remove_teacher_from_class_subject(
    assignment_id: str,
    request: Request,
    db: Session = Depends(get_db)
):
    """Remove a teacher assignment from a class subject (Subadmin only)"""
    current_user = get_current_user(request)

    try:
        UserService.remove_teacher_from_class_subject(db, assignment_id, current_user["user_id"])
        return {"message": "Teacher assignment removed successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to remove teacher assignment: {str(e)}"
        )


# Class Teacher (Homeroom) Management
@router.post("/classes/{class_id}/class-teacher", response_model=ClassResponse, tags=["Subadmin - Class Management"])
async def assign_class_teacher(
    class_id: str,
    teacher_data: dict,  # {"teacher_id": "teacher_id"}
    request: Request,
    db: Session = Depends(get_db)
):
    """Assign a homeroom teacher to a class (Subadmin only)"""
    current_user = get_current_user(request)

    if current_user["role"] != "subadmin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only subadmin can assign class teachers"
        )

    try:
        class_obj = UserService.assign_class_teacher(
            db, class_id, teacher_data["teacher_id"], current_user["user_id"]
        )

        response_data = {
            "id": class_obj.id,
            "name": class_obj.name,
            "grade_level": class_obj.grade_level,
            "section": class_obj.section,
            "academic_year": class_obj.academic_year,
            "school_id": class_obj.school_id,
            "is_active": class_obj.is_active,
            "created_at": class_obj.created_at
        }

        return ClassResponse(**response_data)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to assign class teacher: {str(e)}"
        )


# Enhanced Class Overview
@router.get("/classes/{class_id}/overview", tags=["Subadmin - Class Management"])
async def get_class_overview(
    class_id: str,
    request: Request,
    db: Session = Depends(get_db)
):
    """Get complete overview of a class (students, subjects, teachers)"""
    current_user = get_current_user(request)

    try:
        overview = UserService.get_class_overview(db, class_id, current_user["user_id"])
        return overview
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get class overview: {str(e)}"
        )


# Teacher Workload Management
@router.get("/teachers/{teacher_id}/workload", tags=["Subadmin - Teacher Management"])
async def get_teacher_workload(
    teacher_id: str,
    request: Request,
    academic_year: str = None,
    db: Session = Depends(get_db)
):
    """Get teacher's workload (classes and subjects assigned)"""
    current_user = get_current_user(request)

    # Check permissions
    if current_user["role"] not in ["admin", "subadmin", "teacher"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )

    # Teachers can only view their own workload
    if current_user["role"] == "teacher":
        teacher_profile = db.query(Teacher).filter(Teacher.user_id == current_user["user_id"]).first()
        if not teacher_profile or teacher_profile.id != teacher_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )

    try:
        workload = UserService.get_teacher_workload(db, teacher_id, academic_year)
        return workload
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get teacher workload: {str(e)}"
        )


# Update Teacher Assignment Details
@router.put("/class-subject-teachers/{assignment_id}", response_model=ClassSubjectTeacherResponse, tags=["Subadmin - Teacher Assignments"])
async def update_teacher_assignment(
    assignment_id: str,
    update_data: dict,  # {"periods_per_week": int, "syllabus_completion": int}
    request: Request,
    db: Session = Depends(get_db)
):
    """Update teacher assignment details (periods, syllabus completion)"""
    current_user = get_current_user(request)

    if current_user["role"] != "subadmin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only subadmin can update teacher assignments"
        )

    try:
        assignment = UserService.update_class_subject_teacher(
            db, assignment_id, update_data, current_user["user_id"]
        )

        response_data = {
            "id": assignment.id,
            "class_subject_id": assignment.class_subject_id,
            "teacher_id": assignment.teacher_id,
            "teacher": {
                "id": assignment.teacher.id,
                "user_id": assignment.teacher.user_id,
                "name": assignment.teacher.user.name,
                "qualification": assignment.teacher.qualification
            },
            "academic_year": assignment.academic_year,
            "periods_per_week": assignment.periods_per_week,
            "syllabus_completion": assignment.syllabus_completion,
            "is_active": assignment.is_active,
            "created_at": assignment.created_at,
            "updated_at": assignment.updated_at
        }

        return ClassSubjectTeacherResponse(**response_data)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update teacher assignment: {str(e)}"
        )


# Academic Session Management Routes (Subadmin only)
@router.post("/schools/{school_id}/sessions", tags=["Subadmin - Academic Sessions"])
async def create_academic_session(
    school_id: str,
    session_data: dict,  # {"name": "2024-2025", "start_date": "2024-06-01", "end_date": "2025-05-31", "is_current": true}
    request: Request,
    db: Session = Depends(get_db)
):
    """Create a new academic session for a school (Subadmin only)"""
    current_user = get_current_user(request)

    if current_user["role"] != "subadmin" or current_user["school_id"] != school_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only subadmin of this school can create academic sessions"
        )

    try:
        # Parse dates
        start_date = datetime.fromisoformat(session_data["start_date"].replace('Z', '+00:00'))
        end_date = datetime.fromisoformat(session_data["end_date"].replace('Z', '+00:00'))

        session_info = {
            "name": session_data["name"],
            "start_date": start_date,
            "end_date": end_date,
            "is_current": session_data.get("is_current", False),
            "term_count": session_data.get("term_count", 2)
        }

        session = UserService.create_academic_session(db, session_info, school_id)
        return {
            "id": session.id,
            "name": session.name,
            "start_date": session.start_date,
            "end_date": session.end_date,
            "is_current": session.is_current,
            "term_count": session.term_count,
            "school_id": session.school_id,
            "created_at": session.created_at
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create academic session: {str(e)}"
        )


@router.get("/schools/{school_id}/sessions", tags=["Subadmin - Academic Sessions"])
async def get_school_sessions(
    school_id: str,
    request: Request,
    db: Session = Depends(get_db)
):
    """Get all academic sessions for a school"""
    current_user = get_current_user(request)

    # Check permissions
    if current_user["role"] not in ["admin", "subadmin"] or (
        current_user["role"] == "subadmin" and current_user["school_id"] != school_id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )

    try:
        sessions = UserService.get_sessions_by_school(db, school_id)
        return [{
            "id": session.id,
            "name": session.name,
            "start_date": session.start_date,
            "end_date": session.end_date,
            "is_current": session.is_current,
            "term_count": session.term_count,
            "is_active": session.is_active
        } for session in sessions]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch academic sessions: {str(e)}"
        )


@router.put("/schools/{school_id}/sessions/{session_id}/current", tags=["Subadmin - Academic Sessions"])
async def set_current_session(
    school_id: str,
    session_id: str,
    request: Request,
    db: Session = Depends(get_db)
):
    """Set a session as current for the school (Subadmin only)"""
    current_user = get_current_user(request)

    if current_user["role"] != "subadmin" or current_user["school_id"] != school_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )

    try:
        session = UserService.set_current_session(db, session_id, school_id, current_user["user_id"])
        return {
            "message": f"Session {session.name} set as current",
            "session": {
                "id": session.id,
                "name": session.name,
                "is_current": session.is_current
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to set current session: {str(e)}"
        )


# Student Promotion Routes (Subadmin only)
@router.post("/classes/promote", tags=["Subadmin - Student Promotion"])
async def promote_students(
    promotion_data: dict,  # {"current_class_id": "class_id", "next_class_id": "class_id", "academic_year": "2025-2026"}
    request: Request,
    db: Session = Depends(get_db)
):
    """Promote students from one class to another for new academic session"""
    current_user = get_current_user(request)

    if current_user["role"] != "subadmin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only subadmin can promote students"
        )

    try:
        result = UserService.promote_students_to_next_class(
            db,
            promotion_data["current_class_id"],
            promotion_data["next_class_id"],
            promotion_data["academic_year"],
            current_user["user_id"]
        )
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to promote students: {str(e)}"
        )


# Account Management Routes (Subadmin only)
@router.put("/users/{user_id}/status", tags=["Subadmin - Account Management"])
async def activate_deactivate_user(
    user_id: str,
    status_data: dict,  # {"is_active": true/false}
    request: Request,
    db: Session = Depends(get_db)
):
    """Activate or deactivate a user account (Subadmin only)"""
    current_user = get_current_user(request)

    if current_user["role"] != "subadmin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only subadmin can manage user accounts"
        )

    try:
        user = UserService.activate_deactivate_user(
            db, user_id, status_data["is_active"], current_user["user_id"]
        )

        action = "activated" if status_data["is_active"] else "deactivated"
        return {
            "message": f"User account {action} successfully",
            "user": {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "role": user.role,
                "is_active": user.is_active
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update user status: {str(e)}"
        )


# Enhanced Student Enrollment Tracking (for teachers and subadmins)
@router.get("/students/{student_id}/enrollments", response_model=List[StudentSubjectEnrollmentResponse], tags=["Student - Academic Tracking"])
async def get_student_enrollments(
    student_id: str,
    request: Request,
    db: Session = Depends(get_db)
):
    """Get student's subject enrollments with academic tracking"""
    current_user = get_current_user(request)

    # Check permissions
    if current_user["role"] not in ["admin", "subadmin", "teacher", "parent"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )

    # Parents can only view their own children's enrollments
    if current_user["role"] == "parent":
        # This would need to check if the student is the parent's child
        # For now, allow access (implement parent-child relationship checking later)
        pass

    # Teachers can view enrollments in their classes
    if current_user["role"] == "teacher":
        # Check if teacher teaches this student
        # For now, allow access (implement teacher-student relationship checking later)
        pass

    try:
        student = db.query(Student).filter(Student.id == student_id).first()
        if not student:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Student not found"
            )

        # Check school access
        if current_user["role"] in ["subadmin", "teacher"] and student.user.school_id != current_user["school_id"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )

        enrollments = db.query(StudentSubjectEnrollment).filter(
            StudentSubjectEnrollment.student_id == student_id
        ).all()

        result = []
        for enrollment in enrollments:
            enrollment_data = {
                "id": enrollment.id,
                "student_id": enrollment.student_id,
                "class_subject_id": enrollment.class_subject_id,
                "class_subject": {
                    "id": enrollment.class_subject.id,
                    "subject": {
                        "id": enrollment.class_subject.subject.id,
                        "name": enrollment.class_subject.subject.name,
                        "code": enrollment.class_subject.subject.code
                    },
                    "is_compulsory": enrollment.class_subject.is_compulsory,
                    "credits": enrollment.class_subject.credits
                },
                "enrollment_date": enrollment.enrollment_date,
                "academic_year": enrollment.academic_year,
                "midterm_marks": enrollment.midterm_marks,
                "final_marks": enrollment.final_marks,
                "grade": enrollment.grade,
                "attendance_percentage": enrollment.attendance_percentage,
                "status": enrollment.status,
                "is_active": enrollment.is_active,
                "created_at": enrollment.created_at,
                "updated_at": enrollment.updated_at
            }
            result.append(StudentSubjectEnrollmentResponse(**enrollment_data))

        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get student enrollments: {str(e)}"
        )


# Protected routes (require authentication)
def get_current_user(request: Request) -> dict:
    """Get current user from request state (set by middleware)"""
    user = getattr(request.state, 'user', None)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required"
        )
    return {
        "user_id": user.id,
        "email": user.email,
        "role": user.role,
        "name": user.name,
        "school_id": user.school_id
    }


# Admin only routes
@router.post("/schools", response_model=SchoolResponse, tags=["Admin - Schools"])
async def create_school(
    school_data: SchoolCreate,
    request: Request,
    db: Session = Depends(get_db)
):
    """Create a new school (Admin only)"""
    current_user = get_current_user(request)

    try:
        school = UserService.create_school(
            db=db,
            school_data=school_data.model_dump(),
            admin_id=current_user["user_id"]
        )
        return SchoolResponse.model_validate(school)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create school: {str(e)}"
        )


@router.get("/schools", response_model=List[SchoolResponse], tags=["Admin - Schools"])
async def get_admin_schools(
    request: Request,
    db: Session = Depends(get_db)
):
    """Get all schools created by current admin"""
    current_user = get_current_user(request)

    try:
        schools = UserService.get_schools_by_admin(db, current_user["user_id"])
        
        # Convert schools to response format with subadmins
        school_responses = []
        for school in schools:
            # Convert subadmins to UserResponse format
            subadmin_responses = []
            if hasattr(school, 'subadmins') and school.subadmins:
                for subadmin in school.subadmins:
                    subadmin_dict = {
                        "id": subadmin.id,
                        "email": subadmin.email,
                        "name": subadmin.name,
                        "role": subadmin.role,
                        "school_id": subadmin.school_id,
                        "phone": subadmin.phone,
                        "student_id": subadmin.student_id,
                        "teacher_id": subadmin.teacher_id,
                        "is_active": subadmin.is_active,
                        "is_verified": subadmin.is_verified,
                        "created_at": subadmin.created_at,
                        "address": {
                            "street": subadmin.address.street if subadmin.address else None,
                            "city": subadmin.address.city if subadmin.address else None,
                            "state": subadmin.address.state if subadmin.address else None,
                            "country": subadmin.address.country if subadmin.address else None,
                            "postal_code": subadmin.address.postal_code if subadmin.address else None,
                        } if subadmin.address else None
                    }
                    subadmin_responses.append(UserResponse(**subadmin_dict))
            
            # Convert school to response format
            school_dict = {
                "id": school.id,
                "name": school.name,
                "address": school.address,
                "phone": school.phone,
                "email": school.email,
                "is_active": school.is_active,
                "admin_id": school.admin_id,
                "created_at": school.created_at,
                "subadmins": subadmin_responses
            }
            school_responses.append(SchoolResponse(**school_dict))
        
        return school_responses
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch schools: {str(e)}"
        )


@router.post("/subadmins", response_model=UserResponse, tags=["Admin - Users"])
async def create_subadmin(
    user_data: UserCreate,
    request: Request,
    db: Session = Depends(get_db)
):
    """Create a subadmin for a school (Admin only)"""
    current_user = get_current_user(request)

    # Ensure role is set to subadmin
    user_data.role = "subadmin"

    try:
        user = UserService.create_user(
            db=db,
            user_data=user_data.model_dump(),
            created_by=current_user["user_id"]
        )

        # Convert to dict for proper Pydantic validation
        user_dict = {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "role": user.role,
            "school_id": user.school_id,
            "phone": user.phone,
            "student_id": user.student_id,
            "teacher_id": user.teacher_id,
            "is_active": user.is_active,
            "is_verified": user.is_verified,
            "created_at": user.created_at,
            "address": {
                "street": user.address.street if user.address else None,
                "city": user.address.city if user.address else None,
                "state": user.address.state if user.address else None,
                "country": user.address.country if user.address else None,
                "postal_code": user.address.postal_code if user.address else None,
            } if user.address else None
        }

        return UserResponse(**user_dict)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create subadmin: {str(e)}"
        )


@router.post("/schools/{school_id}/teachers", response_model=UserResponse, tags=["Subadmin - Teachers"])
async def create_teacher(
    school_id: str,
    teacher_data: TeacherUserCreate,
    request: Request,
    db: Session = Depends(get_db)
):
    """Create a teacher for a school (Subadmin only)"""
    current_user = get_current_user(request)
    # Verify the subadmin belongs to this school
    if current_user["role"] != "subadmin" or current_user["school_id"] != school_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Only subadmin of this school can create teachers"
        )

    try:
        # Prepare user data with teacher_data
        user_dict = {
            "email": teacher_data.email,
            "password": teacher_data.password,
            "name": teacher_data.name,
            "role": "teacher",
            "school_id": school_id,
            "phone": teacher_data.phone,
            "address": teacher_data.address.model_dump() if teacher_data.address else None,
            "teacher_data": {
                "qualification": teacher_data.qualification,
                "experience_years": teacher_data.experience_years,
                "specialization": teacher_data.specialization,
                "subjects": teacher_data.subjects
            }
        }

        user = UserService.create_user(
            db=db,
            user_data=user_dict,
            created_by=current_user["user_id"]
        )

        # Convert to dict for proper Pydantic validation
        user_dict_response = {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "role": user.role,
            "school_id": user.school_id,
            "phone": user.phone,
            "student_id": user.student_id,
            "teacher_id": user.teacher_id,
            "is_active": user.is_active,
            "is_verified": user.is_verified,
            "created_at": user.created_at,
            "address": {
                "street": user.address.street if user.address else None,
                "city": user.address.city if user.address else None,
                "state": user.address.state if user.address else None,
                "country": user.address.country if user.address else None,
                "postal_code": user.address.postal_code if user.address else None,
            } if user.address else None
        }

        return UserResponse(**user_dict_response)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create teacher: {str(e)}"
        )


@router.post("/schools/{school_id}/students", response_model=UserResponse, tags=["Subadmin - Students"])
async def create_student(
    school_id: str,
    student_data: StudentUserCreate,
    request: Request,
    db: Session = Depends(get_db)
):
    """Create a student for a school (Subadmin only)"""
    current_user = get_current_user(request)
    # Verify the subadmin belongs to this school
    if current_user["role"] != "subadmin" or current_user["school_id"] != school_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Only subadmin of this school can create students"
        )

    try:
        # Parse date strings to datetime objects if provided
        from datetime import datetime as dt
        date_of_birth = None
        admission_date = None
        if student_data.date_of_birth:
            try:
                date_of_birth = dt.fromisoformat(student_data.date_of_birth.replace('Z', '+00:00'))
            except:
                date_of_birth = None
        if student_data.admission_date:
            try:
                admission_date = dt.fromisoformat(student_data.admission_date.replace('Z', '+00:00'))
            except:
                admission_date = None

        # Prepare user data with student_data
        user_dict = {
            "email": student_data.email,
            "password": student_data.password,
            "name": student_data.name,
            "role": "student",
            "school_id": school_id,
            "phone": student_data.phone,
            "address": student_data.address.model_dump() if student_data.address else None,
            "student_data": {
                "roll_number": student_data.roll_number,
                "date_of_birth": date_of_birth,
                "gender": student_data.gender,
                "blood_group": student_data.blood_group,
                "class_id": student_data.class_id,
                "admission_date": admission_date,
                "guardian_name": student_data.guardian_name,
                "guardian_phone": student_data.guardian_phone,
                "guardian_relation": student_data.guardian_relation,
                "subjects": student_data.subjects
            }
        }

        user = UserService.create_user(
            db=db,
            user_data=user_dict,
            created_by=current_user["user_id"]
        )

        # Convert to dict for proper Pydantic validation
        user_dict_response = {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "role": user.role,
            "school_id": user.school_id,
            "phone": user.phone,
            "student_id": user.student_id,
            "teacher_id": user.teacher_id,
            "is_active": user.is_active,
            "is_verified": user.is_verified,
            "created_at": user.created_at,
            "address": {
                "street": user.address.street if user.address else None,
                "city": user.address.city if user.address else None,
                "state": user.address.state if user.address else None,
                "country": user.address.country if user.address else None,
                "postal_code": user.address.postal_code if user.address else None,
            } if user.address else None
        }

        return UserResponse(**user_dict_response)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create student: {str(e)}"
        )


@router.post("/schools/{school_id}/principles", response_model=UserResponse, tags=["Subadmin - Principles"])
async def create_principle(
    school_id: str,
    principle_data: PrincipleUserCreate,
    request: Request,
    db: Session = Depends(get_db)
):
    """Create a principle for a school (Subadmin only)"""
    current_user = get_current_user(request)
    # Verify the subadmin belongs to this school
    if current_user["role"] != "subadmin" or current_user["school_id"] != school_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Only subadmin of this school can create principles"
        )

    try:
        # Prepare user data with principle_data
        # Default password is "principle"
        password = principle_data.password or "principle"
        
        user_dict = {
            "email": principle_data.email,
            "password": password,
            "name": principle_data.name,
            "role": "principle",
            "school_id": school_id,
            "phone": principle_data.phone,
            "address": principle_data.address.model_dump() if principle_data.address else None,
            "principle_data": {
                "qualification": principle_data.qualification,
                "experience_years": principle_data.experience_years,
                "specialization": principle_data.specialization,
                "designation": "Principle",  # Default designation
                "assigned_school_id": school_id,
                "office_phone": principle_data.office_phone,
                "office_email": principle_data.office_email
            }
        }

        user = UserService.create_user(
            db=db,
            user_data=user_dict,
            created_by=current_user["user_id"]
        )

        # Convert to dict for proper Pydantic validation
        user_dict_response = {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "role": user.role,
            "school_id": user.school_id,
            "phone": user.phone,
            "student_id": user.student_id,
            "teacher_id": user.teacher_id,
            "is_active": user.is_active,
            "is_verified": user.is_verified,
            "created_at": user.created_at,
            "address": {
                "street": user.address.street if user.address else None,
                "city": user.address.city if user.address else None,
                "state": user.address.state if user.address else None,
                "country": user.address.country if user.address else None,
                "postal_code": user.address.postal_code if user.address else None,
            } if user.address else None
        }

        return UserResponse(**user_dict_response)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create principle: {str(e)}"
        )


@router.get("/schools/{school_id}/subadmins", response_model=List[UserResponse], tags=["Admin - Schools"])
async def get_school_subadmins(
    school_id: str,
    request: Request,
    db: Session = Depends(get_db)
):
    """Get all subadmins for a school (Admin only)"""
    current_user = get_current_user(request)

    if current_user["role"] != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin can view subadmins"
        )

    try:
        subadmins = UserService.get_subadmins_by_school(db, school_id)
        
        # Convert to response format
        subadmin_responses = []
        for subadmin in subadmins:
            subadmin_dict = {
                "id": subadmin.id,
                "email": subadmin.email,
                "name": subadmin.name,
                "role": subadmin.role,
                "school_id": subadmin.school_id,
                "phone": subadmin.phone,
                "student_id": subadmin.student_id,
                "teacher_id": subadmin.teacher_id,
                "is_active": subadmin.is_active,
                "is_verified": subadmin.is_verified,
                "created_at": subadmin.created_at,
                "address": {
                    "street": subadmin.address.street if subadmin.address else None,
                    "city": subadmin.address.city if subadmin.address else None,
                    "state": subadmin.address.state if subadmin.address else None,
                    "country": subadmin.address.country if subadmin.address else None,
                    "postal_code": subadmin.address.postal_code if subadmin.address else None,
                } if subadmin.address else None
            }
            subadmin_responses.append(UserResponse(**subadmin_dict))
        
        return subadmin_responses
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch subadmins: {str(e)}"
        )


@router.put("/subadmins/{subadmin_id}", response_model=UserResponse, tags=["Admin - Users"])
async def update_subadmin(
    subadmin_id: str,
    user_data: UserUpdate,
    request: Request,
    db: Session = Depends(get_db)
):
    """Update a subadmin (Admin only)"""
    current_user = get_current_user(request)

    try:
        user = UserService.update_user(
            db=db,
            user_id=subadmin_id,
            update_data=user_data.model_dump(exclude_unset=True),
            updated_by=current_user["user_id"]
        )

        # Convert to dict for proper Pydantic validation
        user_dict = {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "role": user.role,
            "school_id": user.school_id,
            "phone": user.phone,
            "student_id": user.student_id,
            "teacher_id": user.teacher_id,
            "is_active": user.is_active,
            "is_verified": user.is_verified,
            "created_at": user.created_at,
            "address": {
                "street": user.address.street if user.address else None,
                "city": user.address.city if user.address else None,
                "state": user.address.state if user.address else None,
                "country": user.address.country if user.address else None,
                "postal_code": user.address.postal_code if user.address else None,
            } if user.address else None
        }

        return UserResponse(**user_dict)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update subadmin: {str(e)}"
        )


@router.put("/schools/{school_id}/status", response_model=SchoolResponse, tags=["Admin - Schools"])
async def toggle_school_status(
    school_id: str,
    status_data: dict,  # {"is_active": true/false}
    request: Request,
    db: Session = Depends(get_db)
):
    """Toggle school active status (Admin only)"""
    current_user = get_current_user(request)

    try:
        school = UserService.toggle_school_status(
            db=db,
            school_id=school_id,
            is_active=status_data["is_active"],
            admin_id=current_user["user_id"]
        )

        # Load subadmins for the school
        subadmins = UserService.get_subadmins_by_school(db, school_id)
        subadmin_responses = []
        for subadmin in subadmins:
            subadmin_dict = {
                "id": subadmin.id,
                "email": subadmin.email,
                "name": subadmin.name,
                "role": subadmin.role,
                "school_id": subadmin.school_id,
                "phone": subadmin.phone,
                "student_id": subadmin.student_id,
                "teacher_id": subadmin.teacher_id,
                "is_active": subadmin.is_active,
                "is_verified": subadmin.is_verified,
                "created_at": subadmin.created_at,
                "address": {
                    "street": subadmin.address.street if subadmin.address else None,
                    "city": subadmin.address.city if subadmin.address else None,
                    "state": subadmin.address.state if subadmin.address else None,
                    "country": subadmin.address.country if subadmin.address else None,
                    "postal_code": subadmin.address.postal_code if subadmin.address else None,
                } if subadmin.address else None
            }
            subadmin_responses.append(UserResponse(**subadmin_dict))

        school_dict = {
            "id": school.id,
            "name": school.name,
            "address": school.address,
            "phone": school.phone,
            "email": school.email,
            "is_active": school.is_active,
            "admin_id": school.admin_id,
            "created_at": school.created_at,
            "subadmins": subadmin_responses
        }

        return SchoolResponse(**school_dict)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update school status: {str(e)}"
        )


# Note: Individual user creation and management routes have been moved to their respective route files:
# - Teachers: /api/teachers/* (create, read, update, delete, list)
# - Students: /api/students/* (create, read, update, delete, list)
# - Principles: /api/principles/* (create, read, update, delete, list)
# - Parents: /api/parents/* (create, read, update, delete, list)
