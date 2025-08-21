import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Professionals from './pages/ProfessionalsSimple';
import Appointments from './pages/AppointmentsSimple';
import BookAppointment from './pages/BookAppointment';
import VideoCall from './pages/VideoCall';
import Payment from './pages/Payment';
import TestConnection from './pages/TestConnection'; // <--- ADICIONE ESTA LINHA
import './App.css';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  return user ? children : <Navigate to="/login" />;
}

function AppContent() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/professionals" element={
            <ProtectedRoute>
              <Professionals />
            </ProtectedRoute>
          } />
          <Route path="/professionals/:professionalId/book" element={
            <ProtectedRoute>
              <BookAppointment />
            </ProtectedRoute>
          } />
          <Route path="/book-appointment" element={
            <ProtectedRoute>
              <BookAppointment />
            </ProtectedRoute>
          } />
          <Route path="/appointments" element={
            <ProtectedRoute>
              <Appointments />
            </ProtectedRoute>
          } />
<Route path="/video/test" element={
  <ProtectedRoute>
    <TestConnection />
  </ProtectedRoute>
} />
          <Route path="/video-call/:appointmentId" element={
            <ProtectedRoute>
              <VideoCall />
            </ProtectedRoute>
          } />
          <Route path="/payment/:appointmentId" element={
            <ProtectedRoute>
              <Payment />
            </ProtectedRoute>
          } />
          <Route path="/" element={<Navigate to="/dashboard" />} />
        </Routes>
      </main>
      <Toaster position="top-right" />
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;

