from sqlalchemy.orm import Session
from sqlalchemy import and_, func
from fastapi import HTTPException, status
from app.models.student import Student, StudentSubject
from app.models.users import User, Class, Address, StudentSubjectEnrollment, ClassSubject, Subject
from app.models.teacher import Teacher
from app.models.grade import StudentGrade
from app.models.attendance import StudentAttendance
from app.core.utils_functions import generate_id
from app.services.user_service import UserService
from typing import List, Optional, Dict
from datetime import datetime


class StudentService:
    @staticmethod
    def get_student_by_id(db: Session, student_id: str) -> Optional[Student]:
        """Get student by ID"""
        return db.query(Student).filter(Student.id == student_id).first()

    @staticmethod
    def get_student_by_user_id(db: Session, user_id: str) -> Optional[Student]:
        """Get student by user ID"""
        return db.query(Student).filter(Student.user_id == user_id).first()

    @staticmethod
    def get_students_by_school(db: Session, school_id: str) -> List[Student]:
        """Get all students for a school"""
        return db.query(Student).join(User).filter(
            User.school_id == school_id,
            User.role == "student",
            User.is_active == True
        ).all()

    @staticmethod
    def get_students_by_class(db: Session, class_id: str, include_inactive: bool = True) -> List[Student]:
        """Get all students in a class (including inactive if include_inactive=True)"""
        query = db.query(Student).filter(Student.class_id == class_id)
        if not include_inactive:
            query = query.filter(Student.user.has(is_active=True))
        return query.all()

    @staticmethod
    def create_student(db: Session, user_id: str, student_data: dict) -> Student:
        """Create student profile for a user"""
        # Check if user exists and is a student
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        if user.role != "student":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User is not a student"
            )

        # Check if student profile already exists
        existing_student = StudentService.get_student_by_user_id(db, user_id)
        if existing_student:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Student profile already exists for this user"
            )

        # Validate class exists and belongs to same school
        class_obj = db.query(Class).filter(Class.id == student_data["class_id"]).first()
        if not class_obj:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid class ID"
            )
        if class_obj.school_id != user.school_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Class does not belong to the student's school"
            )

        # Create student profile
        student = Student(
            id=generate_id(user.name + "_student"),
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
        db.flush()  # Get the student ID

        # Add student subjects
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

        db.commit()
        db.refresh(student)
        return student

    @staticmethod
    def update_student(db: Session, student_id: str, update_data: dict, updated_by: str) -> Student:
        """Update student profile"""
        student = StudentService.get_student_by_id(db, student_id)
        if not student:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Student not found"
            )

        # Check permissions (only subadmin of same school or the student themselves can update)
        current_user = db.query(User).filter(User.id == updated_by).first()
        student_user = student.user

        if current_user.role == "subadmin":
            if current_user.school_id != student_user.school_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied"
                )
        elif current_user.id != student_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )

        # Update user fields if provided
        user_update_data = {}
        if "name" in update_data and update_data["name"]:
            user_update_data["name"] = update_data["name"]
        if "email" in update_data and update_data["email"]:
            user_update_data["email"] = update_data["email"]
        if "phone" in update_data:
            user_update_data["phone"] = update_data["phone"]
        if "address" in update_data and update_data["address"]:
            user_update_data["address"] = update_data["address"]
        
        if user_update_data:
            UserService.update_user(db, student.user_id, user_update_data, updated_by)

        # Update student fields
        updatable_fields = [
            "roll_number", "date_of_birth", "gender", "blood_group",
            "admission_date", "guardian_name", "guardian_phone", "guardian_relation"
        ]

        for field in updatable_fields:
            if field in update_data:
                setattr(student, field, update_data[field])

        # Update class if provided (with validation)
        if "class_id" in update_data and update_data["class_id"] != student.class_id:
            new_class = db.query(Class).filter(Class.id == update_data["class_id"]).first()
            if not new_class:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid class ID"
                )
            if new_class.school_id != student_user.school_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Class does not belong to the student's school"
                )
            
            # Remove old class enrollments
            db.query(StudentSubjectEnrollment).filter(
                StudentSubjectEnrollment.student_id == student.id
            ).delete()
            
            # Add new class enrollments
            new_class_subjects = db.query(ClassSubject).filter(
                ClassSubject.class_id == update_data["class_id"]
            ).all()
            for class_subject in new_class_subjects:
                enrollment = StudentSubjectEnrollment(
                    id=generate_id(f"{student.id}_{class_subject.id}_enrollment"),
                    student_id=student.id,
                    class_subject_id=class_subject.id,
                    academic_year=class_subject.class_info.academic_year if class_subject.class_info else None
                )
                db.add(enrollment)
            
            student.class_id = update_data["class_id"]

        # Update student subjects if provided
        if "subjects" in update_data:
            # Remove existing subjects
            db.query(StudentSubject).filter(StudentSubject.student_id == student_id).delete()

            # Add new subjects
            for subject_data in update_data["subjects"]:
                student_subject = StudentSubject(
                    id=generate_id(f"{student.user_id}_{subject_data['subject_id']}_student"),
                    student_id=student_id,
                    subject_id=subject_data["subject_id"],
                    is_elective=subject_data.get("is_elective", False),
                    priority_order=subject_data.get("priority_order")
                )
                db.add(student_subject)

        db.commit()
        db.refresh(student)
        return student

    @staticmethod
    def get_student_subjects(db: Session, student_user_id: str) -> List[dict]:
        """Get subjects enrolled by a student (from both StudentSubject and StudentSubjectEnrollment)"""
        student = StudentService.get_student_by_user_id(db, student_user_id)
        if not student:
            return []

        subjects_list = []
        subject_ids_added = set()

        # Get subjects from StudentSubject (legacy direct enrollment)
        student_subjects = db.query(StudentSubject).filter(
            StudentSubject.student_id == student.id
        ).all()

        for ss in student_subjects:
            if ss.subject_id not in subject_ids_added:
                subjects_list.append({
                    "id": ss.id,
                    "subject_id": ss.subject_id,
                    "subject": {
                        "id": ss.subject.id,
                        "name": ss.subject.name,
                        "code": ss.subject.code
                    } if ss.subject else None,
                    "is_elective": ss.is_elective,
                    "priority_order": ss.priority_order,
                    "created_at": ss.created_at
                })
                subject_ids_added.add(ss.subject_id)

        # Get subjects from StudentSubjectEnrollment (class-based enrollment)
        enrollments = db.query(StudentSubjectEnrollment).filter(
            StudentSubjectEnrollment.student_id == student.id,
            StudentSubjectEnrollment.is_active == True,
            StudentSubjectEnrollment.is_deleted == False
        ).all()

        for enrollment in enrollments:
            if enrollment.class_subject and enrollment.class_subject.subject:
                subject_id = enrollment.class_subject.subject.id
                if subject_id not in subject_ids_added:
                    subjects_list.append({
                        "id": enrollment.id,
                        "subject_id": subject_id,
                        "subject": {
                            "id": enrollment.class_subject.subject.id,
                            "name": enrollment.class_subject.subject.name,
                            "code": enrollment.class_subject.subject.code
                        },
                        "is_elective": not enrollment.class_subject.is_compulsory if enrollment.class_subject else False,
                        "priority_order": None,
                        "created_at": enrollment.enrollment_date or enrollment.created_at if hasattr(enrollment, 'created_at') else None,
                        "class_subject_id": enrollment.class_subject_id,
                        "is_compulsory": enrollment.class_subject.is_compulsory if enrollment.class_subject else True
                    })
                    subject_ids_added.add(subject_id)

        return subjects_list

    @staticmethod
    def delete_student(db: Session, student_id: str, deleted_by: str) -> bool:
        """Delete student profile (soft delete by deactivating user)"""
        student = StudentService.get_student_by_id(db, student_id)
        if not student:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Student not found"
            )

        # Check permissions (only subadmin of same school can delete)
        current_user = db.query(User).filter(User.id == deleted_by).first()
        if current_user.role != "subadmin" or current_user.school_id != student.user.school_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )

        # Soft delete - deactivate user
        student.user.is_active = False
        db.commit()

        return True

    @staticmethod
    def get_student_dashboard_data(db: Session, user_id: str) -> Dict:
        """Get comprehensive dashboard data for a student"""
        student = StudentService.get_student_by_user_id(db, user_id)
        if not student:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Student profile not found"
            )

        # Get profile data
        profile = {
            "id": student.id,
            "name": student.user.name,
            "email": student.user.email,
            "roll_number": student.roll_number,
            "class_name": student.class_info.name if student.class_info else None,
            "date_of_birth": student.date_of_birth,
            "gender": student.gender,
            "blood_group": student.blood_group,
            "admission_date": student.admission_date,
            "guardian_name": student.guardian_name,
            "guardian_phone": student.guardian_phone,
            "address": {
                "street": student.user.address.street if student.user.address else None,
                "city": student.user.address.city if student.user.address else None,
                "state": student.user.address.state if student.user.address else None,
                "country": student.user.address.country if student.user.address else None,
                "postal_code": student.user.address.postal_code if student.user.address else None,
            } if student.user.address else None
        }

        # Get subjects data with teacher information
        subjects = StudentService.get_student_subjects_with_teachers(db, student.id)

        # Get grades data
        grades = StudentService.get_student_grades(db, student.id)

        # Get attendance data
        attendance = StudentService.get_student_attendance(db, student.id)

        # Calculate quick stats
        quick_stats = StudentService.calculate_student_quick_stats(db, student.id, grades, attendance)

        return {
            "profile": profile,
            "subjects": subjects,
            "grades": grades,
            "attendance": attendance,
            "quick_stats": quick_stats
        }

    @staticmethod
    def get_student_grades(db: Session, student_id: str) -> List[Dict]:
        """Get all grades for a student"""
        # Import the ClassSubjectTeacher model
        from app.models.users import ClassSubjectTeacher

        # Get grades from StudentGrade table
        grades_query = db.query(StudentGrade).filter(
            StudentGrade.student_id == student_id,
            StudentGrade.is_active == True
        ).join(ClassSubject, StudentGrade.class_subject_id == ClassSubject.id).join(
            Subject, ClassSubject.subject_id == Subject.id
        ).all()

        grades = []
        for grade in grades_query:
            # Get teacher for this class subject (first active teacher)
            teacher_info = None
            class_subject_teacher = db.query(ClassSubjectTeacher).filter(
                ClassSubjectTeacher.class_subject_id == grade.class_subject_id,
                ClassSubjectTeacher.is_active == True
            ).first()

            if class_subject_teacher and class_subject_teacher.teacher:
                teacher_info = class_subject_teacher.teacher.user.name

            grades.append({
                "id": grade.id,
                "subject": {
                    "id": grade.class_subject.subject.id,
                    "name": grade.class_subject.subject.name,
                    "code": grade.class_subject.subject.code
                },
                "academic_year": grade.academic_year,
                "midterm_marks": grade.midterm_marks,
                "final_marks": grade.final_marks,
                "grade": grade.grade,
                "attendance_percentage": grade.attendance_percentage,
                "status": grade.status,
                "teacher": teacher_info,
                "created_at": grade.created_at,
                "updated_at": grade.updated_at
            })

        return grades

    @staticmethod
    def get_student_subjects_with_teachers(db: Session, student_id: str) -> List[Dict]:
        """Get student's subjects with teacher information"""
        from app.models.users import ClassSubjectTeacher

        # Get student
        student = StudentService.get_student_by_id(db, student_id)
        if not student:
            return []

        subjects_list = []

        # Get subjects from StudentSubjectEnrollment (class-based enrollment)
        enrollments = db.query(StudentSubjectEnrollment).filter(
            StudentSubjectEnrollment.student_id == student_id,
            StudentSubjectEnrollment.is_active == True,
            StudentSubjectEnrollment.is_deleted == False
        ).all()

        for enrollment in enrollments:
            if enrollment.class_subject and enrollment.class_subject.subject:
                subject_info = enrollment.class_subject.subject
                class_subject = enrollment.class_subject

                # Get teacher for this class subject
                teacher_info = None
                class_subject_teacher = db.query(ClassSubjectTeacher).filter(
                    ClassSubjectTeacher.class_subject_id == class_subject.id,
                    ClassSubjectTeacher.is_active == True
                ).first()

                if class_subject_teacher and class_subject_teacher.teacher:
                    teacher = class_subject_teacher.teacher
                    teacher_info = {
                        "id": teacher.id,
                        "name": teacher.user.name if teacher.user else None,
                        "email": teacher.user.email if teacher.user else None,
                        "qualification": teacher.qualification,
                        "specialization": teacher.specialization
                    }

                subjects_list.append({
                    "id": enrollment.id,
                    "subject_id": subject_info.id,
                    "subject": {
                        "id": subject_info.id,
                        "name": subject_info.name,
                        "code": subject_info.code,
                        "description": getattr(subject_info, 'description', None)
                    },
                    "teacher": teacher_info,
                    "is_elective": not class_subject.is_compulsory if class_subject.is_compulsory is not None else False,
                    "is_compulsory": class_subject.is_compulsory,
                    "credits": class_subject.credits,
                    "academic_year": enrollment.academic_year or getattr(class_subject.class_info, 'academic_year', None) if class_subject.class_info else None,
                    "enrolled_at": enrollment.enrollment_date
                })

        return subjects_list

    @staticmethod
    def get_student_attendance(db: Session, student_id: str) -> Dict:
        """Get attendance data for a student"""
        # Get attendance records for current academic year
        current_year = datetime.now().year
        academic_year = f"{current_year}-{current_year + 1}"

        # Get student's enrolled subjects first
        student = StudentService.get_student_by_id(db, student_id)
        if not student:
            return {"overall": 0, "subjects": []}

        # Get all class subjects the student is enrolled in
        enrolled_subjects = []
        enrollments = db.query(StudentSubjectEnrollment).filter(
            StudentSubjectEnrollment.student_id == student_id,
            StudentSubjectEnrollment.is_active == True,
            StudentSubjectEnrollment.is_deleted == False
        ).all()

        for enrollment in enrollments:
            if enrollment.class_subject and enrollment.class_subject.subject:
                enrolled_subjects.append({
                    "id": enrollment.class_subject.subject.id,
                    "name": enrollment.class_subject.subject.name,
                    "class_subject_id": enrollment.class_subject.id
                })

        # Calculate overall attendance from all attendance records
        total_classes = db.query(func.count(StudentAttendance.id)).filter(
            StudentAttendance.student_id == student_id,
            StudentAttendance.academic_year == academic_year,
            StudentAttendance.is_active == True
        ).scalar()

        present_classes = db.query(func.count(StudentAttendance.id)).filter(
            StudentAttendance.student_id == student_id,
            StudentAttendance.academic_year == academic_year,
            StudentAttendance.status == "present",
            StudentAttendance.is_active == True
        ).scalar()

        overall_percentage = (present_classes / total_classes * 100) if total_classes > 0 else 0

        # Get subject-wise attendance for enrolled subjects
        from sqlalchemy import case
        subjects = []

        for enrolled_subject in enrolled_subjects:
            # Try to get attendance data for this specific subject
            subject_attendance = db.query(
                func.count(StudentAttendance.id).label('total'),
                func.sum(case((StudentAttendance.status == "present", 1), else_=0)).label('present')
            ).filter(
                StudentAttendance.student_id == student_id,
                StudentAttendance.class_subject_id == enrolled_subject["class_subject_id"],
                StudentAttendance.academic_year == academic_year,
                StudentAttendance.is_active == True
            ).first()

            total = subject_attendance.total or 0
            present = subject_attendance.present or 0
            percentage = (present / total * 100) if total > 0 else 0

            subjects.append({
                "name": enrolled_subject["name"],
                "percentage": round(percentage, 1),
                "present": int(present),
                "total": int(total)
            })

        return {
            "overall": round(overall_percentage, 1),
            "subjects": subjects,
            "academic_year": academic_year
        }

    @staticmethod
    def calculate_student_quick_stats(db: Session, student_id: str, grades: List[Dict], attendance: Dict) -> Dict:
        """Calculate quick statistics for student dashboard"""
        # Calculate GPA from grades
        grade_points = {"A+": 4.0, "A": 4.0, "A-": 3.7, "B+": 3.3, "B": 3.0, "B-": 2.7,
                       "C+": 2.3, "C": 2.0, "C-": 1.7, "D+": 1.3, "D": 1.0, "F": 0.0}

        total_points = 0
        total_subjects = 0

        for grade_data in grades:
            if grade_data.get("grade") and grade_data["grade"] in grade_points:
                total_points += grade_points[grade_data["grade"]]
                total_subjects += 1

        current_gpa = round(total_points / total_subjects, 2) if total_subjects > 0 else 0

        return {
            "overall_attendance": attendance["overall"],
            "current_gpa": current_gpa,
            "total_subjects": total_subjects,
            "completed_subjects": len([g for g in grades if g.get("status") == "completed"])
        }
