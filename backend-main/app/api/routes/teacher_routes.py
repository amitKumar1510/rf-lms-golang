from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.config.database import get_db
from app.schemas.teacher import TeacherCreate, TeacherUpdate, TeacherResponse
from app.schemas.attendance import AttendanceCreate, AttendanceUpdate, ClassSubjectInfo, StudentAttendanceInfo
from app.schemas.assignment import (
    AssignmentCreate, AssignmentUpdate, AssignmentResponse, AssignmentSubmissionResponse,
    AssignmentSubmissionUpdate
)
from app.services.teacher_service import TeacherService
from app.services.attendance_service import AttendanceService
from app.services.assignment_service import AssignmentService
from app.services.user_service import UserService
from typing import List, Optional
from datetime import date


router = APIRouter()


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


# CREATE - Teacher profile creation (when user is created as teacher)
@router.post("/profile", response_model=TeacherResponse, tags=["Teacher - Profile"])
async def create_teacher_profile(
    teacher_data: TeacherCreate,
    request: Request,
    db: Session = Depends(get_db)
):
    """Create teacher profile for the current user (must be a teacher)"""
    current_user = get_current_user(request)

    if current_user["role"] != "teacher":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only teachers can create teacher profiles"
        )

    try:
        teacher = TeacherService.create_teacher(db, current_user["user_id"], teacher_data.model_dump())

        # Get subjects information
        subjects = TeacherService.get_teacher_subjects(db, current_user["user_id"])

        teacher_response = {
            "id": teacher.id,
            "user_id": teacher.user_id,
            "qualification": teacher.qualification,
            "experience_years": teacher.experience_years,
            "specialization": teacher.specialization,
            "subjects": subjects,
            "created_at": teacher.created_at,
            "updated_at": teacher.updated_at
        }

        return TeacherResponse(**teacher_response)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create teacher profile: {str(e)}"
        )


# READ - Get teacher profile
@router.get("/profile", response_model=TeacherResponse, tags=["Teacher - Profile"])
async def get_teacher_profile(
    request: Request,
    db: Session = Depends(get_db)
):
    """Get current teacher's profile"""
    current_user = get_current_user(request)

    if current_user["role"] != "teacher":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )

    try:
        teacher = TeacherService.get_teacher_by_user_id(db, current_user["user_id"])
        if not teacher:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Teacher profile not found"
            )

        subjects = TeacherService.get_teacher_subjects(db, current_user["user_id"])

        teacher_response = {
            "id": teacher.id,
            "user_id": teacher.user_id,
            "qualification": teacher.qualification,
            "experience_years": teacher.experience_years,
            "specialization": teacher.specialization,
            "subjects": subjects,
            "created_at": teacher.created_at,
            "updated_at": teacher.updated_at
        }

        return TeacherResponse(**teacher_response)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch teacher profile: {str(e)}"
        )


# READ - Get teacher profile with class assignments
@router.get("/profile-with-assignments", tags=["Teacher - Profile"])
async def get_teacher_profile_with_assignments(
    request: Request,
    db: Session = Depends(get_db)
):
    """Get current teacher's profile with class assignments"""
    current_user = get_current_user(request)

    if current_user["role"] != "teacher":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )

    try:
        teacher = TeacherService.get_teacher_by_user_id(db, current_user["user_id"])
        if not teacher:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Teacher profile not found"
            )

        # Get general subjects
        subjects = TeacherService.get_teacher_subjects(db, current_user["user_id"])

        # Get class assignments
        class_assignments = TeacherService.get_teacher_class_assignments(db, current_user["user_id"])

        teacher_response = {
            "id": teacher.id,
            "user_id": teacher.user_id,
            "name": teacher.user.name,
            "email": teacher.user.email,
            "phone": teacher.user.phone,
            "qualification": teacher.qualification,
            "experience_years": teacher.experience_years,
            "specialization": teacher.specialization,
            "subjects": subjects,
            "class_assignments": class_assignments,
            "created_at": teacher.created_at,
            "updated_at": teacher.updated_at,
            "user": {
                "id": teacher.user.id,
                "name": teacher.user.name,
                "email": teacher.user.email,
                "phone": teacher.user.phone,
                "is_active": teacher.user.is_active,
                "address": {
                    "street": teacher.user.address.street if teacher.user.address else None,
                    "city": teacher.user.address.city if teacher.user.address else None,
                    "state": teacher.user.address.state if teacher.user.address else None,
                    "country": teacher.user.address.country if teacher.user.address else None,
                    "postal_code": teacher.user.address.postal_code if teacher.user.address else None,
                } if teacher.user.address else None
            }
        }

        return teacher_response
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch teacher profile with assignments: {str(e)}"
        )


