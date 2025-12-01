# LMS API Testing Guide with cURL Commands

## 📋 Overview
This guide provides comprehensive cURL commands for testing all LMS API endpoints using Postman or terminal. All commands include proper headers, authentication, and example data.

## 🔧 Setup Instructions

### 1. Environment Variables
Create a `.env` file in the backend directory:
```env
POSTGRES_URL=postgresql://username:password@localhost:5432/lms_db
SECRET_KEY=your-secret-key-here
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
DOMAIN=localhost
ACCESS_TOKEN_EXPIRE_HOURS=24
```

### 2. Start the Server
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 3. Access Points
- **API Base URL**: `http://localhost:8000`
- **API Docs**: `http://localhost:8000/docs` (Swagger UI)
- **Health Check**: `http://localhost:8000/health`

---

## 🔐 AUTHENTICATION ENDPOINTS

### 📋 User Creation Validation Rules:
- **Admin users**: `school_id` should NOT be provided (admins manage all schools)
- **All other users** (subadmin, teacher, student, principle, parent): `school_id` is REQUIRED
- **Validation errors** will be returned if these rules are not followed

---

### 1. Create Admin User (Initial Setup)
**Endpoint**: `POST /api/users/public/create-admin`  
**Description**: Create the first admin user (public route for initial system setup)  
**Auth**: None (Public) - ⚠️ Disable this route in production  
**Note**: Admin users do NOT require `school_id` (they manage all schools)

```bash
curl -X POST "http://localhost:8000/api/users/public/create-admin" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@lms.com",
    "password": "Admin123!",
    "name": "System Administrator",
    "phone": "+1234567890",
    "address": {
      "street": "123 Admin Street",
      "city": "Admin City",
      "state": "Admin State",
      "country": "Admin Country",
      "postal_code": "12345"
    }
  }'
```

**Response:**
```json
{
  "id": "usr_1234567890",
  "email": "admin@lms.com",
  "name": "System Administrator",
  "role": "admin",
  "phone": "+1234567890",
  "is_active": true,
  "is_verified": false,
  "created_at": "2024-01-15T10:30:00Z"
}
```

**❌ Invalid Admin Creation (with school_id):**
```json
{
  "detail": "school_id should not be provided for admin users"
}
```

### 2. User Login (Universal)
**Endpoint**: `POST /api/users/public/login`  
**Description**: Login for all user types (admin, subadmin, teacher, student, parent, principle)

```bash
curl -X POST "http://localhost:8000/api/users/public/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@lms.com",
    "password": "Admin123!",
    "role": "admin"
  }'
```

**Response**:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": "user_id",
    "email": "admin@lms.com",
    "name": "System Admin",
    "role": "admin"
  },
  "message": "Login successful. Welcome System Admin!"
}
```

---

## 🏫 ADMIN ENDPOINTS

### 1. Create School
**Endpoint**: `POST /api/users/schools`  
**Auth**: Required (Admin JWT)

```bash
curl -X POST "http://localhost:8000/api/users/schools" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN" \
  -d '{
    "name": "Green Valley High School",
    "address": "123 Education Street, City, State",
    "phone": "+1-234-567-8900",
    "email": "admin@gvhs.edu"
  }'
```

### 2. Get Admin's Schools
**Endpoint**: `GET /api/users/schools`  
**Auth**: Required (Admin JWT)

```bash
curl -X GET "http://localhost:8000/api/users/schools" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"
```

### 3. Create Subadmin
**Endpoint**: `POST /api/users/subadmins`  
**Auth**: Required (Admin JWT)  
**Note**: Subadmin users MUST have `school_id` (they manage specific schools)

```bash
curl -X POST "http://localhost:8000/api/users/subadmins" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN" \
  -d '{
    "email": "subadmin@gvhs.edu",
    "password": "SubAdmin123!",
    "name": "School Subadmin",
    "school_id": "school_id_from_step_1"
  }'
