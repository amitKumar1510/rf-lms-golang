from sqlalchemy.orm import Session
from sqlalchemy import and_
from fastapi import HTTPException, status
from app.models.student import Student, StudentSubject
from app.models.users import User, Class, Address, StudentSubjectEnrollment, ClassSubject
from app.core.utils_functions import generate_id
from app.services.user_service import UserService
from typing import List, Optional


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