# GET - Get teacher workload information
@router.get("/workload", tags=["Teacher - Workload"])
async def get_teacher_workload(
    request: Request,
    db: Session = Depends(get_db)
):
    """Get current teacher's workload information"""
    current_user = get_current_user(request)

    if current_user["role"] != "teacher":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )

    try:
        workload = TeacherService.get_teacher_workload(db, current_user["user_id"])
        return workload
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch teacher workload: {str(e)}"
        )


# UPDATE - Update teacher profile
@router.put("/profile", response_model=TeacherResponse, tags=["Teacher - Profile"])
async def update_teacher_profile(
    teacher_data: TeacherUpdate,
    request: Request,
    db: Session = Depends(get_db)
):
    """Update current teacher's profile"""
    current_user = get_current_user(request)

    if current_user["role"] != "teacher":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )

    try:
        teacher = TeacherService.get_teacher_by_user_id(db, current_user["user_id"])
        if not teacher:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Teacher profile not found"
            )

        updated_teacher = TeacherService.update_teacher(
            db, teacher.id, teacher_data.model_dump(), current_user["user_id"]
        )

        subjects = TeacherService.get_teacher_subjects(db, current_user["user_id"])

        teacher_response = {
            "id": updated_teacher.id,
            "user_id": updated_teacher.user_id,
            "qualification": updated_teacher.qualification,
            "experience_years": updated_teacher.experience_years,
            "specialization": updated_teacher.specialization,
            "subjects": subjects,
            "created_at": updated_teacher.created_at,
            "updated_at": updated_teacher.updated_at
        }

        return TeacherResponse(**teacher_response)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update teacher profile: {str(e)}"
        )


# LIST - Get teachers by school (for subadmin/principle)
@router.get("/school/{school_id}", response_model=List[TeacherResponse], tags=["Teacher - Management"])
async def get_school_teachers(
    school_id: str,
    request: Request,
    db: Session = Depends(get_db)
):
    """Get all teachers for a school (subadmin/principle only)"""
    current_user = get_current_user(request)

    # Check permissions
    if current_user["role"] not in ["subadmin", "principle"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )

    # Subadmin can only see teachers from their school
    if current_user["role"] == "subadmin" and current_user["school_id"] != school_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )

    try:
        teachers = TeacherService.get_teachers_by_school(db, school_id)
        result = []

        for teacher in teachers:
            subjects = TeacherService.get_teacher_subjects(db, teacher.user_id)
            teacher_response = {
                "id": teacher.id,
                "name": teacher.user.name,
                "email": teacher.user.email,
                "phone": teacher.user.phone,
                "user_id": teacher.user_id,
                "qualification": teacher.qualification,
                "experience_years": teacher.experience_years,
                "specialization": teacher.specialization,
                "subjects": subjects,
                "created_at": teacher.created_at,
                "updated_at": teacher.updated_at,
                "user": {
                    "id": teacher.user.id,
                    "name": teacher.user.name,
                    "email": teacher.user.email,
                    "phone": teacher.user.phone,
                    "is_active": teacher.user.is_active,
                    "address": {
                        "street": teacher.user.address.street if teacher.user.address else None,
                        "city": teacher.user.address.city if teacher.user.address else None,
                        "state": teacher.user.address.state if teacher.user.address else None,
                        "country": teacher.user.address.country if teacher.user.address else None,
                        "postal_code": teacher.user.address.postal_code if teacher.user.address else None,
                    } if teacher.user.address else None
                }
            }
            result.append(TeacherResponse(**teacher_response))

        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch teachers: {str(e)}"
        )


