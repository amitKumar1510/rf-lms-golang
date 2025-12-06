from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from typing import List, Optional, Dict, Any
from datetime import datetime
import uuid
import os

from app.models.assignment import Assignment, AssignmentQuestion, AssignmentSubmission
from app.models.student import Student
from app.models.teacher import Teacher
from app.schemas.assignment import (
    AssignmentCreate, AssignmentUpdate, AssignmentQuestionCreate,
    AssignmentSubmissionCreate, AssignmentSubmissionUpdate
)


class AssignmentService:

    @staticmethod
    def generate_id(prefix: str = "assignment") -> str:
        """Generate a unique ID with prefix"""
        return f"{prefix}_{uuid.uuid4().hex[:16]}"

    @staticmethod
    def _get_teacher_profile_id(db: Session, teacher_user_id: str) -> Optional[str]:
        """Get teacher profile ID from user ID"""
        from app.models.teacher import Teacher
        teacher_profile = db.query(Teacher).filter(
            Teacher.user_id == teacher_user_id,
            Teacher.is_active == True
        ).first()
        return teacher_profile.id if teacher_profile else None

    @staticmethod
    def create_assignment(db: Session, assignment_data: AssignmentCreate, teacher_user_id: str) -> Assignment:
        """Create a new assignment"""
        # Get the teacher profile ID from user ID
        teacher_profile_id = AssignmentService._get_teacher_profile_id(db, teacher_user_id)
        if not teacher_profile_id:
            raise ValueError("Teacher profile not found")

        assignment = Assignment(
            id=AssignmentService.generate_id(),
            title=assignment_data.title,
            description=assignment_data.description,
            assignment_type=assignment_data.assignment_type,
            subject_id=assignment_data.subject_id,
            class_subject_id=assignment_data.class_subject_id,
            teacher_id=teacher_profile_id,
            total_marks=assignment_data.total_marks,
            passing_marks=assignment_data.passing_marks,
            due_date=assignment_data.due_date
        )

        db.add(assignment)
        db.flush()  # Get the assignment ID

        # Create questions if provided
        if assignment_data.questions:
            for question_data in assignment_data.questions:
                question = AssignmentQuestion(
                    id=AssignmentService.generate_id("question"),
                    assignment_id=assignment.id,
                    question_text=question_data.question_text,
                    question_type=question_data.question_type,
                    options=question_data.options,
                    correct_answer=question_data.correct_answer,
                    marks=question_data.marks,
                    order=question_data.order
                )
                db.add(question)

        db.commit()
        db.refresh(assignment)
        return assignment

    @staticmethod
    def update_assignment(db: Session, assignment_id: str, assignment_data: AssignmentUpdate, teacher_user_id: str) -> Assignment:
        """Update an existing assignment"""
        # Get the teacher profile ID from user ID
        teacher_profile_id = AssignmentService._get_teacher_profile_id(db, teacher_user_id)
        if not teacher_profile_id:
            raise ValueError("Teacher profile not found")

        # Get the assignment
        assignment = db.query(Assignment).filter(
            and_(
                Assignment.id == assignment_id,
                Assignment.teacher_id == teacher_profile_id,
                Assignment.is_active == True,
                Assignment.is_deleted == False
            )
        ).first()

        if not assignment:
            raise ValueError("Assignment not found or access denied")

        # Update assignment fields
        update_data = assignment_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            if field != 'questions' and hasattr(assignment, field):
                setattr(assignment, field, value)

        assignment.updated_at = datetime.utcnow()

        # Handle questions update if provided
        if hasattr(assignment_data, 'questions') and assignment_data.questions is not None:
            # Delete existing questions
            db.query(AssignmentQuestion).filter(AssignmentQuestion.assignment_id == assignment_id).delete()

            # Add new questions
            for question_data in assignment_data.questions:
                question = AssignmentQuestion(
                    id=AssignmentService.generate_id("question"),
                    assignment_id=assignment.id,
                    question_text=question_data.question_text,
                    question_type=question_data.question_type,
                    options=question_data.options,
                    correct_answer=question_data.correct_answer,
                    marks=question_data.marks,
                    order=question_data.order
                )
                db.add(question)

        db.commit()
        db.refresh(assignment)
        return assignment

    @staticmethod
    def get_assignments_for_teacher(db: Session, teacher_user_id: str, class_subject_id: Optional[str] = None, status: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get assignments created by a teacher"""
        from datetime import datetime

        # Get the teacher profile ID from user ID
        teacher_profile_id = AssignmentService._get_teacher_profile_id(db, teacher_user_id)
        print(f"DEBUG: get_assignments_for_teacher - user_id {teacher_user_id} -> profile_id {teacher_profile_id}, status={status}")
        if not teacher_profile_id:
            print("DEBUG: No teacher profile found")
            return []

        query = db.query(Assignment).filter(
            and_(
                Assignment.teacher_id == teacher_profile_id,
                Assignment.is_active == True,
                Assignment.is_deleted == False
            )
        )

        # Apply status filter
        if status == 'ongoing':
            # Ongoing: due date is in the future or no due date
            current_time = datetime.utcnow()
            query = query.filter(
                or_(
                    Assignment.due_date.is_(None),
                    Assignment.due_date > current_time
                )
            )
        elif status == 'closed':
            # Closed: due date has passed
            current_time = datetime.utcnow()
            query = query.filter(
                and_(
                    Assignment.due_date.isnot(None),
                    Assignment.due_date <= current_time
                )
            )

        if class_subject_id and class_subject_id != 'all':
            query = query.filter(Assignment.class_subject_id == class_subject_id)

        assignments = query.order_by(Assignment.created_at.desc()).all()

        result = []
        for assignment in assignments:
            # Count submissions
            submission_count = db.query(AssignmentSubmission).filter(
                and_(
                    AssignmentSubmission.assignment_id == assignment.id,
                    AssignmentSubmission.is_submitted == True
                )
            ).count()

            result.append({
                "id": assignment.id,
                "title": assignment.title,
                "description": assignment.description,
                "assignment_type": assignment.assignment_type,
                "subject_name": assignment.subject.name if assignment.subject else "Unknown",
                "class_name": assignment.class_subject.class_info.name if assignment.class_subject and assignment.class_subject.class_info else "Unknown Class",
                "total_marks": assignment.total_marks,
                "due_date": assignment.due_date.isoformat() if assignment.due_date else None,
                "created_at": assignment.created_at.isoformat(),
                "submission_count": submission_count,
                "question_count": len(assignment.questions)
            })

        print(f"DEBUG: Returning {len(result)} assignments for teacher {teacher_user_id}")
        return result

    @staticmethod
    def get_assignments_for_student(db: Session, student_user_id: str, class_subject_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get assignments available to a student"""
        # Get student's profile using user_id
        student = db.query(Student).filter(Student.user_id == student_user_id).first()
        if not student:
            return []

        # Get assignments for the student's class subjects
        query = db.query(Assignment).join(Assignment.class_subject).filter(
            and_(
                Assignment.class_subject.has(class_id=student.class_id),
                Assignment.is_active == True,
                Assignment.is_deleted == False
            )
        )

        if class_subject_id:
            query = query.filter(Assignment.class_subject_id == class_subject_id)

        assignments = query.order_by(Assignment.created_at.desc()).all()

        result = []
        for assignment in assignments:
            # Check if student has submitted
            submission = db.query(AssignmentSubmission).filter(
                and_(
                    AssignmentSubmission.assignment_id == assignment.id,
                    AssignmentSubmission.student_id == student.id,
                    AssignmentSubmission.is_active == True
                )
            ).first()

            result.append({
                "id": assignment.id,
                "title": assignment.title,
                "description": assignment.description,
                "assignment_type": assignment.assignment_type,
                "subject_name": assignment.subject.name if assignment.subject else "Unknown",
                "total_marks": assignment.total_marks,
                "due_date": assignment.due_date.isoformat() if assignment.due_date else None,
                "created_at": assignment.created_at.isoformat(),
                "has_submitted": submission.is_submitted if submission else False,
                "submission_id": submission.id if submission else None,
                "marks_obtained": submission.marks_obtained if submission else None,
                "is_graded": submission.is_graded if submission else False,
                "question_count": len(assignment.questions)
            })

        return result

    @staticmethod
    def get_assignment_details(db: Session, assignment_id: str, user_id: str, user_role: str) -> Optional[Dict[str, Any]]:
        """Get detailed assignment information"""
        assignment = db.query(Assignment).filter(
            and_(
                Assignment.id == assignment_id,
                Assignment.is_active == True,
                Assignment.is_deleted == False
            )
        ).first()

        if not assignment:
            return None

        # Check permissions based on role
        if user_role == "teacher":
            teacher_profile_id = AssignmentService._get_teacher_profile_id(db, user_id)
            if not teacher_profile_id or assignment.teacher_id != teacher_profile_id:
                return None
        elif user_role == "student":
            # Check if student is in the class
            student = db.query(Student).filter(Student.user_id == user_id).first()
            if not student or assignment.class_subject.class_id != student.class_id:
                return None

        result = {
            "id": assignment.id,
            "title": assignment.title,
            "description": assignment.description,
            "assignment_type": assignment.assignment_type,
            "subject_name": assignment.subject.name if assignment.subject else "Unknown",
            "class_name": assignment.class_subject.class_info.name if assignment.class_subject.class_info else "Unknown",
            "total_marks": assignment.total_marks,
            "passing_marks": assignment.passing_marks,
            "due_date": assignment.due_date.isoformat() if assignment.due_date else None,
            "created_at": assignment.created_at.isoformat(),
            "questions": []
        }

        # Include questions for teachers or for MCQ assignments
        if user_role == "teacher" or assignment.assignment_type == "mcq_quiz":
            result["questions"] = [
                {
                    "id": q.id,
                    "question_text": q.question_text,
                    "question_type": q.question_type,
                    "options": q.options,
                    "marks": q.marks,
                    "order": q.order,
                    "correct_answer": q.correct_answer if user_role == "teacher" else None
                }
                for q in assignment.questions
            ]

        return result

    @staticmethod
    def submit_assignment(db: Session, submission_data: AssignmentSubmissionCreate, student_user_id: str) -> AssignmentSubmission:
        """Submit an assignment"""
        assignment = db.query(Assignment).filter(Assignment.id == submission_data.assignment_id).first()
        if not assignment:
            raise ValueError("Assignment not found")

        # Get student profile
        student = db.query(Student).filter(Student.user_id == student_user_id).first()
        if not student:
            raise ValueError("Student profile not found")

        # Check if student already submitted
        existing_submission = db.query(AssignmentSubmission).filter(
            and_(
                AssignmentSubmission.assignment_id == submission_data.assignment_id,
                AssignmentSubmission.student_id == student.id,
                AssignmentSubmission.is_active == True
            )
        ).first()

        if existing_submission:
            # Update existing submission
            existing_submission.submission_type = submission_data.submission_type
            existing_submission.submitted_answers = submission_data.submitted_answers
            existing_submission.file_path = submission_data.file_path
            existing_submission.file_name = submission_data.file_name
            existing_submission.is_submitted = True
            existing_submission.submitted_at = datetime.utcnow()

            # Auto-grade MCQ assignments
            if assignment.assignment_type == "mcq_quiz" and submission_data.submitted_answers:
                AssignmentService._auto_grade_mcq(db, existing_submission, assignment)

            db.commit()
            db.refresh(existing_submission)
            return existing_submission
        else:
            # Create new submission
            submission = AssignmentSubmission(
                id=AssignmentService.generate_id("submission"),
                assignment_id=submission_data.assignment_id,
                student_id=student.id,
                submission_type=submission_data.submission_type,
                submitted_answers=submission_data.submitted_answers,
                file_path=submission_data.file_path,
                file_name=submission_data.file_name,
                is_submitted=True,
                submitted_at=datetime.utcnow()
            )

            db.add(submission)

            # Auto-grade MCQ assignments
            if assignment.assignment_type == "mcq_quiz" and submission_data.submitted_answers:
                db.flush()  # Get submission ID
                AssignmentService._auto_grade_mcq(db, submission, assignment)

            db.commit()
            db.refresh(submission)
            return submission

    @staticmethod
    def _auto_grade_mcq(db: Session, submission: AssignmentSubmission, assignment: Assignment):
        """Auto-grade MCQ assignments"""
        if not submission.submitted_answers:
            return

        total_marks = 0
        obtained_marks = 0

        for question in assignment.questions:
            total_marks += question.marks
            if question.id in submission.submitted_answers:
                student_answer = submission.submitted_answers[question.id]
                if student_answer == question.correct_answer:
                    obtained_marks += question.marks

        submission.marks_obtained = obtained_marks
        submission.total_marks = total_marks
        submission.percentage = (obtained_marks / total_marks * 100) if total_marks > 0 else 0
        submission.is_graded = True
        submission.graded_at = datetime.utcnow()

        # Assign grade
        percentage = submission.percentage
        if percentage >= 90:
            submission.grade = "A"
        elif percentage >= 80:
            submission.grade = "B"
        elif percentage >= 70:
            submission.grade = "C"
        elif percentage >= 60:
            submission.grade = "D"
        else:
            submission.grade = "F"

    @staticmethod
    def get_assignment_submissions(db: Session, assignment_id: str, teacher_user_id: str) -> List[Dict[str, Any]]:
        """Get all submissions for an assignment"""
        # Get the teacher profile ID from user ID
        teacher_profile_id = AssignmentService._get_teacher_profile_id(db, teacher_user_id)
        if not teacher_profile_id:
            return []

        # Verify teacher owns the assignment
        assignment = db.query(Assignment).filter(
            and_(
                Assignment.id == assignment_id,
                Assignment.teacher_id == teacher_profile_id,
                Assignment.is_active == True
            )
        ).first()

        if not assignment:
            return []

        submissions = db.query(AssignmentSubmission).filter(
            and_(
                AssignmentSubmission.assignment_id == assignment_id,
                AssignmentSubmission.is_active == True
            )
        ).all()

        result = []
        for submission in submissions:
            result.append({
                "id": submission.id,
                "student_name": f"{submission.student.user.name}" if submission.student and submission.student.user else "Unknown",
                "roll_number": submission.student.roll_number if submission.student else "N/A",
                "submission_type": submission.submission_type,
                "file_name": submission.file_name,
                "marks_obtained": submission.marks_obtained,
                "total_marks": submission.total_marks,
                "percentage": submission.percentage,
                "grade": submission.grade,
                "is_graded": submission.is_graded,
                "feedback": submission.feedback,
                "submitted_at": submission.submitted_at.isoformat() if submission.submitted_at else None,
                "is_submitted": submission.is_submitted
            })

        return result

    @staticmethod
    def grade_assignment(db: Session, submission_id: str, grading_data: AssignmentSubmissionUpdate, teacher_user_id: str):
        """Grade a file-based assignment submission"""
        # Get the teacher profile ID from user ID
        teacher_profile_id = AssignmentService._get_teacher_profile_id(db, teacher_user_id)
        if not teacher_profile_id:
            raise ValueError("Teacher profile not found")

        submission = db.query(AssignmentSubmission).filter(
            and_(
                AssignmentSubmission.id == submission_id,
                AssignmentSubmission.is_active == True
            )
        ).first()

        if not submission:
            raise ValueError("Submission not found")

        # Verify teacher owns the assignment
        if submission.assignment.teacher_id != teacher_profile_id:
            raise ValueError("Unauthorized to grade this submission")

        # Update grading information
        if grading_data.marks_obtained is not None:
            submission.marks_obtained = grading_data.marks_obtained
            submission.total_marks = submission.assignment.total_marks
            submission.percentage = (submission.marks_obtained / submission.total_marks * 100) if submission.total_marks > 0 else 0

            # Assign grade
            percentage = submission.percentage
            if percentage >= 90:
                submission.grade = "A"
            elif percentage >= 80:
                submission.grade = "B"
            elif percentage >= 70:
                submission.grade = "C"
            elif percentage >= 60:
                submission.grade = "D"
            else:
                submission.grade = "F"

        submission.feedback = grading_data.feedback
        submission.is_graded = grading_data.is_graded
        submission.graded_by = teacher_profile_id
        submission.graded_at = datetime.utcnow()

        db.commit()
        db.refresh(submission)
        return submission

    @staticmethod
    def get_student_assignment_stats(db: Session, student_user_id: str) -> Dict[str, Any]:
        """Get assignment statistics for a student"""
        # Get student profile
        student = db.query(Student).filter(Student.user_id == student_user_id).first()
        if not student:
            return {
                "total_assignments": 0,
                "submitted_assignments": 0,
                "graded_assignments": 0,
                "average_score": None
            }

        submissions = db.query(AssignmentSubmission).filter(
            and_(
                AssignmentSubmission.student_id == student.id,
                AssignmentSubmission.is_active == True
            )
        ).all()

        total_assignments = len(submissions)
        submitted_count = sum(1 for s in submissions if s.is_submitted)
        graded_count = sum(1 for s in submissions if s.is_graded)

        if graded_count > 0:
            avg_score = sum(s.percentage for s in submissions if s.percentage is not None) / graded_count
        else:
            avg_score = None

        return {
            "total_assignments": total_assignments,
            "submitted_assignments": submitted_count,
            "graded_assignments": graded_count,
            "average_score": avg_score
        }
