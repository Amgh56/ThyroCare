import React, { useState } from 'react';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';
import { NewPatient } from './components/NewPatient';
import { PreviouslyDiagnosed } from './components/PreviouslyDiagnosed';
import { PatientView } from './components/PatientView';

type AppMode = 'login' | 'dashboard' | 'ultrasound-analysis' | 'previously-diagnosed' | 'patient-view' | 'case-selection';

function App() {
  const [appMode, setAppMode] = useState<AppMode>('login');
  const [doctorName, setDoctorName] = useState<string>('');
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');

  const handleLogin = (username: string) => {
    setDoctorName(username);
    setAppMode('dashboard');
  };

  const handleModeSelection = (mode: 'dashboard' | 'ultrasound-analysis' | 'previously-diagnosed' | 'patient-view' | 'case-selection') => {
    setAppMode(mode);
  };

  const handleViewPatient = (patientId: string) => {
    setSelectedPatientId(patientId);
    setAppMode('patient-view');
  };

  const handleBackToDashboard = () => {
    setAppMode('dashboard');
  };

  const handleStartNewAnalysis = (type: 'ultrasound' | 'recurrence') => {
    if (type === 'ultrasound') {
      setAppMode('ultrasound-analysis');
    } else {
      setAppMode('previously-diagnosed');
    }
  };

  if (appMode === 'login') {
    return <Login onLogin={handleLogin} />;
  }

  if (appMode === 'dashboard') {
    return (
      <Dashboard 
        doctorName={doctorName}
        onSelectMode={handleModeSelection}
        onViewPatient={handleViewPatient}
      />
    );
  }

  if (appMode === 'patient-view') {
    return (
      <PatientView 
        patientId={selectedPatientId}
        onBack={handleBackToDashboard}
        onStartNewAnalysis={handleStartNewAnalysis}
      />
    );
  }

  if (appMode === 'ultrasound-analysis') {
    return <NewPatient onBack={handleBackToDashboard} />;
  }

  if (appMode === 'previously-diagnosed') {
    return <PreviouslyDiagnosed onBack={handleBackToDashboard} />;
  }

  return null;
}

export default App;