# UPDATE - Update specific teacher (for subadmin)
@router.put("/{teacher_id}", response_model=TeacherResponse, tags=["Teacher - Management"])
async def update_teacher(
    teacher_id: str,
    teacher_data: TeacherUpdate,
    request: Request,
    db: Session = Depends(get_db)
):
    """Update a specific teacher (subadmin only)"""
    current_user = get_current_user(request)

    if current_user["role"] != "subadmin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only subadmin can update teachers"
        )

    try:
        updated_teacher = TeacherService.update_teacher(
            db, teacher_id, teacher_data.model_dump(), current_user["user_id"]
        )

        subjects = TeacherService.get_teacher_subjects(db, updated_teacher.user_id)
        
        # Refresh to get updated user data
        db.refresh(updated_teacher.user)

        teacher_response = {
            "id": updated_teacher.id,
            "name": updated_teacher.user.name,
            "email": updated_teacher.user.email,
            "phone": updated_teacher.user.phone,
            "user_id": updated_teacher.user_id,
            "qualification": updated_teacher.qualification,
            "experience_years": updated_teacher.experience_years,
            "specialization": updated_teacher.specialization,
            "subjects": subjects,
            "created_at": updated_teacher.created_at,
            "updated_at": updated_teacher.updated_at,
            "user": {
                "id": updated_teacher.user.id,
                "name": updated_teacher.user.name,
                "email": updated_teacher.user.email,
                "phone": updated_teacher.user.phone,
                "is_active": updated_teacher.user.is_active,
                "address": {
                    "street": updated_teacher.user.address.street if updated_teacher.user.address else None,
                    "city": updated_teacher.user.address.city if updated_teacher.user.address else None,
                    "state": updated_teacher.user.address.state if updated_teacher.user.address else None,
                    "country": updated_teacher.user.address.country if updated_teacher.user.address else None,
                    "postal_code": updated_teacher.user.address.postal_code if updated_teacher.user.address else None,
                } if updated_teacher.user.address else None
            }
        }

        return TeacherResponse(**teacher_response)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update teacher: {str(e)}"
        )


# DELETE - Delete teacher (for subadmin)
@router.delete("/{teacher_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Teacher - Management"])
async def delete_teacher(
    teacher_id: str,
    request: Request,
    db: Session = Depends(get_db)
):
    """Delete a teacher (subadmin only) - soft delete"""
    current_user = get_current_user(request)

    if current_user["role"] != "subadmin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only subadmin can delete teachers"
        )

    try:
        TeacherService.delete_teacher(db, teacher_id, current_user["user_id"])
        return {"message": "Teacher deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete teacher: {str(e)}"
        )


# ATTENDANCE ROUTES

# GET - Debug endpoint to check teacher data
@router.get("/attendance/debug", tags=["Teacher - Attendance"])
async def debug_teacher_data(
    request: Request,
    db: Session = Depends(get_db)
):
    """Debug endpoint to check teacher data"""
    current_user = get_current_user(request)

    if current_user["role"] != "teacher":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only teachers can access this endpoint"
        )

    from app.models.teacher import Teacher, TeacherSubject
    from app.models.users import ClassSubjectTeacher

    # Check teacher profile
    teacher_profile = db.query(Teacher).filter(
        Teacher.user_id == current_user["user_id"],
        Teacher.is_active == True
    ).first()

    # Check general subject assignments
    teacher_subjects = []
    if teacher_profile:
        teacher_subjects = db.query(TeacherSubject).filter(
            TeacherSubject.teacher_id == teacher_profile.id,
            TeacherSubject.is_active == True
        ).all()

    # Check class-subject assignments
    class_assignments = []
    if teacher_profile:
        class_assignments = db.query(ClassSubjectTeacher).filter(
            ClassSubjectTeacher.teacher_id == teacher_profile.id,
            ClassSubjectTeacher.is_active == True
        ).all()

    return {
        "user_id": current_user["user_id"],
        "user_email": current_user["email"],
        "teacher_profile_exists": teacher_profile is not None,
        "teacher_profile_id": teacher_profile.id if teacher_profile else None,
        "general_subjects_count": len(teacher_subjects),
        "general_subjects": [
            {
                "subject_id": ts.subject_id,
                "subject_name": ts.subject.name if ts.subject else "Unknown",
                "is_primary": ts.is_primary
            } for ts in teacher_subjects
        ],
        "class_assignments_count": len(class_assignments),
        "class_assignments": [
            {
                "class_subject_id": ca.class_subject_id,
                "periods_per_week": ca.periods_per_week,
                "syllabus_completion": ca.syllabus_completion
            } for ca in class_assignments
        ]
    }

# GET - Get class subjects assigned to teacher
@router.get("/attendance/class-subjects", response_model=List[ClassSubjectInfo], tags=["Teacher - Attendance"])
async def get_teacher_class_subjects(
    request: Request,
    db: Session = Depends(get_db)
):
    """Get all class subjects assigned to the current teacher"""
    current_user = get_current_user(request)

    if current_user["role"] != "teacher":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only teachers can access attendance management"
        )

    try:
        class_subjects = AttendanceService.get_class_subjects_for_teacher(db, current_user["user_id"])
        return class_subjects
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch class subjects: {str(e)}"
        )


