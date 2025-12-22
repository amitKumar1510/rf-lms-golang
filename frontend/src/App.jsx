import './App.css'
import { Navigate, Route, Routes } from "react-router-dom";
import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "./store/hooks";
import { hydrateThunk } from "./store/authSlice";
import AdminLayout from "./admin/pages/AdminLayout";
import AdminLogin from "./admin/pages/AdminLogin";
import AdminDashboard from "./admin/pages/AdminDashboard";
import SubadminLayout from "./subadmin/pages/SubadminLayout";
import SubadminDashboard from "./subadmin/pages/SubadminDashboard";
import TeacherLayout from "./teacher/pages/TeacherLayout";
import TeacherDashboard from "./teacher/pages/TeacherDashboard";
import StudentLayout from "./students/pages/StudentLayout";
import StudentDashboard from "./students/pages/StudentDashboard";
import ParentLayout from "./parent/pages/ParentLayout";
import ParentDashboard from "./parent/pages/ParentDashboard";
import PrincipleLayout from "./principle/pages/PrincipleLayout";
import PrincipleDashboard from "./principle/pages/PrincipleDashboard";

function App() {
  const dispatch = useAppDispatch();
  const { hydrateStatus, user } = useAppSelector((s) => s.auth);

  useEffect(() => {
    if (hydrateStatus === "idle") dispatch(hydrateThunk());
  }, [dispatch, hydrateStatus]);

  const role = user?.role;

  return (
    <Routes>
      <Route
        path="/"
        element={
          hydrateStatus === "loading" ? (
            <div style={{ padding: 24 }}>Loading...</div>
          ) : role === "admin" ? (
            <Navigate to="/admin/dashboard" replace />
          ) : role === "student" ? (
            <Navigate to="/students/dashboard" replace />
          ) : role === "teacher" ? (
            <Navigate to="/teacher/dashboard" replace />
          ) : role === "subadmin" ? (
            <Navigate to="/subadmin/dashboard" replace />
          ) : role === "parent" ? (
            <Navigate to="/parent/dashboard" replace />
          ) : role === "principle" ? (
            <Navigate to="/principle/dashboard" replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      <Route path="/login" element={<AdminLogin />} />

      <Route path="/admin" element={<AdminLayout />}>
        <Route path="login" element={<AdminLogin />} />
        <Route path="dashboard" element={<AdminDashboard />} />
      </Route>

      <Route path="/subadmin" element={<SubadminLayout />}>
        <Route path="dashboard" element={<SubadminDashboard />} />
      </Route>

      <Route path="/teacher" element={<TeacherLayout />}>
        <Route path="dashboard" element={<TeacherDashboard />} />
      </Route>

      <Route path="/students" element={<StudentLayout />}>
        <Route path="dashboard" element={<StudentDashboard />} />
      </Route>

      <Route path="/parent" element={<ParentLayout />}>
        <Route path="dashboard" element={<ParentDashboard />} />
      </Route>

      <Route path="/principle" element={<PrincipleLayout />}>
        <Route path="dashboard" element={<PrincipleDashboard />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
