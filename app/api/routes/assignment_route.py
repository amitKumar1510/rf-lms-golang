from typing import Any

from fastapi import APIRouter, Depends, File, HTTPException, Request, UploadFile, status
from fastapi import Body
from sqlalchemy.orm import Session

from app.config.database import get_db
from app.schemas.assignment import (
    AssignmentCreate,
    AssignmentQuestionCreate,
    AssignmentQuestionResponse,
    AssignmentQuestionUpdate,
    AssignmentResponse,
    ClassSubjectPerformanceResponse,
    AssignmentSubmissionResponse,
    AssignmentSubmissionUpdate,
    AssignmentUpdate,
)
from app.services.assignment_service import AssignmentService

router = APIRouter()


def _to_public_url(request: Request, path: str | None):
    if not path:
        return None
    if str(path).startswith("http://") or str(path).startswith("https://"):
        return path
    base = str(request.base_url).rstrip("/")
    p = str(path).replace("\\", "/")
    if not p.startswith("/"):
        p = "/" + p
    return f"{base}{p}"


@router.post("/create", response_model=AssignmentResponse, tags=["Assignment"])
def create_assignment(request: Request, data: AssignmentCreate, db: Session = Depends(get_db)):
    user = request.state.user
    school_id = getattr(user, "school_id", None)
    teacher_id = getattr(user, "teacher_id", None)
    a = AssignmentService.create_assignment(db, school_id, teacher_id, data)
    a.question_file_path = _to_public_url(request, getattr(a, "question_file_path", None))
    return AssignmentResponse.model_validate(a)


@router.get("/get/{assignment_id}", response_model=AssignmentResponse, tags=["Assignment"])
def get_assignment(request: Request, assignment_id: str, db: Session = Depends(get_db)):
    user = request.state.user
    school_id = getattr(user, "school_id", None)
    teacher_id = getattr(user, "teacher_id", None)
    a = AssignmentService.get_assignment(db, school_id, teacher_id, assignment_id)
    a.question_file_path = _to_public_url(request, getattr(a, "question_file_path", None))
    return AssignmentResponse.model_validate(a)


@router.get("/get-all", response_model=list[AssignmentResponse], tags=["Assignment"])
def get_all_assignments(request: Request, class_subject_id: str | None = None, db: Session = Depends(get_db)):
    user = request.state.user
    school_id = getattr(user, "school_id", None)
    teacher_id = getattr(user, "teacher_id", None)
    items = AssignmentService.get_all_assignments(db, school_id, teacher_id, class_subject_id=class_subject_id)
    out = []
    for a in items:
        a.question_file_path = _to_public_url(request, getattr(a, "question_file_path", None))
        out.append(AssignmentResponse.model_validate(a))
    return out


@router.get("/student/get-all", response_model=list[AssignmentResponse], tags=["Assignment"])
def get_all_assignments_for_student(request: Request, class_subject_id: str | None = None, db: Session = Depends(get_db)):
    user = request.state.user
    school_id = getattr(user, "school_id", None)
    student_user_id = getattr(user, "user_id", None)
    items = AssignmentService.get_all_assignments_for_student(db, school_id, student_user_id, class_subject_id=class_subject_id)
    out = []
    for a in items:
        a.question_file_path = _to_public_url(request, getattr(a, "question_file_path", None))
        out.append(AssignmentResponse.model_validate(a))
    return out


@router.get("/student/get/{assignment_id}", response_model=AssignmentResponse, tags=["Assignment"])
def get_assignment_for_student(request: Request, assignment_id: str, db: Session = Depends(get_db)):
    user = request.state.user
    school_id = getattr(user, "school_id", None)
    student_user_id = getattr(user, "user_id", None)
    a = AssignmentService.get_assignment_for_student(db, school_id, student_user_id, assignment_id)
    a.question_file_path = _to_public_url(request, getattr(a, "question_file_path", None))
    return AssignmentResponse.model_validate(a)


@router.get("/student/submissions", response_model=list[AssignmentSubmissionResponse], tags=["Assignment"])
def get_my_submissions(request: Request, class_subject_id: str | None = None, db: Session = Depends(get_db)):
    user = request.state.user
    school_id = getattr(user, "school_id", None)
    student_user_id = getattr(user, "user_id", None)
    subs = AssignmentService.get_my_submissions(db, school_id, student_user_id, class_subject_id=class_subject_id)
    out = []
    for s in subs:
        s.file_path = _to_public_url(request, getattr(s, "file_path", None))
        out.append(AssignmentSubmissionResponse.model_validate(s))
    return out