```

**❌ Invalid Subadmin Creation (missing school_id):**
```json
{
  "detail": "school_id is required for subadmin users"
}
```

### 4. Create School Subject
**Endpoint**: `POST /api/users/schools/{school_id}/subjects`  
**Auth**: Required (Subadmin JWT)

```bash
curl -X POST "http://localhost:8000/api/users/schools/YOUR_SCHOOL_ID/subjects" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SUBADMIN_JWT_TOKEN" \
  -d '{
    "name": "Mathematics",
    "code": "MATH101",
    "description": "Advanced Mathematics for Grade 10"
  }'
```

### 5. Get School Subjects
**Endpoint**: `GET /api/users/schools/{school_id}/subjects`  
**Auth**: Required (Subadmin/Admin JWT)

```bash
curl -X GET "http://localhost:8000/api/users/schools/YOUR_SCHOOL_ID/subjects" \
  -H "Authorization: Bearer YOUR_SUBADMIN_JWT_TOKEN"
```

---

## 🏛️ SUBADMIN ENDPOINTS

### 1. Create Class
**Endpoint**: `POST /api/users/schools/{school_id}/classes`  
**Auth**: Required (Subadmin JWT)

```bash
curl -X POST "http://localhost:8000/api/users/schools/YOUR_SCHOOL_ID/classes" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SUBADMIN_JWT_TOKEN" \
  -d '{
    "name": "Grade 10-A",
    "grade_level": "Grade 10",
    "section": "A",
    "academic_year": "2024-2025",
    "capacity": 40,
    "term": "Term 1"
  }'
```

### 2. Get School Classes
**Endpoint**: `GET /api/users/schools/{school_id}/classes`  
**Auth**: Required (Subadmin JWT)

```bash
curl -X GET "http://localhost:8000/api/users/schools/YOUR_SCHOOL_ID/classes" \
  -H "Authorization: Bearer YOUR_SUBADMIN_JWT_TOKEN"
```

### 3. Add Subject to Class
**Endpoint**: `POST /api/users/classes/{class_id}/subjects`  
**Auth**: Required (Subadmin JWT)

```bash
curl -X POST "http://localhost:8000/api/users/classes/YOUR_CLASS_ID/subjects" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SUBADMIN_JWT_TOKEN" \
  -d '{
    "subject_id": "math_subject_id",
    "is_compulsory": true,
    "credits": 4
  }'
```

### 4. Get Class Subjects
**Endpoint**: `GET /api/users/classes/{class_id}/subjects`  
**Auth**: Required (Subadmin/Teacher JWT)

```bash
curl -X GET "http://localhost:8000/api/users/classes/YOUR_CLASS_ID/subjects" \
  -H "Authorization: Bearer YOUR_SUBADMIN_JWT_TOKEN"
```

### 5. Assign Teacher to Class Subject
**Endpoint**: `POST /api/users/class-subjects/{class_subject_id}/teachers`  
**Auth**: Required (Subadmin JWT)

```bash
curl -X POST "http://localhost:8000/api/users/class-subjects/YOUR_CLASS_SUBJECT_ID/teachers" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SUBADMIN_JWT_TOKEN" \
  -d '{
    "teacher_id": "teacher_profile_id",
    "academic_year": "2024-2025"
  }'
```

### 6. Assign Class Teacher (Homeroom)
**Endpoint**: `POST /api/users/classes/{class_id}/class-teacher`  
**Auth**: Required (Subadmin JWT)

```bash
curl -X POST "http://localhost:8000/api/users/classes/YOUR_CLASS_ID/class-teacher" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SUBADMIN_JWT_TOKEN" \
  -d '{
    "teacher_id": "homeroom_teacher_id"
  }'
```

### 7. Get Class Overview
**Endpoint**: `GET /api/users/classes/{class_id}/overview`  
**Auth**: Required (Subadmin JWT)

```bash
curl -X GET "http://localhost:8000/api/users/classes/YOUR_CLASS_ID/overview" \
  -H "Authorization: Bearer YOUR_SUBADMIN_JWT_TOKEN"
