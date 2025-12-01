# LMS (Learning Management System) Architecture

## 🏗️ System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           LMS - Learning Management System                │
├─────────────────────────────────────────────────────────────────────────┤
│  Built with: FastAPI, PostgreSQL, SQLAlchemy, JWT Authentication        │
│  Architecture: Modular Microservices-style with separate route handlers │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           FASTAPI APPLICATION                            │
├─────────────────────────────────────────────────────────────────────────┤
│  - Main App (main.py)                                                   │
│  - Middleware (CORS, Authentication)                                    │
│  - Route Registration (Users, Teachers, Students, Principles, Parents) │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          AUTHENTICATION & SECURITY                       │
├─────────────────────────────────────────────────────────────────────────┤
│  - JWT Token-based Authentication                                       │
│  - Role-based Access Control (Admin, Subadmin, Teacher, Student, Parent)│
│  - Cookie-based Session Management                                      │
│  - Middleware-based Route Protection                                    │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           API ROUTE HANDLERS                            │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐        │
│  │  Users      │ │  Teachers   │ │  Students  │ │  Principles│        │
│  │  Routes     │ │  Routes     │ │  Routes    │ │  Routes    │        │
│  │ (Auth, Core)│ │ (CRUD)      │ │ (CRUD)     │ │ (CRUD)     │        │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘        │
│  ┌─────────────┐                                                        │
│  │  Parents    │                                                        │
│  │  Routes     │                                                        │
│  │ (CRUD)      │                                                        │
│  └─────────────┘                                                        │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           BUSINESS LOGIC LAYER                          │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐        │
│  │  User       │ │  Teacher    │ │  Student   │ │  Principle │        │
│  │  Service    │ │  Service    │ │  Service   │ │  Service   │        │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘        │
│  ┌─────────────┐                                                        │
│  │  Parent     │                                                        │
│  │  Service    │                                                        │
│  └─────────────┘                                                        │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           DATA ACCESS LAYER                             │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐        │
│  │  User       │ │  Teacher    │ │  Student   │ │  Student   │        │
│  │  Models     │ │  Models     │ │  Models    │ │  Models    │        │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘        │
│  ┌─────────────┐                                                        │
│  │  Parent     │                                                        │
│  │  Models     │                                                        │
│  └─────────────┘                                                        │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           DATABASE LAYER                                │
├─────────────────────────────────────────────────────────────────────────┤
│  PostgreSQL Database with SQLAlchemy ORM                               │
│                                                                         │
│  Core Tables:                                                          │
│  - users (all user types)                                              │
│  - schools                                                             │
│  - addresses                                                           │
│  - subjects                                                            │
│  - classes                                                             │
│                                                                         │
│  User-Specific Tables:                                                 │
│  - teachers, teacher_subjects                                          │
│  - students, student_subjects, student_subject_enrollments             │
│  - principles                                                          │
│  - parents                                                             │
│                                                                         │
│  Relationship Tables:                                                  │
│  - class_subjects, class_subject_teachers                              │
└─────────────────────────────────────────────────────────────────────────┘
```

## 🎯 Quick Architecture Summary

```
Frontend (React) ──── HTTP Requests ──── FastAPI Backend
                                               │
                                               ├── Authentication Middleware
                                               ├── Route Handlers (5 modules)
                                               ├── Business Logic (5 services)
                                               ├── Data Models (5 modules)
                                               └── PostgreSQL Database
```

### Key Components:
- **5 Route Modules**: Users, Teachers, Students, Principles, Parents
- **5 Service Modules**: Business logic for each user type
- **5 Model Modules**: Database schemas for each user type
- **JWT Authentication**: Token-based security with role permissions
- **Public Admin Creation**: Initial admin setup endpoint (disable in production)
- **School-scoped Subjects**: Subjects managed per school by subadmins
- **Session-wise Operations**: Academic sessions with student progression
- **PostgreSQL**: ACID-compliant database with complex relationships

## 🏛️ Hierarchical User Structure

```
┌─────────────┐
│   ADMIN     │ ← Creates schools, subadmins, manages system
├─────────────┤
       │
       ▼
┌─────────────┐
│  SUBADMIN   │ ← Manages school: classes, subjects, teachers, students
├─────────────┤
       │
       ▼