@router.get("/parent/submissions", response_model=list[AssignmentSubmissionResponse], tags=["Assignment"])
def get_parent_submissions(request: Request, class_subject_id: str | None = None, db: Session = Depends(get_db)):
    user = request.state.user
    if getattr(user, "role", None) != "parent":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Parent access required")
    school_id = getattr(user, "school_id", None)
    student_id = getattr(user, "student_id", None)
    if not school_id or not student_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Parent is not linked to a student")
    subs = AssignmentService.get_submissions_for_student_id(db, school_id, student_id, class_subject_id=class_subject_id)
    out = []
    for s in subs:
        s.file_path = _to_public_url(request, getattr(s, "file_path", None))
        out.append(AssignmentSubmissionResponse.model_validate(s))
    return out


@router.get("/principle/performance", response_model=list[ClassSubjectPerformanceResponse], tags=["Assignment"])
def get_school_performance(
    request: Request,
    class_id: str | None = None,
    subject_id: str | None = None,
    db: Session = Depends(get_db),
):
    user = request.state.user
    role = getattr(user, "role", None)
    if role not in ("principle", "admin", "subadmin"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Principle access required")
    school_id = getattr(user, "school_id", None)
    items = AssignmentService.get_class_subject_performance(db, school_id, class_id=class_id, subject_id=subject_id)
    return [ClassSubjectPerformanceResponse.model_validate(x) for x in items]


@router.put("/update/{assignment_id}", response_model=AssignmentResponse, tags=["Assignment"])
def update_assignment(request: Request, assignment_id: str, data: AssignmentUpdate, db: Session = Depends(get_db)):
    user = request.state.user
    school_id = getattr(user, "school_id", None)
    teacher_id = getattr(user, "teacher_id", None)
    a = AssignmentService.update_assignment(db, school_id, teacher_id, assignment_id, data)
    a.question_file_path = _to_public_url(request, getattr(a, "question_file_path", None))
    return AssignmentResponse.model_validate(a)


@router.delete("/delete/{assignment_id}", response_model=dict, tags=["Assignment"])
def delete_assignment(request: Request, assignment_id: str, db: Session = Depends(get_db)):
    user = request.state.user
    school_id = getattr(user, "school_id", None)
    teacher_id = getattr(user, "teacher_id", None)
    return AssignmentService.delete_assignment(db, school_id, teacher_id, assignment_id)


@router.post("/deactivate/{assignment_id}", response_model=AssignmentResponse, tags=["Assignment"])
def deactivate_assignment(request: Request, assignment_id: str, db: Session = Depends(get_db)):
    user = request.state.user
    school_id = getattr(user, "school_id", None)
    teacher_id = getattr(user, "teacher_id", None)
    a = AssignmentService.deactivate_assignment(db, school_id, teacher_id, assignment_id)
    a.question_file_path = _to_public_url(request, getattr(a, "question_file_path", None))
    return AssignmentResponse.model_validate(a)


@router.post("/activate/{assignment_id}", response_model=AssignmentResponse, tags=["Assignment"])
def activate_assignment(request: Request, assignment_id: str, db: Session = Depends(get_db)):
    user = request.state.user
    school_id = getattr(user, "school_id", None)
    teacher_id = getattr(user, "teacher_id", None)
    a = AssignmentService.activate_assignment(db, school_id, teacher_id, assignment_id)
    a.question_file_path = _to_public_url(request, getattr(a, "question_file_path", None))
    return AssignmentResponse.model_validate(a)


# -------------------- questions (teacher) --------------------
@router.post("/{assignment_id}/questions", response_model=AssignmentQuestionResponse, tags=["Assignment"])
def add_assignment_question(request: Request, assignment_id: str, data: AssignmentQuestionCreate, db: Session = Depends(get_db)):
    user = request.state.user
    school_id = getattr(user, "school_id", None)
    teacher_id = getattr(user, "teacher_id", None)
    q = AssignmentService.add_question(db, school_id, teacher_id, assignment_id, data)
    return AssignmentQuestionResponse.model_validate(q)


@router.put("/{assignment_id}/questions/{question_id}", response_model=AssignmentQuestionResponse, tags=["Assignment"])
def update_assignment_question(
    request: Request,
    assignment_id: str,
    question_id: str,
    data: AssignmentQuestionUpdate,
    db: Session = Depends(get_db),
):
    user = request.state.user
    school_id = getattr(user, "school_id", None)
    teacher_id = getattr(user, "teacher_id", None)
    q = AssignmentService.update_question(db, school_id, teacher_id, assignment_id, question_id, data)
    return AssignmentQuestionResponse.model_validate(q)


@router.delete("/{assignment_id}/questions/{question_id}", response_model=dict, tags=["Assignment"])
def delete_assignment_question(request: Request, assignment_id: str, question_id: str, db: Session = Depends(get_db)):
    user = request.state.user
    school_id = getattr(user, "school_id", None)
    teacher_id = getattr(user, "teacher_id", None)
    return AssignmentService.delete_question(db, school_id, teacher_id, assignment_id, question_id)


# -------------------- question file (teacher) --------------------
@router.post("/{assignment_id}/question-file", response_model=AssignmentResponse, tags=["Assignment"])
async def upload_assignment_question_file(
    request: Request,
    assignment_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    user = request.state.user
    school_id = getattr(user, "school_id", None)
    teacher_id = getattr(user, "teacher_id", None)
    a = await AssignmentService.upload_question_file(db, school_id, teacher_id, assignment_id, file)
    a.question_file_path = _to_public_url(request, getattr(a, "question_file_path", None))
    return AssignmentResponse.model_validate(a)


@router.delete("/{assignment_id}/question-file", response_model=AssignmentResponse, tags=["Assignment"])
def delete_assignment_question_file(request: Request, assignment_id: str, db: Session = Depends(get_db)):
    user = request.state.user
    school_id = getattr(user, "school_id", None)
    teacher_id = getattr(user, "teacher_id", None)
    a = AssignmentService.delete_question_file(db, school_id, teacher_id, assignment_id)
    a.question_file_path = _to_public_url(request, getattr(a, "question_file_path", None))
    return AssignmentResponse.model_validate(a)


# -------------------- submissions (teacher) --------------------
@router.get("/{assignment_id}/submissions", response_model=list[AssignmentSubmissionResponse], tags=["Assignment"])
def get_assignment_submissions(request: Request, assignment_id: str, db: Session = Depends(get_db)):
    user = request.state.user
    school_id = getattr(user, "school_id", None)
    teacher_id = getattr(user, "teacher_id", None)
    if not teacher_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only teachers can view submissions")
    subs = AssignmentService.get_submissions(db, school_id, teacher_id, assignment_id)
    out = []
    for s in subs:
        s.file_path = _to_public_url(request, getattr(s, "file_path", None))
        out.append(AssignmentSubmissionResponse.model_validate(s))
    return out


@router.put("/{assignment_id}/submissions/{submission_id}/grade", response_model=AssignmentSubmissionResponse, tags=["Assignment"])
def grade_assignment_submission(
    request: Request,
    assignment_id: str,
    submission_id: str,
    data: AssignmentSubmissionUpdate,
    db: Session = Depends(get_db),
):
    user = request.state.user
    school_id = getattr(user, "school_id", None)
    teacher_id = getattr(user, "teacher_id", None)
    if not teacher_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only teachers can grade submissions")
    sub = AssignmentService.grade_submission(db, school_id, teacher_id, assignment_id, submission_id, data)
    sub.file_path = _to_public_url(request, getattr(sub, "file_path", None))
    return AssignmentSubmissionResponse.model_validate(sub)


# -------------------- submissions (student) --------------------
@router.post("/{assignment_id}/submit-file", response_model=AssignmentSubmissionResponse, tags=["Assignment"])
async def submit_assignment_file(
    request: Request,
    assignment_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    user = request.state.user
    school_id = getattr(user, "school_id", None)
    student_user_id = getattr(user, "user_id", None)
    sub = await AssignmentService.submit_file(db, school_id, student_user_id, assignment_id, file)
    sub.file_path = _to_public_url(request, getattr(sub, "file_path", None))
    return AssignmentSubmissionResponse.model_validate(sub)


@router.post("/{assignment_id}/submit-mcq", response_model=AssignmentSubmissionResponse, tags=["Assignment"])
async def submit_assignment_mcq(
    request: Request,
    assignment_id: str,
    submitted_answers: Any = Body(...),
    db: Session = Depends(get_db),
):
    user = request.state.user
    school_id = getattr(user, "school_id", None)
    student_user_id = getattr(user, "user_id", None)
    sub = await AssignmentService.submit_mcq(db, school_id, student_user_id, assignment_id, submitted_answers)
    return AssignmentSubmissionResponse.model_validate(sub)


