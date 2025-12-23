from pydantic import BaseModel


class SubadminOverviewResponse(BaseModel):
    total_teachers: int
    total_students: int
    total_classes: int
    total_subjects: int
    total_departments: int
    total_sessions: int
    total_subadmins: int


