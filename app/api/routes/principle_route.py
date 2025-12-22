from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session

from app.config.database import get_db
from app.services.principle_service import PrincipleService
from app.schemas.principle import PrincipleCreate, PrincipleUpdate, PrincipleResponse


router = APIRouter()


@router.post("/create", response_model=PrincipleResponse, tags=["Principle"])
def create_principle(request: Request, data: PrincipleCreate, db: Session = Depends(get_db)):
    user = request.state.user
    default_school_id = getattr(user, "school_id", None)
    created_by = getattr(user, "user_id", None)
    return PrincipleResponse.model_validate(
        PrincipleService.create_principle(db, default_school_id, created_by, data)
    )


@router.get("/get/{principle_id}", response_model=PrincipleResponse, tags=["Principle"])
def get_principle_by_id(request: Request, principle_id: str, db: Session = Depends(get_db)):
    user = request.state.user
    school_id = None if getattr(user, "role", None) == "admin" else getattr(user, "school_id", None)
    return PrincipleResponse.model_validate(PrincipleService.get_principle_by_id(db, principle_id, school_id))


@router.get("/get-all", response_model=list[PrincipleResponse], tags=["Principle"])
def get_all_principles(request: Request, db: Session = Depends(get_db)):
    school_id = request.state.user.school_id
    principles = PrincipleService.get_all_principles(db, school_id)
    return [PrincipleResponse.model_validate(p) for p in principles]


@router.get("/admin/get-by-school/{school_id}", response_model=list[PrincipleResponse], tags=["Principle"])
def admin_get_principles_by_school(request: Request, school_id: str, db: Session = Depends(get_db)):
    if getattr(request.state.user, "role", None) != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    principles = PrincipleService.get_principles_by_school_id(db, school_id)
    return [PrincipleResponse.model_validate(p) for p in principles]


@router.put("/update/{principle_id}", response_model=PrincipleResponse, tags=["Principle"])
def update_principle(request: Request, principle_id: str, data: PrincipleUpdate, db: Session = Depends(get_db)):
    school_id = request.state.user.school_id
    updated = PrincipleService.update_principle(db, principle_id, school_id, data)
    return PrincipleResponse.model_validate(updated)


@router.delete("/delete/{principle_id}", tags=["Principle"])
def delete_principle(request: Request, principle_id: str, db: Session = Depends(get_db)):
    school_id = request.state.user.school_id
    return PrincipleService.delete_principle(db, principle_id, school_id)


@router.post("/deactivate/{principle_id}", response_model=PrincipleResponse, tags=["Principle"])
def deactivate_principle(request: Request, principle_id: str, db: Session = Depends(get_db)):
    school_id = request.state.user.school_id
    principle = PrincipleService.deactivate_principle(db, principle_id, school_id)
    return PrincipleResponse.model_validate(principle)


@router.post("/activate/{principle_id}", response_model=PrincipleResponse, tags=["Principle"])
def activate_principle(request: Request, principle_id: str, db: Session = Depends(get_db)):
    school_id = request.state.user.school_id
    principle = PrincipleService.activate_principle(db, principle_id, school_id)
    return PrincipleResponse.model_validate(principle)