```

### 8. Update Teacher Assignment
**Endpoint**: `PUT /api/users/class-subject-teachers/{assignment_id}`  
**Auth**: Required (Subadmin JWT)

```bash
curl -X PUT "http://localhost:8000/api/users/class-subject-teachers/YOUR_ASSIGNMENT_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SUBADMIN_JWT_TOKEN" \
  -d '{
    "periods_per_week": 5,
    "syllabus_completion": 75
  }'
```

---

## 🚀 QUICK START

### Starting the Application

#### Backend (FastAPI)
```bash
# Windows - Using provided batch file
start_server.bat

# Manual startup
cd backend
venv\Scripts\activate  # Activate virtual environment
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

#### Frontend (React)
```bash
# Windows - Using provided batch file
start_frontend.bat

# Manual startup
cd frontend
npm install --legacy-peer-deps
npm start
```

### Initial Setup
1. **Start Backend**: Run `start_server.bat`
2. **Start Frontend**: Run `start_frontend.bat` (in a separate terminal)
3. **Create Admin**: Use the endpoint below to create your first admin user
4. **Access Application**:
   - Frontend: http://localhost:3000
   - API Docs: http://localhost:8000/docs

---

## 👨‍🏫 TEACHER ENDPOINTS

### 1. Create Teacher Profile
**Endpoint**: `POST /api/teachers/profile`  
**Auth**: Required (Teacher JWT)

```bash
curl -X POST "http://localhost:8000/api/teachers/profile" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TEACHER_JWT_TOKEN" \
  -d '{
    "qualification": "M.Sc. Mathematics",
    "experience_years": 5,
    "specialization": "Mathematics",
    "subjects": [
      {
        "subject_id": "math_subject_id",
        "is_primary": true,
        "experience_years": 5
      },
      {
        "subject_id": "physics_subject_id",
        "is_primary": false,
        "experience_years": 2
      }
    ]
  }'
```

### 2. Get Teacher Profile
**Endpoint**: `GET /api/teachers/profile`  
**Auth**: Required (Teacher JWT)

```bash
curl -X GET "http://localhost:8000/api/teachers/profile" \
  -H "Authorization: Bearer YOUR_TEACHER_JWT_TOKEN"
```

### 3. Update Teacher Profile
**Endpoint**: `PUT /api/teachers/profile`  
**Auth**: Required (Teacher JWT)

```bash
curl -X PUT "http://localhost:8000/api/teachers/profile" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TEACHER_JWT_TOKEN" \
  -d '{
    "experience_years": 6,
    "subjects": [
      {
        "subject_id": "math_subject_id",
        "is_primary": true,
        "experience_years": 6
      }
    ]
  }'
```

### 4. Get Teacher Workload
**Endpoint**: `GET /api/teachers/{teacher_id}/workload`  
**Auth**: Required (Subadmin/Teacher JWT)

```bash
curl -X GET "http://localhost:8000/api/teachers/YOUR_TEACHER_ID/workload?academic_year=2024-2025" \
  -H "Authorization: Bearer YOUR_SUBADMIN_JWT_TOKEN"
```

---

## 👨‍🎓 STUDENT ENDPOINTS

### 1. Create Student Profile
**Endpoint**: `POST /api/students/profile`  
**Auth**: Required (Student JWT)

```bash
curl -X POST "http://localhost:8000/api/students/profile" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_STUDENT_JWT_TOKEN" \
  -d '{
    "roll_number": "STD2024001",
    "date_of_birth": "2010-05-15",
    "gender": "Male",
    "blood_group": "O+",
    "class_id": "class_id_here",
    "admission_date": "2024-06-01",
    "guardian_name": "John Doe Sr.",
    "guardian_phone": "+1-234-567-8901",
    "guardian_relation": "Father"
  }'
```

### 2. Get Student Profile
**Endpoint**: `GET /api/students/profile`  
**Auth**: Required (Student JWT)

```bash
curl -X GET "http://localhost:8000/api/students/profile" \
  -H "Authorization: Bearer YOUR_STUDENT_JWT_TOKEN"
```

