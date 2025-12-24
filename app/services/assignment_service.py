from __future__ import annotations

from datetime import datetime

from fastapi import HTTPException, status
from sqlalchemy import case, func
from sqlalchemy.orm import Session, joinedload

from app.core.utils_functions import generate_id
from app.models.assignment import Assignment, AssignmentQuestion, AssignmentSubmission
from app.models.student import Student
from app.models.teacher import Teacher
from app.models.users import Class, ClassSubject, ClassSubjectTeacher, Subject
from app.schemas.assignment import (
    AssignmentCreate,
    AssignmentQuestionCreate,
    AssignmentQuestionUpdate,
    AssignmentSubmissionUpdate,
    AssignmentUpdate,
)
from app.services.file_service import FileUploadService


class AssignmentService:
    @staticmethod
    def _assignment_query(db: Session):
        return db.query(Assignment).options(joinedload(Assignment.questions))

    @staticmethod
    def _submission_query(db: Session):
        return db.query(AssignmentSubmission).options(
            joinedload(AssignmentSubmission.student).joinedload(Student.user),
            joinedload(AssignmentSubmission.assignment),
        )

    @staticmethod
    def _require_teacher(db: Session, teacher_id: str, school_id: str):
        teacher = (
            db.query(Teacher)
            .filter(
                Teacher.id == teacher_id,
                Teacher.school_id == school_id,
                Teacher.is_deleted == False,
            )
            .first()
        )
        if not teacher:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Teacher access required")
        return teacher

    @staticmethod
    def _require_student(db: Session, student_user_id: str, school_id: str) -> Student:
        student = (
            db.query(Student)
            .options(joinedload(Student.user), joinedload(Student.class_info))
            .filter(
                Student.user_id == student_user_id,
                Student.school_id == school_id,
                Student.is_deleted == False,
            )
            .first()
        )
        if not student:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Student access required")
        return student

    @staticmethod
    def _require_assignment_owner(db: Session, school_id: str, teacher_id: str, assignment_id: str) -> Assignment:
        AssignmentService._require_teacher(db, teacher_id, school_id)
        a = (
            AssignmentService._assignment_query(db)
            .options(joinedload(Assignment.class_subject))
            .filter(
                Assignment.id == assignment_id,
                Assignment.teacher_id == teacher_id,
                Assignment.is_deleted == False,
            )
            .first()
        )
        if not a:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignment not found")
        if not a.class_subject or a.class_subject.school_id != school_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Assignment does not belong to your school")
        return a

    @staticmethod
    def _public_upload_url(file_path: str | None) -> str | None:
        if not file_path:
            return None
        p = str(file_path).replace("\\", "/")
        if p.startswith("http://") or p.startswith("https://"):
            return p
        if p.startswith("/uploads/"):
            return p
        # normalize common stored forms: "uploads/..." or full local path ending in "uploads/..."
        idx = p.find("/uploads/")
        if idx != -1:
            return p[idx:]
        if p.startswith("uploads/"):
            return f"/{p}"
        return p

    @staticmethod
    def _grade_letter(percentage: float | None) -> str | None:
        if percentage is None:
            return None
        if percentage >= 90:
            return "A"
        if percentage >= 80:
            return "B"
        if percentage >= 70:
            return "C"
        if percentage >= 60:
            return "D"
        return "F"

    @staticmethod
    def _auto_grade_mcq(assignment: Assignment, submission: AssignmentSubmission) -> float:
        """
        Compute marks for MCQ style answers.
        Accepts submitted_answers as:
        - dict[question_id] = selected_answer
        - OR list[{"question_id": "...", "selected_answer": "..."}]
        """
        answers = submission.submitted_answers or {}
        mapping: dict[str, str] = {}
        if isinstance(answers, dict):
            for k, v in answers.items():
                if v is None:
                    continue
                mapping[str(k)] = str(v)
        elif isinstance(answers, list):
            for item in answers:
                if not isinstance(item, dict):
                    continue
                qid = item.get("question_id")
                sel = item.get("selected_answer")
                if qid and sel is not None:
                    mapping[str(qid)] = str(sel)

        total = 0.0
        for q in assignment.questions or []:
            if not q.correct_answer:
                continue
            selected = mapping.get(q.id)
            if selected is None:
                continue
            if str(selected).strip() == str(q.correct_answer).strip():
                total += float(q.marks or 0.0)
        return total

    @staticmethod
    def create_assignment(db: Session, school_id: str, teacher_id: str, data: AssignmentCreate):
        AssignmentService._require_teacher(db, teacher_id, school_id)

        class_subject = (
            db.query(ClassSubject)
            .filter(
                ClassSubject.id == data.class_subject_id,
                ClassSubject.school_id == school_id,
                ClassSubject.is_deleted == False,
            )
            .first()
        )
        if not class_subject:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Class subject not found")

        # Ensure teacher is assigned to this class_subject (active assignment)
        assignment = (
            db.query(ClassSubjectTeacher)
            .filter(
                ClassSubjectTeacher.class_subject_id == data.class_subject_id,
                ClassSubjectTeacher.teacher_id == teacher_id,
                ClassSubjectTeacher.is_deleted == False,
                ClassSubjectTeacher.is_active == True,
            )
            .first()
        )
        if not assignment:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not assigned to this class subject")

        # Ensure subject_id matches class_subject.subject_id
        if data.subject_id != class_subject.subject_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="subject_id does not match class_subject.subject_id")

        a = Assignment(
            id=generate_id("assignment"),
            title=data.title,
            description=data.description,
            assignment_type=data.assignment_type,
            subject_id=data.subject_id,
            class_subject_id=data.class_subject_id,
            teacher_id=teacher_id,
            total_marks=data.total_marks,
            passing_marks=data.passing_marks,
            due_date=data.due_date,
        )
        db.add(a)
        db.flush()

        if data.questions:
            for q in data.questions:
                db.add(
                    AssignmentQuestion(
                        id=generate_id("assign_q"),
                        assignment_id=a.id,
                        question_text=q.question_text,
                        question_type=q.question_type,
                        options=q.options,
                        correct_answer=q.correct_answer,
                        marks=q.marks,
                        order=q.order,
                    )
                )

        db.commit()
        return AssignmentService.get_assignment(db, school_id, teacher_id, a.id)

    @staticmethod
    def get_assignment(db: Session, school_id: str, teacher_id: str, assignment_id: str):
        AssignmentService._require_teacher(db, teacher_id, school_id)
        a = (
            AssignmentService._assignment_query(db)
            .filter(
                Assignment.id == assignment_id,
                Assignment.teacher_id == teacher_id,
                Assignment.is_deleted == False,
            )
            .first()
        )
        if not a:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignment not found")
        return a

    @staticmethod
    def get_all_assignments(db: Session, school_id: str, teacher_id: str, class_subject_id: str | None = None):
        AssignmentService._require_teacher(db, teacher_id, school_id)
        q = AssignmentService._assignment_query(db).filter(
            Assignment.teacher_id == teacher_id,
            Assignment.is_deleted == False,
        )
        if class_subject_id:
            q = q.filter(Assignment.class_subject_id == class_subject_id)
        return q.all()

    # ---------------------- assignments (student) ----------------------
    @staticmethod
    def get_all_assignments_for_student(db: Session, school_id: str, student_user_id: str, class_subject_id: str | None = None):
        student = AssignmentService._require_student(db, student_user_id, school_id)

        q = (
            AssignmentService._assignment_query(db)
            .options(joinedload(Assignment.class_subject))
            .filter(
                Assignment.is_deleted == False,
                Assignment.is_active == True,
            )
            .join(ClassSubject, Assignment.class_subject_id == ClassSubject.id)
            .filter(
                ClassSubject.school_id == school_id,
                ClassSubject.class_id == student.class_id,
                ClassSubject.is_deleted == False,
                ClassSubject.is_active == True,
            )
            .order_by(Assignment.created_at.desc())
        )
        if class_subject_id:
            q = q.filter(Assignment.class_subject_id == class_subject_id)

        items = q.all()
        # Never leak correct answers to students
        for a in items:
            for qu in a.questions or []:
                qu.correct_answer = None
        return items

    @staticmethod
    def get_assignment_for_student(db: Session, school_id: str, student_user_id: str, assignment_id: str) -> Assignment:
        student = AssignmentService._require_student(db, student_user_id, school_id)
        a = (
            AssignmentService._assignment_query(db)
            .options(joinedload(Assignment.class_subject))
            .filter(
                Assignment.id == assignment_id,
                Assignment.is_deleted == False,
                Assignment.is_active == True,
            )
            .first()
        )
        if not a or not a.class_subject:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignment not found")
        if a.class_subject.school_id != school_id or a.class_subject.class_id != student.class_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Assignment does not belong to your class")

        for qu in a.questions or []:
            qu.correct_answer = None
        return a

    @staticmethod
    def get_my_submissions(db: Session, school_id: str, student_user_id: str, class_subject_id: str | None = None):
        student = AssignmentService._require_student(db, student_user_id, school_id)

        q = (
            AssignmentService._submission_query(db)
            .join(Assignment, AssignmentSubmission.assignment_id == Assignment.id)
            .join(ClassSubject, Assignment.class_subject_id == ClassSubject.id)
            .filter(
                AssignmentSubmission.student_id == student.id,
                AssignmentSubmission.is_active == True,
                Assignment.is_deleted == False,
                ClassSubject.school_id == school_id,
                ClassSubject.is_deleted == False,
            )
            .order_by(AssignmentSubmission.submitted_at.desc().nullslast(), AssignmentSubmission.created_at.desc())
        )
        if class_subject_id:
            q = q.filter(Assignment.class_subject_id == class_subject_id)

        subs = q.all()
        for s in subs:
            s.file_path = AssignmentService._public_upload_url(s.file_path)
            try:
                s.student_name = s.student.user.name if s.student and s.student.user else None
            except Exception:
                s.student_name = None
            try:
                s.assignment_title = s.assignment.title if s.assignment else None
            except Exception:
                s.assignment_title = None
        return subs

    @staticmethod
    def get_submissions_for_student_id(db: Session, school_id: str, student_id: str, class_subject_id: str | None = None):
        """
        Used for parent view: fetch submissions/marks for a specific student_id (scoped to school).
        """
        # Ensure student belongs to school
        student = (
            db.query(Student)
            .options(joinedload(Student.user))
            .filter(
                Student.id == student_id,
                Student.school_id == school_id,
                Student.is_deleted == False,
            )
            .first()
        )
        if not student:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")

        q = (
            AssignmentService._submission_query(db)
            .join(Assignment, AssignmentSubmission.assignment_id == Assignment.id)
            .join(ClassSubject, Assignment.class_subject_id == ClassSubject.id)
            .filter(
                AssignmentSubmission.student_id == student.id,
                AssignmentSubmission.is_active == True,
                Assignment.is_deleted == False,
                ClassSubject.school_id == school_id,
                ClassSubject.is_deleted == False,
            )
            .order_by(AssignmentSubmission.submitted_at.desc().nullslast(), AssignmentSubmission.created_at.desc())
        )
        if class_subject_id:
            q = q.filter(Assignment.class_subject_id == class_subject_id)

        subs = q.all()
        for s in subs:
            s.file_path = AssignmentService._public_upload_url(s.file_path)
            try:
                s.student_name = s.student.user.name if s.student and s.student.user else None
            except Exception:
                s.student_name = None
            try:
                s.assignment_title = s.assignment.title if s.assignment else None
            except Exception:
                s.assignment_title = None
        return subs

    # ---------------------- performance (principle) ----------------------
    @staticmethod
    def get_class_subject_performance(
        db: Session,
        school_id: str,
        class_id: str | None = None,
        subject_id: str | None = None,
    ):
        """
        Returns per-class-subject performance for the school based on assignment submissions.
        """
        cs_q = (
            db.query(ClassSubject)
            .options(joinedload(ClassSubject.class_info), joinedload(ClassSubject.subject))
            .filter(
                ClassSubject.school_id == school_id,
                ClassSubject.is_deleted == False,
                ClassSubject.is_active == True,
            )
        )
        if class_id:
            cs_q = cs_q.filter(ClassSubject.class_id == class_id)
        if subject_id:
            cs_q = cs_q.filter(ClassSubject.subject_id == subject_id)
        class_subjects = cs_q.all()

        # assignments per class_subject
        a_counts = (
            db.query(Assignment.class_subject_id, func.count(Assignment.id))
            .join(ClassSubject, Assignment.class_subject_id == ClassSubject.id)
            .filter(
                Assignment.is_deleted == False,
                Assignment.is_active == True,
                ClassSubject.school_id == school_id,
                ClassSubject.is_deleted == False,
            )
        )
        if class_id:
            a_counts = a_counts.filter(ClassSubject.class_id == class_id)
        if subject_id:
            a_counts = a_counts.filter(ClassSubject.subject_id == subject_id)
        a_counts = a_counts.group_by(Assignment.class_subject_id).all()
        a_count_map = {cid: int(cnt or 0) for (cid, cnt) in a_counts}

        # submissions per class_subject (counts + graded + avg percentage)
        s_stats = (
            db.query(
                Assignment.class_subject_id.label("class_subject_id"),
                func.count(AssignmentSubmission.id).label("total_submissions"),
                func.sum(case((AssignmentSubmission.is_graded == True, 1), else_=0)).label("graded_submissions"),
                func.avg(AssignmentSubmission.percentage).label("avg_percentage"),
            )
            .join(Assignment, AssignmentSubmission.assignment_id == Assignment.id)
            .join(ClassSubject, Assignment.class_subject_id == ClassSubject.id)
            .filter(
                AssignmentSubmission.is_active == True,
                Assignment.is_deleted == False,
                ClassSubject.school_id == school_id,
                ClassSubject.is_deleted == False,
            )
        )
        if class_id:
            s_stats = s_stats.filter(ClassSubject.class_id == class_id)
        if subject_id:
            s_stats = s_stats.filter(ClassSubject.subject_id == subject_id)
        s_stats = s_stats.group_by(Assignment.class_subject_id).all()
        s_map = {
            row.class_subject_id: {
                "total_submissions": int(row.total_submissions or 0),
                "graded_submissions": int(row.graded_submissions or 0),
                "average_percentage": float(row.avg_percentage) if row.avg_percentage is not None else None,
            }
            for row in s_stats
        }

        out = []
        for cs in class_subjects:
            cl: Class | None = getattr(cs, "class_info", None)
            subj: Subject | None = getattr(cs, "subject", None)
            srow = s_map.get(cs.id, {})
            out.append(
                {
                    "class_subject_id": cs.id,
                    "class_id": cs.class_id,
                    "class_name": getattr(cl, "name", None),
                    "class_section": getattr(cl, "section", None),
                    "subject_id": cs.subject_id,
                    "subject_name": getattr(subj, "name", None),
                    "subject_code": getattr(subj, "code", None),
                    "total_assignments": a_count_map.get(cs.id, 0),
                    "total_submissions": srow.get("total_submissions", 0),
                    "graded_submissions": srow.get("graded_submissions", 0),
                    "average_percentage": srow.get("average_percentage", None),
                }
            )
        return out

    @staticmethod
    def update_assignment(db: Session, school_id: str, teacher_id: str, assignment_id: str, data: AssignmentUpdate):
        a = AssignmentService.get_assignment(db, school_id, teacher_id, assignment_id)
        payload = data.model_dump(exclude_unset=True)

        for field in ["title", "description", "assignment_type", "total_marks", "passing_marks", "due_date", "is_active"]:
            if field in payload:
                setattr(a, field, payload[field])

        # Replace questions if provided
        if data.questions is not None:
            a.questions.clear()
            for q in data.questions or []:
                a.questions.append(
                    AssignmentQuestion(
                        id=generate_id("assign_q"),
                        assignment_id=a.id,
                        question_text=q.question_text,
                        question_type=q.question_type,
                        options=q.options,
                        correct_answer=q.correct_answer,
                        marks=q.marks,
                        order=q.order,
                    )
                )

        db.commit()
        return AssignmentService.get_assignment(db, school_id, teacher_id, assignment_id)

    # ---------------------- questions (teacher) ----------------------
    @staticmethod
    def add_question(db: Session, school_id: str, teacher_id: str, assignment_id: str, data: AssignmentQuestionCreate):
        a = AssignmentService._require_assignment_owner(db, school_id, teacher_id, assignment_id)
        if a.assignment_type != "mcq_quiz":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Questions are only supported for mcq_quiz assignments")
        q = AssignmentQuestion(
            id=generate_id("assign_q"),
            assignment_id=a.id,
            question_text=data.question_text,
            question_type=data.question_type,
            options=data.options,
            correct_answer=data.correct_answer,
            marks=data.marks,
            order=data.order,
        )
        db.add(q)
        db.commit()
        db.refresh(q)
        return q

    @staticmethod
    def update_question(db: Session, school_id: str, teacher_id: str, assignment_id: str, question_id: str, data: AssignmentQuestionUpdate):
        a = AssignmentService._require_assignment_owner(db, school_id, teacher_id, assignment_id)
        q = db.query(AssignmentQuestion).filter(AssignmentQuestion.id == question_id, AssignmentQuestion.assignment_id == a.id).first()
        if not q:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found")
        payload = data.model_dump(exclude_unset=True)
        for k, v in payload.items():
            setattr(q, k, v)
        db.commit()
        db.refresh(q)
        return q

    @staticmethod
    def delete_question(db: Session, school_id: str, teacher_id: str, assignment_id: str, question_id: str):
        a = AssignmentService._require_assignment_owner(db, school_id, teacher_id, assignment_id)
        q = db.query(AssignmentQuestion).filter(AssignmentQuestion.id == question_id, AssignmentQuestion.assignment_id == a.id).first()
        if not q:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found")
        db.delete(q)
        db.commit()
        return {"message": "Question deleted successfully"}

    # ---------------------- question file (teacher) ----------------------
    @staticmethod
    async def upload_question_file(db: Session, school_id: str, teacher_id: str, assignment_id: str, file):
        a = AssignmentService._require_assignment_owner(db, school_id, teacher_id, assignment_id)
        if a.assignment_type != "file_upload":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Question PDF is only for file_upload assignments")
        if not file:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="file is required")

        uploader = FileUploadService(school_id)
        meta = await uploader.upload_file(file, folder=f"assignment_questions/{assignment_id}")
        public_path = AssignmentService._public_upload_url(meta.get("filepath"))

        a.question_file_path = public_path
        a.question_file_name = getattr(file, "filename", None)
        a.question_file_mime = getattr(file, "content_type", None)
        try:
            a.question_file_size = getattr(file, "size", None)
        except Exception:
            a.question_file_size = None
        db.commit()
        return AssignmentService.get_assignment(db, school_id, teacher_id, assignment_id)

    @staticmethod
    def delete_question_file(db: Session, school_id: str, teacher_id: str, assignment_id: str):
        a = AssignmentService._require_assignment_owner(db, school_id, teacher_id, assignment_id)
        a.question_file_path = None
        a.question_file_name = None
        a.question_file_mime = None
        a.question_file_size = None
        db.commit()
        return AssignmentService.get_assignment(db, school_id, teacher_id, assignment_id)

    # ---------------------- submissions (teacher) ----------------------
    @staticmethod
    def get_submissions(db: Session, school_id: str, teacher_id: str, assignment_id: str):
        a = AssignmentService._require_assignment_owner(db, school_id, teacher_id, assignment_id)
        subs = (
            AssignmentService._submission_query(db)
            .filter(
                AssignmentSubmission.assignment_id == a.id,
                AssignmentSubmission.is_active == True,
            )
            .order_by(AssignmentSubmission.submitted_at.desc().nullslast(), AssignmentSubmission.created_at.desc())
            .all()
        )
        for s in subs:
            s.file_path = AssignmentService._public_upload_url(s.file_path)
            try:
                s.student_name = s.student.user.name if s.student and s.student.user else None
            except Exception:
                s.student_name = None
            s.assignment_title = a.title
        return subs

    @staticmethod
    def grade_submission(
        db: Session,
        school_id: str,
        teacher_id: str,
        assignment_id: str,
        submission_id: str,
        data: AssignmentSubmissionUpdate,
    ):
        a = AssignmentService._require_assignment_owner(db, school_id, teacher_id, assignment_id)
        sub = (
            AssignmentService._submission_query(db)
            .filter(
                AssignmentSubmission.id == submission_id,
                AssignmentSubmission.assignment_id == a.id,
                AssignmentSubmission.is_active == True,
            )
            .first()
        )
        if not sub:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Submission not found")
        if not sub.is_submitted:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Student has not submitted yet")

        payload = data.model_dump(exclude_unset=True)
        # feedback can always be updated
        if "feedback" in payload:
            sub.feedback = payload.get("feedback")

        # MCQ: if marks not provided, auto-grade
        marks = payload.get("marks_obtained")
        if a.assignment_type == "mcq_quiz" and sub.submission_type == "mcq_answers":
            if marks is None:
                marks = AssignmentService._auto_grade_mcq(a, sub)

        # file_upload: require marks
        if a.assignment_type == "file_upload" and sub.submission_type == "file_upload":
            if marks is None:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="marks_obtained is required for file_upload grading")

        if marks is not None:
            sub.marks_obtained = float(marks)
            sub.total_marks = float(a.total_marks or 0.0)
            sub.percentage = (sub.marks_obtained / sub.total_marks * 100.0) if sub.total_marks else None
            sub.grade = AssignmentService._grade_letter(sub.percentage)
            sub.is_graded = True
            sub.graded_by = teacher_id
            sub.graded_at = datetime.utcnow()

        db.commit()
        db.refresh(sub)
        sub.file_path = AssignmentService._public_upload_url(sub.file_path)
        try:
            sub.student_name = sub.student.user.name if sub.student and sub.student.user else None
        except Exception:
            sub.student_name = None
        sub.assignment_title = a.title
        return sub

    # ---------------------- submissions (student) ----------------------
    @staticmethod
    async def submit_file(db: Session, school_id: str, student_user_id: str, assignment_id: str, file):
        a = (
            AssignmentService._assignment_query(db)
            .options(joinedload(Assignment.class_subject))
            .filter(Assignment.id == assignment_id, Assignment.is_deleted == False, Assignment.is_active == True)
            .first()
        )
        if not a or not a.class_subject or a.class_subject.school_id != school_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignment not found")
        if a.assignment_type != "file_upload":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This assignment is not file_upload type")

        student = (
            db.query(Student)
            .filter(Student.user_id == student_user_id, Student.school_id == school_id, Student.is_deleted == False)
            .first()
        )
        if not student:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Student access required")

        uploader = FileUploadService(school_id)
        meta = await uploader.upload_file(file, folder=f"assignments/{assignment_id}/{student.id}")
        public_path = AssignmentService._public_upload_url(meta.get("filepath"))

        sub = (
            db.query(AssignmentSubmission)
            .filter(AssignmentSubmission.assignment_id == assignment_id, AssignmentSubmission.student_id == student.id)
            .first()
        )
        if not sub:
            sub = AssignmentSubmission(
                id=generate_id("assign_sub"),
                assignment_id=assignment_id,
                student_id=student.id,
                submission_type="file_upload",
            )
            db.add(sub)

        sub.file_path = public_path
        sub.file_name = getattr(file, "filename", None)
        sub.submission_type = "file_upload"
        sub.is_submitted = True
        sub.submitted_at = datetime.utcnow()
        sub.is_graded = False
        sub.marks_obtained = None
        sub.total_marks = None
        sub.percentage = None
        sub.grade = None
        sub.feedback = None
        sub.graded_by = None
        sub.graded_at = None

        db.commit()
        db.refresh(sub)
        sub.file_path = AssignmentService._public_upload_url(sub.file_path)
        sub.student_name = student.user.name if student.user else None
        sub.assignment_title = a.title
        return sub

    @staticmethod
    async def submit_mcq(db: Session, school_id: str, student_user_id: str, assignment_id: str, submitted_answers):
        a = (
            AssignmentService._assignment_query(db)
            .options(joinedload(Assignment.class_subject))
            .filter(Assignment.id == assignment_id, Assignment.is_deleted == False, Assignment.is_active == True)
            .first()
        )
        if not a or not a.class_subject or a.class_subject.school_id != school_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignment not found")
        if a.assignment_type != "mcq_quiz":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This assignment is not mcq_quiz type")

        student = (
            db.query(Student)
            .filter(Student.user_id == student_user_id, Student.school_id == school_id, Student.is_deleted == False)
            .first()
        )
        if not student:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Student access required")

        sub = (
            db.query(AssignmentSubmission)
            .filter(AssignmentSubmission.assignment_id == assignment_id, AssignmentSubmission.student_id == student.id)
            .first()
        )
        if not sub:
            sub = AssignmentSubmission(
                id=generate_id("assign_sub"),
                assignment_id=assignment_id,
                student_id=student.id,
                submission_type="mcq_answers",
            )
            db.add(sub)

        sub.submitted_answers = submitted_answers
        sub.submission_type = "mcq_answers"
        sub.is_submitted = True
        sub.submitted_at = datetime.utcnow()
        # Auto-grade MCQ immediately on submission
        marks = AssignmentService._auto_grade_mcq(a, sub)
        sub.marks_obtained = float(marks)
        sub.total_marks = float(a.total_marks or 0.0)
        sub.percentage = (sub.marks_obtained / sub.total_marks * 100.0) if sub.total_marks else None
        sub.grade = AssignmentService._grade_letter(sub.percentage)
        sub.is_graded = True
        sub.feedback = None
        sub.graded_by = None  # auto-graded
        sub.graded_at = datetime.utcnow()
        sub.file_path = None
        sub.file_name = None

        db.commit()
        db.refresh(sub)
        sub.student_name = student.user.name if student.user else None
        sub.assignment_title = a.title
        return sub

    @staticmethod
    def delete_assignment(db: Session, school_id: str, teacher_id: str, assignment_id: str):
        a = AssignmentService.get_assignment(db, school_id, teacher_id, assignment_id)
        a.is_deleted = True
        db.commit()
        return {"message": "Assignment deleted successfully"}

    @staticmethod
    def deactivate_assignment(db: Session, school_id: str, teacher_id: str, assignment_id: str):
        a = AssignmentService.get_assignment(db, school_id, teacher_id, assignment_id)
        a.is_active = False
        db.commit()
        return AssignmentService.get_assignment(db, school_id, teacher_id, assignment_id)

    @staticmethod
    def activate_assignment(db: Session, school_id: str, teacher_id: str, assignment_id: str):
        a = AssignmentService.get_assignment(db, school_id, teacher_id, assignment_id)
        a.is_active = True
        db.commit()
        return AssignmentService.get_assignment(db, school_id, teacher_id, assignment_id)


