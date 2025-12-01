import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Button,
  Tabs,
  Tab,
  Box,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  IconButton,
  Tooltip,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  School as SchoolIcon,
  Subject as SubjectIcon,
  Class as ClassIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  Group as GroupIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Logout as LogoutIcon,
  Visibility as VisibilityIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { subadminService } from '../../services/subadminService';

const SubadminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Data states
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [principles, setPrinciples] = useState([]);
  const [schoolInfo, setSchoolInfo] = useState(null);
  const [classSubjects, setClassSubjects] = useState({}); // { classId: [subjects] }
  const [viewClassSubjectsDialog, setViewClassSubjectsDialog] = useState({ open: false, classId: null, className: '' });
  const [classDetailsDialog, setClassDetailsDialog] = useState({ open: false, classItem: null, subjects: [], loading: false });
  const [assignTeacherDialog, setAssignTeacherDialog] = useState({ open: false, classSubject: null, classId: null });
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [teacherFilterType, setTeacherFilterType] = useState('all'); // 'all', 'subject', 'specialization', 'class'
  const [selectedFilterSubject, setSelectedFilterSubject] = useState('');
  const [selectedFilterSpecialization, setSelectedFilterSpecialization] = useState('');
  const [selectedFilterClass, setSelectedFilterClass] = useState('');
  const [classTeachersMap, setClassTeachersMap] = useState({}); // { classId: [teacherIds] }

  // Dialog states
  const [subjectDialog, setSubjectDialog] = useState({ open: false, mode: 'create', subject: null });
  const [classDialog, setClassDialog] = useState({ open: false, mode: 'create', classItem: null });
  const [sessionDialog, setSessionDialog] = useState({ open: false });
  const [addSubjectToClassDialog, setAddSubjectToClassDialog] = useState({ open: false, classId: null, className: '' });
  const [editClassSubjectDialog, setEditClassSubjectDialog] = useState({ open: false, classSubject: null, classId: null });
  const [principleDialog, setPrincipleDialog] = useState({ open: false, mode: 'create', principle: null });
  const [principleDetailsDialog, setPrincipleDetailsDialog] = useState({ open: false, principle: null });

  // Form data
  const [subjectForm, setSubjectForm] = useState({ name: '', code: '', description: '' });
  const [classForm, setClassForm] = useState({
    name: '',
    grade_level: '',
    section: '',
    capacity: '',
    academic_session: ''
  });
  const [classSubjectForm, setClassSubjectForm] = useState({
    subject_id: '',
    is_compulsory: true,
    credits: null
  });
  const [editClassSubjectForm, setEditClassSubjectForm] = useState({
    is_compulsory: true,
    credits: null
  });
  const [teacherDialog, setTeacherDialog] = useState({ open: false, mode: 'create', teacher: null });
  const [teacherForm, setTeacherForm] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
    qualification: '',
    experience_years: '',
    specialization: '',
    subjects: [],
    address: {
      street: '',
      city: '',
      state: '',
      country: '',
      postal_code: ''
    }
  });
  const [selectedSubjectIds, setSelectedSubjectIds] = useState([]);
  const [studentDialog, setStudentDialog] = useState({ open: false, mode: 'create', student: null });
  const [studentDetailsDialog, setStudentDetailsDialog] = useState({ open: false, student: null });
  const [classStudentsDialog, setClassStudentsDialog] = useState({ open: false, classId: null, students: [] });
  const [teacherDetailsDialog, setTeacherDetailsDialog] = useState({ open: false, teacher: null });
  const [studentForm, setStudentForm] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      country: '',
      postal_code: ''
    },
    roll_number: '',
    date_of_birth: '',
    gender: '',
    blood_group: '',
    class_id: '',
    admission_date: '',
    guardian_name: '',
    guardian_phone: '',
    guardian_relation: '',
    subjects: []
  });
  const [sessionForm, setSessionForm] = useState({
    name: '',
    start_date: '',
    end_date: '',
    term_count: 2,
    is_current: false
  });
  const [principleForm, setPrincipleForm] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
    qualification: '',
    experience_years: '',
    specialization: '',
    designation: '',
    office_phone: '',
    office_email: '',
    address: {
      street: '',
      city: '',
      state: '',
      country: '',
      postal_code: ''
    }
  });

  useEffect(() => {
    loadData();
  }, []);

  // Load class teachers when class filter is selected
  useEffect(() => {
    const loadClassTeachers = async () => {
      if (teacherFilterType === 'class' && selectedFilterClass) {
        try {
          const subjects = await subadminService.getClassSubjects(selectedFilterClass);
          // Extract unique teacher IDs from all subjects' teachers
          const teacherIds = new Set();
          subjects.forEach(subject => {
            if (subject.teachers && subject.teachers.length > 0) {
              subject.teachers.forEach(teacher => {
                const teacherId = teacher.teacher_id || teacher.teacher?.id;
                if (teacherId) {
                  teacherIds.add(teacherId);
                }
              });
            }
          });
          setClassTeachersMap(prev => ({
            ...prev,
            [selectedFilterClass]: Array.from(teacherIds)
          }));
        } catch (err) {
          console.error('Failed to load class teachers:', err);
          setClassTeachersMap(prev => ({
            ...prev,
            [selectedFilterClass]: []
          }));
        }
      }
    };
    loadClassTeachers();
  }, [selectedFilterClass, teacherFilterType]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [subjectsData, classesData, sessionsData, teachersData, studentsData] = await Promise.all([
        subadminService.getSubjects(user.school_id),
        subadminService.getClasses(user.school_id, true), // Include student count
        subadminService.getSessions(user.school_id),
        subadminService.getTeachers(user.school_id),
        subadminService.getStudents(user.school_id)
      ]);

      setSubjects(subjectsData);
      setClasses(classesData);
      setSessions(sessionsData);
      setTeachers(teachersData);
      setStudents(studentsData);
      
      // Load school info if available
      if (user.school_id) {
        try {
          const schoolData = await subadminService.getSchool(user.school_id);
          setSchoolInfo(schoolData);
          // console.log(schoolInfo);
        } catch (err) {
          console.error('Failed to load school info:', err);
        }
      }
    } catch (err) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadClassSubjects = async (classId) => {
    try {
      const subjects = await subadminService.getClassSubjects(classId);
      setClassSubjects(prev => ({ ...prev, [classId]: subjects }));
      return subjects;
    } catch (err) {
      setError('Failed to load class subjects');
      return [];
    }
  };

  const handleViewClassDetails = async (classItem) => {
    setClassDetailsDialog({ open: true, classItem, subjects: [], loading: true });
    try {
      const subjects = await loadClassSubjects(classItem.id);
      setClassDetailsDialog({ open: true, classItem, subjects, loading: false });
    } catch (err) {
      setError('Failed to load class details');
      setClassDetailsDialog({ open: true, classItem, subjects: [], loading: false });
    }
  };

  const handleAssignTeacherToSubject = async () => {
    if (!selectedTeacherId || !assignTeacherDialog.classSubject) {
      setError('Please select a teacher');
      return;
    }
    try {
      // Get the academic year from class or use current year
      const academicYear = classDetailsDialog.classItem?.academic_session || 
                          classDetailsDialog.classItem?.academic_year || 
                          new Date().getFullYear().toString();
      
      await subadminService.assignTeacherToSubject(assignTeacherDialog.classSubject.id, {
        teacher_id: selectedTeacherId,
        academic_year: academicYear
      });
      setSuccess('Teacher assigned successfully');
      setAssignTeacherDialog({ open: false, classSubject: null, classId: null });
      setSelectedTeacherId('');
      // Reload class details
      if (classDetailsDialog.classItem) {
        const subjects = await loadClassSubjects(classDetailsDialog.classItem.id);
        setClassDetailsDialog({ ...classDetailsDialog, subjects });
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to assign teacher');
    }
  };

  const handleRemoveTeacherFromSubject = async (assignmentId, classSubjectId) => {
    if (window.confirm('Are you sure you want to remove this teacher from the subject?')) {
      try {
        await subadminService.removeTeacherFromSubject(assignmentId);
        setSuccess('Teacher removed successfully');
        // Reload class details
        if (classDetailsDialog.classItem) {
          const subjects = await loadClassSubjects(classDetailsDialog.classItem.id);
          setClassDetailsDialog({ ...classDetailsDialog, subjects });
        }
      } catch (err) {
        setError(err.response?.data?.detail || 'Failed to remove teacher');
      }
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Subject handlers
  const handleCreateSubject = async () => {
    try {
      await subadminService.createSubject(user.school_id, subjectForm);
      setSuccess('Subject created successfully');
      setSubjectDialog({ open: false, mode: 'create', subject: null });
      setSubjectForm({ name: '', code: '', description: '' });
      loadData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create subject');
    }
  };

  const handleEditSubject = (subject) => {
    setSubjectForm({
      name: subject.name,
      code: subject.code,
      description: subject.description || ''
    });
    setSubjectDialog({ open: true, mode: 'edit', subject });
  };

  const handleUpdateSubject = async () => {
    try {
      await subadminService.updateSubject(user.school_id, subjectDialog.subject.id, subjectForm);
      setSuccess('Subject updated successfully');
      setSubjectDialog({ open: false, mode: 'create', subject: null });
      setSubjectForm({ name: '', code: '', description: '' });
      loadData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update subject');
    }
  };

  const handleDeleteSubject = async (subjectId) => {
    if (window.confirm('Are you sure you want to delete this subject?')) {
      try {
        await subadminService.deleteSubject(user.school_id, subjectId);
        setSuccess('Subject deleted successfully');
        loadData();
      } catch (err) {
        setError(err.response?.data?.detail || 'Failed to delete subject');
      }
    }
  };

  // Class handlers
  const handleCreateClass = async () => {
    try {
      await subadminService.createClass(user.school_id, classForm);
      setSuccess('Class created successfully');
      setClassDialog({ open: false, mode: 'create', classItem: null });
      setClassForm({ name: '', grade_level: '', section: '', capacity: '', academic_session: '' });
      loadData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create class');
    }
  };

  const handleEditClass = (classItem) => {
    setClassForm({
      name: classItem.name,
      grade_level: classItem.grade_level,
      section: classItem.section,
      capacity: classItem.capacity || '',
      academic_session: classItem.academic_session || classItem.academic_year || ''
    });
    setClassDialog({ open: true, mode: 'edit', classItem });
  };

  const handleUpdateClass = async () => {
    try {
      await subadminService.updateClass(user.school_id, classDialog.classItem.id, classForm);
      setSuccess('Class updated successfully');
      setClassDialog({ open: false, mode: 'create', classItem: null });
      setClassForm({ name: '', grade_level: '', section: '', capacity: '', academic_session: '' });
      loadData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update class');
    }
  };

  const handleDeleteClass = async (classId) => {
    if (window.confirm('Are you sure you want to delete this class?')) {
      try {
        await subadminService.deleteClass(user.school_id, classId);
        setSuccess('Class deleted successfully');
        loadData();
      } catch (err) {
        setError(err.response?.data?.detail || 'Failed to delete class');
      }
    }
  };

  const handleAddSubjectToClass = async () => {
    try {
      const classId = addSubjectToClassDialog.classId;
      await subadminService.addSubjectToClass(classId, classSubjectForm);
      setSuccess('Subject added to class successfully');
      // Reload class subjects for this class to update the filter
      await loadClassSubjects(classId);
      setAddSubjectToClassDialog({ open: false, classId: null, className: '' });
      setClassSubjectForm({ subject_id: '', is_compulsory: true, credits: null });
      loadData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to add subject to class');
    }
  };

  const handleViewClassSubjects = async (classId, className) => {
    await loadClassSubjects(classId);
    setViewClassSubjectsDialog({ open: true, classId, className });
  };

  const handleOpenAddSubjectDialog = async (classId, className) => {
    // Load current class subjects to filter them out
    const currentSubjects = await loadClassSubjects(classId);
    setAddSubjectToClassDialog({ open: true, classId, className });
    setClassSubjectForm({ subject_id: '', is_compulsory: true, credits: null });
  };

  const handleRemoveSubjectFromClass = async (classSubjectId, classId) => {
    if (window.confirm('Are you sure you want to remove this subject from the class?')) {
      try {
        await subadminService.removeSubjectFromClass(classSubjectId);
        setSuccess('Subject removed from class successfully');
        // Reload class subjects to update the list
        await loadClassSubjects(classId);
      } catch (err) {
        setError(err.response?.data?.detail || 'Failed to remove subject from class');
      }
    }
  };

  const handleEditClassSubject = (classSubject) => {
    setEditClassSubjectForm({
      is_compulsory: classSubject.is_compulsory !== undefined ? classSubject.is_compulsory : true,
      credits: classSubject.credits || null
    });
    setEditClassSubjectDialog({ open: true, classSubject, classId: viewClassSubjectsDialog.classId });
  };

  const handleUpdateClassSubject = async () => {
    try {
      await subadminService.updateClassSubject(editClassSubjectDialog.classSubject.id, editClassSubjectForm);
      setSuccess('Class subject updated successfully');
      setEditClassSubjectDialog({ open: false, classSubject: null, classId: null });
      // Reload class subjects to update the list
      await loadClassSubjects(editClassSubjectDialog.classId);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update class subject');
    }
  };

  // Teacher handlers
  const handleCreateTeacher = async () => {
    try {
      const teacherData = {
        email: teacherForm.email,
        password: teacherForm.password,
        name: teacherForm.name,
        phone: teacherForm.phone,
        qualification: teacherForm.qualification,
        experience_years: teacherForm.experience_years ? parseInt(teacherForm.experience_years) : null,
        specialization: teacherForm.specialization,
        subjects: selectedSubjectIds.map(subjectId => ({
          subject_id: subjectId,
          is_primary: false,
          experience_years: null
        })),
        address: (teacherForm.address?.street || teacherForm.address?.city || teacherForm.address?.state || teacherForm.address?.country || teacherForm.address?.postal_code)
          ? {
              street: teacherForm.address?.street || null,
              city: teacherForm.address?.city || null,
              state: teacherForm.address?.state || null,
              country: teacherForm.address?.country || null,
              postal_code: teacherForm.address?.postal_code || null
            }
          : null
      };
      await subadminService.createTeacher(user.school_id, teacherData);
      setSuccess('Teacher created successfully');
      setTeacherDialog({ open: false, mode: 'create', teacher: null });
      setTeacherForm({
        email: '',
        password: '',
        name: '',
        phone: '',
        qualification: '',
        experience_years: '',
        specialization: '',
        subjects: [],
        address: {
          street: '',
          city: '',
          state: '',
          country: '',
          postal_code: ''
        }
      });
      setSelectedSubjectIds([]);
      loadData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create teacher');
    }
  };

  const handleEditTeacher = (teacher) => {
    setTeacherForm({
      email: teacher.user?.email || teacher.email || '',
      password: '',
      name: teacher.user?.name || teacher.name || '',
      phone: teacher.user?.phone || teacher.phone || '',
      qualification: teacher.qualification || '',
      experience_years: teacher.experience_years || '',
      specialization: teacher.specialization || '',
      subjects: teacher.subjects || [],
      address: {
        street: teacher.user?.address?.street || '',
        city: teacher.user?.address?.city || '',
        state: teacher.user?.address?.state || '',
        country: teacher.user?.address?.country || '',
        postal_code: teacher.user?.address?.postal_code || ''
      }
    });
    setSelectedSubjectIds(teacher.subjects?.map(s => s.subject_id || s.subject?.id) || []);
    setTeacherDialog({ open: true, mode: 'edit', teacher });
  };

  const handleUpdateTeacher = async () => {
    try {
      const updateData = {
        name: teacherForm.name,
        email: teacherForm.email,
        phone: teacherForm.phone,
        qualification: teacherForm.qualification,
        experience_years: teacherForm.experience_years ? parseInt(teacherForm.experience_years) : null,
        specialization: teacherForm.specialization,
        subjects: selectedSubjectIds.map(subjectId => ({
          subject_id: subjectId,
          is_primary: false,
          experience_years: null
        })),
        address: (teacherForm.address?.street || teacherForm.address?.city || teacherForm.address?.state || teacherForm.address?.country || teacherForm.address?.postal_code)
          ? {
              street: teacherForm.address?.street || null,
              city: teacherForm.address?.city || null,
              state: teacherForm.address?.state || null,
              country: teacherForm.address?.country || null,
              postal_code: teacherForm.address?.postal_code || null
            }
          : null
      };
      await subadminService.updateTeacher(teacherDialog.teacher.id, updateData);
      setSuccess('Teacher updated successfully');
      setTeacherDialog({ open: false, mode: 'create', teacher: null });
      setTeacherForm({
        email: '',
        password: '',
        name: '',
        phone: '',
        qualification: '',
        experience_years: '',
        specialization: '',
        subjects: [],
        address: {
          street: '',
          city: '',
          state: '',
          country: '',
          postal_code: ''
        }
      });
      setSelectedSubjectIds([]);
      loadData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update teacher');
    }
  };

  const handleDeleteTeacher = async (teacherId) => {
    if (window.confirm('Are you sure you want to delete this teacher?')) {
      try {
        await subadminService.deleteTeacher(teacherId);
        setSuccess('Teacher deleted successfully');
        loadData();
      } catch (err) {
        setError(err.response?.data?.detail || 'Failed to delete teacher');
      }
    }
  };

  // Principle handlers
  const handleCreatePrinciple = async () => {
    try {
      const principleData = {
        email: principleForm.email,
        password: principleForm.password,
        name: principleForm.name,
        phone: principleForm.phone || null,
        qualification: principleForm.qualification || null,
        experience_years: principleForm.experience_years ? parseInt(principleForm.experience_years) : null,
        specialization: principleForm.specialization || null,
        designation: principleForm.designation || null,
        office_phone: principleForm.office_phone || null,
        office_email: principleForm.office_email || null,
        address: (principleForm.address?.street || principleForm.address?.city || principleForm.address?.state || principleForm.address?.country || principleForm.address?.postal_code)
          ? {
              street: principleForm.address?.street || null,
              city: principleForm.address?.city || null,
              state: principleForm.address?.state || null,
              country: principleForm.address?.country || null,
              postal_code: principleForm.address?.postal_code || null
            }
          : null
      };
      await subadminService.createPrinciple(user.school_id, principleData);
      setSuccess('Principle created successfully');
      setPrincipleDialog({ open: false, mode: 'create', principle: null });
      setPrincipleForm({
        email: '',
        password: '',
        name: '',
        phone: '',
        qualification: '',
        experience_years: '',
        specialization: '',
        designation: '',
        office_phone: '',
        office_email: '',
        address: {
          street: '',
          city: '',
          state: '',
          country: '',
          postal_code: ''
        }
      });
      loadData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create principle');
    }
  };

  const handleEditPrinciple = (principle) => {
    setPrincipleForm({
      email: principle.user?.email || principle.email || '',
      password: '',
      name: principle.user?.name || principle.name || '',
      phone: principle.user?.phone || principle.phone || '',
      qualification: principle.qualification || '',
      experience_years: principle.experience_years || '',
      specialization: principle.specialization || '',
      designation: principle.designation || '',
      office_phone: principle.office_phone || '',
      office_email: principle.office_email || '',
      address: {
        street: principle.user?.address?.street || '',
        city: principle.user?.address?.city || '',
        state: principle.user?.address?.state || '',
        country: principle.user?.address?.country || '',
        postal_code: principle.user?.address?.postal_code || ''
      }
    });
    setPrincipleDialog({ open: true, mode: 'edit', principle });
  };

  const handleUpdatePrinciple = async () => {
    try {
      const updateData = {
        name: principleForm.name,
        email: principleForm.email,
        phone: principleForm.phone,
        qualification: principleForm.qualification || null,
        experience_years: principleForm.experience_years ? parseInt(principleForm.experience_years) : null,
        specialization: principleForm.specialization || null,
        designation: principleForm.designation || null,
        office_phone: principleForm.office_phone || null,
        office_email: principleForm.office_email || null,
        address: (principleForm.address?.street || principleForm.address?.city || principleForm.address?.state || principleForm.address?.country || principleForm.address?.postal_code)
          ? {
              street: principleForm.address?.street || null,
              city: principleForm.address?.city || null,
              state: principleForm.address?.state || null,
              country: principleForm.address?.country || null,
              postal_code: principleForm.address?.postal_code || null
            }
          : null
      };
      await subadminService.updatePrinciple(principleDialog.principle.id, updateData);
      setSuccess('Principle updated successfully');
      setPrincipleDialog({ open: false, mode: 'create', principle: null });
      setPrincipleForm({
        email: '',
        password: '',
        name: '',
        phone: '',
        qualification: '',
        experience_years: '',
        specialization: '',
        designation: '',
        office_phone: '',
        office_email: '',
        address: {
          street: '',
          city: '',
          state: '',
          country: '',
          postal_code: ''
        }
      });
      loadData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update principle');
    }
  };

  const handleDeletePrinciple = async (principleId) => {
    if (window.confirm('Are you sure you want to delete this principle?')) {
      try {
        await subadminService.deletePrinciple(principleId);
        setSuccess('Principle deleted successfully');
        loadData();
      } catch (err) {
        setError(err.response?.data?.detail || 'Failed to delete principle');
      }
    }
  };

  const handleViewPrincipleDetails = (principle) => {
    setPrincipleDetailsDialog({ open: true, principle });
  };

  // Student handlers
  const handleClassChange = (classId) => {
    const selectedClass = classes.find(c => c.id === classId);
    if (selectedClass && studentDialog.mode === 'create') {
      // Auto-generate roll number based on current student count
      const currentStudentCount = selectedClass.student_count || 0;
      const capacity = selectedClass.capacity || 0;
      const nextRollNumber = currentStudentCount + 1;
      
      // Only allow if class has capacity
      if (capacity > currentStudentCount) {
        setStudentForm({ ...studentForm, class_id: classId, roll_number: nextRollNumber.toString() });
      } else {
        setError('Selected class is full. Please choose another class.');
        setStudentForm({ ...studentForm, class_id: '' });
      }
    } else {
      setStudentForm({ ...studentForm, class_id: classId });
    }
  };

  const handleCreateStudent = async () => {
    try {
      const studentData = {
        ...studentForm,
        subjects: [] // Can be extended later
      };
      await subadminService.createStudent(user.school_id, studentData);
      setSuccess('Student created successfully');
      setStudentDialog({ open: false, mode: 'create', student: null });
      setStudentForm({
        email: '',
        password: '',
        name: '',
        phone: '',
        roll_number: '',
        date_of_birth: '',
        gender: '',
        blood_group: '',
        class_id: '',
        admission_date: '',
        guardian_name: '',
        guardian_phone: '',
        guardian_relation: '',
        subjects: []
      });
      loadData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create student');
    }
  };

  const handleEditStudent = (student) => {
    // Parse address if available
    let addressObj = {
      street: '',
      city: '',
      state: '',
      country: '',
      postal_code: ''
    };
    
    if (student.user?.address) {
      if (typeof student.user.address === 'object') {
        addressObj = {
          street: student.user.address.street || '',
          city: student.user.address.city || '',
          state: student.user.address.state || '',
          country: student.user.address.country || '',
          postal_code: student.user.address.postal_code || ''
        };
      }
    }
    
    setStudentForm({
      email: student.user?.email || '',
      password: '',
      name: student.user?.name || '',
      phone: student.user?.phone || '',
      address: addressObj,
      roll_number: student.roll_number || '',
      date_of_birth: student.date_of_birth ? new Date(student.date_of_birth).toISOString().split('T')[0] : '',
      gender: student.gender || '',
      blood_group: student.blood_group || '',
      class_id: student.class_id || '',
      admission_date: student.admission_date ? new Date(student.admission_date).toISOString().split('T')[0] : '',
      guardian_name: student.guardian_name || '',
      guardian_phone: student.guardian_phone || '',
      guardian_relation: student.guardian_relation || '',
      subjects: student.subjects || []
    });
    setStudentDialog({ open: true, mode: 'edit', student });
  };

  const handleUpdateStudent = async () => {
    try {
      const updateData = {
        name: studentForm.name,
        email: studentForm.email,
        phone: studentForm.phone,
        address: studentForm.address.street || studentForm.address.city ? studentForm.address : null,
        roll_number: studentForm.roll_number,
        date_of_birth: studentForm.date_of_birth ? new Date(studentForm.date_of_birth).toISOString() : null,
        gender: studentForm.gender,
        blood_group: studentForm.blood_group,
        class_id: studentForm.class_id,
        admission_date: studentForm.admission_date ? new Date(studentForm.admission_date).toISOString() : null,
        guardian_name: studentForm.guardian_name,
        guardian_phone: studentForm.guardian_phone,
        guardian_relation: studentForm.guardian_relation,
        subjects: []
      };
      await subadminService.updateStudent(studentDialog.student.id, updateData);
      setSuccess('Student updated successfully');
      setStudentDialog({ open: false, mode: 'create', student: null });
      setStudentForm({
        email: '',
        password: '',
        name: '',
        phone: '',
        address: {
          street: '',
          city: '',
          state: '',
          country: '',
          postal_code: ''
        },
        roll_number: '',
        date_of_birth: '',
        gender: '',
        blood_group: '',
        class_id: '',
        admission_date: '',
        guardian_name: '',
        guardian_phone: '',
        guardian_relation: '',
        subjects: []
      });
      loadData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update student');
    }
  };

  const handleToggleStudentStatus = async (student) => {
    try {
      const userId = student.user_id || student.user?.id;
      if (!userId) {
        setError('Unable to find user ID for student');
        return;
      }
      // Determine current status - prioritize user.is_active if available, otherwise check student.is_active
      const userIsActive = student.user?.is_active;
      const studentIsActive = student.is_active;
      
      // If user.is_active is explicitly set (true or false), use it; otherwise check student.is_active
      const isCurrentlyActive = userIsActive !== undefined 
        ? userIsActive === true 
        : (studentIsActive !== undefined ? studentIsActive === true : true); // Default to true if both undefined
      
      const newStatus = !isCurrentlyActive;
      console.log('Toggling student status:', { userId, isCurrentlyActive, newStatus, userIsActive, studentIsActive });
      
      await subadminService.activateDeactivateUser(userId, newStatus);
      setSuccess(`Student ${newStatus ? 'activated' : 'deactivated'} successfully`);
      loadData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update student status');
      console.error('Toggle student status error:', err);
    }
  };

  const handleDeleteStudent = async (studentId) => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      try {
        await subadminService.deleteStudent(studentId);
        setSuccess('Student deleted successfully');
        loadData();
      } catch (err) {
        setError(err.response?.data?.detail || 'Failed to delete student');
      }
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Session handlers
  const handleCreateSession = async () => {
    try {
      await subadminService.createSession(user.school_id, sessionForm);
      setSuccess('Academic session created successfully');
      setSessionDialog({ open: false });
      setSessionForm({ name: '', start_date: '', end_date: '', term_count: 2, is_current: false });
      loadData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create session');
    }
  };

  const handleSetCurrentSession = async (sessionId) => {
    try {
      await subadminService.setCurrentSession(user.school_id, sessionId);
      setSuccess('Current session updated successfully');
      loadData();
    } catch (err) {
      setError('Failed to update current session');
    }
  };

  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  const renderSubjectsTab = () => (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6">Subjects Management</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setSubjectForm({ name: '', code: '', description: '' });
            setSubjectDialog({ open: true, mode: 'create', subject: null });
          }}
        >
          Add Subject
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Subject Name</TableCell>
              <TableCell>Code</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {subjects.map((subject) => (
              <TableRow key={subject.id}>
                <TableCell>{subject.name}</TableCell>
                <TableCell>{subject.code}</TableCell>
                <TableCell>{subject.description}</TableCell>
                <TableCell>
                  <Chip
                    label={subject.is_active ? 'Active' : 'Inactive'}
                    color={subject.is_active ? 'success' : 'error'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Tooltip title="Edit Subject">
                    <IconButton
                      color="primary"
                      size="small"
                      onClick={() => handleEditSubject(subject)}
                    >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete Subject">
                    <IconButton
                      color="error"
                      size="small"
                      onClick={() => handleDeleteSubject(subject.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  const renderTeachersTab = () => {
    // Filter teachers based on selected filter
    const filteredTeachers = teachers.filter(teacher => {
      if (teacherFilterType === 'all') {
        return true;
      } else if (teacherFilterType === 'subject') {
        if (!selectedFilterSubject) return true;
        return teacher.subjects && teacher.subjects.some(subject => 
          (subject.subject_id || subject.subject?.id) === selectedFilterSubject
        );
      } else if (teacherFilterType === 'specialization') {
        if (!selectedFilterSpecialization) return true;
        return teacher.specialization && 
               teacher.specialization.toLowerCase().includes(selectedFilterSpecialization.toLowerCase());
      } else if (teacherFilterType === 'class') {
        if (!selectedFilterClass) return true;
        const classTeacherIds = classTeachersMap[selectedFilterClass] || [];
        return classTeacherIds.includes(teacher.id);
      }
      return true;
    });

    // Get unique specializations from teachers
    const specializations = [...new Set(teachers
      .map(t => t.specialization)
      .filter(s => s && s.trim() !== '')
    )].sort();

    return (
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h6">Teachers Management</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setTeacherForm({
                email: '',
                password: '',
                name: '',
                phone: '',
                qualification: '',
                experience_years: '',
                specialization: '',
                subjects: [],
                address: {
                  street: '',
                  city: '',
                  state: '',
                  country: '',
                  postal_code: ''
                }
              });
              setSelectedSubjectIds([]);
              setTeacherDialog({ open: true, mode: 'create', teacher: null });
            }}
          >
            Add Teacher
          </Button>
        </Box>

        {/* Filter Section */}
        <Box display="flex" gap={2} mb={3} flexWrap="wrap" alignItems="center">
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Filter By</InputLabel>
            <Select
              value={teacherFilterType}
              label="Filter By"
              onChange={(e) => {
                setTeacherFilterType(e.target.value);
                setSelectedFilterSubject('');
                setSelectedFilterSpecialization('');
                setSelectedFilterClass('');
              }}
            >
              <MenuItem value="all">All Teachers</MenuItem>
              <MenuItem value="subject">By Subject</MenuItem>
              <MenuItem value="specialization">By Specialization</MenuItem>
              <MenuItem value="class">By Class</MenuItem>
            </Select>
          </FormControl>

          {teacherFilterType === 'subject' && (
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Select Subject</InputLabel>
              <Select
                value={selectedFilterSubject}
                label="Select Subject"
                onChange={(e) => setSelectedFilterSubject(e.target.value)}
              >
                <MenuItem value="">All Subjects</MenuItem>
                {subjects.map((subject) => (
                  <MenuItem key={subject.id} value={subject.id}>
                    {subject.name} ({subject.code})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {teacherFilterType === 'specialization' && (
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Select Specialization</InputLabel>
              <Select
                value={selectedFilterSpecialization}
                label="Select Specialization"
                onChange={(e) => setSelectedFilterSpecialization(e.target.value)}
              >
                <MenuItem value="">All Specializations</MenuItem>
                {specializations.map((spec, index) => (
                  <MenuItem key={index} value={spec}>
                    {spec}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {teacherFilterType === 'class' && (
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Select Class</InputLabel>
              <Select
                value={selectedFilterClass}
                label="Select Class"
                onChange={(e) => setSelectedFilterClass(e.target.value)}
              >
                <MenuItem value="">All Classes</MenuItem>
                {classes.map((classItem) => (
                  <MenuItem key={classItem.id} value={classItem.id}>
                    {classItem.name} ({classItem.section})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {teacherFilterType !== 'all' && (
            <Chip
              label={`Showing ${filteredTeachers.length} teacher(s)`}
              color="primary"
              size="small"
            />
          )}
        </Box>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Qualification</TableCell>
                <TableCell>Experience</TableCell>
                <TableCell>Specialization</TableCell>
                <TableCell>Subjects</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredTeachers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                    <Typography variant="body2" color="text.secondary">
                      {teacherFilterType === 'all' 
                        ? 'No teachers found' 
                        : teacherFilterType === 'subject'
                        ? 'No teachers found for the selected subject'
                        : teacherFilterType === 'specialization'
                        ? 'No teachers found with the selected specialization'
                        : 'No teachers found for the selected class'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredTeachers.map((teacher) => (
                  <TableRow 
                    key={teacher.id}
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => setTeacherDetailsDialog({ open: true, teacher })}
                  >
                    <TableCell>{teacher?.name || 'N/A'}</TableCell>
                    <TableCell>{teacher?.email || 'N/A'}</TableCell>
                    <TableCell>{teacher?.phone || 'N/A'}</TableCell>
                    <TableCell>{teacher.qualification || 'N/A'}</TableCell>
                    <TableCell>{teacher.experience_years ? `${teacher.experience_years} years` : 'N/A'}</TableCell>
                    <TableCell>{teacher.specialization || 'N/A'}</TableCell>
                    <TableCell>
                      {teacher.subjects && teacher.subjects.length > 0 ? (
                        <Chip
                          label={`${teacher.subjects.length} subject(s)`}
                          size="small"
                          color="primary"
                        />
                      ) : (
                        'No subjects'
                      )}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Tooltip title="Edit Teacher">
                        <IconButton
                          color="primary"
                          size="small"
                          onClick={() => handleEditTeacher(teacher)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Teacher">
                        <IconButton
                          color="error"
                          size="small"
                          onClick={() => handleDeleteTeacher(teacher.id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    );
  };

  const renderStudentsTab = () => (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6">Students Management</Typography>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<GroupIcon />}
            onClick={() => setClassStudentsDialog({ open: true, classId: null, students: [] })}
          >
            View Class Students
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
            setStudentForm({
              email: '',
              password: '',
              name: '',
              phone: '',
              address: {
                street: '',
                city: '',
                state: '',
                country: '',
                postal_code: ''
              },
              roll_number: '',
              date_of_birth: '',
              gender: '',
              blood_group: '',
              class_id: '',
              admission_date: '',
              guardian_name: '',
              guardian_phone: '',
              guardian_relation: '',
              subjects: []
            });
            setStudentDialog({ open: true, mode: 'create', student: null });
          }}
        >
          Add Student
        </Button>
        </Box>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Roll Number</TableCell>
              <TableCell>Class</TableCell>
              <TableCell>Gender</TableCell>
              <TableCell>Date of Birth</TableCell>
              <TableCell>Guardian Name</TableCell>
              <TableCell>Guardian Phone</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {students.map((student) => (
              <TableRow 
                key={student.id}
                hover
                onClick={() => setStudentDetailsDialog({ open: true, student })}
                sx={{ cursor: 'pointer' }}
              >
                <TableCell>{student.user?.name || student.name || 'N/A'}</TableCell>
                <TableCell>{student.user?.email || student.email || 'N/A'}</TableCell>
                <TableCell>{student.roll_number || 'N/A'}</TableCell>
                <TableCell>
                  {student.class_info ? `${student.class_info.name} (${student.class_info.grade_level}-${student.class_info.section})` : 'N/A'}
                </TableCell>
                <TableCell>{student.gender || 'N/A'}</TableCell>
                <TableCell>{student.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString() : 'N/A'}</TableCell>
                <TableCell>{student.guardian_name || 'N/A'}</TableCell>
                <TableCell>{student.guardian_phone || 'N/A'}</TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Tooltip title={student.user?.is_active !== false && student.is_active !== false ? 'Deactivate Student' : 'Activate Student'}>
                    <IconButton
                      color={student.user?.is_active !== false && student.is_active !== false ? 'success' : 'default'}
                      size="small"
                      onClick={() => handleToggleStudentStatus(student)}
                    >
                      {student.user?.is_active !== false && student.is_active !== false ? <CheckCircleIcon /> : <CancelIcon />}
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Edit Student">
                    <IconButton
                      color="primary"
                      size="small"
                      onClick={() => handleEditStudent(student)}
                    >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete Student">
                    <IconButton
                      color="error"
                      size="small"
                      onClick={() => handleDeleteStudent(student.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  const renderClassesTab = () => (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6">Classes Management</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setClassForm({ name: '', grade_level: '', section: '', capacity: '', academic_session: '' });
            setClassDialog({ open: true, mode: 'create', classItem: null });
          }}
        >
          Add Class
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Class Name</TableCell>
              <TableCell>Grade Level</TableCell>
              <TableCell>Section</TableCell>
              <TableCell>Academic Session</TableCell>
              <TableCell>Capacity</TableCell>
              <TableCell>Students</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {classes.map((classItem) => (
              <TableRow 
                key={classItem.id}
                hover
                sx={{ cursor: 'pointer' }}
                onClick={() => handleViewClassDetails(classItem)}
              >
                <TableCell>{classItem.name}</TableCell>
                <TableCell>{classItem.grade_level}</TableCell>
                <TableCell>{classItem.section}</TableCell>
                <TableCell>{classItem.academic_session || classItem.academic_year || 'N/A'}</TableCell>
                <TableCell>{classItem.capacity || 'N/A'}</TableCell>
                <TableCell>{classItem.student_count || classItem.students?.length || 0}</TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Tooltip title="View Subjects">
                    <IconButton
                      color="info"
                      size="small"
                      onClick={() => handleViewClassSubjects(classItem.id, classItem.name)}
                    >
                      <VisibilityIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Add Subjects">
                    <IconButton
                      color="secondary"
                      size="small"
                      onClick={() => handleOpenAddSubjectDialog(classItem.id, classItem.name)}
                    >
                      <SubjectIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Edit Class">
                    <IconButton
                      color="primary"
                      size="small"
                      onClick={() => handleEditClass(classItem)}
                    >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete Class">
                    <IconButton
                      color="error"
                      size="small"
                      onClick={() => handleDeleteClass(classItem.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  const renderPrinciplesTab = () => (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6">Principles Management</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setPrincipleForm({
              email: '',
              password: '',
              name: '',
              phone: '',
              qualification: '',
              experience_years: '',
              specialization: '',
              designation: '',
              office_phone: '',
              office_email: '',
              address: {
                street: '',
                city: '',
                state: '',
                country: '',
                postal_code: ''
              }
            });
            setPrincipleDialog({ open: true, mode: 'create', principle: null });
          }}
        >
          Add Principle
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>Designation</TableCell>
              <TableCell>Qualification</TableCell>
              <TableCell>Experience</TableCell>
              <TableCell>Specialization</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {principles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                    No principles found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              principles.map((principle) => (
                <TableRow key={principle.id}>
                  <TableCell>{principle.name || principle.user?.name || 'N/A'}</TableCell>
                  <TableCell>{principle.email || principle.user?.email || 'N/A'}</TableCell>
                  <TableCell>{principle.phone || principle.user?.phone || 'N/A'}</TableCell>
                  <TableCell>{principle.designation || 'N/A'}</TableCell>
                  <TableCell>{principle.qualification || 'N/A'}</TableCell>
                  <TableCell>{principle.experience_years ? `${principle.experience_years} years` : 'N/A'}</TableCell>
                  <TableCell>{principle.specialization || 'N/A'}</TableCell>
                  <TableCell>
                    <Tooltip title="View Details">
                      <IconButton
                        color="primary"
                        size="small"
                        onClick={() => handleViewPrincipleDetails(principle)}
                      >
                        <VisibilityIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit Principle">
                      <IconButton
                        color="primary"
                        size="small"
                        onClick={() => handleEditPrinciple(principle)}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete Principle">
                      <IconButton
                        color="error"
                        size="small"
                        onClick={() => handleDeletePrinciple(principle.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  const renderSessionsTab = () => (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6">Academic Sessions</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setSessionDialog({ open: true })}
        >
          Add Session
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Session Name</TableCell>
              <TableCell>Start Date</TableCell>
              <TableCell>End Date</TableCell>
              <TableCell>Terms</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sessions.map((session) => (
              <TableRow key={session.id}>
                <TableCell>{session.name}</TableCell>
                <TableCell>{new Date(session.start_date).toLocaleDateString()}</TableCell>
                <TableCell>{new Date(session.end_date).toLocaleDateString()}</TableCell>
                <TableCell>{session.term_count}</TableCell>
                <TableCell>
                  <Chip
                    label={session.is_current ? 'Current' : 'Past'}
                    color={session.is_current ? 'primary' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {!session.is_current && (
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => handleSetCurrentSession(session.id)}
                    >
                      Set Current
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  const renderOverviewTab = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center">
              <SubjectIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">Subjects</Typography>
            </Box>
            <Typography variant="h4">{subjects.length}</Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center">
              <ClassIcon color="secondary" sx={{ mr: 1 }} />
              <Typography variant="h6">Classes</Typography>
            </Box>
            <Typography variant="h4">{classes.length}</Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center">
              <PersonIcon color="success" sx={{ mr: 1 }} />
              <Typography variant="h6">Teachers</Typography>
            </Box>
            <Typography variant="h4">{teachers.length}</Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center">
              <GroupIcon color="warning" sx={{ mr: 1 }} />
              <Typography variant="h6">Students</Typography>
            </Box>
            <Typography variant="h4">{students.length}</Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Box>
          <Typography variant="h4" gutterBottom>
            School Management Dashboard
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" gutterBottom>
            Managing: {schoolInfo?.name || 'School'} ({user?.school_id || 'N/A'})
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Logged in Sub-Admin: {user?.name || 'Subadmin'} ({user?.id || 'N/A'})
          </Typography>
        </Box>
        <Button
          variant="outlined"
          color="error"
          startIcon={<LogoutIcon />}
          onClick={handleLogout}
        >
          Logout
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={clearMessages}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={clearMessages}>{success}</Alert>}

      <Paper sx={{ width: '100%', mb: 2 }}>
        <Tabs value={activeTab} onChange={handleTabChange} aria-label="subadmin dashboard tabs">
          <Tab label="Overview" />
          <Tab label="Subjects" />
          <Tab label="Classes" />
          <Tab label="Teachers" />
          <Tab label="Students" />
          <Tab label="Principles" />
          <Tab label="Sessions" />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {loading ? (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              {activeTab === 0 && renderOverviewTab()}
              {activeTab === 1 && renderSubjectsTab()}
              {activeTab === 2 && renderClassesTab()}
              {activeTab === 3 && renderTeachersTab()}
              {activeTab === 4 && renderStudentsTab()}
              {activeTab === 5 && renderPrinciplesTab()}
              {activeTab === 6 && renderSessionsTab()}
            </>
          )}
        </Box>
      </Paper>

      {/* Subject Dialog */}
      <Dialog open={subjectDialog.open} onClose={() => setSubjectDialog({ open: false, mode: 'create', subject: null })} maxWidth="sm" fullWidth>
        <DialogTitle>{subjectDialog.mode === 'create' ? 'Add New Subject' : 'Edit Subject'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Subject Name"
            fullWidth
            value={subjectForm.name}
            onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Subject Code"
            fullWidth
            value={subjectForm.code}
            onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            multiline
            rows={3}
            value={subjectForm.description}
            onChange={(e) => setSubjectForm({ ...subjectForm, description: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSubjectDialog({ open: false, mode: 'create', subject: null })}>Cancel</Button>
          <Button
            onClick={subjectDialog.mode === 'create' ? handleCreateSubject : handleUpdateSubject}
            variant="contained"
          >
            {subjectDialog.mode === 'create' ? 'Create' : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Class Dialog */}
      <Dialog open={classDialog.open} onClose={() => setClassDialog({ open: false, mode: 'create', classItem: null })} maxWidth="sm" fullWidth>
        <DialogTitle>{classDialog.mode === 'create' ? 'Add New Class' : 'Edit Class'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Class Name"
            fullWidth
            value={classForm.name}
            onChange={(e) => setClassForm({ ...classForm, name: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Grade Level"
            fullWidth
            value={classForm.grade_level}
            onChange={(e) => setClassForm({ ...classForm, grade_level: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Section"
            fullWidth
            value={classForm.section}
            onChange={(e) => setClassForm({ ...classForm, section: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Capacity"
            type="number"
            fullWidth
            value={classForm.capacity}
            onChange={(e) => setClassForm({ ...classForm, capacity: e.target.value })}
          />
          <FormControl fullWidth margin="dense">
            <InputLabel>Academic Session</InputLabel>
            <Select
              value={classForm.academic_session}
              onChange={(e) => setClassForm({ ...classForm, academic_session: e.target.value })}
              required
            >
              {sessions.length === 0 ? (
                <MenuItem disabled>No sessions available. Please create a session first.</MenuItem>
              ) : (
                sessions.map((session) => (
                  <MenuItem key={session.id} value={session.name}>
                    {session.name}
                  </MenuItem>
                ))
              )}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setClassDialog({ open: false, mode: 'create', classItem: null })}>Cancel</Button>
          <Button
            onClick={classDialog.mode === 'create' ? handleCreateClass : handleUpdateClass}
            variant="contained"
          >
            {classDialog.mode === 'create' ? 'Create' : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Class Subjects Dialog */}
      <Dialog open={viewClassSubjectsDialog.open} onClose={() => setViewClassSubjectsDialog({ open: false, classId: null, className: '' })} maxWidth="md" fullWidth>
        <DialogTitle>Subjects in {viewClassSubjectsDialog.className}</DialogTitle>
        <DialogContent>
          {loading ? (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress />
            </Box>
          ) : classSubjects[viewClassSubjectsDialog.classId]?.length > 0 ? (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Subject Name</TableCell>
                    <TableCell>Code</TableCell>
                    <TableCell>Compulsory</TableCell>
                    <TableCell>Credits</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {classSubjects[viewClassSubjectsDialog.classId]?.map((cs) => {
                    // Handle different response structures
                    const subject = cs.subject || {};
                    const subjectName = subject.name || cs.subject_name || 'N/A';
                    const subjectCode = subject.code || cs.subject_code || 'N/A';
                    
                    return (
                      <TableRow key={cs.id}>
                        <TableCell>{subjectName}</TableCell>
                        <TableCell>{subjectCode}</TableCell>
                        <TableCell>
                          <Chip
                            label={cs.is_compulsory ? 'Yes' : 'No'}
                            color={cs.is_compulsory ? 'primary' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{cs.credits || 'N/A'}</TableCell>
                        <TableCell>
                          <Tooltip title="Edit Subject">
                            <IconButton
                              color="primary"
                              size="small"
                              onClick={() => handleEditClassSubject(cs)}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Remove Subject">
                            <IconButton
                              color="error"
                              size="small"
                              onClick={() => handleRemoveSubjectFromClass(cs.id, viewClassSubjectsDialog.classId)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
              No subjects added to this class yet.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewClassSubjectsDialog({ open: false, classId: null, className: '' })}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Class Subject Dialog */}
      <Dialog open={editClassSubjectDialog.open} onClose={() => setEditClassSubjectDialog({ open: false, classSubject: null, classId: null })} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Subject Settings</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="dense" sx={{ mt: 2 }}>
            <InputLabel>Is Compulsory</InputLabel>
            <Select
              value={editClassSubjectForm.is_compulsory ? 'true' : 'false'}
              onChange={(e) => setEditClassSubjectForm({ ...editClassSubjectForm, is_compulsory: e.target.value === 'true' })}
            >
              <MenuItem value="true">Yes</MenuItem>
              <MenuItem value="false">No</MenuItem>
            </Select>
          </FormControl>
          <TextField
            margin="dense"
            label="Credits (Optional)"
            type="number"
            fullWidth
            value={editClassSubjectForm.credits || ''}
            onChange={(e) => setEditClassSubjectForm({ ...editClassSubjectForm, credits: e.target.value ? parseInt(e.target.value) : null })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditClassSubjectDialog({ open: false, classSubject: null, classId: null })}>Cancel</Button>
          <Button onClick={handleUpdateClassSubject} variant="contained">
            Update
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Subject to Class Dialog */}
      <Dialog open={addSubjectToClassDialog.open} onClose={() => setAddSubjectToClassDialog({ open: false, classId: null, className: '' })} maxWidth="sm" fullWidth>
        <DialogTitle>Add Subject to {addSubjectToClassDialog.className}</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="dense">
            <InputLabel>Select Subject</InputLabel>
            <Select
              value={classSubjectForm.subject_id}
              onChange={(e) => setClassSubjectForm({ ...classSubjectForm, subject_id: e.target.value })}
            >
              {subjects.length === 0 ? (
                <MenuItem disabled>No subjects available</MenuItem>
              ) : (
                subjects
                  .filter(subject => {
                    // Filter out subjects already added to this class
                    const currentClassSubjects = classSubjects[addSubjectToClassDialog.classId] || [];
                    if (currentClassSubjects.length === 0) return true;
                    
                    // Check if subject is already added
                    const addedSubjectIds = currentClassSubjects.map(cs => {
                      // Handle different response structures
                      if (cs.subject && typeof cs.subject === 'object') {
                        return cs.subject.id || cs.subject_id;
                      }
                      return cs.subject_id || cs.id;
                    });
                    return !addedSubjectIds.includes(subject.id);
                  })
                  .map((subject) => (
                    <MenuItem key={subject.id} value={subject.id}>
                      {subject.name} ({subject.code})
                    </MenuItem>
                  ))
              )}
            </Select>
          </FormControl>
          <FormControl fullWidth margin="dense">
            <InputLabel>Is Compulsory</InputLabel>
            <Select
              value={classSubjectForm.is_compulsory}
              onChange={(e) => setClassSubjectForm({ ...classSubjectForm, is_compulsory: e.target.value === 'true' })}
            >
              <MenuItem value={true}>Yes</MenuItem>
              <MenuItem value={false}>No</MenuItem>
            </Select>
          </FormControl>
          <TextField
            margin="dense"
            label="Credits (Optional)"
            type="number"
            fullWidth
            value={classSubjectForm.credits || ''}
            onChange={(e) => setClassSubjectForm({ ...classSubjectForm, credits: e.target.value ? parseInt(e.target.value) : null })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddSubjectToClassDialog({ open: false, classId: null, className: '' })}>Cancel</Button>
          <Button onClick={handleAddSubjectToClass} variant="contained" disabled={!classSubjectForm.subject_id}>
            Add Subject
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Class Subject Dialog */}
      <Dialog open={editClassSubjectDialog.open} onClose={() => setEditClassSubjectDialog({ open: false, classSubject: null, classId: null })} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Subject Settings</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="dense" sx={{ mt: 2 }}>
            <InputLabel>Is Compulsory</InputLabel>
            <Select
              value={editClassSubjectForm.is_compulsory ? 'true' : 'false'}
              onChange={(e) => setEditClassSubjectForm({ ...editClassSubjectForm, is_compulsory: e.target.value === 'true' })}
            >
              <MenuItem value="true">Yes</MenuItem>
              <MenuItem value="false">No</MenuItem>
            </Select>
          </FormControl>
          <TextField
            margin="dense"
            label="Credits (Optional)"
            type="number"
            fullWidth
            value={editClassSubjectForm.credits || ''}
            onChange={(e) => setEditClassSubjectForm({ ...editClassSubjectForm, credits: e.target.value ? parseInt(e.target.value) : null })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditClassSubjectDialog({ open: false, classSubject: null, classId: null })}>Cancel</Button>
          <Button onClick={handleUpdateClassSubject} variant="contained">
            Update
          </Button>
        </DialogActions>
      </Dialog>

      {/* Teacher Dialog */}
      <Dialog open={teacherDialog.open} onClose={() => setTeacherDialog({ open: false, mode: 'create', teacher: null })} maxWidth="md" fullWidth>
        <DialogTitle>{teacherDialog.mode === 'create' ? 'Add New Teacher' : 'Edit Teacher'}</DialogTitle>
        <DialogContent>
          {teacherDialog.mode === 'create' && (
            <>
              <TextField
                autoFocus
                margin="dense"
                label="Email"
                type="email"
                fullWidth
                required
                value={teacherForm.email}
                onChange={(e) => setTeacherForm({ ...teacherForm, email: e.target.value })}
              />
              <TextField
                margin="dense"
                label="Password"
                type="password"
                fullWidth
                required
                value={teacherForm.password}
                onChange={(e) => setTeacherForm({ ...teacherForm, password: e.target.value })}
              />
            </>
          )}
          <TextField
            margin="dense"
            label="Name"
            fullWidth
            required
            value={teacherForm.name}
            onChange={(e) => setTeacherForm({ ...teacherForm, name: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Phone"
            fullWidth
            value={teacherForm.phone}
            onChange={(e) => setTeacherForm({ ...teacherForm, phone: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Qualification"
            fullWidth
            value={teacherForm.qualification}
            onChange={(e) => setTeacherForm({ ...teacherForm, qualification: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Experience (Years)"
            type="number"
            fullWidth
            value={teacherForm.experience_years}
            onChange={(e) => setTeacherForm({ ...teacherForm, experience_years: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Specialization"
            fullWidth
            value={teacherForm.specialization}
            onChange={(e) => setTeacherForm({ ...teacherForm, specialization: e.target.value })}
          />
          <FormControl fullWidth margin="dense">
            <InputLabel>Subjects (Optional)</InputLabel>
            <Select
              multiple
              value={selectedSubjectIds}
              onChange={(e) => setSelectedSubjectIds(e.target.value)}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => {
                    const subject = subjects.find(s => s.id === value);
                    return <Chip key={value} label={subject?.name || value} size="small" />;
                  })}
                </Box>
              )}
            >
              {subjects.map((subject) => (
                <MenuItem key={subject.id} value={subject.id}>
                  {subject.name} ({subject.code})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <Typography variant="h6" gutterBottom sx={{ mt: 2, mb: 1, color: 'primary.main' }}>
            Address (Optional)
          </Typography>
          <TextField
            margin="dense"
            label="Street"
            fullWidth
            value={teacherForm.address?.street || ''}
            onChange={(e) => setTeacherForm({ ...teacherForm, address: { ...(teacherForm.address || {}), street: e.target.value } })}
          />
          <TextField
            margin="dense"
            label="City"
            fullWidth
            value={teacherForm.address?.city || ''}
            onChange={(e) => setTeacherForm({ ...teacherForm, address: { ...(teacherForm.address || {}), city: e.target.value } })}
          />
          <TextField
            margin="dense"
            label="State"
            fullWidth
            value={teacherForm.address?.state || ''}
            onChange={(e) => setTeacherForm({ ...teacherForm, address: { ...(teacherForm.address || {}), state: e.target.value } })}
          />
          <TextField
            margin="dense"
            label="Country"
            fullWidth
            value={teacherForm.address?.country || ''}
            onChange={(e) => setTeacherForm({ ...teacherForm, address: { ...(teacherForm.address || {}), country: e.target.value } })}
          />
          <TextField
            margin="dense"
            label="Postal Code"
            fullWidth
            value={teacherForm.address?.postal_code || ''}
            onChange={(e) => setTeacherForm({ ...teacherForm, address: { ...(teacherForm.address || {}), postal_code: e.target.value } })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTeacherDialog({ open: false, mode: 'create', teacher: null })}>Cancel</Button>
          <Button
            onClick={teacherDialog.mode === 'create' ? handleCreateTeacher : handleUpdateTeacher}
            variant="contained"
            disabled={!teacherForm.name || (teacherDialog.mode === 'create' && (!teacherForm.email || !teacherForm.password))}
          >
            {teacherDialog.mode === 'create' ? 'Create' : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Student Dialog */}
      <Dialog open={studentDialog.open} onClose={() => setStudentDialog({ open: false, mode: 'create', student: null })} maxWidth="md" fullWidth>
        <DialogTitle>{studentDialog.mode === 'create' ? 'Add New Student' : 'Edit Student'}</DialogTitle>
        <DialogContent>
          {studentDialog.mode === 'create' && (
            <>
              <TextField
                autoFocus
                margin="dense"
                label="Email"
                type="email"
                fullWidth
                required
                value={studentForm.email}
                onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })}
              />
              <TextField
                margin="dense"
                label="Password"
                type="password"
                fullWidth
                required
                value={studentForm.password}
                onChange={(e) => setStudentForm({ ...studentForm, password: e.target.value })}
              />
            </>
          )}
          <TextField
            margin="dense"
            label="Name"
            fullWidth
            required
            value={studentForm.name}
            onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Phone"
            fullWidth
            value={studentForm.phone}
            onChange={(e) => setStudentForm({ ...studentForm, phone: e.target.value })}
          />
          <FormControl fullWidth margin="dense">
            <InputLabel>Class *</InputLabel>
            <Select
              value={studentForm.class_id}
              onChange={(e) => handleClassChange(e.target.value)}
              required
            >
              {classes
                .filter(classItem => {
                  // Filter out full classes for create mode
                  if (studentDialog.mode === 'create') {
                    const capacity = classItem.capacity || 0;
                    const currentCount = classItem.student_count || 0;
                    return capacity > currentCount;
                  }
                  return true; // Show all classes in edit mode
                })
                .map((classItem) => {
                  const capacity = classItem.capacity || 0;
                  const currentCount = classItem.student_count || 0;
                  const available = capacity - currentCount;
                  return (
                    <MenuItem key={classItem.id} value={classItem.id}>
                      {classItem.name} ({classItem.grade_level}-{classItem.section}) 
                      {capacity > 0 && ` - ${available} seats available`}
                    </MenuItem>
                  );
                })}
            </Select>
          </FormControl>
          <TextField
            margin="dense"
            label="Roll Number"
            fullWidth
            value={studentForm.roll_number}
            onChange={(e) => setStudentForm({ ...studentForm, roll_number: e.target.value })}
            helperText={studentDialog.mode === 'create' ? 'Roll number will be auto-generated when you select a class' : ''}
          />
          <TextField
            margin="dense"
            label="Date of Birth"
            type="date"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={studentForm.date_of_birth}
            onChange={(e) => setStudentForm({ ...studentForm, date_of_birth: e.target.value })}
          />
          <FormControl fullWidth margin="dense">
            <InputLabel>Gender</InputLabel>
            <Select
              value={studentForm.gender}
              onChange={(e) => setStudentForm({ ...studentForm, gender: e.target.value })}
            >
              <MenuItem value="Male">Male</MenuItem>
              <MenuItem value="Female">Female</MenuItem>
              <MenuItem value="Other">Other</MenuItem>
            </Select>
          </FormControl>
          <TextField
            margin="dense"
            label="Blood Group"
            fullWidth
            value={studentForm.blood_group}
            onChange={(e) => setStudentForm({ ...studentForm, blood_group: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Admission Date"
            type="date"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={studentForm.admission_date}
            onChange={(e) => setStudentForm({ ...studentForm, admission_date: e.target.value })}
          />
          <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>Guardian/Parent Information</Typography>
          <TextField
            margin="dense"
            label="Guardian Name"
            fullWidth
            value={studentForm.guardian_name}
            onChange={(e) => setStudentForm({ ...studentForm, guardian_name: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Guardian Phone"
            fullWidth
            value={studentForm.guardian_phone}
            onChange={(e) => setStudentForm({ ...studentForm, guardian_phone: e.target.value })}
          />
          <FormControl fullWidth margin="dense">
            <InputLabel>Guardian Relation</InputLabel>
            <Select
              value={studentForm.guardian_relation}
              onChange={(e) => setStudentForm({ ...studentForm, guardian_relation: e.target.value })}
            >
              <MenuItem value="Father">Father</MenuItem>
              <MenuItem value="Mother">Mother</MenuItem>
              <MenuItem value="Guardian">Guardian</MenuItem>
              <MenuItem value="Other">Other</MenuItem>
            </Select>
          </FormControl>
          <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>Address Information</Typography>
          <TextField
            margin="dense"
            label="Street"
            fullWidth
            value={studentForm.address.street}
            onChange={(e) => setStudentForm({ 
              ...studentForm, 
              address: { ...studentForm.address, street: e.target.value } 
            })}
          />
          <TextField
            margin="dense"
            label="City"
            fullWidth
            value={studentForm.address.city}
            onChange={(e) => setStudentForm({ 
              ...studentForm, 
              address: { ...studentForm.address, city: e.target.value } 
            })}
          />
          <TextField
            margin="dense"
            label="State"
            fullWidth
            value={studentForm.address.state}
            onChange={(e) => setStudentForm({ 
              ...studentForm, 
              address: { ...studentForm.address, state: e.target.value } 
            })}
          />
          <TextField
            margin="dense"
            label="Country"
            fullWidth
            value={studentForm.address.country}
            onChange={(e) => setStudentForm({ 
              ...studentForm, 
              address: { ...studentForm.address, country: e.target.value } 
            })}
          />
          <TextField
            margin="dense"
            label="Postal Code"
            fullWidth
            value={studentForm.address.postal_code}
            onChange={(e) => setStudentForm({ 
              ...studentForm, 
              address: { ...studentForm.address, postal_code: e.target.value } 
            })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStudentDialog({ open: false, mode: 'create', student: null })}>Cancel</Button>
          <Button
            onClick={studentDialog.mode === 'create' ? handleCreateStudent : handleUpdateStudent}
            variant="contained"
            disabled={!studentForm.name || !studentForm.class_id || (studentDialog.mode === 'create' && (!studentForm.email || !studentForm.password))}
          >
            {studentDialog.mode === 'create' ? 'Create' : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Student Details Dialog */}
      <Dialog 
        open={studentDetailsDialog.open} 
        onClose={() => setStudentDetailsDialog({ open: false, student: null })} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          Student Details
          <IconButton
            aria-label="close"
            onClick={() => setStudentDetailsDialog({ open: false, student: null })}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
            }}
          >
            <CancelIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {studentDetailsDialog.student && (
            <Box>
              <Typography variant="h6" gutterBottom sx={{ mb: 2, color: 'primary.main' }}>
                Personal Information
              </Typography>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Name</Typography>
                  <Typography variant="body1">{studentDetailsDialog.student.user?.name || studentDetailsDialog.student.name || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Email</Typography>
                  <Typography variant="body1">{studentDetailsDialog.student.user?.email || studentDetailsDialog.student.email || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Phone</Typography>
                  <Typography variant="body1">{studentDetailsDialog.student.user?.phone || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Roll Number</Typography>
                  <Typography variant="body1">{studentDetailsDialog.student.roll_number || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Date of Birth</Typography>
                  <Typography variant="body1">
                    {studentDetailsDialog.student.date_of_birth 
                      ? new Date(studentDetailsDialog.student.date_of_birth).toLocaleDateString() 
                      : 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Gender</Typography>
                  <Typography variant="body1">{studentDetailsDialog.student.gender || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Blood Group</Typography>
                  <Typography variant="body1">{studentDetailsDialog.student.blood_group || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Admission Date</Typography>
                  <Typography variant="body1">
                    {studentDetailsDialog.student.admission_date 
                      ? new Date(studentDetailsDialog.student.admission_date).toLocaleDateString() 
                      : 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                  <Chip 
                    label={studentDetailsDialog.student.user?.is_active !== false && studentDetailsDialog.student.is_active !== false ? 'Active' : 'Inactive'} 
                    color={studentDetailsDialog.student.user?.is_active !== false && studentDetailsDialog.student.is_active !== false ? 'success' : 'default'}
                    size="small"
                  />
                </Grid>
              </Grid>

              <Typography variant="h6" gutterBottom sx={{ mb: 2, mt: 3, color: 'primary.main' }}>
                Class Information
              </Typography>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Class</Typography>
                  <Typography variant="body1">
                    {studentDetailsDialog.student.class_info 
                      ? `${studentDetailsDialog.student.class_info.name} (${studentDetailsDialog.student.class_info.grade_level}-${studentDetailsDialog.student.class_info.section})` 
                      : 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Academic Session</Typography>
                  <Typography variant="body1">
                    {studentDetailsDialog.student.class_info?.academic_year || 'N/A'}
                  </Typography>
                </Grid>
              </Grid>

              <Typography variant="h6" gutterBottom sx={{ mb: 2, mt: 3, color: 'primary.main' }}>
                Address Information
              </Typography>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                {studentDetailsDialog.student.user?.address ? (
                  <>
                    {typeof studentDetailsDialog.student.user.address === 'object' ? (
                      <>
                        {studentDetailsDialog.student.user.address.street && (
                          <Grid item xs={12}>
                            <Typography variant="subtitle2" color="text.secondary">Street</Typography>
                            <Typography variant="body1">{studentDetailsDialog.student.user.address.street}</Typography>
                          </Grid>
                        )}
                        {studentDetailsDialog.student.user.address.city && (
                          <Grid item xs={12} sm={6}>
                            <Typography variant="subtitle2" color="text.secondary">City</Typography>
                            <Typography variant="body1">{studentDetailsDialog.student.user.address.city}</Typography>
                          </Grid>
                        )}
                        {studentDetailsDialog.student.user.address.state && (
                          <Grid item xs={12} sm={6}>
                            <Typography variant="subtitle2" color="text.secondary">State</Typography>
                            <Typography variant="body1">{studentDetailsDialog.student.user.address.state}</Typography>
                          </Grid>
                        )}
                        {studentDetailsDialog.student.user.address.country && (
                          <Grid item xs={12} sm={6}>
                            <Typography variant="subtitle2" color="text.secondary">Country</Typography>
                            <Typography variant="body1">{studentDetailsDialog.student.user.address.country}</Typography>
                          </Grid>
                        )}
                        {studentDetailsDialog.student.user.address.postal_code && (
                          <Grid item xs={12} sm={6}>
                            <Typography variant="subtitle2" color="text.secondary">Postal Code</Typography>
                            <Typography variant="body1">{studentDetailsDialog.student.user.address.postal_code}</Typography>
                          </Grid>
                        )}
                      </>
                    ) : (
                      <Grid item xs={12}>
                        <Typography variant="body1">{studentDetailsDialog.student.user.address}</Typography>
                      </Grid>
                    )}
                  </>
                ) : (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">No address provided</Typography>
                  </Grid>
                )}
              </Grid>

              <Typography variant="h6" gutterBottom sx={{ mb: 2, mt: 3, color: 'primary.main' }}>
                Guardian/Parent Information
              </Typography>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Guardian Name</Typography>
                  <Typography variant="body1">{studentDetailsDialog.student.guardian_name || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Guardian Phone</Typography>
                  <Typography variant="body1">{studentDetailsDialog.student.guardian_phone || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Relation</Typography>
                  <Typography variant="body1">{studentDetailsDialog.student.guardian_relation || 'N/A'}</Typography>
                </Grid>
              </Grid>

              <Typography variant="h6" gutterBottom sx={{ mb: 2, mt: 3, color: 'primary.main' }}>
                Enrolled Subjects
              </Typography>
              {studentDetailsDialog.student.subjects && studentDetailsDialog.student.subjects.length > 0 ? (
                <Box sx={{ mb: 2 }}>
                  {studentDetailsDialog.student.subjects.map((subject, index) => (
                    <Chip
                      key={index}
                      label={subject.subject?.name || subject.subject_id}
                      sx={{ mr: 1, mb: 1 }}
                      color={subject.is_elective ? 'secondary' : 'primary'}
                      size="small"
                    />
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">No subjects enrolled</Typography>
              )}

              <Typography variant="h6" gutterBottom sx={{ mb: 2, mt: 3, color: 'primary.main' }}>
                Account Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Student ID</Typography>
                  <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>{studentDetailsDialog.student.id}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">User ID</Typography>
                  <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>{studentDetailsDialog.student.user_id}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Created At</Typography>
                  <Typography variant="body1">
                    {studentDetailsDialog.student.created_at 
                      ? new Date(studentDetailsDialog.student.created_at).toLocaleString() 
                      : 'N/A'}
                  </Typography>
                </Grid>
                {studentDetailsDialog.student.updated_at && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">Last Updated</Typography>
                    <Typography variant="body1">
                      {new Date(studentDetailsDialog.student.updated_at).toLocaleString()}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              if (studentDetailsDialog.student) {
                handleEditStudent(studentDetailsDialog.student);
              }
              setStudentDetailsDialog({ open: false, student: null });
            }}
            variant="contained"
            startIcon={<EditIcon />}
          >
            Edit Student
          </Button>
          <Button onClick={() => setStudentDetailsDialog({ open: false, student: null })}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Class Students Dialog */}
      <Dialog 
        open={classStudentsDialog.open} 
        onClose={() => setClassStudentsDialog({ open: false, classId: null, students: [] })} 
        maxWidth="lg" 
        fullWidth
      >
        <DialogTitle>
          All Students by Class
          <IconButton
            aria-label="close"
            onClick={() => setClassStudentsDialog({ open: false, classId: null, students: [] })}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
            }}
          >
            <CancelIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ mb: 3 }}>
            <FormControl fullWidth>
              <InputLabel>Select Class</InputLabel>
              <Select
                value={classStudentsDialog.classId || ''}
                onChange={(e) => {
                  const selectedClassId = e.target.value;
                  if (selectedClassId) {
                    (async () => {
                      try {
                        const classStudents = await subadminService.getClassStudents(selectedClassId);
                        setClassStudentsDialog({ 
                          open: true, 
                          classId: selectedClassId, 
                          students: classStudents 
                        });
                      } catch (err) {
                        setError(err.response?.data?.detail || 'Failed to load class students');
                      }
                    })();
                  }
                }}
              >
                {classes.map((classItem) => (
                  <MenuItem key={classItem.id} value={classItem.id}>
                    {classItem.name} ({classItem.grade_level}-{classItem.section})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {classStudentsDialog.classId && classStudentsDialog.students.length > 0 && (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Roll Number</TableCell>
                    <TableCell>Gender</TableCell>
                    <TableCell>Date of Birth</TableCell>
                    <TableCell>Guardian Name</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {classStudentsDialog.students.map((student) => {
                    const isActive = student.user?.is_active !== false && student.is_active !== false;
                    return (
                      <TableRow 
                        key={student.id}
                        sx={{
                          backgroundColor: isActive ? 'transparent' : 'rgba(0, 0, 0, 0.04)',
                          opacity: isActive ? 1 : 0.7,
                          '&:hover': {
                            backgroundColor: isActive ? 'rgba(0, 0, 0, 0.04)' : 'rgba(0, 0, 0, 0.08)',
                            cursor: 'pointer'
                          }
                        }}
                        onClick={() => setStudentDetailsDialog({ open: true, student })}
                      >
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            {student.user?.name || student.name || 'N/A'}
                            {!isActive && (
                              <Chip 
                                label="Inactive" 
                                size="small" 
                                color="default"
                                sx={{ height: 20, fontSize: '0.7rem' }}
                              />
                            )}
                          </Box>
                        </TableCell>
                        <TableCell sx={{ color: isActive ? 'inherit' : 'text.secondary' }}>
                          {student.user?.email || student.email || 'N/A'}
                        </TableCell>
                        <TableCell sx={{ color: isActive ? 'inherit' : 'text.secondary' }}>
                          {student.roll_number || 'N/A'}
                        </TableCell>
                        <TableCell sx={{ color: isActive ? 'inherit' : 'text.secondary' }}>
                          {student.gender || 'N/A'}
                        </TableCell>
                        <TableCell sx={{ color: isActive ? 'inherit' : 'text.secondary' }}>
                          {student.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString() : 'N/A'}
                        </TableCell>
                        <TableCell sx={{ color: isActive ? 'inherit' : 'text.secondary' }}>
                          {student.guardian_name || 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={isActive ? 'Active' : 'Inactive'} 
                            color={isActive ? 'success' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Tooltip title={isActive ? 'Deactivate Student' : 'Activate Student'}>
                            <IconButton
                              color={isActive ? 'success' : 'default'}
                              size="small"
                              onClick={async () => {
                                await handleToggleStudentStatus(student);
                                // Refresh the class students list after toggle
                                if (classStudentsDialog.classId) {
                                  try {
                                    const classStudents = await subadminService.getClassStudents(classStudentsDialog.classId);
                                    setClassStudentsDialog({ 
                                      ...classStudentsDialog, 
                                      students: classStudents 
                                    });
                                  } catch (err) {
                                    setError(err.response?.data?.detail || 'Failed to refresh student list');
                                  }
                                }
                              }}
                            >
                              {isActive ? <CheckCircleIcon /> : <CancelIcon />}
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit Student">
                            <IconButton
                              color="primary"
                              size="small"
                              onClick={() => {
                                handleEditStudent(student);
                                setClassStudentsDialog({ open: false, classId: null, students: [] });
                              }}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="View Details">
                            <IconButton
                              color="info"
                              size="small"
                              onClick={() => {
                                setStudentDetailsDialog({ open: true, student });
                                setClassStudentsDialog({ open: false, classId: null, students: [] });
                              }}
                            >
                              <VisibilityIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {classStudentsDialog.classId && classStudentsDialog.students.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" color="text.secondary">
                No students found in this class.
              </Typography>
            </Box>
          )}

          {!classStudentsDialog.classId && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" color="text.secondary">
                Please select a class to view its students.
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setClassStudentsDialog({ open: false, classId: null, students: [] })}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Session Dialog */}
      <Dialog open={sessionDialog.open} onClose={() => setSessionDialog({ open: false })} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Academic Session</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Session Name (e.g., 2024-2025)"
            fullWidth
            value={sessionForm.name}
            onChange={(e) => setSessionForm({ ...sessionForm, name: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Start Date"
            type="date"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={sessionForm.start_date}
            onChange={(e) => setSessionForm({ ...sessionForm, start_date: e.target.value })}
          />
          <TextField
            margin="dense"
            label="End Date"
            type="date"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={sessionForm.end_date}
            onChange={(e) => setSessionForm({ ...sessionForm, end_date: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Number of Terms"
            type="number"
            fullWidth
            value={sessionForm.term_count}
            onChange={(e) => setSessionForm({ ...sessionForm, term_count: parseInt(e.target.value) })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSessionDialog({ open: false })}>Cancel</Button>
          <Button onClick={handleCreateSession} variant="contained">Create</Button>
        </DialogActions>
      </Dialog>

      {/* Teacher Details Dialog */}
      <Dialog 
        open={teacherDetailsDialog.open} 
        onClose={() => setTeacherDetailsDialog({ open: false, teacher: null })} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h5">Teacher Details</Typography>
            <Button onClick={() => setTeacherDetailsDialog({ open: false, teacher: null })}>Close</Button>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {teacherDetailsDialog.teacher && (
            <>
              <Typography variant="h6" gutterBottom sx={{ mb: 2, color: 'primary.main' }}>
                Personal Information
              </Typography>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Name</Typography>
                  <Typography variant="body1">{teacherDetailsDialog.teacher.user?.name || teacherDetailsDialog.teacher.name || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Email</Typography>
                  <Typography variant="body1">{teacherDetailsDialog.teacher.user?.email || teacherDetailsDialog.teacher.email || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Phone</Typography>
                  <Typography variant="body1">{teacherDetailsDialog.teacher.user?.phone || teacherDetailsDialog.teacher.phone || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                  <Chip 
                    label={teacherDetailsDialog.teacher.user?.is_active !== false ? 'Active' : 'Inactive'} 
                    color={teacherDetailsDialog.teacher.user?.is_active !== false ? 'success' : 'default'}
                    size="small"
                  />
                </Grid>
              </Grid>

              <Typography variant="h6" gutterBottom sx={{ mb: 2, mt: 3, color: 'primary.main' }}>
                Professional Information
              </Typography>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Qualification</Typography>
                  <Typography variant="body1">{teacherDetailsDialog.teacher.qualification || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Experience</Typography>
                  <Typography variant="body1">
                    {teacherDetailsDialog.teacher.experience_years ? `${teacherDetailsDialog.teacher.experience_years} years` : 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">Specialization</Typography>
                  <Typography variant="body1">{teacherDetailsDialog.teacher.specialization || 'N/A'}</Typography>
                </Grid>
              </Grid>

              <Typography variant="h6" gutterBottom sx={{ mb: 2, mt: 3, color: 'primary.main' }}>
                Assigned Subjects
              </Typography>
              {teacherDetailsDialog.teacher.subjects && teacherDetailsDialog.teacher.subjects.length > 0 ? (
                <Box sx={{ mb: 2 }}>
                  {teacherDetailsDialog.teacher.subjects.map((subject, index) => (
                    <Chip
                      key={index}
                      label={subject.subject?.name || subject.subject_id || 'N/A'}
                      sx={{ mr: 1, mb: 1 }}
                      color="primary"
                      size="small"
                    />
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">No subjects assigned</Typography>
              )}

              <Typography variant="h6" gutterBottom sx={{ mb: 2, mt: 3, color: 'primary.main' }}>
                Address Information
              </Typography>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                {teacherDetailsDialog.teacher.user?.address ? (
                  <>
                    {teacherDetailsDialog.teacher.user.address.street && (
                      <Grid item xs={12}>
                        <Typography variant="subtitle2" color="text.secondary">Street</Typography>
                        <Typography variant="body1">{teacherDetailsDialog.teacher.user.address.street}</Typography>
                      </Grid>
                    )}
                    {teacherDetailsDialog.teacher.user.address.city && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary">City</Typography>
                        <Typography variant="body1">{teacherDetailsDialog.teacher.user.address.city}</Typography>
                      </Grid>
                    )}
                    {teacherDetailsDialog.teacher.user.address.state && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary">State</Typography>
                        <Typography variant="body1">{teacherDetailsDialog.teacher.user.address.state}</Typography>
                      </Grid>
                    )}
                    {teacherDetailsDialog.teacher.user.address.country && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary">Country</Typography>
                        <Typography variant="body1">{teacherDetailsDialog.teacher.user.address.country}</Typography>
                      </Grid>
                    )}
                    {teacherDetailsDialog.teacher.user.address.postal_code && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary">Postal Code</Typography>
                        <Typography variant="body1">{teacherDetailsDialog.teacher.user.address.postal_code}</Typography>
                      </Grid>
                    )}
                  </>
                ) : (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">No address provided</Typography>
                  </Grid>
                )}
              </Grid>

              <Typography variant="h6" gutterBottom sx={{ mb: 2, mt: 3, color: 'primary.main' }}>
                Account Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Teacher ID</Typography>
                  <Typography variant="body1">{teacherDetailsDialog.teacher.id || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">User ID</Typography>
                  <Typography variant="body1">{teacherDetailsDialog.teacher.user_id || teacherDetailsDialog.teacher.user?.id || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Created At</Typography>
                  <Typography variant="body1">
                    {teacherDetailsDialog.teacher.created_at 
                      ? new Date(teacherDetailsDialog.teacher.created_at).toLocaleString() 
                      : 'N/A'}
                  </Typography>
                </Grid>
                {teacherDetailsDialog.teacher.updated_at && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">Last Updated</Typography>
                    <Typography variant="body1">
                      {new Date(teacherDetailsDialog.teacher.updated_at).toLocaleString()}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTeacherDetailsDialog({ open: false, teacher: null })}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Class Details Dialog */}
      <Dialog 
        open={classDetailsDialog.open} 
        onClose={() => setClassDetailsDialog({ open: false, classItem: null, subjects: [], loading: false })} 
        maxWidth="lg" 
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h5">Class Details</Typography>
            <Button onClick={() => setClassDetailsDialog({ open: false, classItem: null, subjects: [], loading: false })}>Close</Button>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {classDetailsDialog.loading ? (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress />
            </Box>
          ) : classDetailsDialog.classItem ? (
            <>
              <Typography variant="h6" gutterBottom sx={{ mb: 2, color: 'primary.main' }}>
                Class Information
              </Typography>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Class Name</Typography>
                  <Typography variant="body1">{classDetailsDialog.classItem.name || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Grade Level</Typography>
                  <Typography variant="body1">{classDetailsDialog.classItem.grade_level || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Section</Typography>
                  <Typography variant="body1">{classDetailsDialog.classItem.section || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Academic Session</Typography>
                  <Typography variant="body1">
                    {classDetailsDialog.classItem.academic_session || classDetailsDialog.classItem.academic_year || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Capacity</Typography>
                  <Typography variant="body1">{classDetailsDialog.classItem.capacity || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Current Students</Typography>
                  <Typography variant="body1">
                    {classDetailsDialog.classItem.student_count || classDetailsDialog.classItem.students?.length || 0}
                    {classDetailsDialog.classItem.capacity && ` / ${classDetailsDialog.classItem.capacity}`}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Available Seats</Typography>
                  <Typography variant="body1">
                    {classDetailsDialog.classItem.available_seats !== undefined 
                      ? classDetailsDialog.classItem.available_seats 
                      : (classDetailsDialog.classItem.capacity 
                          ? classDetailsDialog.classItem.capacity - (classDetailsDialog.classItem.student_count || classDetailsDialog.classItem.students?.length || 0)
                          : 'N/A')}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                  <Chip 
                    label={classDetailsDialog.classItem.is_active !== false ? 'Active' : 'Inactive'} 
                    color={classDetailsDialog.classItem.is_active !== false ? 'success' : 'default'}
                    size="small"
                  />
                </Grid>
              </Grid>

              <Typography variant="h6" gutterBottom sx={{ mb: 2, mt: 3, color: 'primary.main' }}>
                Subjects & Allocated Teachers
              </Typography>
              {classDetailsDialog.subjects && classDetailsDialog.subjects.length > 0 ? (
                <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell><strong>Subject</strong></TableCell>
                        <TableCell><strong>Code</strong></TableCell>
                        <TableCell><strong>Type</strong></TableCell>
                        <TableCell><strong>Credits</strong></TableCell>
                        <TableCell><strong>Allocated Teachers</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {classDetailsDialog.subjects.map((classSubject) => (
                        <TableRow key={classSubject.id}>
                          <TableCell>
                            {classSubject.subject?.name || classSubject.subject_id || 'N/A'}
                          </TableCell>
                          <TableCell>
                            {classSubject.subject?.code || 'N/A'}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={classSubject.is_compulsory ? 'Compulsory' : 'Elective'}
                              size="small"
                              color={classSubject.is_compulsory ? 'primary' : 'secondary'}
                            />
                          </TableCell>
                          <TableCell>
                            {classSubject.credits !== null && classSubject.credits !== undefined 
                              ? `${classSubject.credits} credits` 
                              : 'N/A'}
                          </TableCell>
                          <TableCell>
                            <Box display="flex" flexWrap="wrap" gap={0.5} alignItems="center">
                              {classSubject.teachers && classSubject.teachers.length > 0 ? (
                                <>
                                  {classSubject.teachers.map((teacher, index) => (
                                    <Chip
                                      key={index}
                                      label={teacher.teacher?.name || teacher.teacher_id || 'N/A'}
                                      size="small"
                                      color="info"
                                      onDelete={() => handleRemoveTeacherFromSubject(teacher.id, classSubject.id)}
                                    />
                                  ))}
                                </>
                              ) : (
                                <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>No teachers assigned</Typography>
                              )}
                              <Tooltip title="Assign Teacher">
                                <IconButton
                                  size="small"
                                  color="primary"
                                  onClick={() => {
                                    setAssignTeacherDialog({ open: true, classSubject, classId: classDetailsDialog.classItem.id });
                                    setSelectedTeacherId('');
                                  }}
                                >
                                  <AddIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" color="text.secondary">No subjects assigned to this class</Typography>
                </Box>
              )}

              <Typography variant="h6" gutterBottom sx={{ mb: 2, mt: 3, color: 'primary.main' }}>
                Summary
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <Typography variant="subtitle2" color="text.secondary">Total Subjects</Typography>
                  <Typography variant="h6">{classDetailsDialog.subjects?.length || 0}</Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="subtitle2" color="text.secondary">Compulsory Subjects</Typography>
                  <Typography variant="h6">
                    {classDetailsDialog.subjects?.filter(s => s.is_compulsory).length || 0}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="subtitle2" color="text.secondary">Elective Subjects</Typography>
                  <Typography variant="h6">
                    {classDetailsDialog.subjects?.filter(s => !s.is_compulsory).length || 0}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="subtitle2" color="text.secondary">Total Teachers Assigned</Typography>
                  <Typography variant="h6">
                    {classDetailsDialog.subjects?.reduce((count, subject) => {
                      return count + (subject.teachers?.length || 0);
                    }, 0) || 0}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="subtitle2" color="text.secondary">Total Credits</Typography>
                  <Typography variant="h6">
                    {classDetailsDialog.subjects?.reduce((total, subject) => {
                      return total + (subject.credits || 0);
                    }, 0) || 0}
                  </Typography>
                </Grid>
              </Grid>
            </>
          ) : (
            <Typography variant="body2" color="text.secondary">No class information available</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setClassDetailsDialog({ open: false, classItem: null, subjects: [], loading: false })}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Assign Teacher to Class Subject Dialog */}
      <Dialog 
        open={assignTeacherDialog.open} 
        onClose={() => setAssignTeacherDialog({ open: false, classSubject: null, classId: null })} 
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle>Assign Teacher to Subject</DialogTitle>
        <DialogContent>
          {assignTeacherDialog.classSubject && (
            <>
              <Typography variant="subtitle1" gutterBottom sx={{ mb: 2 }}>
                Subject: <strong>{assignTeacherDialog.classSubject.subject?.name || assignTeacherDialog.classSubject.subject_id}</strong>
                {assignTeacherDialog.classSubject.subject?.code && ` (${assignTeacherDialog.classSubject.subject.code})`}
              </Typography>
              <FormControl fullWidth margin="dense">
                <InputLabel>Select Teacher</InputLabel>
                <Select
                  value={selectedTeacherId}
                  label="Select Teacher"
                  onChange={(e) => setSelectedTeacherId(e.target.value)}
                >
                  {teachers.length === 0 ? (
                    <MenuItem disabled>No teachers available</MenuItem>
                  ) : (
                    teachers
                      .filter(teacher => {
                        // Filter out teachers already assigned to this subject
                        if (!assignTeacherDialog.classSubject.teachers || assignTeacherDialog.classSubject.teachers.length === 0) {
                          return true;
                        }
                        const assignedTeacherIds = assignTeacherDialog.classSubject.teachers.map(t => 
                          t.teacher_id || t.teacher?.id
                        );
                        // Use teacher.id (Teacher model ID) not user_id
                        return !assignedTeacherIds.includes(teacher.id);
                      })
                      .map((teacher) => (
                        <MenuItem key={teacher.id} value={teacher.id}>
                          {teacher.name || teacher.user?.name || 'N/A'}
                          {teacher.specialization && ` - ${teacher.specialization}`}
                        </MenuItem>
                      ))
                  )}
                </Select>
              </FormControl>
              {assignTeacherDialog.classSubject.teachers && assignTeacherDialog.classSubject.teachers.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Currently Assigned Teachers:
                  </Typography>
                  <Box display="flex" flexWrap="wrap" gap={0.5}>
                    {assignTeacherDialog.classSubject.teachers.map((teacher, index) => (
                      <Chip
                        key={index}
                        label={teacher.teacher?.name || teacher.teacher_id || 'N/A'}
                        size="small"
                        color="info"
                      />
                    ))}
                  </Box>
                </Box>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setAssignTeacherDialog({ open: false, classSubject: null, classId: null });
            setSelectedTeacherId('');
          }}>
            Cancel
          </Button>
          <Button 
            onClick={handleAssignTeacherToSubject} 
            variant="contained"
            disabled={!selectedTeacherId}
          >
            Assign Teacher
          </Button>
        </DialogActions>
      </Dialog>

      {/* Principle Create/Edit Dialog */}
      <Dialog 
        open={principleDialog.open} 
        onClose={() => setPrincipleDialog({ open: false, mode: 'create', principle: null })} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          {principleDialog.mode === 'create' ? 'Add New Principle' : 'Edit Principle'}
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Name *"
                value={principleForm.name}
                onChange={(e) => setPrincipleForm({ ...principleForm, name: e.target.value })}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email *"
                type="email"
                value={principleForm.email}
                onChange={(e) => setPrincipleForm({ ...principleForm, email: e.target.value })}
                margin="normal"
                disabled={principleDialog.mode === 'edit'}
              />
            </Grid>
            {principleDialog.mode === 'create' && (
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Password *"
                  type="password"
                  value={principleForm.password}
                  onChange={(e) => setPrincipleForm({ ...principleForm, password: e.target.value })}
                  margin="normal"
                />
              </Grid>
            )}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone"
                value={principleForm.phone}
                onChange={(e) => setPrincipleForm({ ...principleForm, phone: e.target.value })}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Designation"
                value={principleForm.designation}
                onChange={(e) => setPrincipleForm({ ...principleForm, designation: e.target.value })}
                margin="normal"
                placeholder="e.g., Principal, Vice Principal"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Qualification"
                value={principleForm.qualification}
                onChange={(e) => setPrincipleForm({ ...principleForm, qualification: e.target.value })}
                margin="normal"
                placeholder="e.g., M.Ed., Ph.D."
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Experience (Years)"
                type="number"
                value={principleForm.experience_years}
                onChange={(e) => setPrincipleForm({ ...principleForm, experience_years: e.target.value })}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Specialization"
                value={principleForm.specialization}
                onChange={(e) => setPrincipleForm({ ...principleForm, specialization: e.target.value })}
                margin="normal"
                placeholder="e.g., Educational Leadership"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Office Phone"
                value={principleForm.office_phone}
                onChange={(e) => setPrincipleForm({ ...principleForm, office_phone: e.target.value })}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Office Email"
                type="email"
                value={principleForm.office_email}
                onChange={(e) => setPrincipleForm({ ...principleForm, office_email: e.target.value })}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>Address</Typography>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Street"
                value={principleForm.address?.street || ''}
                onChange={(e) => setPrincipleForm({ 
                  ...principleForm, 
                  address: { ...principleForm.address, street: e.target.value } 
                })}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="City"
                value={principleForm.address?.city || ''}
                onChange={(e) => setPrincipleForm({ 
                  ...principleForm, 
                  address: { ...principleForm.address, city: e.target.value } 
                })}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="State"
                value={principleForm.address?.state || ''}
                onChange={(e) => setPrincipleForm({ 
                  ...principleForm, 
                  address: { ...principleForm.address, state: e.target.value } 
                })}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Country"
                value={principleForm.address?.country || ''}
                onChange={(e) => setPrincipleForm({ 
                  ...principleForm, 
                  address: { ...principleForm.address, country: e.target.value } 
                })}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Postal Code"
                value={principleForm.address?.postal_code || ''}
                onChange={(e) => setPrincipleForm({ 
                  ...principleForm, 
                  address: { ...principleForm.address, postal_code: e.target.value } 
                })}
                margin="normal"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPrincipleDialog({ open: false, mode: 'create', principle: null })}>
            Cancel
          </Button>
          <Button 
            onClick={principleDialog.mode === 'create' ? handleCreatePrinciple : handleUpdatePrinciple} 
            variant="contained"
            disabled={!principleForm.name || !principleForm.email || (principleDialog.mode === 'create' && !principleForm.password)}
          >
            {principleDialog.mode === 'create' ? 'Create' : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Principle Details Dialog */}
      <Dialog 
        open={principleDetailsDialog.open} 
        onClose={() => setPrincipleDetailsDialog({ open: false, principle: null })} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h5">Principle Details</Typography>
            <Button onClick={() => setPrincipleDetailsDialog({ open: false, principle: null })}>Close</Button>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {principleDetailsDialog.principle && (
            <>
              <Typography variant="h6" gutterBottom sx={{ mb: 2, color: 'primary.main' }}>
                Personal Information
              </Typography>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Name</Typography>
                  <Typography variant="body1">{principleDetailsDialog.principle.name || principleDetailsDialog.principle.user?.name || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Email</Typography>
                  <Typography variant="body1">{principleDetailsDialog.principle.email || principleDetailsDialog.principle.user?.email || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Phone</Typography>
                  <Typography variant="body1">{principleDetailsDialog.principle.phone || principleDetailsDialog.principle.user?.phone || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                  <Chip 
                    label={principleDetailsDialog.principle.user?.is_active !== false ? 'Active' : 'Inactive'} 
                    color={principleDetailsDialog.principle.user?.is_active !== false ? 'success' : 'default'}
                    size="small"
                  />
                </Grid>
              </Grid>

              <Typography variant="h6" gutterBottom sx={{ mb: 2, mt: 3, color: 'primary.main' }}>
                Professional Information
              </Typography>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Designation</Typography>
                  <Typography variant="body1">{principleDetailsDialog.principle.designation || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Qualification</Typography>
                  <Typography variant="body1">{principleDetailsDialog.principle.qualification || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Experience</Typography>
                  <Typography variant="body1">
                    {principleDetailsDialog.principle.experience_years ? `${principleDetailsDialog.principle.experience_years} years` : 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Specialization</Typography>
                  <Typography variant="body1">{principleDetailsDialog.principle.specialization || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Office Phone</Typography>
                  <Typography variant="body1">{principleDetailsDialog.principle.office_phone || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Office Email</Typography>
                  <Typography variant="body1">{principleDetailsDialog.principle.office_email || 'N/A'}</Typography>
                </Grid>
              </Grid>

              <Typography variant="h6" gutterBottom sx={{ mb: 2, mt: 3, color: 'primary.main' }}>
                Address Information
              </Typography>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                {principleDetailsDialog.principle.user?.address ? (
                  <>
                    {principleDetailsDialog.principle.user.address.street && (
                      <Grid item xs={12}>
                        <Typography variant="subtitle2" color="text.secondary">Street</Typography>
                        <Typography variant="body1">{principleDetailsDialog.principle.user.address.street}</Typography>
                      </Grid>
                    )}
                    {principleDetailsDialog.principle.user.address.city && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary">City</Typography>
                        <Typography variant="body1">{principleDetailsDialog.principle.user.address.city}</Typography>
                      </Grid>
                    )}
                    {principleDetailsDialog.principle.user.address.state && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary">State</Typography>
                        <Typography variant="body1">{principleDetailsDialog.principle.user.address.state}</Typography>
                      </Grid>
                    )}
                    {principleDetailsDialog.principle.user.address.country && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary">Country</Typography>
                        <Typography variant="body1">{principleDetailsDialog.principle.user.address.country}</Typography>
                      </Grid>
                    )}
                    {principleDetailsDialog.principle.user.address.postal_code && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary">Postal Code</Typography>
                        <Typography variant="body1">{principleDetailsDialog.principle.user.address.postal_code}</Typography>
                      </Grid>
                    )}
                  </>
                ) : (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">No address provided</Typography>
                  </Grid>
                )}
              </Grid>

              <Typography variant="h6" gutterBottom sx={{ mb: 2, mt: 3, color: 'primary.main' }}>
                Account Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Principle ID</Typography>
                  <Typography variant="body1">{principleDetailsDialog.principle.id || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">User ID</Typography>
                  <Typography variant="body1">{principleDetailsDialog.principle.user_id || principleDetailsDialog.principle.user?.id || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Assigned School</Typography>
                  <Typography variant="body1">
                    {principleDetailsDialog.principle.assigned_school?.name || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Created At</Typography>
                  <Typography variant="body1">
                    {principleDetailsDialog.principle.created_at 
                      ? new Date(principleDetailsDialog.principle.created_at).toLocaleString() 
                      : 'N/A'}
                  </Typography>
                </Grid>
                {principleDetailsDialog.principle.updated_at && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">Last Updated</Typography>
                    <Typography variant="body1">
                      {new Date(principleDetailsDialog.principle.updated_at).toLocaleString()}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPrincipleDetailsDialog({ open: false, principle: null })}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default SubadminDashboard;