### 3. Update Student Profile
**Endpoint**: `PUT /api/students/profile`  
**Auth**: Required (Student JWT)

```bash
curl -X PUT "http://localhost:8000/api/students/profile" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_STUDENT_JWT_TOKEN" \
  -d '{
    "guardian_phone": "+1-234-567-8902"
  }'
```

### 4. Get Student Enrollments (Academic Tracking)
**Endpoint**: `GET /api/users/students/{student_id}/enrollments`  
**Auth**: Required (Teacher/Subadmin/Parent JWT)

```bash
curl -X GET "http://localhost:8000/api/users/students/YOUR_STUDENT_ID/enrollments" \
  -H "Authorization: Bearer YOUR_TEACHER_JWT_TOKEN"
```

---

## 🎓 PRINCIPLE ENDPOINTS

### 1. Create Principle Profile
**Endpoint**: `POST /api/principles/profile`  
**Auth**: Required (Principle JWT)

```bash
curl -X POST "http://localhost:8000/api/principles/profile" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_PRINCIPLE_JWT_TOKEN" \
  -d '{
    "qualification": "M.Ed.",
    "experience_years": 10,
    "specialization": "Educational Leadership",
    "designation": "Principal",
    "assigned_school_id": "school_id_here",
    "office_phone": "+1-234-567-8903",
    "office_email": "principal@gvhs.edu"
  }'
```

### 2. Get Principle Profile
**Endpoint**: `GET /api/principles/profile`  
**Auth**: Required (Principle JWT)

```bash
curl -X GET "http://localhost:8000/api/principles/profile" \
  -H "Authorization: Bearer YOUR_PRINCIPLE_JWT_TOKEN"
```

---

## 👨‍👩‍👧‍👦 PARENT ENDPOINTS

### 1. Create Parent Profile
**Endpoint**: `POST /api/parents/profile`  
**Auth**: Required (Parent JWT)

```bash
curl -X POST "http://localhost:8000/api/parents/profile" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_PARENT_JWT_TOKEN" \
  -d '{
    "occupation": "Engineer",
    "education_level": "Bachelor's",
    "marital_status": "Married",
    "emergency_contact_name": "Jane Doe",
    "emergency_contact_phone": "+1-234-567-8904",
    "emergency_contact_relation": "Wife",
    "number_of_children": 2
  }'
```

### 2. Get Parent Profile
**Endpoint**: `GET /api/parents/profile`  
**Auth**: Required (Parent JWT)

```bash
curl -X GET "http://localhost:8000/api/parents/profile" \
  -H "Authorization: Bearer YOUR_PARENT_JWT_TOKEN"
```

### 3. Get Parent's Children
**Endpoint**: `GET /api/parents/children`  
**Auth**: Required (Parent JWT)

```bash
curl -X GET "http://localhost:8000/api/parents/children" \
  -H "Authorization: Bearer YOUR_PARENT_JWT_TOKEN"
```

---

## 🧪 COMPLETE TESTING WORKFLOW

### Phase 1: Setup (Admin)
```bash
# 1. Login as Admin
curl -X POST "http://localhost:8000/api/users/public/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@lms.com", "password": "Admin123!", "role": "admin"}'

# 2. Create School
curl -X POST "http://localhost:8000/api/users/schools" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_JWT" \
  -d '{"name": "Green Valley High School", "address": "123 Main St", "phone": "+1234567890"}'

# 3. Create Subjects (Subadmin)
curl -X POST "http://localhost:8000/api/users/schools/SCHOOL_ID/subjects" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SUBADMIN_JWT" \
  -d '{"name": "Mathematics", "code": "MATH101", "description": "Basic Mathematics"}'

# 4. Create Subadmin
curl -X POST "http://localhost:8000/api/users/subadmins" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_JWT" \
  -d '{"email": "subadmin@gvhs.edu", "password": "SubAdmin123!", "name": "School Manager", "school_id": "SCHOOL_ID"}'
```

