from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.config.database import get_db
from app.schemas.student import StudentCreate, StudentUpdate, StudentResponse, StudentDashboardResponse
from app.schemas.assignment import AssignmentSubmissionCreate
from app.services.student_service import StudentService
from app.services.assignment_service import AssignmentService
from app.services.user_service import UserService
from typing import List, Optional


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


# CREATE - Student profile creation (when user is created as student)
@router.post("/profile", response_model=StudentResponse, tags=["Student - Profile"])
async def create_student_profile(
    student_data: StudentCreate,
    request: Request,
    db: Session = Depends(get_db)
):
    """Create student profile for the current user (must be a student)"""
    current_user = get_current_user(request)

    if current_user["role"] != "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can create student profiles"
        )

    try:
        student = StudentService.create_student(db, current_user["user_id"], student_data.model_dump())

        # Get subjects and class information
        subjects = StudentService.get_student_subjects(db, current_user["user_id"])
        class_info = {
            "id": student.class_info.id,
            "name": student.class_info.name,
            "grade_level": student.class_info.grade_level,
            "section": student.class_info.section,
            "academic_year": student.class_info.academic_year
        } if student.class_info else None

        student_response = {
            "id": student.id,
            "user_id": student.user_id,
            "roll_number": student.roll_number,
            "date_of_birth": student.date_of_birth,
            "gender": student.gender,
            "blood_group": student.blood_group,
            "class_id": student.class_id,
            "class_info": class_info,
            "admission_date": student.admission_date,
            "guardian_name": student.guardian_name,
            "guardian_phone": student.guardian_phone,
            "guardian_relation": student.guardian_relation,
            "subjects": subjects,
            "created_at": student.created_at,
            "updated_at": student.updated_at
        }

        return StudentResponse(**student_response)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create student profile: {str(e)}"
        )


# READ - Get student profile
@router.get("/profile", response_model=StudentResponse, tags=["Student - Profile"])
async def get_student_profile(
    request: Request,
    db: Session = Depends(get_db)
):
    """Get current student's profile"""
    current_user = get_current_user(request)

    if current_user["role"] != "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )

    try:
        student = StudentService.get_student_by_user_id(db, current_user["user_id"])
        if not student:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Student profile not found"
            )

        subjects = StudentService.get_student_subjects(db, current_user["user_id"])
        class_info = {
            "id": student.class_info.id,
            "name": student.class_info.name,
            "grade_level": student.class_info.grade_level,
            "section": student.class_info.section,
            "academic_year": student.class_info.academic_year
        } if student.class_info else None

        student_response = {
            "id": student.id,
            "user_id": student.user_id,
            "roll_number": student.roll_number,
            "date_of_birth": student.date_of_birth,
            "gender": student.gender,
            "blood_group": student.blood_group,
            "class_id": student.class_id,
            "class_info": class_info,
            "admission_date": student.admission_date,
            "guardian_name": student.guardian_name,
            "guardian_phone": student.guardian_phone,
            "guardian_relation": student.guardian_relation,
            "subjects": subjects,
            "created_at": student.created_at,
            "updated_at": student.updated_at
        }

        return StudentResponse(**student_response)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch student profile: {str(e)}"
        )


# UPDATE - Update student profile
@router.put("/profile", response_model=StudentResponse, tags=["Student - Profile"])
async def update_student_profile(
    student_data: StudentUpdate,
    request: Request,
    db: Session = Depends(get_db)
):
    """Update current student's profile"""
    current_user = get_current_user(request)

    if current_user["role"] != "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )

    try:
        student = StudentService.get_student_by_user_id(db, current_user["user_id"])
        if not student:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Student profile not found"
            )

        updated_student = StudentService.update_student(
            db, student.id, student_data.model_dump(), current_user["user_id"]
        )

        subjects = StudentService.get_student_subjects(db, current_user["user_id"])
        class_info = {
            "id": updated_student.class_info.id,
            "name": updated_student.class_info.name,
            "grade_level": updated_student.class_info.grade_level,
            "section": updated_student.class_info.section,
            "academic_year": updated_student.class_info.academic_year
        } if updated_student.class_info else None

        student_response = {
            "id": updated_student.id,
            "user_id": updated_student.user_id,
            "roll_number": updated_student.roll_number,
            "date_of_birth": updated_student.date_of_birth,
            "gender": updated_student.gender,
            "blood_group": updated_student.blood_group,
            "class_id": updated_student.class_id,
            "class_info": class_info,
            "admission_date": updated_student.admission_date,
            "guardian_name": updated_student.guardian_name,
            "guardian_phone": updated_student.guardian_phone,
            "guardian_relation": updated_student.guardian_relation,
            "subjects": subjects,
            "created_at": updated_student.created_at,
            "updated_at": updated_student.updated_at
        }

        return StudentResponse(**student_response)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update student profile: {str(e)}"
        )