┌─────────────────────┐
│ TEACHER │ STUDENT   │ ← Teachers teach subjects, Students learn subjects
│ PRINCIPLE │ PARENT  │    Principles oversee, Parents monitor children
└─────────────────────┘
```

## 📊 Database Schema Relationships

```
Schools (Admin creates)
├── Subjects (Subadmin creates per school)
├── Classes (Subadmin creates)
│   ├── class_teacher (Teacher - Homeroom)
│   ├── class_subjects (Subjects offered in class)
│   │   ├── subject (Subject details - school-specific)
│   │   └── class_subject_teachers (Teachers assigned to subject)
│   │       └── teacher (Teacher details)
│   └── students (Students enrolled)
│       └── student_subject_enrollments (Academic tracking)
│           └── class_subject (Subject enrollment details)

Users (Base user table)
├── teachers (Teacher profiles)
│   └── teacher_subjects (Subjects teacher can teach)
├── students (Student profiles)
│   └── student_subjects (Legacy - subject preferences)
└── addresses (User addresses)
```

## 🔄 API Request Flow

```
Client Request → FastAPI → Middleware → Route Handler → Service Layer → Database
                       ↑                                           │
                       └────────────── JWT Validation ─────────────┘
```

## 🛡️ Security Layers

1. **JWT Authentication**: Bearer token in Authorization header
2. **Role-based Access Control**: Route-level permission checks
3. **Public Routes**: Limited public endpoints (login, initial admin creation)
4. **School-based Isolation**: Users can only access their school's data
5. **Cookie Sessions**: Automatic session management
5. **CORS Protection**: Configured for React frontend

## 📁 Project Structure

```
backend/
├── app/
│   ├── main.py                 # FastAPI application entry point
│   ├── api/
│   │   ├── __init__.py         # Authentication middleware
│   │   └── routes/
│   │       ├── users_routes.py     # Auth + Admin/Subadmin routes
│   │       ├── teacher_routes.py   # Teacher CRUD operations
│   │       ├── student_routes.py   # Student CRUD operations
│   │       ├── principle_routes.py # Principle CRUD operations
│   │       └── parent_routes.py    # Parent CRUD operations
│   ├── models/
│   │   ├── users.py            # Core models (User, School, Class, Subject)
│   │   ├── teacher.py          # Teacher-specific models
│   │   ├── student.py          # Student-specific models
│   │   ├── principle.py        # Principle-specific models
│   │   └── parent.py           # Parent-specific models
│   ├── schemas/
│   │   ├── user.py             # Core schemas
│   │   ├── teacher.py          # Teacher schemas
│   │   ├── student.py          # Student schemas
│   │   ├── principle.py        # Principle schemas
│   │   └── parent.py           # Parent schemas
│   ├── services/
│   │   ├── user_service.py     # Core business logic
│   │   ├── teacher_service.py  # Teacher operations
│   │   ├── student_service.py  # Student operations
│   │   ├── principle_service.py# Principle operations
│   │   └── parent_service.py   # Parent operations
│   ├── core/
│   │   ├── __init__.py
│   │   ├── hash.py             # Password hashing utilities
│   │   ├── auth.py             # JWT token management
│   │   ├── mail_service.py     # Email services
│   │   └── utils_functions.py  # ID generation, OTP
│   └── config/
│       └── database.py         # Database configuration
├── requirements.txt            # Python dependencies
└── .env                       # Environment variables
```

## 🚀 Key Features Implemented

### ✅ **Authentication & Authorization**
- JWT-based authentication
- Role-based access control
- Cookie-based sessions
- Middleware protection

### ✅ **Multi-level User Management**
- Admin: System-wide management
- Subadmin: School-level management
- Teachers: Subject teaching and profile management
- Students: Academic tracking and enrollment
- Principles: Administrative oversight
- Parents: Child monitoring

### ✅ **Academic Structure**
- Schools with classes and subjects
- Teacher-subject-class assignments
- Student enrollment and tracking
- Homeroom teacher assignments
- Academic performance monitoring

### ✅ **Real-school Workflow**
- Class creation and management
- Subject assignment to classes
- Teacher workload management
- Student automatic enrollment
- Academic progress tracking