### Phase 2: School Setup (Subadmin)
```bash
# 1. Login as Subadmin
curl -X POST "http://localhost:8000/api/users/public/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "subadmin@gvhs.edu", "password": "SubAdmin123!", "role": "subadmin"}'

# 2. Create Classes
curl -X POST "http://localhost:8000/api/users/schools/SCHOOL_ID/classes" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SUBADMIN_JWT" \
  -d '{"name": "Grade 10-A", "grade_level": "Grade 10", "section": "A", "academic_year": "2024-2025", "capacity": 40}'

# 3. Add Subjects to Class
curl -X POST "http://localhost:8000/api/users/classes/CLASS_ID/subjects" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SUBADMIN_JWT" \
  -d '{"subject_id": "SUBJECT_ID", "is_compulsory": true, "credits": 4}'

# 4. Create Teachers
# (Use the teacher creation endpoints from subadmin routes)
```

### Phase 3: Academic Operations (Teachers & Students)
```bash
# 1. Teacher creates profile and specifies subjects
curl -X POST "http://localhost:8000/api/teachers/profile" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TEACHER_JWT" \
  -d '{"qualification": "M.Sc.", "experience_years": 5, "specialization": "Math", "subjects": [{"subject_id": "MATH_ID", "is_primary": true}]}'

# 2. Student creates profile and gets auto-enrolled
curl -X POST "http://localhost:8000/api/students/profile" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer STUDENT_JWT" \
  -d '{"roll_number": "STD001", "class_id": "CLASS_ID", "guardian_name": "Parent Name"}'

# 3. Subadmin assigns teachers to class subjects
curl -X POST "http://localhost:8000/api/users/class-subjects/CLASS_SUBJECT_ID/teachers" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SUBADMIN_JWT" \
  -d '{"teacher_id": "TEACHER_ID", "academic_year": "2024-2025"}'
```

---

## 📊 RESPONSE EXAMPLES

### Successful Login Response
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": "user_123",
    "email": "user@lms.com",
    "name": "John Doe",
    "role": "teacher"
  },
  "message": "Login successful. Welcome John Doe!"
}
```

### Class Overview Response
```json
{
  "class": {
    "id": "class_123",
    "name": "Grade 10-A",
    "grade_level": "Grade 10",
    "section": "A",
    "academic_year": "2024-2025",
    "capacity": 40,
    "class_teacher": {
      "id": "teacher_456",
      "name": "Jane Smith",
      "qualification": "M.Ed."
    }
  },
  "subjects": [
    {
      "id": "cs_123",
      "subject": {
        "id": "sub_123",
        "name": "Mathematics",
        "code": "MATH101"
      },
      "is_compulsory": true,
      "credits": 4,
      "teachers": [
        {
          "teacher": {
            "id": "teacher_456",
            "name": "Jane Smith"
          },
          "periods_per_week": 4,
          "syllabus_completion": 65
        }
      ]
    }
  ],
  "students_count": 35
}
```

---

## 🚨 ERROR RESPONSES

### Authentication Error
```json
{
  "detail": "Authentication required"
}
```

### Permission Denied
```json
{
  "detail": "Only subadmin can assign teachers to classes"
}
```

### Not Found
```json
{
  "detail": "Teacher not found"
}
```

### Validation Error
```json
{
  "detail": [
    {
      "loc": ["body", "email"],
      "msg": "value is not a valid email address",
      "type": "value_error.email"
    }
  ]
}
```

---

## 🔍 TESTING CHECKLIST

- [ ] Admin login and school creation
- [ ] Subject creation (admin)
- [ ] Subadmin creation and login
- [ ] Class creation (subadmin)
- [ ] Subject addition to classes
- [ ] Teacher creation and profile setup
- [ ] Student creation and auto-enrollment
- [ ] Teacher assignment to class subjects
- [ ] Class teacher assignment
- [ ] Class overview retrieval
- [ ] Teacher workload checking
- [ ] Student enrollment tracking

---

## 🐛 TROUBLESHOOTING

### Common Issues:

1. **"Authentication required"**
   - Check if JWT token is included in Authorization header
   - Verify token hasn't expired (24 hours default)

2. **"Access denied"**
   - Verify user has correct role for the operation
   - Check if user belongs to the correct school

3. **"Not found"**
   - Verify IDs are correct
   - Check if referenced entities exist

4. **Database errors**
   - Ensure PostgreSQL is running
   - Check database connection string in `.env`
   - Run database migrations if needed

### Useful Debug Commands:

```bash
# Check API health
curl http://localhost:8000/health

