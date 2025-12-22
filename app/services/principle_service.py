from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.schemas.principle import PrincipleCreate, PrincipleUpdate
from app.models.principle import Principle
from app.models.users import User, Address, School
from app.core.utils_functions import generate_id
from app.core.hash import hash_password
from app.services.user_service import UserService


class PrincipleService:
    @staticmethod
    def _principle_query(db: Session):
        return db.query(Principle).options(
            joinedload(Principle.user).joinedload(User.address),
            joinedload(Principle.assigned_school),
        )

    @staticmethod
    def create_principle(db: Session, default_school_id: str, created_by: str, data: PrincipleCreate):
        # Determine which school this principle belongs to
        assigned_school_id = data.assigned_school_id or default_school_id
        if not assigned_school_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="assigned_school_id is required (admin users do not have a default school).",
            )

        # Ensure school exists
        school = db.query(School).filter(School.id == assigned_school_id, School.is_deleted == False).first()
        if not school:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="School not found")

        # Create user (role = principle)
        principle_user = UserService.create_user(db, data, created_by=created_by)
        principle_user.school_id = assigned_school_id

        # Optional address
        if data.address is not None:
            db.add(
                Address(
                    id=generate_id("address"),
                    street=data.address.street,
                    city=data.address.city,
                    state=data.address.state,
                    country=data.address.country,
                    postal_code=data.address.postal_code,
                    user_id=principle_user.user_id,
                )
            )

        principle = Principle(
            id=generate_id("principle"),
            user_id=principle_user.user_id,
            qualification=data.qualification,
            experience_years=data.experience_years,
            specialization=data.specialization,
            designation=data.designation,
            assigned_school_id=assigned_school_id,
            office_phone=data.office_phone,
            office_email=data.office_email,
        )
        db.add(principle)
        db.commit()

        return (
            PrincipleService._principle_query(db)
            .filter(Principle.id == principle.id, Principle.is_deleted == False)
            .first()
        )

    @staticmethod
    def get_principle_by_id(db: Session, principle_id: str, school_id: str | None = None):
        q = PrincipleService._principle_query(db).filter(Principle.id == principle_id, Principle.is_deleted == False)
        if school_id is not None:
            q = q.filter(Principle.assigned_school_id == school_id)
        principle = q.first()
        if not principle:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Principle not found")
        return principle

    @staticmethod
    def get_all_principles(db: Session, school_id: str):
        return (
            PrincipleService._principle_query(db)
            .filter(Principle.assigned_school_id == school_id, Principle.is_deleted == False)
            .all()
        )

    @staticmethod
    def get_principles_by_school_id(db: Session, school_id: str):
        # Admin scope helper
        return PrincipleService.get_all_principles(db, school_id)

    @staticmethod
    def update_principle(db: Session, principle_id: str, school_id: str, data: PrincipleUpdate):
        principle = PrincipleService.get_principle_by_id(db, principle_id, school_id)
        payload = data.model_dump(exclude_unset=True)

        # User updates
        if "name" in payload:
            principle.user.name = payload["name"]
        if "email" in payload:
            principle.user.email = payload["email"]
        if "phone" in payload:
            principle.user.phone = payload["phone"]
        if payload.get("password"):
            principle.user.password = hash_password(payload["password"])

        # Address updates
        if "address" in payload and payload["address"] is not None:
            if principle.user.address is None:
                principle.user.address = Address(id=generate_id("address"), user_id=principle.user.user_id)
                db.add(principle.user.address)
            addr = payload["address"]
            for field in ["street", "city", "state", "country", "postal_code"]:
                if field in addr:
                    setattr(principle.user.address, field, addr[field])

        # Principle updates
        for field in [
            "qualification",
            "experience_years",
            "specialization",
            "designation",
            "assigned_school_id",
            "office_phone",
            "office_email",
        ]:
            if field in payload:
                setattr(principle, field, payload[field])

        # Keep user's school_id in sync if assigned_school_id changes
        if "assigned_school_id" in payload and payload["assigned_school_id"]:
            principle.user.school_id = payload["assigned_school_id"]

        db.commit()
        return PrincipleService.get_principle_by_id(db, principle_id, None)

    @staticmethod
    def delete_principle(db: Session, principle_id: str, school_id: str):
        principle = PrincipleService.get_principle_by_id(db, principle_id, school_id)
        principle.is_deleted = True
        principle.user.is_deleted = True
        if principle.user.address:
            principle.user.address.is_deleted = True
        db.commit()
        return {"message": "Principle deleted successfully"}

    @staticmethod
    def deactivate_principle(db: Session, principle_id: str, school_id: str):
        principle = PrincipleService.get_principle_by_id(db, principle_id, school_id)
        principle.is_active = False
        principle.user.is_active = False
        db.commit()
        return PrincipleService.get_principle_by_id(db, principle_id, None)

    @staticmethod
    def activate_principle(db: Session, principle_id: str, school_id: str):
        principle = PrincipleService.get_principle_by_id(db, principle_id, school_id)
        principle.is_active = True
        principle.user.is_active = True
        db.commit()
        return PrincipleService.get_principle_by_id(db, principle_id, None)