# LIST - Get students by school (for subadmin/teacher)
@router.get("/school/{school_id}", response_model=List[StudentResponse], tags=["Student - Management"])
async def get_school_students(
    school_id: str,
    request: Request,
    db: Session = Depends(get_db)
):
    """Get all students for a school (subadmin/teacher only)"""
    current_user = get_current_user(request)

    # Check permissions
    if current_user["role"] not in ["subadmin", "teacher", "principle"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )

    # Subadmin/teacher can only see students from their school
    if current_user["role"] in ["subadmin", "teacher"] and current_user["school_id"] != school_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )

    try:
        students = StudentService.get_students_by_school(db, school_id)
        result = []

        for student in students:
            subjects = StudentService.get_student_subjects(db, student.user_id)
            class_info = {
                "id": student.class_info.id,
                "name": student.class_info.name,
                "grade_level": student.class_info.grade_level,
                "section": student.class_info.section,
                "academic_year": student.class_info.academic_year
            } if student.class_info else None

            # Include user data
            user_data = {
                "id": student.user.id,
                "name": student.user.name,
                "email": student.user.email,
                "phone": student.user.phone,
                "is_active": student.user.is_active,
                "address": {
                    "street": student.user.address.street if student.user.address else None,
                    "city": student.user.address.city if student.user.address else None,
                    "state": student.user.address.state if student.user.address else None,
                    "country": student.user.address.country if student.user.address else None,
                    "postal_code": student.user.address.postal_code if student.user.address else None,
                } if student.user.address else None
            } if student.user else None

            student_response = {
                "id": student.id,
                "user_id": student.user_id,
                "user": user_data,
                "roll_number": student.roll_number,
                "date_of_birth": student.date_of_birth,
                "gender": student.gender,
                "blood_group": student.blood_group,
                "class_id": student.class_id,
                "class_info": class_info,
                "admission_date": student.admission_date,
                "guardian_name": student.guardian_name,
                "guardian_phone": student.guardian_phone,
                "guardian_relation": student.guardian_relation,
                "subjects": subjects,
                "created_at": student.created_at,
                "updated_at": student.updated_at,
                "is_active": student.is_active
            }
            result.append(StudentResponse(**student_response))

        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch students: {str(e)}"
        )


# LIST - Get students by class
@router.get("/class/{class_id}", response_model=List[StudentResponse], tags=["Student - Management"])
async def get_class_students(
    class_id: str,
    request: Request,
    db: Session = Depends(get_db)
):
    """Get all students in a specific class"""
    current_user = get_current_user(request)

    # Check permissions
    if current_user["role"] not in ["subadmin", "teacher", "principle"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )

    try:
        # Get all students including inactive ones
        students = StudentService.get_students_by_class(db, class_id, include_inactive=True)
        result = []

        for student in students:
            # Check if teacher/subadmin has access to this class's school
            if current_user["role"] in ["subadmin", "teacher"]:
                if student.user.school_id != current_user["school_id"]:
                    continue  # Skip students from different schools

            subjects = StudentService.get_student_subjects(db, student.user_id)
            class_info = {
                "id": student.class_info.id,
                "name": student.class_info.name,
                "grade_level": student.class_info.grade_level,
                "section": student.class_info.section,
                "academic_year": student.class_info.academic_year
            } if student.class_info else None

            # Include user data
            user_data = {
                "id": student.user.id,
                "name": student.user.name,
                "email": student.user.email,
                "phone": student.user.phone,
                "is_active": student.user.is_active,
                "address": {
                    "street": student.user.address.street if student.user.address else None,
                    "city": student.user.address.city if student.user.address else None,
                    "state": student.user.address.state if student.user.address else None,
                    "country": student.user.address.country if student.user.address else None,
                    "postal_code": student.user.address.postal_code if student.user.address else None,
                } if student.user.address else None
            } if student.user else None

            student_response = {
                "id": student.id,
                "user_id": student.user_id,
                "user": user_data,
                "roll_number": student.roll_number,
                "date_of_birth": student.date_of_birth,
                "gender": student.gender,
                "blood_group": student.blood_group,
                "class_id": student.class_id,
                "class_info": class_info,
                "admission_date": student.admission_date,
                "guardian_name": student.guardian_name,
                "guardian_phone": student.guardian_phone,
                "guardian_relation": student.guardian_relation,
                "subjects": subjects,
                "created_at": student.created_at,
                "updated_at": student.updated_at,
                "is_active": student.is_active
            }
            result.append(StudentResponse(**student_response))

        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch class students: {str(e)}"
        )


