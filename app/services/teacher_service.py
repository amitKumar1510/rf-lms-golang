from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.schemas.teacher import TeacherCreate, TeacherUpdate
from app.models.teacher import Teacher, TeacherSubject, TeacherDepartment
from app.models.users import Address, User, Subject, Department, ClassSubject, ClassSubjectTeacher
from app.core.utils_functions import generate_id
from app.core.hash import hash_password
from app.services.user_service import UserService


class TeacherService:
    @staticmethod
    def _teacher_query(db: Session):
        return db.query(Teacher).options(
            joinedload(Teacher.user).joinedload(User.address),
            joinedload(Teacher.subjects).joinedload(TeacherSubject.subject),
            joinedload(Teacher.departments).joinedload(TeacherDepartment.department),
            joinedload(Teacher.class_assignments)
            .joinedload(ClassSubjectTeacher.class_subject)
            .joinedload(ClassSubject.subject),
            joinedload(Teacher.class_assignments)
            .joinedload(ClassSubjectTeacher.class_subject)
            .joinedload(ClassSubject.class_info),
        )

    @staticmethod
    def create_teacher(db: Session, school_id: str, created_by: str, data: TeacherCreate):
        # Create user
        teacher_user = UserService.create_user(db, data, created_by=created_by)
        teacher_user.school_id = school_id

        # Address (optional)
        if data.address is not None:
            teacher_address = Address(
                id=generate_id("address"),
                street=data.address.street,
                city=data.address.city,
                state=data.address.state,
                country=data.address.country,
                postal_code=data.address.postal_code,
                user_id=teacher_user.user_id,
            )
            db.add(teacher_address)

        # Teacher profile
        teacher_model = Teacher(
            school_id=school_id,
            id=generate_id("teacher"),
            user_id=teacher_user.user_id,
            qualification=data.qualification,
            experience_years=data.experience_years,
            specialization=data.specialization,
        )
        db.add(teacher_model)
        db.flush()

        # Also store in users.teacher_id (if your code relies on it)
        teacher_user.teacher_id = teacher_model.id

        # Subjects
        for s in data.subjects or []:
            # ensure subject exists (optional guard)
            subject = db.query(Subject).filter(Subject.id == s.subject_id, Subject.is_deleted == False).first()
            if not subject:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Subject not found: {s.subject_id}")
            db.add(
                TeacherSubject(
                    id=generate_id("teacher_subject"),
                    teacher_id=teacher_model.id,
                    subject_id=s.subject_id,
                    is_primary=bool(s.is_primary),
                    experience_years=s.experience_years,
                )
            )

        # Departments
        for d in data.departments or []:
            department = (
                db.query(Department)
                .filter(Department.id == d.department_id, Department.is_deleted == False)
                .first()
            )
            if not department:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND, detail=f"Department not found: {d.department_id}"
                )
            db.add(
                TeacherDepartment(
                    id=generate_id("teacher_department"),
                    teacher_id=teacher_model.id,
                    department_id=d.department_id,
                    is_primary=bool(d.is_primary),
                )
            )

        db.commit()
        return (
            TeacherService._teacher_query(db)
            .filter(Teacher.id == teacher_model.id, Teacher.school_id == school_id, Teacher.is_deleted == False)
            .first()
        )

    @staticmethod
    def get_teacher_by_id(db: Session, teacher_id: str, school_id: str):
        teacher = (
            TeacherService._teacher_query(db)
            .filter(Teacher.id == teacher_id, Teacher.school_id == school_id, Teacher.is_deleted == False)
            .first()
        )
        if not teacher:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Teacher not found")
        return teacher

    @staticmethod
    def get_all_teachers(db: Session, school_id: str):
        return (
            TeacherService._teacher_query(db)
            .filter(Teacher.school_id == school_id, Teacher.is_deleted == False)
            .all()
        )

    @staticmethod
    def get_teachers_by_department_id(db: Session, school_id: str, department_id: str):
        return (
            TeacherService._teacher_query(db)
            .join(TeacherDepartment, TeacherDepartment.teacher_id == Teacher.id)
            .filter(
                Teacher.school_id == school_id,
                Teacher.is_deleted == False,
                TeacherDepartment.department_id == department_id,
                TeacherDepartment.is_deleted == False,
            )
            .all()
        )

    @staticmethod
    def get_teachers_by_subject_id(db: Session, school_id: str, subject_id: str):
        return (
            TeacherService._teacher_query(db)
            .join(TeacherSubject, TeacherSubject.teacher_id == Teacher.id)
            .filter(
                Teacher.school_id == school_id,
                Teacher.is_deleted == False,
                TeacherSubject.subject_id == subject_id,
                TeacherSubject.is_deleted == False,
            )
            .all()
        )

    @staticmethod
    def get_teachers_by_school_id(db: Session, school_id: str):
        # Admin scope helper; same as get_all_teachers but explicit naming.
        return TeacherService.get_all_teachers(db, school_id)

    @staticmethod
    def get_teachers_by_class_id(db: Session, school_id: str, class_id: str):
        # Use an explicit SELECT for IN() to avoid SAWarning about coercing subquery() into select().
        teacher_ids = (
            select(ClassSubjectTeacher.teacher_id)
            .join(ClassSubject, ClassSubject.id == ClassSubjectTeacher.class_subject_id)
            .where(
                ClassSubject.class_id == class_id,
                ClassSubject.school_id == school_id,
                ClassSubjectTeacher.is_deleted == False,
                ClassSubject.is_deleted == False,
            )
            .distinct()
        )
        return (
            TeacherService._teacher_query(db)
            .filter(Teacher.school_id == school_id, Teacher.is_deleted == False, Teacher.id.in_(teacher_ids))
            .all()
        )

    @staticmethod
    def update_teacher(db: Session, school_id: str, teacher_id: str, data: TeacherUpdate):
        teacher = TeacherService.get_teacher_by_id(db, teacher_id, school_id)

        payload = data.model_dump(exclude_unset=True)

        # User updates
        if "name" in payload:
            teacher.user.name = payload["name"]
        if "email" in payload:
            teacher.user.email = payload["email"]
        if "phone" in payload:
            teacher.user.phone = payload["phone"]
        if payload.get("password"):
            teacher.user.password = hash_password(payload["password"])

        # Address updates
        if "address" in payload and payload["address"] is not None:
            if teacher.user.address is None:
                teacher.user.address = Address(id=generate_id("address"), user_id=teacher.user.user_id)
                db.add(teacher.user.address)
            addr = payload["address"]
            for field in ["street", "city", "state", "country", "postal_code"]:
                if field in addr:
                    setattr(teacher.user.address, field, addr[field])

        # Teacher updates
        for field in ["qualification", "experience_years", "specialization"]:
            if field in payload:
                setattr(teacher, field, payload[field])

        # Replace subjects if provided
        if data.subjects is not None:
            for existing in teacher.subjects:
                existing.is_deleted = True
            for s in data.subjects or []:
                db.add(
                    TeacherSubject(
                        id=generate_id("teacher_subject"),
                        teacher_id=teacher.id,
                        subject_id=s.subject_id,
                        is_primary=bool(s.is_primary),
                        experience_years=s.experience_years,
                    )
                )

        # Replace departments if provided
        if data.departments is not None:
            for existing in teacher.departments:
                existing.is_deleted = True
            for d in data.departments or []:
                db.add(
                    TeacherDepartment(
                        id=generate_id("teacher_department"),
                        teacher_id=teacher.id,
                        department_id=d.department_id,
                        is_primary=bool(d.is_primary),
                    )
                )

        db.commit()
        return TeacherService.get_teacher_by_id(db, teacher_id, school_id)

    @staticmethod
    def delete_teacher(db: Session, school_id: str, teacher_id: str):
        teacher = TeacherService.get_teacher_by_id(db, teacher_id, school_id)
        teacher.is_deleted = True
        teacher.user.is_deleted = True
        if teacher.user.address:
            teacher.user.address.is_deleted = True
        for s in teacher.subjects:
            s.is_deleted = True
        for d in teacher.departments:
            d.is_deleted = True
        db.commit()
        return {"message": "Teacher deleted successfully"}

    @staticmethod
    def deactivate_teacher(db: Session, school_id: str, teacher_id: str):
        teacher = TeacherService.get_teacher_by_id(db, teacher_id, school_id)
        teacher.is_active = False
        teacher.user.is_active = False
        db.commit()
        return TeacherService.get_teacher_by_id(db, teacher_id, school_id)

    @staticmethod
    def activate_teacher(db: Session, school_id: str, teacher_id: str):
        teacher = TeacherService.get_teacher_by_id(db, teacher_id, school_id)
        teacher.is_active = True
        teacher.user.is_active = True
        db.commit()
        return TeacherService.get_teacher_by_id(db, teacher_id, school_id)


