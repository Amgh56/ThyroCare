import React, { useState } from 'react';
import { Login } from './components/Login';
import { ModeSelection } from './components/ModeSelection';
import { NewPatient } from './components/NewPatient';
import { PreviouslyDiagnosed } from './components/PreviouslyDiagnosed';
import type { AppMode } from './types';

function App() {
  const [currentMode, setCurrentMode] = useState<AppMode>('login');

  const handleLogin = () => {
    setCurrentMode('mode-selection');
  };

  const handleModeSelection = (mode: 'new-patient' | 'previously-diagnosed') => {
    setCurrentMode(mode);
  };

  const handleBack = () => {
    setCurrentMode('mode-selection');
  };

  return (
    <div className="min-h-screen">
      {currentMode === 'login' && (
        <Login onLogin={handleLogin} />
      )}
      
      {currentMode === 'mode-selection' && (
        <ModeSelection onSelectMode={handleModeSelection} />
      )}
      
      {currentMode === 'new-patient' && (
        <NewPatient onBack={handleBack} />
      )}
      
      {currentMode === 'previously-diagnosed' && (
        <PreviouslyDiagnosed onBack={handleBack} />
      )}
    </div>
  );
}

export default App;