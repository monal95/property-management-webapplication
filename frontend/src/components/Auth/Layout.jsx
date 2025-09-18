import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import RoleSelection from './RoleSelection';
import Login from './Login';
import Signup from './Signup';

// This is the equivalent of your React Native _layout.tsx
// In web React, we typically use React Router for navigation
export default function AuthLayout() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<RoleSelection />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
      </Routes>
    </Router>
  );
}

// Alternative layout without routing (if you prefer state-based navigation like in App.jsx)
export function SimpleAuthLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex flex-col">
        {children}
      </div>
    </div>
  );
}