# View API documentation
open http://localhost:8000/docs

# Check database tables (if using psql)
psql -d lms_db -c "\dt"
```

---

## 📅 ACADEMIC SESSION MANAGEMENT

### 1. Create Academic Session
**Endpoint**: `POST /api/users/schools/{school_id}/sessions`  
**Auth**: Required (Subadmin JWT)

```bash
curl -X POST "http://localhost:8000/api/users/schools/YOUR_SCHOOL_ID/sessions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SUBADMIN_JWT_TOKEN" \
  -d '{
    "name": "2024-2025",
    "start_date": "2024-06-01T00:00:00",
    "end_date": "2025-05-31T23:59:59",
    "is_current": true,
    "term_count": 2
  }'
```

### 2. Get School Sessions
**Endpoint**: `GET /api/users/schools/{school_id}/sessions`  
**Auth**: Required (Subadmin JWT)

```bash
curl -X GET "http://localhost:8000/api/users/schools/YOUR_SCHOOL_ID/sessions" \
  -H "Authorization: Bearer YOUR_SUBADMIN_JWT_TOKEN"
```

### 3. Set Current Session
**Endpoint**: `PUT /api/users/schools/{school_id}/sessions/{session_id}/current`  
**Auth**: Required (Subadmin JWT)

```bash
curl -X PUT "http://localhost:8000/api/users/schools/YOUR_SCHOOL_ID/sessions/YOUR_SESSION_ID/current" \
  -H "Authorization: Bearer YOUR_SUBADMIN_JWT_TOKEN"
```

---

## 📈 STUDENT PROMOTION MANAGEMENT

### 1. Promote Students to Next Class
**Endpoint**: `POST /api/users/classes/promote`  
**Auth**: Required (Subadmin JWT)

```bash
curl -X POST "http://localhost:8000/api/users/classes/promote" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SUBADMIN_JWT_TOKEN" \
  -d '{
    "current_class_id": "grade_10_a_id",
    "next_class_id": "grade_11_a_id",
    "academic_year": "2025-2026"
  }'
```

**Response**:
```json
{
  "message": "Successfully promoted 35 students from Grade 10-A to Grade 11-A",
  "promoted_students": 35,
  "from_class": "Grade 10-A",
  "to_class": "Grade 11-A",
  "academic_year": "2025-2026"
}
```

---

## 👥 ACCOUNT MANAGEMENT

### 1. Activate/Deactivate User Account
**Endpoint**: `PUT /api/users/users/{user_id}/status`  
**Auth**: Required (Subadmin JWT)

```bash
# Activate account
curl -X PUT "http://localhost:8000/api/users/users/YOUR_USER_ID/status" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SUBADMIN_JWT_TOKEN" \
  -d '{
    "is_active": true
  }'

# Deactivate account
curl -X PUT "http://localhost:8000/api/users/users/YOUR_USER_ID/status" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SUBADMIN_JWT_TOKEN" \
  -d '{
    "is_active": false
  }'
```

---

## 🎓 SOFT DELETE & ACCOUNT STATUS

### Model Changes:
All models now include soft delete functionality:
- `is_active`: Controls whether user can login/use system
- `is_deleted`: Marks record as deleted (preserves data)

### Account Management Rules:
- **Subadmins** can activate/deactivate users in their school
- **Admins** cannot be deactivated by subadmins
- **Deactivated users** cannot login but data is preserved
- **Deleted records** are marked but not physically removed

---

## 📊 ENHANCED WORKFLOW EXAMPLES

### Initial System Setup:

```bash
# 1. Create the first admin user (public route - use once for initial setup)
curl -X POST "http://localhost:8000/api/users/public/create-admin" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@lms.com",
    "password": "Admin123!",
    "name": "System Administrator",
    "phone": "+1234567890",
    "address": {
      "street": "123 Admin Street",
      "city": "Admin City",
      "state": "Admin State",
      "country": "Admin Country",
      "postal_code": "12345"
    }
  }'

