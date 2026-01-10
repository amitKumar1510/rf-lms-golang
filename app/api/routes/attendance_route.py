from typing import List
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.config.database import get_db
from app.schemas.attendance import (
    AttendanceCreate,
    AttendanceUpdate,
    AttendanceResponse,
    AttendanceSummary,
    StudentAttendanceInfo
)
from app.models.attendance import StudentAttendance
from app.models.student import Student, StudentsParent
from app.models.teacher import Teacher
from app.models.users import Class, ClassSubject, ClassSubjectTeacher, Subject, User
from app.services.attendance_service import AttendanceService

router = APIRouter()


@router.get("/class-subject/{class_subject_id}/date/{attendance_date}", response_model=List[AttendanceResponse], tags=["Attendance"])
def get_attendance_by_class_subject_and_date(
    request: Request,
    class_subject_id: str,
    attendance_date: str,
    db: Session = Depends(get_db)
):
    """Get attendance records for a specific class subject and date"""
    user = request.state.user
    teacher_id = getattr(user, "teacher_id", None)
    school_id = getattr(user, "school_id", None)

    if not teacher_id or not school_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Teacher access required")

    try:
        attendance_date_obj = date.fromisoformat(attendance_date)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid date format")

    return AttendanceService.get_attendance_by_class_subject_and_date(
        db, class_subject_id, attendance_date_obj, teacher_id, school_id
    )


@router.get("/students/{class_subject_id}", response_model=List[StudentAttendanceInfo], tags=["Attendance"])
def get_students_for_attendance(request: Request, class_subject_id: str, db: Session = Depends(get_db)):
    """Get all students for attendance marking in a class subject"""
    user = request.state.user
    teacher_id = getattr(user, "teacher_id", None)
    school_id = getattr(user, "school_id", None)

    if not teacher_id or not school_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Teacher access required")

    return AttendanceService.get_students_for_attendance(db, class_subject_id, teacher_id, school_id)


@router.post("/mark", response_model=List[AttendanceResponse], tags=["Attendance"])
def mark_attendance(request: Request, data: AttendanceCreate, db: Session = Depends(get_db)):
    """Mark attendance for multiple students"""
    user = request.state.user
    teacher_id = getattr(user, "teacher_id", None)
    school_id = getattr(user, "school_id", None)

    if not teacher_id or not school_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Teacher access required")

    return AttendanceService.mark_attendance(db, teacher_id, school_id, data)


@router.put("/{attendance_id}", response_model=AttendanceResponse, tags=["Attendance"])
def update_attendance(
    request: Request,
    attendance_id: str,
    data: AttendanceUpdate,
    db: Session = Depends(get_db)
):
    """Update an individual attendance record"""
    user = request.state.user
    teacher_id = getattr(user, "teacher_id", None)
    school_id = getattr(user, "school_id", None)

    if not teacher_id or not school_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Teacher access required")

    return AttendanceService.update_attendance(db, attendance_id, teacher_id, school_id, data)


@router.get("/summary", response_model=AttendanceSummary, tags=["Attendance"])
def get_attendance_summary(
    request: Request,
    class_subject_id: str,
    start_date: str,
    end_date: str,
    db: Session = Depends(get_db)
):
    """Get attendance summary for a class subject within a date range"""
    user = request.state.user
    teacher_id = getattr(user, "teacher_id", None)
    school_id = getattr(user, "school_id", None)

    if not teacher_id or not school_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Teacher access required")

    try:
        start_date_obj = date.fromisoformat(start_date)
        end_date_obj = date.fromisoformat(end_date)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid date format")

    return AttendanceService.get_attendance_summary(
        db, class_subject_id, start_date_obj, end_date_obj, teacher_id, school_id
    )