# GET - Get students for a specific class subject
@router.get("/attendance/class-subjects/{class_subject_id}/students", response_model=List[StudentAttendanceInfo], tags=["Teacher - Attendance"])
async def get_students_for_class_subject(
    class_subject_id: str,
    request: Request,
    db: Session = Depends(get_db)
):
    """Get all students enrolled in a specific class subject"""
    current_user = get_current_user(request)

    if current_user["role"] != "teacher":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only teachers can access attendance management"
        )

    try:
        students = AttendanceService.get_students_for_class_subject(db, class_subject_id)
        return students
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch students: {str(e)}"
        )


# POST - Mark attendance for a class subject
@router.post("/attendance/mark", tags=["Teacher - Attendance"])
async def mark_attendance(
    attendance_data: AttendanceCreate,
    request: Request,
    db: Session = Depends(get_db)
):
    """Mark attendance for a class subject on a specific date"""
    current_user = get_current_user(request)

    if current_user["role"] != "teacher":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only teachers can mark attendance"
        )

    try:
        result = AttendanceService.mark_attendance(db, attendance_data, current_user["user_id"])
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to mark attendance: {str(e)}"
        )


# GET - Get attendance records for a specific date and class
@router.get("/attendance/class-subjects/{class_subject_id}/date/{attendance_date}", tags=["Teacher - Attendance"])
async def get_attendance_for_date(
    class_subject_id: str,
    attendance_date: str,  # Change to str and parse manually
    request: Request,
    db: Session = Depends(get_db)
):
    from datetime import datetime
    try:
        # Parse the date string manually
        parsed_date = datetime.strptime(attendance_date, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid date format: {attendance_date}. Expected YYYY-MM-DD"
        )

    """Get attendance records for a specific class subject and date"""
    current_user = get_current_user(request)

    if current_user["role"] != "teacher":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only teachers can view attendance"
        )

    try:
        attendance_records = AttendanceService.get_attendance_for_class_subject(
            db, class_subject_id, parsed_date, current_user["user_id"]
        )
        return attendance_records
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch attendance: {str(e)}"
        )


# PUT - Update a specific attendance record
@router.put("/attendance/{attendance_id}", tags=["Teacher - Attendance"])
async def update_attendance_record(
    attendance_id: str,
    update_data: AttendanceUpdate,
    request: Request,
    db: Session = Depends(get_db)
):
    """Update a specific attendance record"""
    current_user = get_current_user(request)

    if current_user["role"] != "teacher":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only teachers can update attendance"
        )

    try:
        result = AttendanceService.update_attendance_record(db, attendance_id, update_data, current_user["user_id"])
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update attendance: {str(e)}"
        )


# GET - Get attendance summary for a date range
@router.get("/attendance/summary/class-subjects/{class_subject_id}", tags=["Teacher - Attendance"])
async def get_attendance_summary(
    class_subject_id: str,
    start_date: date,
    end_date: date,
    request: Request,
    db: Session = Depends(get_db)
):
    """Get attendance summary for a class subject over a date range"""
    current_user = get_current_user(request)

    if current_user["role"] != "teacher":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only teachers can view attendance summary"
        )

    try:
        summary = AttendanceService.get_attendance_summary(
            db, class_subject_id, start_date, end_date, current_user["user_id"]
        )
        return summary
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get attendance summary: {str(e)}"
        )


# ATTENDANCE ANALYTICS ROUTES

# GET - Get class-wise attendance analytics
@router.get("/analytics/class-wise", tags=["Teacher - Attendance Analytics"])
async def get_class_wise_attendance_analytics(
    request: Request,
    academic_session: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get attendance analytics by class and subject"""
    current_user = get_current_user(request)

    if current_user["role"] != "teacher":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only teachers can access attendance analytics"
        )

    try:
        analytics = AttendanceService.get_class_wise_attendance_analytics(
            db, current_user["school_id"], academic_session
        )
        return analytics
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch class-wise attendance analytics: {str(e)}"
        )


# GET - Get subject-wise student attendance analytics
@router.get("/analytics/subject-wise", tags=["Teacher - Attendance Analytics"])
async def get_subject_wise_student_attendance(
    request: Request,
    academic_session: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get attendance analytics by subject and students"""
    current_user = get_current_user(request)

    if current_user["role"] != "teacher":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only teachers can access attendance analytics"
        )

    try:
        analytics = AttendanceService.get_subject_wise_student_attendance(
            db, current_user["school_id"], academic_session
        )
        return analytics
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch subject-wise student attendance: {str(e)}"
        )


