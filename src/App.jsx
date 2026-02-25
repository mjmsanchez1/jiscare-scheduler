import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'

import Login from './pages/Login'
import AdminLayout from './layouts/AdminLayout'
import EmployeeLayout from './layouts/EmployeeLayout'

import Dashboard from './pages/admin/Dashboard'
import CreateSchedule from './pages/admin/CreateSchedule'
import EmployeesPage from './pages/admin/EmployeesPage'
import ScheduleChecker from './pages/admin/ScheduleChecker'
import DayOffRequests from './pages/admin/DayOffRequests'

import MySchedule from './pages/employee/MySchedule'
import EmployeeDayOff from './pages/employee/DayOffRequest'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          {/* Admin Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="schedule"  element={<CreateSchedule />} />
            <Route path="employees" element={<EmployeesPage />} />
            <Route path="checker"   element={<ScheduleChecker />} />
            <Route path="dayoff"    element={<DayOffRequests />} />
          </Route>

          {/* Employee Routes */}
          <Route path="/employee" element={<EmployeeLayout />}>
            <Route index element={<Navigate to="my-schedule" replace />} />
            <Route path="my-schedule" element={<MySchedule />} />
            <Route path="dayoff"      element={<EmployeeDayOff />} />
          </Route>

          {/* Default redirect */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
