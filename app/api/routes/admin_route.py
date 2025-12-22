from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from sqlalchemy.orm import Session
from app.config.database import get_db
from app.services.admin_service import AdminService
from app.schemas.admin import AdminResponse, SchoolResponse, SubadminResponse,AdminCreate, SchoolCreate, SubadminCreate, AdminCreateResponse
from app.services.subadmin_service import SubadminService


router = APIRouter()

@router.post("/public/create", response_model=AdminCreateResponse, tags=["Admin"])
def create_admin(admin: AdminCreate, db: Session = Depends(get_db)):
    return AdminCreateResponse.model_validate(AdminService.create_admin(db, admin))

@router.get("/get", response_model=AdminResponse, tags=["Admin"])
def get_admin(request: Request, db: Session = Depends(get_db)):
    email = request.state.user.email
    return AdminResponse.model_validate(AdminService.get_admin(db, email))



@router.post("/add-school", response_model=SchoolResponse, tags=["Admin"])
def add_school(request: Request, school: SchoolCreate, db: Session = Depends(get_db)):
    admin_id=request.state.user.user_id
    return SchoolResponse.model_validate(AdminService.add_school(db, admin_id, school))

@router.put("/update-school/{school_id}", response_model=SchoolResponse, tags=["Admin"])
def update_school(request: Request, school_id: str, school: SchoolCreate, db: Session = Depends(get_db)):
    admin_id=request.state.user.user_id
    return SchoolResponse.model_validate(AdminService.update_school(db, school_id, school))

@router.delete("/delete-school/{school_id}",tags=["Admin"])
def delete_school(request: Request, school_id: str, db: Session = Depends(get_db)):
    admin_id=request.state.user.user_id
    return AdminService.delete_school(db, school_id)

@router.get("/get-all-schools", response_model=list[SchoolResponse], tags=["Admin"])
def get_all_schools(request: Request, db: Session = Depends(get_db)):
    admin_id=request.state.user.user_id
    schools = AdminService.get_all_schools(db)
    if not schools:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No schools found")
    return [SchoolResponse.model_validate(school) for school in schools]

@router.get("/get-school/{school_id}", response_model=SchoolResponse, tags=["Admin"])
def get_school(school_id: str, db: Session = Depends(get_db)):
    return SchoolResponse.model_validate(AdminService.get_school(db, school_id))




@router.post("/subadmin/create", response_model=SubadminResponse, tags=["Admin"])
def create_subadmin(request: Request, subadmin: SubadminCreate, db: Session = Depends(get_db)):
    admin_id=request.state.user.user_id
    return SubadminResponse.model_validate(AdminService.create_subadmin(db, admin_id, subadmin))

# @router.put("/subadmin/update/{subadmin_id}", response_model=SubadminResponse, tags=["Admin"])
# def update_subadmin(request: Request, subadmin_id: str, subadmin: SubadminCreate, db: Session = Depends(get_db)):
#     admin_id=request.state.user.user_id
#     return SubadminResponse.model_validate(AdminService.update_subadmin(db, subadmin_id, subadmin))

# @router.delete("/subadmin/delete/{subadmin_id}", response_model=SubadminResponse, tags=["Admin"])
# def delete_subadmin(subadmin_id: str, db: Session = Depends(get_db)):
#     return AdminService.delete_subadmin(db, subadmin_id)

@router.get("/subadmins/{school_id}", response_model=list[SubadminResponse], tags=["Admin"])
def get_subadmin_by_school_id(school_id: str, db: Session = Depends(get_db)):
    return [SubadminResponse.model_validate(subadmin) for subadmin in SubadminService.get_subadmin_by_school_id(db, school_id)]