# 2. Login as admin
curl -X POST "http://localhost:8000/api/users/public/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@lms.com",
    "password": "Admin123!",
    "role": "admin"
  }'
```

### Complete Academic Session Workflow:

```bash
# 1. Create academic session
curl -X POST "http://localhost:8000/api/users/schools/SCHOOL_ID/sessions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SUBADMIN_JWT" \
  -d '{"name": "2024-2025", "start_date": "2024-06-01T00:00:00", "end_date": "2025-05-31T23:59:59", "is_current": true}'

# 2. Create classes for the session
curl -X POST "http://localhost:8000/api/users/schools/SCHOOL_ID/classes" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SUBADMIN_JWT" \
  -d '{"name": "Grade 10-A", "grade_level": "Grade 10", "section": "A", "academic_year": "2024-2025"}'

# 3. Add subjects to classes
curl -X POST "http://localhost:8000/api/users/classes/CLASS_ID/subjects" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SUBADMIN_JWT" \
  -d '{"subject_id": "MATH_ID", "is_compulsory": true, "credits": 4}'

# 4. Assign teachers to subjects
curl -X POST "http://localhost:8000/api/users/class-subjects/CLASS_SUBJECT_ID/teachers" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SUBADMIN_JWT" \
  -d '{"teacher_id": "TEACHER_ID", "academic_year": "2024-2025"}'

# 5. Enroll students (they automatically get enrolled in class subjects)

# 6. At session end, promote students
curl -X POST "http://localhost:8000/api/users/classes/promote" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SUBADMIN_JWT" \
  -d '{"current_class_id": "grade_10_a_id", "next_class_id": "grade_11_a_id", "academic_year": "2025-2026"}'
```

### Session-wise Features:
- **Student Enrollment**: Students enroll in classes for specific academic sessions
- **Subject Assignments**: Teachers are assigned to subjects for specific sessions
- **Academic Tracking**: Grades, attendance tracked per session
- **Promotion System**: Students move to next class at session end
- **Historical Data**: All academic records preserved by session

---

## 📞 SUPPORT

## 🔧 Troubleshooting

### Bcrypt Compatibility Issues
If you encounter errors like `AttributeError: module 'bcrypt' has no attribute '__about__'`:

1. **Solution**: Use compatible versions of bcrypt and passlib
   ```bash
   pip install "bcrypt==4.0.1" "passlib==1.7.4"
   ```

2. **Why this happens**: Newer bcrypt versions (5.0+) changed their API, but passlib 1.7.4 expects the old API.

### Common Issues:
1. Check the API documentation at `/docs`
2. Verify your `.env` configuration
3. Ensure all dependencies are installed (especially bcrypt/passlib compatibility)
4. Check server logs for detailed error messages
5. For admin creation issues, ensure you're using the public route: `/api/users/public/create-admin`
6. **Address validation errors**: When creating users with addresses, ensure the address object is properly structured as shown in the examples above

### Testing Checklist
- [x] Server starts without errors
- [x] Admin creation endpoint works (`POST /api/users/public/create-admin`)
- [x] Bcrypt compatibility issues resolved
- [ ] Login endpoint works (`POST /api/users/public/login`)
- [ ] School creation works (admin only)
- [ ] Subadmin creation works (admin only)
- [ ] Subject creation works (subadmin only)
- [ ] Class creation works (subadmin only)
- [ ] Teacher creation works (subadmin only)
- [ ] Student creation works (subadmin only)
- [ ] Parent creation works (subadmin only)
- [ ] Role-based access control works