# ASSIGNMENT MANAGEMENT ROUTES

# POST - Create new assignment
@router.post("/assignments", response_model=AssignmentResponse, tags=["Teacher - Assignments"])
async def create_assignment(
    assignment_data: AssignmentCreate,
    request: Request,
    db: Session = Depends(get_db)
):
    """Create a new assignment"""
    current_user = get_current_user(request)

    if current_user["role"] != "teacher":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only teachers can create assignments"
        )

    try:
        assignment = AssignmentService.create_assignment(db, assignment_data, current_user["user_id"])
        return AssignmentResponse.from_orm(assignment)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create assignment: {str(e)}"
        )


# PUT - Update assignment
@router.put("/assignments/{assignment_id}", response_model=AssignmentResponse, tags=["Teacher - Assignments"])
async def update_assignment(
    assignment_id: str,
    assignment_data: AssignmentUpdate,
    request: Request,
    db: Session = Depends(get_db)
):
    """Update an existing assignment"""
    current_user = get_current_user(request)

    if current_user["role"] != "teacher":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only teachers can update assignments"
        )

    try:
        assignment = AssignmentService.update_assignment(db, assignment_id, assignment_data, current_user["user_id"])
        return AssignmentResponse.from_orm(assignment)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update assignment: {str(e)}"
        )


# GET - Get assignments created by teacher
@router.get("/assignments", tags=["Teacher - Assignments"])
async def get_teacher_assignments(
    request: Request,
    class_subject_id: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get assignments created by the teacher"""
    current_user = get_current_user(request)

    if current_user["role"] != "teacher":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only teachers can view their assignments"
        )

    try:
        print(f"DEBUG: Getting assignments for user {current_user['user_id']}, class_subject_id={class_subject_id}, status={status}")
        assignments = AssignmentService.get_assignments_for_teacher(db, current_user["user_id"], class_subject_id, status)
        print(f"DEBUG: Found {len(assignments)} assignments")
        return assignments
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch assignments: {str(e)}"
        )


# GET - Get assignment details
@router.get("/assignments/{assignment_id}", tags=["Teacher - Assignments"])
async def get_assignment_details(
    assignment_id: str,
    request: Request,
    db: Session = Depends(get_db)
):
    """Get detailed assignment information"""
    current_user = get_current_user(request)

    if current_user["role"] != "teacher":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only teachers can view assignment details"
        )

    try:
        assignment = AssignmentService.get_assignment_details(db, assignment_id, current_user["user_id"], current_user["role"])
        if not assignment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Assignment not found or access denied"
            )
        return assignment
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch assignment details: {str(e)}"
        )


# GET - Get submissions for an assignment
@router.get("/assignments/{assignment_id}/submissions", tags=["Teacher - Assignments"])
async def get_assignment_submissions(
    assignment_id: str,
    request: Request,
    db: Session = Depends(get_db)
):
    """Get all submissions for an assignment"""
    current_user = get_current_user(request)

    if current_user["role"] != "teacher":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only teachers can view assignment submissions"
        )

    try:
        submissions = AssignmentService.get_assignment_submissions(db, assignment_id, current_user["user_id"])
        return submissions
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch assignment submissions: {str(e)}"
        )


# PUT - Grade an assignment submission
@router.put("/assignments/submissions/{submission_id}", tags=["Teacher - Assignments"])
async def grade_assignment_submission(
    submission_id: str,
    grading_data: AssignmentSubmissionUpdate,
    request: Request,
    db: Session = Depends(get_db)
):
    """Grade an assignment submission"""
    current_user = get_current_user(request)

    if current_user["role"] != "teacher":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only teachers can grade assignments"
        )

    try:
        submission = AssignmentService.grade_assignment(db, submission_id, grading_data, current_user["user_id"])
        return {
            "id": submission.id,
            "marks_obtained": submission.marks_obtained,
            "grade": submission.grade,
            "feedback": submission.feedback,
            "is_graded": submission.is_graded,
            "graded_at": submission.graded_at.isoformat() if submission.graded_at else None
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to grade assignment: {str(e)}"
        )



