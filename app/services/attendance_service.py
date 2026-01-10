from __future__ import annotations

from datetime import datetime, date
from typing import List, Dict, Any

from fastapi import HTTPException, status
from sqlalchemy import and_, func, case
from sqlalchemy.orm import Session, joinedload

from app.core.utils_functions import generate_id
from app.models.attendance import StudentAttendance
from app.models.student import Student
from app.models.teacher import Teacher
from app.models.users import Class, ClassSubject, ClassSubjectTeacher, Subject, User
from app.schemas.attendance import (
    AttendanceCreate,
    AttendanceUpdate,
    AttendanceResponse,
    AttendanceSummary,
    StudentAttendanceInfo,
    ClassSubjectInfo
)


class AttendanceService:
    @staticmethod
    def _attendance_query(db: Session):
        return db.query(StudentAttendance).options(
            joinedload(StudentAttendance.student).joinedload(Student.user),
            joinedload(StudentAttendance.class_subject).joinedload(ClassSubject.class_info),
            joinedload(StudentAttendance.class_subject).joinedload(ClassSubject.subject),
            joinedload(StudentAttendance.marker)
        )

    @staticmethod
    def _require_teacher_access(db: Session, teacher_id: str, class_subject_id: str, school_id: str):
        """Check if teacher has access to mark attendance for this class subject"""
        # Check if teacher is assigned to this class subject
        assignment = db.query(ClassSubjectTeacher).filter(
            ClassSubjectTeacher.class_subject_id == class_subject_id,
            ClassSubjectTeacher.teacher_id == teacher_id,
            ClassSubjectTeacher.is_active == True
        ).first()

        if not assignment:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Teacher not assigned to this class subject"
            )

        # Verify class subject belongs to teacher's school
        class_subject = db.query(ClassSubject).filter(
            ClassSubject.id == class_subject_id,
            ClassSubject.is_active == True
        ).first()

        if not class_subject:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Class subject not found"
            )

        class_info = db.query(Class).filter(
            Class.id == class_subject.class_id,
            Class.school_id == school_id
        ).first()

        if not class_info:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Class subject does not belong to teacher's school"
            )

        return class_subject

    @staticmethod
    def get_students_for_attendance(db: Session, class_subject_id: str, teacher_id: str, school_id: str) -> List[StudentAttendanceInfo]:
        """Get all students enrolled in a class subject for attendance marking"""
        # Verify teacher access
        AttendanceService._require_teacher_access(db, teacher_id, class_subject_id, school_id)

        # Get all students in the class
        class_subject = db.query(ClassSubject).filter(ClassSubject.id == class_subject_id).first()
        if not class_subject:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Class subject not found")

        students = db.query(Student).options(
            joinedload(Student.user),
            joinedload(Student.class_info)
        ).filter(
            Student.class_id == class_subject.class_id,
            Student.is_active == True,
            Student.is_deleted == False
        ).all()

        return [
            StudentAttendanceInfo.model_validate({
                "id": student.id,
                "user_id": student.user_id,
                "name": student.user.name,
                "email": student.user.email,
                "roll_number": student.roll_number,
                "class_id": student.class_id,
                "class_name": student.class_info.name if student.class_info else "",
                "grade_level": student.class_info.grade_level if student.class_info else "",
                "section": student.class_info.section if student.class_info else ""
            })
            for student in students
        ]

    @staticmethod
    def mark_attendance(db: Session, teacher_id: str, school_id: str, data: AttendanceCreate) -> List[AttendanceResponse]:
        """Mark attendance for multiple students"""
        # Verify teacher access
        class_subject = AttendanceService._require_teacher_access(db, teacher_id, data.class_subject_id, school_id)

        # Get current session/academic year
        current_session = db.query(Class).filter(
            Class.id == class_subject.class_id
        ).first()

        academic_year = current_session.academic_year if current_session else str(date.today().year)

        # Check if attendance is already marked for this date
        existing_records = db.query(StudentAttendance).filter(
            StudentAttendance.class_subject_id == data.class_subject_id,
            StudentAttendance.attendance_date == data.attendance_date,
            StudentAttendance.is_active == True
        ).all()

        if existing_records:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Attendance already marked for this date"
            )

        # Create attendance records
        attendance_records = []
        for record_data in data.attendance_records:
            student_id = record_data.get("student_id")
            status_val = record_data.get("status", "present")
            remarks = record_data.get("remarks")

            # Verify student belongs to the class
            student = db.query(Student).filter(
                Student.id == student_id,
                Student.class_id == class_subject.class_id,
                Student.is_active == True,
                Student.is_deleted == False
            ).first()

            if not student:
                continue  # Skip invalid students

            attendance = StudentAttendance(
                id=generate_id("attendance"),
                student_id=student_id,
                class_subject_id=data.class_subject_id,
                academic_year=academic_year,
                attendance_date=data.attendance_date,
                status=status_val,
                remarks=remarks,
                marked_by=teacher_id,
                is_active=True
            )

            db.add(attendance)
            attendance_records.append(attendance)

        db.commit()

        # Return created records with relationships loaded
        result = []
        for record in attendance_records:
            db.refresh(record)
            result.append(AttendanceService._attendance_query(db).filter(
                StudentAttendance.id == record.id
            ).first())

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
                    "roll_number": record.student.roll_number
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
            for record in result
        ]

    @staticmethod
    def get_attendance_by_class_subject_and_date(
        db: Session, class_subject_id: str, attendance_date: date, teacher_id: str, school_id: str
    ) -> List[AttendanceResponse]:
        """Get attendance records for a specific class subject and date"""
        # Verify teacher access
        AttendanceService._require_teacher_access(db, teacher_id, class_subject_id, school_id)

        records = AttendanceService._attendance_query(db).filter(
            StudentAttendance.class_subject_id == class_subject_id,
            StudentAttendance.attendance_date == attendance_date,
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

    @staticmethod
    def update_attendance(
        db: Session, attendance_id: str, teacher_id: str, school_id: str, data: AttendanceUpdate
    ) -> AttendanceResponse:
        """Update an individual attendance record"""
        # Find the attendance record
        record = db.query(StudentAttendance).filter(
            StudentAttendance.id == attendance_id,
            StudentAttendance.is_active == True
        ).first()

        if not record:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Attendance record not found"
            )

        # Verify teacher access to this class subject
        AttendanceService._require_teacher_access(db, teacher_id, record.class_subject_id, school_id)

        # Update the record
        if data.status is not None:
            record.status = data.status
        if data.remarks is not None:
            record.remarks = data.remarks

        record.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(record)

        # Return updated record
        updated = AttendanceService._attendance_query(db).filter(
            StudentAttendance.id == attendance_id
        ).first()

        return AttendanceResponse.model_validate({
            "id": updated.id,
            "student_id": updated.student_id,
            "class_subject_id": updated.class_subject_id,
            "academic_year": updated.academic_year,
            "attendance_date": updated.attendance_date,
            "status": updated.status,
            "remarks": updated.remarks,
            "marked_by": updated.marked_by,
            "is_active": updated.is_active,
            "created_at": updated.created_at,
            "updated_at": updated.updated_at,
            "student": {
                "id": updated.student.id,
                "name": updated.student.user.name if updated.student.user else "",
                "email": updated.student.user.email if updated.student.user else "",
                "roll_number": updated.student.roll_number
            } if updated.student else None,
            "class_subject": {
                "id": updated.class_subject.id,
                "class_id": updated.class_subject.class_id,
                "subject_id": updated.class_subject.subject_id,
                "class_name": updated.class_subject.class_info.name if updated.class_subject.class_info else "",
                "subject_name": updated.class_subject.subject.name if updated.class_subject.subject else ""
            } if updated.class_subject else None,
            "marker": {
                "id": updated.marker.id,
                "name": updated.marker.user.name if updated.marker.user else ""
            } if updated.marker else None
        })

    @staticmethod
    def get_attendance_summary(
        db: Session, class_subject_id: str, start_date: date, end_date: date, teacher_id: str, school_id: str
    ) -> AttendanceSummary:
        """Get attendance summary for a class subject within a date range"""
        # Verify teacher access
        AttendanceService._require_teacher_access(db, teacher_id, class_subject_id, school_id)

        # Get total students in class
        class_subject = db.query(ClassSubject).filter(ClassSubject.id == class_subject_id).first()
        total_students = db.query(Student).filter(
            Student.class_id == class_subject.class_id,
            Student.is_active == True,
            Student.is_deleted == False
        ).count()

        # Get attendance statistics
        stats = db.query(
            func.count(StudentAttendance.id).label('total_records'),
            func.sum(case((StudentAttendance.status == 'present', 1), else_=0)).label('present_count'),
            func.sum(case((StudentAttendance.status == 'absent', 1), else_=0)).label('absent_count'),
            func.sum(case((StudentAttendance.status == 'late', 1), else_=0)).label('late_count'),
            func.sum(case((StudentAttendance.status == 'excused', 1), else_=0)).label('excused_count')
        ).filter(
            StudentAttendance.class_subject_id == class_subject_id,
            StudentAttendance.attendance_date >= start_date,
            StudentAttendance.attendance_date <= end_date,
            StudentAttendance.is_active == True
        ).first()

        present_count = stats.present_count or 0
        total_records = stats.total_records or 0

        # Calculate attendance percentage
        attendance_percentage = (present_count / total_records * 100) if total_records > 0 else 0

        return AttendanceSummary(
            class_subject_id=class_subject_id,
            attendance_date=date.today(),  # Summary covers a range, so use current date as reference
            total_students=total_students,
            present_count=present_count,
            absent_count=stats.absent_count or 0,
            late_count=stats.late_count or 0,
            excused_count=stats.excused_count or 0,
            attendance_percentage=round(attendance_percentage, 2)
        )