# UPDATE - Update specific student (for subadmin)
@router.put("/{student_id}", response_model=StudentResponse, tags=["Student - Management"])
async def update_student(
    student_id: str,
    student_data: StudentUpdate,
    request: Request,
    db: Session = Depends(get_db)
):
    """Update a specific student (subadmin only)"""
    current_user = get_current_user(request)

    if current_user["role"] != "subadmin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only subadmin can update students"
        )

    try:
        updated_student = StudentService.update_student(
            db, student_id, student_data.model_dump(), current_user["user_id"]
        )

        subjects = StudentService.get_student_subjects(db, updated_student.user_id)
        class_info = {
            "id": updated_student.class_info.id,
            "name": updated_student.class_info.name,
            "grade_level": updated_student.class_info.grade_level,
            "section": updated_student.class_info.section,
            "academic_year": updated_student.class_info.academic_year
        } if updated_student.class_info else None

        # Include user data
        user_data = {
            "id": updated_student.user.id,
            "name": updated_student.user.name,
            "email": updated_student.user.email,
            "phone": updated_student.user.phone,
            "is_active": updated_student.user.is_active,
            "address": {
                "street": updated_student.user.address.street if updated_student.user.address else None,
                "city": updated_student.user.address.city if updated_student.user.address else None,
                "state": updated_student.user.address.state if updated_student.user.address else None,
                "country": updated_student.user.address.country if updated_student.user.address else None,
                "postal_code": updated_student.user.address.postal_code if updated_student.user.address else None,
            } if updated_student.user.address else None
        } if updated_student.user else None

        student_response = {
            "id": updated_student.id,
            "user_id": updated_student.user_id,
            "user": user_data,
            "roll_number": updated_student.roll_number,
            "date_of_birth": updated_student.date_of_birth,
            "gender": updated_student.gender,
            "blood_group": updated_student.blood_group,
            "class_id": updated_student.class_id,
            "class_info": class_info,
            "admission_date": updated_student.admission_date,
            "guardian_name": updated_student.guardian_name,
            "guardian_phone": updated_student.guardian_phone,
            "guardian_relation": updated_student.guardian_relation,
            "subjects": subjects,
            "created_at": updated_student.created_at,
            "updated_at": updated_student.updated_at,
            "is_active": updated_student.is_active
        }

        return StudentResponse(**student_response)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update student: {str(e)}"
        )


# DELETE - Delete student (for subadmin)
@router.delete("/{student_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Student - Management"])
async def delete_student(
    student_id: str,
    request: Request,
    db: Session = Depends(get_db)
):
    """Delete a student (subadmin only) - soft delete"""
    current_user = get_current_user(request)

    if current_user["role"] != "subadmin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only subadmin can delete students"
        )

    try:
        StudentService.delete_student(db, student_id, current_user["user_id"])
        return {"message": "Student deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete student: {str(e)}"
        )


