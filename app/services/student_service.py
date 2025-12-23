from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException, status
from app.models.student import Student
from app.models.users import Class
from app.schemas.student import StudentCreate
from app.services.user_service import UserService
from app.core.utils_functions import generate_id
from app.models.users import Address, User
from app.services.parent_service import ParentService
from app.core.hash import hash_password


class StudentService:
    @staticmethod
    def _next_roll_number_for_class(db: Session, school_id: str, class_id: str) -> str:
        # Lock class row to reduce race conditions for concurrent student creation.
        class_model = (
            db.query(Class)
            .filter(
                Class.id == class_id,
                Class.school_id == school_id,
                Class.is_deleted == False,
            )
            .with_for_update()
            .first()
        )
        if not class_model:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Class not found")

        existing_rolls = (
            db.query(Student.roll_number)
            .filter(
                Student.school_id == school_id,
                Student.class_id == class_id,
                Student.is_deleted == False,
            )
            .all()
        )
        active_count = len(existing_rolls)

        if class_model.capacity is not None and active_count >= class_model.capacity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Class capacity is full ({active_count}/{class_model.capacity}).",
            )

        max_num = 0
        for (rn,) in existing_rolls:
            if rn is None:
                continue
            s = str(rn).strip()
            if s.isdigit():
                max_num = max(max_num, int(s))

        next_num = max_num + 1
        # Format like 01, 02 ... (keeps more digits when >99)
        return str(next_num).zfill(2)

    @staticmethod
    def _student_query_with_all_info(db: Session):
        return db.query(Student).options(
            joinedload(Student.user).joinedload(User.address),
            joinedload(Student.parent),
            joinedload(Student.class_info),
        )

    @staticmethod
    def _student_full_payload(student: Student):
        return {
            "student": student,
            "parent": student.parent,
            "address": student.user.address if getattr(student, "user", None) else None,
        }

    def create_student(db: Session, school_id: str, user_id: str, data: StudentCreate):
        # Auto-allocate roll number if not provided and enforce class capacity.
        # Do this BEFORE creating user/address to avoid orphan rows when class is full.
        requested_roll = (data.roll_number or "").strip() if data.roll_number is not None else ""
        if requested_roll:
            # Validate class exists and capacity not full (lock row)
            class_model = (
                db.query(Class)
                .filter(
                    Class.id == data.class_id,
                    Class.school_id == school_id,
                    Class.is_deleted == False,
                )
                .with_for_update()
                .first()
            )
            if not class_model:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Class not found")

            existing_count = (
                db.query(Student.id)
                .filter(Student.school_id == school_id, Student.class_id == data.class_id, Student.is_deleted == False)
                .count()
            )
            if class_model.capacity is not None and existing_count >= class_model.capacity:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Class capacity is full ({existing_count}/{class_model.capacity}).",
                )

            dup = (
                db.query(Student.id)
                .filter(
                    Student.school_id == school_id,
                    Student.class_id == data.class_id,
                    Student.roll_number == requested_roll,
                    Student.is_deleted == False,
                )
                .first()
            )
            if dup:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Roll number already exists for this class")
            roll_number = requested_roll
        else:
            roll_number = StudentService._next_roll_number_for_class(db, school_id, data.class_id)

        # Create underlying user account for the student
        student_user = UserService.create_user(db, data, created_by=user_id)
        student_user.school_id = school_id
        # (User model uses created_by; create_user already sets it)

        student_address = Address(
            id=generate_id("address"),
            street=data.parent.address.street if data.parent and data.parent.address else None,
            city=data.parent.address.city if data.parent and data.parent.address else None,
            state=data.parent.address.state if data.parent and data.parent.address else None,
            country=data.parent.address.country if data.parent and data.parent.address else None,
            postal_code=data.parent.address.postal_code if data.parent and data.parent.address else None,
            user_id=student_user.user_id,
        )
        db.add(student_address)
        db.flush()

        student = Student(
            id=generate_id("student"),
            user_id=student_user.user_id,
            roll_number=roll_number,
            date_of_birth=data.date_of_birth,
            gender=data.gender,
            blood_group=data.blood_group,
            class_id=data.class_id,
            admission_date=data.admission_date,
            school_id=school_id,
        )
        db.add(student)
        db.flush()
        # store student profile id on user (same pattern as teachers)
        student_user.student_id = student.id
        parent = None
        if data.parent is not None:
            parent = ParentService.create_parent(db, student.id, school_id, data.parent)
            # keep linkage for convenience
            try:
                student_user.parent_id = getattr(parent, "id", None)
            except Exception:
                pass

        db.commit()
        db.refresh(student)
        db.refresh(student_address)
        db.refresh(student_user)
        if parent is not None:
            db.refresh(parent)
        return {
            "student": student,
            "parent": parent,
            "address": student_address,
        }

    def get_student_by_user_id(db: Session, school_id: str, user_id: str):
        student = (
            StudentService._student_query_with_all_info(db)
            .filter(
                Student.user_id == user_id,
                Student.school_id == school_id,
                Student.is_deleted == False,
            )
            .first()
        )
        if not student:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")
        return StudentService._student_full_payload(student)

    def get_student(db: Session, student_id: str):
        student = (
            StudentService._student_query_with_all_info(db)
            .filter(Student.id == student_id, Student.is_deleted == False)
            .first()
        )
        if not student:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")
        return StudentService._student_full_payload(student)

    # def get_student_by_user_id(db: Session, user_id: str):
    #     print("user_id", user_id)
    #     student = (
    #         StudentService._student_query_with_all_info(db)
    #         .filter(Student.user_id == user_id, Student.is_deleted == False)
    #         .first()
    #     )
    #     if not student:
    #         raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student data not found")
    #     return StudentService._student_full_payload(student)

    def get_all_students(db: Session, school_id: str):
        students = (
            StudentService._student_query_with_all_info(db)
            .filter(Student.school_id == school_id, Student.is_deleted == False)
            .all()
        )
        return [StudentService._student_full_payload(s) for s in students]

    def update_student(db: Session, student_id: str, data: StudentCreate):
        student = (
            StudentService._student_query_with_all_info(db)
            .filter(Student.id == student_id, Student.is_deleted == False)
            .first()
        )
        if not student:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")

        payload = data.model_dump(exclude_unset=True)

        # Update user fields
        if "name" in payload:
            student.user.name = payload["name"]
        if "email" in payload:
            student.user.email = payload["email"]
        if "phone" in payload:
            student.user.phone = payload["phone"]
        if payload.get("password"):
            student.user.password = hash_password(payload["password"])

        # Update student fields
        for field in [
            "roll_number",
            "date_of_birth",
            "gender",
            "blood_group",
            "class_id",
            "admission_date",
        ]:
            if field in payload:
                setattr(student, field, payload[field])

        # Update parent + address fields (if provided)
        parent_payload = payload.get("parent")
        if parent_payload and student.parent:
            for field in [
                "name",
                "phone",
                "relation",
                "email",
                "occupation",
                "education_level",
                "marital_status",
            ]:
                if field in parent_payload and parent_payload[field] is not None:
                    setattr(student.parent, field, parent_payload[field])

            if parent_payload.get("address") and student.user and student.user.address:
                addr = parent_payload["address"]
                for field in ["street", "city", "state", "country", "postal_code"]:
                    if field in addr and addr[field] is not None:
                        setattr(student.user.address, field, addr[field])

        db.commit()
        student = (
            StudentService._student_query_with_all_info(db)
            .filter(Student.id == student.id, Student.is_deleted == False)
            .first()
        )
        return StudentService._student_full_payload(student)

    def delete_student(db: Session, student_id: str):
        student = db.query(Student).filter(Student.id == student_id, Student.is_deleted == False).first()
        if not student:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")
        student.is_deleted = True
        db.commit()
        db.refresh(student)
        return {
            "message": "Student deleted successfully"
        }

    def deactivate_student(db: Session, student_id: str):
        student = (
            StudentService._student_query_with_all_info(db)
            .filter(Student.id == student_id, Student.is_deleted == False)
            .first()
        )
        if not student:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")
        student.is_active = False
        db.commit()
        student = (
            StudentService._student_query_with_all_info(db)
            .filter(Student.id == student.id, Student.is_deleted == False)
            .first()
        )
        return StudentService._student_full_payload(student)

    def activate_student(db: Session, student_id: str):
        student = (
            StudentService._student_query_with_all_info(db)
            .filter(Student.id == student_id, Student.is_deleted == False)
            .first()
        )
        if not student:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")
        student.is_active = True
        db.commit()
        student = (
            StudentService._student_query_with_all_info(db)
            .filter(Student.id == student.id, Student.is_deleted == False)
            .first()
        )
        return StudentService._student_full_payload(student)

    def get_students_by_class_id(db: Session, class_id: str):
        students = (
            StudentService._student_query_with_all_info(db)
            .filter(Student.class_id == class_id, Student.is_deleted == False)
            .all()
        )
        return [StudentService._student_full_payload(s) for s in students]

    






    