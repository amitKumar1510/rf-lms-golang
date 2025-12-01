# Learning Management System (LMS)

A comprehensive Learning Management System built with FastAPI (backend) and React (frontend) that supports real-life school operations with session-wise student progression, teacher assignments, and academic tracking.

## 🚀 Features

### Core Functionality
- **Multi-role Authentication**: Admin, Subadmin, Teacher, Student, Principle, Parent
- **Session-wise Operations**: Academic sessions with student promotion
- **School Management**: Multi-school support with isolated data
- **Subject & Class Management**: Flexible curriculum structure
- **Teacher Assignments**: Subject-wise teacher allocation
- **Academic Tracking**: Grades, attendance, and performance analytics

### Advanced Features
- **Soft Delete**: Data preservation with activation/deactivation
- **Role-based Access Control**: Granular permissions per user type
- **Real-time Dashboard**: Comprehensive analytics and reporting
- **API Documentation**: Auto-generated Swagger/OpenAPI docs

## 🏗️ Architecture

### Backend (FastAPI)
- **Framework**: FastAPI with async support
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Authentication**: JWT tokens with role-based access
- **Validation**: Pydantic schemas with custom validators

### Frontend (React)
- **UI Library**: Material-UI (MUI) components
- **State Management**: React Context API
- **Routing**: React Router v6
- **HTTP Client**: Axios with interceptors

## 🛠️ Installation & Setup

### Prerequisites
- Python 3.11+
- Node.js 16+
- PostgreSQL

### Backend Setup

1. **Clone and navigate to backend:**
   ```bash
   cd backend
   ```

2. **Create virtual environment:**
   ```bash
   python -m venv venv
   ```

3. **Activate virtual environment:**
   ```bash
   # Windows
   venv\Scripts\activate

   # Linux/Mac
   source venv/bin/activate
   ```

4. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

5. **Configure environment variables:**
   Create `.env` file in backend root:
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

6. **Start the backend server:**
   ```bash
   # Using the provided batch file (Windows)
   start_server.bat

   # Or manually
   uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
   ```

### Frontend Setup

1. **Navigate to frontend:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install --legacy-peer-deps
   ```

3. **Configure environment:**
   Create `.env` file in frontend root:
   ```env
   REACT_APP_API_URL=http://localhost:8000
   ```

4. **Start the frontend:**
   ```bash
   # Using the provided batch file (Windows)
   start_frontend.bat

   # Or manually
   npm start
   ```

## 🎯 Quick Start

### 1. Create Initial Admin
```bash
curl -X POST "http://localhost:8000/api/users/public/create-admin" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@lms.com",
    "password": "Admin123!",
    "name": "System Administrator"
  }'
```

### 2. Login as Admin
```bash
curl -X POST "http://localhost:8000/api/users/public/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@lms.com",
    "password": "Admin123!",
    "role": "admin"
  }'
```

### 3. Access the Application
- **Frontend**: http://localhost:3000
- **API Docs**: http://localhost:8000/docs
- **API Health**: http://localhost:8000/health

## 📊 API Documentation

Comprehensive API documentation is available at `/docs` when the server is running. Key endpoints include:

### Authentication
- `POST /api/users/public/login` - Universal login
- `POST /api/users/public/create-admin` - Initial admin setup

### Admin Operations
- `POST /api/users/schools` - Create school
- `POST /api/users/subadmins` - Create subadmin

### Subadmin Operations
- `POST /api/users/schools/{school_id}/subjects` - Create subjects
- `POST /api/users/schools/{school_id}/classes` - Create classes
- `POST /api/users/classes/{class_id}/subjects` - Add subjects to classes
- `POST /api/users/class-subjects/{id}/teachers` - Assign teachers

For detailed API usage, see [API_TESTING_GUIDE.md](API_TESTING_GUIDE.md)

## 🏫 User Roles & Permissions

### Admin
- Create/manage schools and subadmins
- System-wide access and configuration

### Subadmin (School Admin)
- Manage school's subjects, classes, teachers, students
- Create academic sessions and handle student promotion
- Oversee school operations within their assigned school

### Teacher
- View assigned classes and subjects
- Access teaching workload and schedule
- Manage assignments and student progress

### Student
- View enrolled subjects and grades
- Track attendance and academic performance
- Access class information and teacher details

### Principle
- School-wide analytics and reporting
- Department performance monitoring
- Administrative oversight

### Parent
- Monitor children's academic progress
- View grades, attendance, and school notices
- Access guardian-specific information

## 🔒 Security Features

- **JWT Authentication** with configurable expiration
- **Role-based Access Control** with granular permissions
- **School Data Isolation** - users only access their school data
- **Soft Delete** - data preservation with deactivation
- **Password Hashing** - Bcrypt encryption
- **Input Validation** - Comprehensive Pydantic schemas

## 🗂️ Project Structure

```
├── backend/
│   ├── app/
│   │   ├── api/           # Route definitions
│   │   ├── config/        # Database and app configuration
│   │   ├── core/          # Core utilities (auth, hashing, etc.)
│   │   ├── models/        # SQLAlchemy models
│   │   ├── schemas/       # Pydantic schemas
│   │   └── services/      # Business logic
│   ├── requirements.txt
│   └── venv/
├── frontend/
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── context/       # React context providers
│   │   ├── pages/         # Page components by role
│   │   └── services/      # API service functions
│   ├── package.json
│   └── public/
├── API_TESTING_GUIDE.md   # Comprehensive API documentation
├── ARCHITECTURE.md        # System architecture overview
└── README.md             # This file
```

## 🚀 Deployment

### Production Considerations
- Set `orm.configure_mappers()` in production startup
- Use environment variables for sensitive configuration
- Implement proper CORS settings for production domains
- Set up database connection pooling
- Configure proper logging and monitoring

### Docker Support
The application is designed to be containerizable. Add Dockerfile configurations for both backend and frontend.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes with proper testing
4. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For issues and questions:
1. Check the API documentation at `/docs`
2. Review the testing guide in `API_TESTING_GUIDE.md`
3. Check the architecture documentation in `ARCHITECTURE.md`

---

**Built with ❤️ for modern educational institutions**
