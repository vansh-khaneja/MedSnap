'use client'
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import RegistrationForm from '@/components/RegistrationForm';
import Dashboard from '@/components/Dashboard';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RegistrationForm />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;