# DASHBOARD - Student Dashboard Data
@router.get("/dashboard", response_model=StudentDashboardResponse, tags=["Student - Dashboard"])
async def get_student_dashboard(
    request: Request,
    db: Session = Depends(get_db)
):
    """Get comprehensive dashboard data for the current student"""
    current_user = get_current_user(request)

    if current_user["role"] != "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can access their dashboard"
        )

    try:
        dashboard_data = StudentService.get_student_dashboard_data(db, current_user["user_id"])
        return StudentDashboardResponse(**dashboard_data)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch dashboard data: {str(e)}"
        )


# DASHBOARD - Student Grades
@router.get("/grades", response_model=List[dict], tags=["Student - Dashboard"])
async def get_student_grades(
    request: Request,
    academic_year: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get grades for the current student (optionally filtered by academic year)"""
    current_user = get_current_user(request)

    if current_user["role"] != "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can access their grades"
        )

    try:
        student = StudentService.get_student_by_user_id(db, current_user["user_id"])
        if not student:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Student profile not found"
            )

        grades = StudentService.get_student_grades(db, student.id)

        # Filter by academic year if provided
        if academic_year:
            grades = [g for g in grades if g.get("academic_year") == academic_year]

        return grades
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch grades: {str(e)}"
        )


# DASHBOARD - Student Attendance
@router.get("/attendance", response_model=dict, tags=["Student - Dashboard"])
async def get_student_attendance(
    request: Request,
    academic_year: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get attendance data for the current student"""
    current_user = get_current_user(request)

    if current_user["role"] != "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can access their attendance"
        )

    try:
        student = StudentService.get_student_by_user_id(db, current_user["user_id"])
        if not student:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Student profile not found"
            )

        # Use provided academic year or current year
        if not academic_year:
            from datetime import datetime
            current_year = datetime.now().year
            academic_year = f"{current_year}-{current_year + 1}"

        # Get attendance data (Note: we need to update the service method to accept academic_year)
        attendance = StudentService.get_student_attendance(db, student.id)

        # Add academic year to response
        attendance["academic_year"] = academic_year

        return attendance
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch attendance: {str(e)}"
        )


# ASSIGNMENT ROUTES FOR STUDENTS

# GET - Get assignments available to student
@router.get("/assignments", tags=["Student - Assignments"])
async def get_student_assignments(
    request: Request,
    class_subject_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get assignments available to the student"""
    current_user = get_current_user(request)

    if current_user["role"] != "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can view their assignments"
        )

    try:
        assignments = AssignmentService.get_assignments_for_student(db, current_user["user_id"], class_subject_id)
        return assignments
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch assignments: {str(e)}"
        )


# GET - Get assignment details for student
@router.get("/assignments/{assignment_id}", tags=["Student - Assignments"])
async def get_student_assignment_details(
    assignment_id: str,
    request: Request,
    db: Session = Depends(get_db)
):
    """Get detailed assignment information for student"""
    current_user = get_current_user(request)

    if current_user["role"] != "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can view assignment details"
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


# POST - Submit assignment
@router.post("/assignments/{assignment_id}/submit", tags=["Student - Assignments"])
async def submit_assignment(
    assignment_id: str,
    submission_data: AssignmentSubmissionCreate,
    request: Request,
    db: Session = Depends(get_db)
):
    """Submit an assignment"""
    current_user = get_current_user(request)

    if current_user["role"] != "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can submit assignments"
        )

    try:
        submission = AssignmentService.submit_assignment(db, submission_data, current_user["user_id"])
        return {
            "id": submission.id,
            "assignment_id": submission.assignment_id,
            "submission_type": submission.submission_type,
            "marks_obtained": submission.marks_obtained,
            "total_marks": submission.total_marks,
            "percentage": submission.percentage,
            "grade": submission.grade,
            "is_graded": submission.is_graded,
            "submitted_at": submission.submitted_at.isoformat() if submission.submitted_at else None
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to submit assignment: {str(e)}"
        )


# GET - Get student's assignment statistics
@router.get("/assignments/stats", tags=["Student - Assignments"])
async def get_student_assignment_stats(
    request: Request,
    db: Session = Depends(get_db)
):
    """Get assignment statistics for the student"""
    current_user = get_current_user(request)

    if current_user["role"] != "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can view their assignment stats"
        )

    try:
        stats = AssignmentService.get_student_assignment_stats(db, current_user["user_id"])
        return stats
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch assignment statistics: {str(e)}"
        )
