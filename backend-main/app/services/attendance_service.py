from sqlalchemy.orm import Session
from sqlalchemy import and_, func
from fastapi import HTTPException, status
from app.models.attendance import StudentAttendance
from app.models.users import ClassSubject, ClassSubjectTeacher, Class
from app.models.student import Student
from app.models.users import User
from app.schemas.attendance import AttendanceCreate, AttendanceUpdate
from app.core.utils_functions import generate_id
from datetime import datetime, date
from typing import List, Optional


class AttendanceService:

    @staticmethod
    @staticmethod
    def _get_teacher_profile_id(db: Session, teacher_user_id: str) -> Optional[str]:
        """Helper method to get teacher profile ID from user ID"""
        from app.models.teacher import Teacher
        teacher_profile = db.query(Teacher).filter(
            Teacher.user_id == teacher_user_id,
            Teacher.is_active == True
        ).first()
        return teacher_profile.id if teacher_profile else None

    @staticmethod
    def get_class_subjects_for_teacher(db: Session, teacher_user_id: str) -> List[dict]:
        """Get all class subjects assigned to a teacher"""
        try:
            # First get the teacher profile ID using user_id
            teacher_profile_id = AttendanceService._get_teacher_profile_id(db, teacher_user_id)

            if not teacher_profile_id:
                return []  # No teacher profile found

            # Now get class subject assignments for this teacher
            assignments = db.query(ClassSubjectTeacher).join(ClassSubject).filter(
                ClassSubjectTeacher.teacher_id == teacher_profile_id,
                ClassSubjectTeacher.is_active == True,
                ClassSubject.is_active == True
            ).all()


            result = []
            for assignment in assignments:
                class_subject = assignment.class_subject
                class_info = class_subject.class_info
                subject = class_subject.subject

                result.append({
                    "id": class_subject.id,
                    "class_id": class_subject.class_id,
                    "subject_id": class_subject.subject_id,
                    "class_name": class_info.name,
                    "subject_name": subject.name,
                    "grade_level": class_info.grade_level,
                    "section": class_info.section,
                    "is_compulsory": class_subject.is_compulsory,
                    "credits": class_subject.credits,
                    "periods_per_week": assignment.periods_per_week,
                    "syllabus_completion": assignment.syllabus_completion
                })

            return result
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to fetch class subjects: {str(e)}"
            )

    @staticmethod
    def get_students_for_class_subject(db: Session, class_subject_id: str) -> List[dict]:
        """Get all students enrolled in a specific class subject"""
        try:
            # Find the class for this subject
            class_subject = db.query(ClassSubject).filter(ClassSubject.id == class_subject_id).first()
            if not class_subject:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Class subject not found"
                )

            # Get all students in this class
            students = db.query(Student).filter(
                Student.class_id == class_subject.class_id,
                Student.is_active == True,
                Student.is_deleted == False
            ).all()

            result = []
            for student in students:
                result.append({
                    "id": student.id,
                    "user_id": student.user_id,
                    "name": student.user.name,
                    "email": student.user.email,
                    "roll_number": student.roll_number,
                    "class_id": student.class_id,
                    "class_name": student.class_info.name,
                    "grade_level": student.class_info.grade_level,
                    "section": student.class_info.section
                })

            return result
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to fetch students: {str(e)}"
            )

    @staticmethod
    def mark_attendance(db: Session, attendance_data: AttendanceCreate, teacher_user_id: str) -> dict:
        """Mark attendance for a class subject on a specific date"""
        try:
            # Get teacher profile ID
            teacher_profile_id = AttendanceService._get_teacher_profile_id(db, teacher_user_id)
            if not teacher_profile_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Teacher profile not found"
                )

            # Verify teacher is assigned to this class subject
            assignment = db.query(ClassSubjectTeacher).filter(
                ClassSubjectTeacher.class_subject_id == attendance_data.class_subject_id,
                ClassSubjectTeacher.teacher_id == teacher_profile_id,
                ClassSubjectTeacher.is_active == True
            ).first()

            if not assignment:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You are not assigned to teach this class subject"
                )

            # Get current academic year (simplified - you might want to make this configurable)
            current_year = datetime.now().year
            academic_year = f"{current_year}-{current_year + 1}"

            # Check if attendance already exists for this date and class
            existing_attendance = db.query(StudentAttendance).filter(
                StudentAttendance.class_subject_id == attendance_data.class_subject_id,
                StudentAttendance.attendance_date == attendance_data.attendance_date,
                StudentAttendance.is_active == True
            ).all()

            # If attendance already exists, soft delete the existing records
            if existing_attendance:
                for record in existing_attendance:
                    record.is_active = False
                    record.updated_at = datetime.utcnow()
                db.commit()

            # Create attendance records
            attendance_records = []
            for record in attendance_data.attendance_records:
                attendance = StudentAttendance(
                    id=generate_id(f"{record['student_id']}_{attendance_data.class_subject_id}_{attendance_data.attendance_date}"),
                    student_id=record["student_id"],
                    class_subject_id=attendance_data.class_subject_id,
                    academic_year=academic_year,
                    attendance_date=attendance_data.attendance_date,
                    status=record["status"],
                    remarks=record.get("remarks"),
                    marked_by=teacher_user_id,
                    is_active=True
                )
                db.add(attendance)
                attendance_records.append(attendance)

            db.commit()

            # Calculate summary
            total_students = len(attendance_records)
            present_count = sum(1 for r in attendance_records if r.status == "present")
            absent_count = sum(1 for r in attendance_records if r.status == "absent")
            late_count = sum(1 for r in attendance_records if r.status == "late")
            excused_count = sum(1 for r in attendance_records if r.status == "excused")

            return {
                "message": "Attendance marked successfully",
                "total_students": total_students,
                "present_count": present_count,
                "absent_count": absent_count,
                "late_count": late_count,
                "excused_count": excused_count,
                "attendance_percentage": (present_count / total_students * 100) if total_students > 0 else 0
            }

        except HTTPException:
            raise
        except Exception as e:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to mark attendance: {str(e)}"
            )

    @staticmethod
    def get_attendance_for_class_subject(db: Session, class_subject_id: str, attendance_date: date, teacher_user_id: str) -> List[dict]:
        """Get attendance records for a specific class subject and date"""
        try:
            # Get teacher profile ID
            teacher_profile_id = AttendanceService._get_teacher_profile_id(db, teacher_user_id)
            if not teacher_profile_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Teacher profile not found"
                )

            # Verify teacher is assigned to this class subject
            assignment = db.query(ClassSubjectTeacher).filter(
                ClassSubjectTeacher.class_subject_id == class_subject_id,
                ClassSubjectTeacher.teacher_id == teacher_profile_id,
                ClassSubjectTeacher.is_active == True
            ).first()

            if not assignment:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You are not assigned to teach this class subject"
                )

            attendance_records = db.query(StudentAttendance).filter(
                StudentAttendance.class_subject_id == class_subject_id,
                StudentAttendance.attendance_date == attendance_date,
                StudentAttendance.is_active == True
            ).all()

            result = []
            for record in attendance_records:
                result.append({
                    "id": record.id,
                    "student_id": record.student_id,
                    "student_name": record.student.user.name,
                    "roll_number": record.student.roll_number,
                    "status": record.status,
                    "remarks": record.remarks,
                    "marked_by": record.marker.name if record.marker else None,
                    "created_at": record.created_at
                })

            return result
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to fetch attendance: {str(e)}"
            )

    @staticmethod
    def update_attendance_record(db: Session, attendance_id: str, update_data: AttendanceUpdate, teacher_user_id: str) -> dict:
        """Update a specific attendance record"""
        try:
            attendance_record = db.query(StudentAttendance).filter(
                StudentAttendance.id == attendance_id,
                StudentAttendance.is_active == True
            ).first()

            if not attendance_record:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Attendance record not found"
                )

            # Get teacher profile ID
            teacher_profile_id = AttendanceService._get_teacher_profile_id(db, teacher_user_id)
            if not teacher_profile_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Teacher profile not found"
                )

            # Verify teacher is assigned to this class subject
            assignment = db.query(ClassSubjectTeacher).filter(
                ClassSubjectTeacher.class_subject_id == attendance_record.class_subject_id,
                ClassSubjectTeacher.teacher_id == teacher_profile_id,
                ClassSubjectTeacher.is_active == True
            ).first()

            if not assignment:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You are not authorized to update this attendance record"
                )

            # Update fields
            if update_data.status:
                attendance_record.status = update_data.status
            if update_data.remarks is not None:
                attendance_record.remarks = update_data.remarks

            db.commit()
            db.refresh(attendance_record)

            return {
                "id": attendance_record.id,
                "student_id": attendance_record.student_id,
                "status": attendance_record.status,
                "remarks": attendance_record.remarks,
                "updated_at": attendance_record.updated_at
            }

        except HTTPException:
            raise
        except Exception as e:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to update attendance: {str(e)}"
            )

    @staticmethod
    def get_attendance_summary(db: Session, class_subject_id: str, start_date: date, end_date: date, teacher_user_id: str) -> dict:
        """Get attendance summary for a date range"""
        try:
            # Get teacher profile ID
            teacher_profile_id = AttendanceService._get_teacher_profile_id(db, teacher_user_id)
            if not teacher_profile_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Teacher profile not found"
                )

            # Verify teacher is assigned to this class subject
            assignment = db.query(ClassSubjectTeacher).filter(
                ClassSubjectTeacher.class_subject_id == class_subject_id,
                ClassSubjectTeacher.teacher_id == teacher_profile_id,
                ClassSubjectTeacher.is_active == True
            ).first()

            if not assignment:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You are not assigned to teach this class subject"
                )

            # Get attendance statistics
            attendance_stats = db.query(
                func.count(StudentAttendance.id).label('total_records'),
                func.sum(func.case((StudentAttendance.status == 'present', 1), else_=0)).label('present_count'),
                func.sum(func.case((StudentAttendance.status == 'absent', 1), else_=0)).label('absent_count'),
                func.sum(func.case((StudentAttendance.status == 'late', 1), else_=0)).label('late_count'),
                func.sum(func.case((StudentAttendance.status == 'excused', 1), else_=0)).label('excused_count')
            ).filter(
                StudentAttendance.class_subject_id == class_subject_id,
                StudentAttendance.attendance_date.between(start_date, end_date),
                StudentAttendance.is_active == True
            ).first()

            # Get total working days (dates with attendance records)
            working_days = db.query(func.count(func.distinct(StudentAttendance.attendance_date))).filter(
                StudentAttendance.class_subject_id == class_subject_id,
                StudentAttendance.attendance_date.between(start_date, end_date),
                StudentAttendance.is_active == True
            ).scalar()

            # Get total students in class
            class_subject = db.query(ClassSubject).filter(ClassSubject.id == class_subject_id).first()
            total_students = db.query(Student).filter(
                Student.class_id == class_subject.class_id,
                Student.is_active == True
            ).count()

            return {
                "class_subject_id": class_subject_id,
                "start_date": start_date,
                "end_date": end_date,
                "working_days": working_days,
                "total_students": total_students,
                "total_records": attendance_stats.total_records or 0,
                "present_count": attendance_stats.present_count or 0,
                "absent_count": attendance_stats.absent_count or 0,
                "late_count": attendance_stats.late_count or 0,
                "excused_count": attendance_stats.excused_count or 0,
                "overall_attendance_percentage": (
                    (attendance_stats.present_count or 0) / (attendance_stats.total_records or 1) * 100
                )
            }

        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to get attendance summary: {str(e)}"
            )

    @staticmethod
    def get_class_wise_attendance_analytics(db: Session, school_id: str, academic_session_name: Optional[str] = None) -> dict:
        """Get attendance analytics by class and subject for a school"""
        try:
            from app.models.users import AcademicSession, Class, ClassSubject

            # Get academic session if specified, otherwise get current session
            session_filter = None
            if academic_session_name:
                academic_session = db.query(AcademicSession).filter(
                    AcademicSession.name == academic_session_name,
                    AcademicSession.school_id == school_id,
                    AcademicSession.is_active == True
                ).first()
                if academic_session:
                    session_filter = academic_session
            else:
                # Get current session
                academic_session = db.query(AcademicSession).filter(
                    AcademicSession.school_id == school_id,
                    AcademicSession.is_current == True,
                    AcademicSession.is_active == True
                ).first()
                if academic_session:
                    session_filter = academic_session

            if not session_filter:
                return {"classes": [], "summary": {"total_classes": 0, "total_subjects": 0, "average_attendance": 0}}

            # Get all classes for this academic session
            classes = db.query(Class).filter(
                Class.school_id == school_id,
                Class.academic_year == academic_session.name,
                Class.is_active == True,
                Class.is_deleted == False
            ).all()

            classes_data = []
            total_classes = len(classes)
            total_subjects_overall = 0
            total_students_overall = 0
            total_attendance_percentage = 0
            classes_with_data = 0

            for class_obj in classes:
                # Get subjects for this class
                class_subjects = db.query(ClassSubject).filter(
                    ClassSubject.class_id == class_obj.id,
                    ClassSubject.is_active == True
                ).all()

                # Get total students in this class
                total_students_in_class = db.query(Student).filter(
                    Student.class_id == class_obj.id,
                    Student.is_active == True,
                    Student.is_deleted == False
                ).count()

                subjects_data = []
                class_total_percentage = 0
                subjects_with_data = 0

                for class_subject in class_subjects:
                    # Get attendance data for this subject
                    attendance_records = db.query(StudentAttendance).filter(
                        StudentAttendance.class_subject_id == class_subject.id,
                        StudentAttendance.attendance_date >= session_filter.start_date,
                        StudentAttendance.attendance_date <= session_filter.end_date,
                        StudentAttendance.is_active == True
                    ).all()

                    if attendance_records:
                        present_count = sum(1 for r in attendance_records if r.status == 'present')
                        total_records = len(attendance_records)
                        attendance_percentage = (present_count / total_records * 100) if total_records > 0 else 0

                        subjects_data.append({
                            "subject_id": class_subject.id,
                            "subject_name": class_subject.subject.name if class_subject.subject else "Unknown",
                            "total_classes": len(set(r.attendance_date for r in attendance_records)),
                            "total_present": present_count,
                            "total_records": total_records,
                            "attendance_percentage": round(attendance_percentage, 2)
                        })

                        class_total_percentage += attendance_percentage
                        subjects_with_data += 1

                # Calculate class average
                class_average = class_total_percentage / subjects_with_data if subjects_with_data > 0 else 0

                if subjects_data:
                    classes_data.append({
                        "class_id": class_obj.id,
                        "class_name": class_obj.name,
                        "total_students": total_students_in_class,
                        "total_subjects": len(subjects_data),
                        "subjects": subjects_data,
                        "class_average_attendance": round(class_average, 2)
                    })

                    total_subjects_overall += len(subjects_data)
                    total_students_overall += total_students_in_class
                    total_attendance_percentage += class_average
                    classes_with_data += 1

            overall_average = total_attendance_percentage / classes_with_data if classes_with_data > 0 else 0

            return {
                "academic_session": {
                    "name": session_filter.name,
                    "start_date": session_filter.start_date.isoformat() if session_filter.start_date else None,
                    "end_date": session_filter.end_date.isoformat() if session_filter.end_date else None
                },
                "classes": classes_data,
                "summary": {
                    "total_classes": total_classes,
                    "classes_with_data": classes_with_data,
                    "total_subjects": total_subjects_overall,
                    "total_students": total_students_overall,
                    "average_attendance": round(overall_average, 2)
                }
            }

        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to get class-wise attendance analytics: {str(e)}"
            )

    @staticmethod
    def get_subject_wise_student_attendance(db: Session, school_id: str, academic_session_name: Optional[str] = None) -> dict:
        """Get attendance analytics by subject and students"""
        try:
            from app.models.users import AcademicSession, ClassSubject
            from app.models.student import Student

            # Get academic session
            session_filter = None
            if academic_session_name:
                academic_session = db.query(AcademicSession).filter(
                    AcademicSession.name == academic_session_name,
                    AcademicSession.school_id == school_id,
                    AcademicSession.is_active == True
                ).first()
                if academic_session:
                    session_filter = academic_session
            else:
                academic_session = db.query(AcademicSession).filter(
                    AcademicSession.school_id == school_id,
                    AcademicSession.is_current == True,
                    AcademicSession.is_active == True
                ).first()
                if academic_session:
                    session_filter = academic_session

            if not session_filter:
                return {"subjects": [], "summary": {"total_subjects": 0, "total_students": 0, "average_attendance": 0}}

            # Get all class subjects for this school and session
            class_subjects = db.query(ClassSubject).join(Class).filter(
                Class.school_id == school_id,
                Class.academic_year == academic_session.name,
                ClassSubject.is_active == True,
                Class.is_active == True,
                Class.is_deleted == False
            ).all()

            subjects_data = []
            total_subjects = len(class_subjects)
            total_students_overall = 0
            total_attendance_percentage = 0
            subjects_with_data = 0

            for class_subject in class_subjects:
                # Get all students enrolled in classes that have this subject
                students_in_class = db.query(Student).filter(
                    Student.class_id == class_subject.class_id,
                    Student.is_active == True,
                    Student.is_deleted == False
                ).all()

                students_data = []
                subject_total_percentage = 0
                students_with_data = 0

                for student in students_in_class:
                    # Get attendance records for this student in this subject
                    attendance_records = db.query(StudentAttendance).filter(
                        StudentAttendance.student_id == student.id,
                        StudentAttendance.class_subject_id == class_subject.id,
                        StudentAttendance.attendance_date >= session_filter.start_date,
                        StudentAttendance.attendance_date <= session_filter.end_date,
                        StudentAttendance.is_active == True
                    ).all()

                    if attendance_records:
                        present_count = sum(1 for r in attendance_records if r.status == 'present')
                        total_records = len(attendance_records)
                        attendance_percentage = (present_count / total_records * 100) if total_records > 0 else 0

                        students_data.append({
                            "student_id": student.id,
                            "student_name": f"{student.user.name} ({student.roll_number or 'N/A'})" if student.user else "Unknown",
                            "total_classes": len(set(r.attendance_date for r in attendance_records)),
                            "total_present": present_count,
                            "total_records": total_records,
                            "attendance_percentage": round(attendance_percentage, 2)
                        })

                        subject_total_percentage += attendance_percentage
                        students_with_data += 1

                # Calculate subject average
                subject_average = subject_total_percentage / students_with_data if students_with_data > 0 else 0

                if students_data:
                    subjects_data.append({
                        "subject_id": class_subject.id,
                        "subject_name": class_subject.subject.name if class_subject.subject else "Unknown",
                        "class_name": class_subject.class_info.name if class_subject.class_info else "Unknown Class",
                        "total_students": len(students_data),
                        "students": students_data,
                        "subject_average_attendance": round(subject_average, 2)
                    })

                    total_students_overall += len(students_data)
                    total_attendance_percentage += subject_average
                    subjects_with_data += 1

            overall_average = total_attendance_percentage / subjects_with_data if subjects_with_data > 0 else 0

            return {
                "academic_session": {
                    "name": session_filter.name,
                    "start_date": session_filter.start_date.isoformat() if session_filter.start_date else None,
                    "end_date": session_filter.end_date.isoformat() if session_filter.end_date else None
                },
                "subjects": subjects_data,
                "summary": {
                    "total_subjects": total_subjects,
                    "subjects_with_data": subjects_with_data,
                    "total_students": total_students_overall,
                    "average_attendance": round(overall_average, 2)
                }
            }

        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to get subject-wise student attendance: {str(e)}"
            )