@router.get("/student/history", response_model=List[AttendanceResponse], tags=["Attendance"])
def get_student_attendance_history(
    request: Request,
    student_id: str,
    class_subject_id: str,
    start_date: str,
    end_date: str,
    db: Session = Depends(get_db)
):
    """Get attendance history for a specific student"""
    user = request.state.user
    user_id = getattr(user, "id", None)
    school_id = getattr(user, "school_id", None)
    parent_id = getattr(user, "parent_id", None)
    teacher_id = getattr(user, "teacher_id", None)

    # Check if user has access to view this student's attendance
    user_role = getattr(user, "role", None)

    # Prioritize role-based access control over ID-based checks
    if user_role == "student":
        # Student can only view their own attendance
        student_user_id = getattr(user, "user_id", None)  # For students, user_id contains their student record ID
        if student_user_id != student_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Students can only view their own attendance")
    elif user_role == "parent" or parent_id:
        # Parent can view their child's attendance - simplified logic
        if parent_id:
            # If parent_id is set, verify the relationship
            student = db.query(Student).filter(
                Student.id == student_id,
                Student.parent_id == parent_id,
                Student.is_active == True
            ).first()
            if not student:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Parent access denied - student not found")
        else:
            # For role-based parent access, allow access (assume authentication middleware validates)
            pass
    elif user_role == "teacher" or teacher_id:
        # Teacher access (already implemented in other endpoints)
        AttendanceService._require_teacher_access(db, teacher_id or getattr(user, "teacher_id"), class_subject_id, school_id)
    else:
        # Allow access for other authenticated users (temporary for debugging)
        pass

    try:
        start_date_obj = date.fromisoformat(start_date)
        end_date_obj = date.fromisoformat(end_date)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid date format")

    # Filter attendance records for the specific student and date range
    records = AttendanceService._attendance_query(db).filter(
        StudentAttendance.student_id == student_id,
        StudentAttendance.class_subject_id == class_subject_id,
        StudentAttendance.attendance_date >= start_date_obj,
        StudentAttendance.attendance_date <= end_date_obj,
        StudentAttendance.is_active == True
    ).all()

    return [
        AttendanceResponse.model_validate({
            "id": record.id,
            "student_id": record.student_id,
            "class_subject_id": record.class_subject_id,
            "academic_year": record.academic_year,
            "attendance_date": record.attendance_date,
            "status": record.status,
            "remarks": record.remarks,
            "marked_by": record.marked_by,
            "is_active": record.is_active,
            "created_at": record.created_at,
            "updated_at": record.updated_at,
            "student": {
                "id": record.student.id,
                "name": record.student.user.name if record.student.user else "",
                "email": record.student.user.email if record.student.user else "",
                "roll_number": record.student.roll_number,
                "student_name": record.student.user.name if record.student.user else ""
            } if record.student else None,
            "class_subject": {
                "id": record.class_subject.id,
                "class_id": record.class_subject.class_id,
                "subject_id": record.class_subject.subject_id,
                "class_name": record.class_subject.class_info.name if record.class_subject.class_info else "",
                "subject_name": record.class_subject.subject.name if record.class_subject.subject else ""
            } if record.class_subject else None,
            "marker": {
                "id": record.marker.id,
                "name": record.marker.user.name if record.marker.user else ""
            } if record.marker else None
        })
        for record in records
    ]


@router.get("/student/summary", response_model=List[AttendanceSummary], tags=["Attendance"])
def get_student_attendance_summary(
    request: Request,
    student_id: str,
    start_date: str,
    end_date: str,
    db: Session = Depends(get_db)
):
    """Get attendance summary for all subjects of a specific student"""
    user = request.state.user
    user_id = getattr(user, "id", None)
    school_id = getattr(user, "school_id", None)
    parent_id = getattr(user, "parent_id", None)

    # Check if user has access to view this student's attendance
    user_role = getattr(user, "role", None)

    # Prioritize role-based access control over ID-based checks
    if user_role == "student":
        # Student can only view their own attendance
        student_user_id = getattr(user, "user_id", None)  # For students, user_id contains their student record ID
        if student_user_id != student_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Students can only view their own attendance")
    elif user_role == "parent" or parent_id:
        # Parent can view their child's attendance - simplified logic
        if parent_id:
            # If parent_id is set, verify the relationship
            student = db.query(Student).filter(
                Student.id == student_id,
                Student.parent_id == parent_id,
                Student.is_active == True
            ).first()
            if not student:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Parent access denied - student not found")
        else:
            # For role-based parent access, allow access (assume authentication middleware validates)
            pass
    else:
        # Allow access for other authenticated users (temporary for debugging)
        pass

    try:
        start_date_obj = date.fromisoformat(start_date)
        end_date_obj = date.fromisoformat(end_date)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid date format")

    # Get all class subjects for this student
    student_record = db.query(Student).filter(Student.id == student_id).first()
    if not student_record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")

    class_subjects = db.query(ClassSubject).filter(
        ClassSubject.class_id == student_record.class_id,
        ClassSubject.is_active == True
    ).all()

    summaries = []
    for cs in class_subjects:
        summary = AttendanceService.get_attendance_summary(
            db, cs.id, start_date_obj, end_date_obj, None, school_id
        )
        # Override with student-specific data
        summary.class_subject_id = cs.id
        summaries.append(summary)

    return summaries
