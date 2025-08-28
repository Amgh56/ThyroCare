import React, { useState } from 'react';
import {
    ArrowLeft, Brain, BarChart3, CheckCircle, Target, Zap, Database,
    Search, Clock, FileText, Plus, UserPlus, User, Activity, AlertTriangle,AlertCircle, Loader2
  } from 'lucide-react';
  import type { Patient, PredictionResult } from '../types';
import { THYROID_FUNCTION_OPTIONS, PHYSICAL_EXAM_OPTIONS, PATHOLOGY_OPTIONS, TUMOR_STAGES, NODE_STAGES, AGE_OPTIONS } from '../utils/constants';
import { postPredict } from "../lib/api";
import { getClinicalRecommendation } from "../utils/recommendations";
import type { PatientCase } from '../types';

interface PreviouslyDiagnosedProps {
  onBack: () => void;
}



export const PreviouslyDiagnosed: React.FC<PreviouslyDiagnosedProps> = ({ onBack }) => {
  const [currentStep, setCurrentStep] = useState<'patient-selection' | 'recurrence-analysis'>('patient-selection');
  const [selectedPatient, setSelectedPatient] = useState<PatientCase | null>(null);
  const [isNewPatient, setIsNewPatient] = useState(false);
  const [newPatientName, setNewPatientName] = useState('');
  const [newPatientFileNumber, setNewPatientFileNumber] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [patient, setPatient] = useState<Partial<Patient>>({
    age: undefined,
    gender: undefined,
    smoking: undefined,
    smokingHistory: undefined,
    radiotherapyHistory: undefined,
    thyroidFunction: '',
    physicalExam: '',
    adenopathy: undefined,
    pathology: '',
    focality: undefined,
    riskATA: undefined,
    tumorStage: '',
    nodeStage: '',
    metastasis: undefined
  });

  const [isPredicting, setIsPredicting] = useState(false);
  const [predictionResult, setPredictionResult] = useState<PredictionResult | null>(null);

  const updatePatient = (field: keyof Patient, value: any) => {
    setPatient(prev => ({ ...prev, [field]: value }));
  };

  const isFormComplete = () => {
    return (
      patient.age !== undefined &&
      patient.gender !== undefined &&
      patient.smoking !== undefined &&
      patient.smokingHistory !== undefined &&
      patient.radiotherapyHistory !== undefined &&
      patient.thyroidFunction !== '' &&
      patient.physicalExam !== '' &&
      patient.adenopathy !== undefined &&
      patient.pathology !== '' &&
      patient.focality !== undefined &&
      patient.riskATA !== undefined &&
      patient.tumorStage !== '' &&
      patient.nodeStage !== '' &&
      patient.metastasis !== undefined
    );
  };

  const clearForm = () => {
    setPatient({
      age: undefined,
      gender: undefined,
      smoking: undefined,
      smokingHistory: undefined,
      radiotherapyHistory: undefined,
      thyroidFunction: '',
      physicalExam: '',
      adenopathy: undefined,
      pathology: '',
      focality: undefined,
      riskATA: undefined,
      tumorStage: '',
      nodeStage: '',
      metastasis: undefined
    });
    setPredictionResult(null);
  };


  // ---- mock data for patient selection UI (UI only) ----
  const [existingPatients] = useState<PatientCase[]>([
    {
      id: '1',
      name: 'Sara Al-Mahmoud',
      fileNumber: 'TC-2024-001',
      biopsiesExcluded: 2,
      caseSummary: 'Papillary thyroid carcinoma, post-surgical follow-up',
      lastSession: '2024-01-15',
      status: 'Follow-up Required'
    },
    {
      id: '2',
      name: 'Noor Hassan',
      fileNumber: 'TC-2024-002',
      biopsiesExcluded: 1,
      caseSummary: 'Benign thyroid nodule, surveillance imaging',
      lastSession: '2024-01-12',
      status: 'Active'
    },
    {
      id: '3',
      name: 'Fahad Al-Rashid',
      fileNumber: 'TC-2024-003',
      biopsiesExcluded: 3,
      caseSummary: 'Follicular thyroid cancer, recurrence monitoring',
      lastSession: '2024-01-10',
      status: 'Completed'
    }
  ]);


  const [caseHistory] = useState([
    {
      id: '1',
      date: '2024-01-15',
      type: 'Recurrence Prediction',
      results: 'Low risk - 15% probability',
      notes: 'Stable post-surgical findings'
    },
    {
      id: '2',
      date: '2023-11-20',
      type: 'Ultrasound Analysis',
      results: 'TI-RADS 4, Biopsy completed',
      notes: 'Papillary thyroid carcinoma confirmed'
    },
    {
      id: '3',
      date: '2023-10-05',
      type: 'Recurrence Prediction',
      results: 'High risk - 87% probability',
      notes: 'Recommended intensive surveillance'
    }
  ]);

  const filteredPatients = existingPatients.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.fileNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectExistingPatient = (p: PatientCase) => {
    setSelectedPatient(p);
    setCurrentStep('recurrence-analysis');
    
  };

  const handleCreateNewPatient = () => {
    if (!newPatientName.trim() || !newPatientFileNumber.trim()) return;

    const p: PatientCase = {
      id: Date.now().toString(),
      name: newPatientName,
      fileNumber: newPatientFileNumber,
      biopsiesExcluded: 0,
      caseSummary: 'New patient case - previously diagnosed',
      lastSession: new Date().toISOString().split('T')[0],
      status: 'Active'
    };

    setSelectedPatient(p);
    setCurrentStep('recurrence-analysis');
  };

    // Send patient data to the backend, get prediction from api.ts, update UI (all through the api).
    const predict = async () => {
    setIsPredicting(true);
    setPredictionResult(null);
    try {
      const payload = {
        age: patient.age!,
        gender: patient.gender!,
        smoking: Boolean(patient.smoking),
        smokingHistory: Boolean(patient.smokingHistory),
        radiotherapyHistory: Boolean(patient.radiotherapyHistory),
        thyroidFunction: patient.thyroidFunction!,
        physicalExam: patient.physicalExam!,
        adenopathy: patient.adenopathy!,
        pathology: patient.pathology!,
        focality: patient.focality!,
        riskATA: patient.riskATA!,
        tumorStage: patient.tumorStage!,
        nodeStage: patient.nodeStage!,
        metastasis: patient.metastasis!,
      };
  
      // Update UI with prediction 
      const r = await postPredict(payload);
  
      setPredictionResult({
        cancerStage: r.stage,
        aiModels: [r.model],       
        recurrence: r.recurrence,  
        probability: Math.round(r.probability * 100) / 100
      });
    } catch (e) {
      console.error(e);
      alert("Prediction failed. Please try again.");
    } finally {
      setIsPredicting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Completed': return 'bg-green-100 text-green-700 border-green-200';
      case 'Follow-up Required': return 'bg-amber-100 text-amber-700 border-amber-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Active': return <Activity className="w-4 h-4" />;
      case 'Completed': return <CheckCircle className="w-4 h-4" />;
      case 'Follow-up Required': return <Clock className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button onClick={onBack} className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Recurrence Prediction</h1>
              <p className="text-gray-600">
                {currentStep === 'patient-selection'
                  ? 'Select existing patient or create new patient record'
                  : `Analyzing recurrence risk for ${selectedPatient?.name || 'patient'}`}
              </p>
            </div>
          </div>
  
          {currentStep === 'recurrence-analysis' && (
            <button
              onClick={() => {
                setCurrentStep('patient-selection');
                setSelectedPatient(null);
              }}
              className="text-blue-600 hover:text-blue-700 font-semibold"
            >
              Change Patient
            </button>
          )}
        </div>
      </div>
  
      {/* Page content */}
      <div className="max-w-7xl mx-auto p-6">
        {/* Step 1: Patient selection */}
        {currentStep === 'patient-selection' && (
          <div className="max-w-4xl mx-auto mb-8">
            {/* Toggle New/Existing */}
            <div className="mb-8">
              <div className="flex bg-gray-100 rounded-lg p-1 max-w-md mx-auto">
                <button
                  onClick={() => setIsNewPatient(false)}
                  className={`flex-1 py-2 px-4 rounded-md font-semibold text-sm transition-colors ${
                    !isNewPatient ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Existing Patient
                </button>
                <button
                  onClick={() => setIsNewPatient(true)}
                  className={`flex-1 py-2 px-4 rounded-md font-semibold text-sm transition-colors ${
                    isNewPatient ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  New Patient
                </button>
              </div>
            </div>
  
            {/* New Patient */}
            {isNewPatient && (
              <div className="bg-white rounded-xl shadow-sm p-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
                  <UserPlus className="w-6 h-6 mr-3 text-green-600" />
                  Create New Patient
                </h2>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Patient Name</label>
                    <input
                      type="text"
                      value={newPatientName}
                      onChange={(e) => setNewPatientName(e.target.value)}
                      placeholder="Enter patient full name"
                      className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Hospital File Number</label>
                    <input
                      type="text"
                      value={newPatientFileNumber}
                      onChange={(e) => setNewPatientFileNumber(e.target.value)}
                      placeholder="Enter hospital file number (e.g., TC-2024-004)"
                      className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                    />
                  </div>
                  <button
                    onClick={handleCreateNewPatient}
                    disabled={!newPatientName.trim() || !newPatientFileNumber.trim()}
                    className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-4 px-6 rounded-lg transition-all duration-200 flex items-center justify-center text-lg"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Create Patient & Continue to Analysis
                  </button>
                </div>
              </div>
            )}
  
            {/* Existing Patient */}
            {!isNewPatient && (
              <div className="bg-white rounded-xl shadow-sm p-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
                  <Search className="w-6 h-6 mr-3 text-blue-600" />
                  Select Existing Patient
                </h2>
  
                {/* Search */}
                <div className="mb-6">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Search by patient name or file number..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                    />
                  </div>
                </div>
  
                {/* List */}
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {filteredPatients.length === 0 ? (
                    <div className="text-center py-8">
                      <User className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">
                        {searchTerm ? 'No patients found matching your search' : 'Start typing to search for patients'}
                      </p>
                    </div>
                  ) : (
                    filteredPatients.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => handleSelectExistingPatient(p)}
                        className="border border-gray-200 rounded-lg p-4 hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition-all duration-200"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center mb-2">
                              <h3 className="text-lg font-semibold text-gray-900 mr-3">{p.name}</h3>
                              <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">{p.fileNumber}</span>
                              <span
                                className={`ml-3 px-2 py-1 rounded-full text-xs font-semibold border flex items-center ${
                                  p.status === 'Active'
                                    ? 'bg-blue-100 text-blue-700 border-blue-200'
                                    : p.status === 'Completed'
                                    ? 'bg-green-100 text-green-700 border-green-200'
                                    : p.status === 'Follow-up Required'
                                    ? 'bg-amber-100 text-amber-700 border-amber-200'
                                    : 'bg-gray-100 text-gray-700 border-gray-200'
                                }`}
                              >
                                {p.status === 'Active' ? (
                                  <Activity className="w-4 h-4" />
                                ) : p.status === 'Completed' ? (
                                  <CheckCircle className="w-4 h-4" />
                                ) : p.status === 'Follow-up Required' ? (
                                  <Clock className="w-4 h-4" />
                                ) : (
                                  <FileText className="w-4 h-4" />
                                )}
                                <span className="ml-1">{p.status}</span>
                              </span>
                            </div>
                            <p className="text-gray-600 text-sm">{p.caseSummary}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              Last session: {new Date(p.lastSession).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="ml-4">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <ArrowLeft className="w-4 h-4 text-blue-600 rotate-180" />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}
  
        {/* Step 2: Recurrence analysis */}
        {currentStep === 'recurrence-analysis' && selectedPatient && (
          <>
            {/* Selected patient header */}
            <div className="mb-6">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <User className="w-5 h-5 mr-2 text-blue-600" />
                  Patient
                </h2>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{selectedPatient.name}</h3>
                  <p className="text-gray-600">File: {selectedPatient.fileNumber}</p>
                </div>
              </div>
            </div>
  
            {/* Case history — show NONE for new patients, ONE (most recent) for existing */}
            {!isNewPatient && (
              <div className="mb-6">
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Clock className="w-5 h-5 mr-2 text-blue-600" />
                    Case History for {selectedPatient.name}
                  </h2>
  
                  {(() => {
                    // Choose ONE most-recent entry overall. (If you prefer only recurrence-type, add a .filter(e => e.type === 'Recurrence Prediction') before sort.)
                    const one = [...caseHistory]
                      .filter(Boolean)
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  
                    if (!one) {
                      return <div className="text-sm text-gray-500">No history available.</div>;
                    }
  
                    return (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center">
                            <FileText className="w-4 h-4 text-gray-500 mr-3" />
                            <div>
                              <div className="font-semibold text-gray-900">{one.type}</div>
                              <div className="text-sm text-gray-600">{one.results}</div>
                              <div className="text-xs text-gray-500">{new Date(one.date).toLocaleDateString()}</div>
                            </div>
                          </div>
                          <button className="text-blue-600 hover:text-blue-700 text-sm font-semibold">View Details</button>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}
  
  
            {/* LEFT/RIGHT grid */}
            <div className="grid lg:grid-cols-2 gap-8">
              {/* LEFT: Patient form */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Patient Information</h2>
                <div className="space-y-6">
                  {/* Demographics */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Age</label>
                      <select
                        value={patient.age ?? ''}
                        onChange={(e) => updatePatient('age', e.target.value === '' ? undefined : Number(e.target.value))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select age...</option>
                        {AGE_OPTIONS.map((age) => (
                          <option key={age} value={age}>
                            {age}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Gender</label>
                      <select
                        value={patient.gender ?? ''}
                        onChange={(e) => updatePatient('gender', e.target.value === '' ? undefined : e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select gender...</option>
                        <option value="F">F</option>
                        <option value="M">M</option>
                      </select>
                    </div>
                  </div>
  
                  {/* Lifestyle Factors */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">Lifestyle Factors</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <label className="text-sm font-semibold text-gray-700">Smoking</label>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => updatePatient('smoking', true)}
                            className={`px-3 py-1 rounded text-sm font-semibold ${
                              patient.smoking === true ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'
                            }`}
                          >
                            Yes
                          </button>
                          <button
                            onClick={() => updatePatient('smoking', false)}
                            className={`px-3 py-1 rounded text-sm font-semibold ${
                              patient.smoking === false ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-600'
                            }`}
                          >
                            No
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <label className="text-sm font-semibold text-gray-700">Smoking History</label>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => updatePatient('smokingHistory', true)}
                            className={`px-3 py-1 rounded text-sm font-semibold ${
                              patient.smokingHistory === true ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'
                            }`}
                          >
                            Yes
                          </button>
                          <button
                            onClick={() => updatePatient('smokingHistory', false)}
                            className={`px-3 py-1 rounded text-sm font-semibold ${
                              patient.smokingHistory === false ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-600'
                            }`}
                          >
                            No
                          </button>
                        </div>
                      </div>
                    </div>
  
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <label className="text-sm font-semibold text-gray-700">Radiotherapy History</label>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => updatePatient('radiotherapyHistory', true)}
                          className={`px-3 py-1 rounded text-sm font-semibold ${
                            patient.radiotherapyHistory === true ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'
                          }`}
                        >
                          Yes
                        </button>
                        <button
                          onClick={() => updatePatient('radiotherapyHistory', false)}
                          className={`px-3 py-1 rounded text-sm font-semibold ${
                            patient.radiotherapyHistory === false ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-600'
                          }`}
                        >
                          No
                        </button>
                      </div>
                    </div>
                  </div>
  
                  {/* Clinical Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">Clinical Information</h3>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Thyroid Function</label>
                      <select
                        value={patient.thyroidFunction || ''}
                        onChange={(e) => updatePatient('thyroidFunction', e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select thyroid function...</option>
                        {THYROID_FUNCTION_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>
  
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Physical Exam</label>
                      <select
                        value={patient.physicalExam || ''}
                        onChange={(e) => updatePatient('physicalExam', e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select physical exam...</option>
                        {PHYSICAL_EXAM_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>
  
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Adenopathy</label>
                        <select
                          value={patient.adenopathy || ''}
                          onChange={(e) => updatePatient('adenopathy', e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Select adenopathy...</option>
                          <option value="No">No</option>
                          <option value="Right">Right</option>
                          <option value="Left">Left</option>
                          <option value="Bilateral">Bilateral</option>
                          <option value="Extensive">Extensive</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Pathology</label>
                        <select
                          value={patient.pathology || ''}
                          onChange={(e) => updatePatient('pathology', e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Select pathology...</option>
                          {PATHOLOGY_OPTIONS.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
  
                  {/* Staging Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">Staging Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Focality</label>
                        <select
                          value={patient.focality || ''}
                          onChange={(e) => updatePatient('focality', e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Select focality...</option>
                          <option value="Uni-Focal">Uni-Focal</option>
                          <option value="Multi-Focal">Multi-Focal</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Risk (ATA 2015)</label>
                        <select
                          value={patient.riskATA || ''}
                          onChange={(e) => updatePatient('riskATA', e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Select risk level...</option>
                          <option value="Low">Low</option>
                          <option value="Intermediate">Intermediate</option>
                          <option value="High">High</option>
                        </select>
                      </div>
                    </div>
  
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">T (Tumor)</label>
                        <select
                          value={patient.tumorStage || ''}
                          onChange={(e) => updatePatient('tumorStage', e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Select tumor stage...</option>
                          {TUMOR_STAGES.map((stage) => (
                            <option key={stage} value={stage}>
                              {stage}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">N (Node)</label>
                        <select
                          value={patient.nodeStage || ''}
                          onChange={(e) => updatePatient('nodeStage', e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Select node stage...</option>
                          {NODE_STAGES.map((stage) => (
                            <option key={stage} value={stage}>
                              {stage}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">M (Metastasis)</label>
                        <select
                          value={patient.metastasis || ''}
                          onChange={(e) => updatePatient('metastasis', e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Select metastasis...</option>
                          <option value="M0">M0</option>
                          <option value="M1">M1</option>
                        </select>
                      </div>
                    </div>
                  </div>
  
                  {/* Action Buttons */}
                  <div className="flex space-x-4 pt-4">
                    <button
                      onClick={predict}
                      disabled={isPredicting || !isFormComplete()}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center"
                    >
                      {isPredicting ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          Predicting...
                        </>
                      ) : (
                        <>
                          <Brain className="w-5 h-5 mr-2" />
                          Predict
                        </>
                      )}
                    </button>
                    <button
                      onClick={clearForm}
                      className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition-colors"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              </div>
  
              {/* RIGHT: Results */}
              <div className="space-y-6">
                {predictionResult && (
                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                      <BarChart3 className="w-5 h-5 mr-2 text-purple-600" />
                      Prediction Results
                    </h2>
  
                    <div className="space-y-6">
                      {/* Cancer Stage */}
                      <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                        <h3 className="font-semibold text-purple-900 mb-2 flex items-center">
                          <Target className="w-4 h-4 mr-2" />
                          Cancer Stage
                        </h3>
                        <div className="text-2xl font-bold text-purple-700">{predictionResult.cancerStage}</div>
                      </div>
  
                      {/* AI Models */}
                      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <h3 className="font-semibold text-blue-900 mb-2 flex items-center">
                          <Database className="w-4 h-4 mr-2" />
                          AI Models Used
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {predictionResult.aiModels.map((model) => (
                            <span
                              key={model}
                              className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold border border-blue-200"
                            >
                              {model}
                            </span>
                          ))}
                        </div>
                      </div>
  
                      {/* Recurrence Prediction */}
                      <div
                        className={`p-4 rounded-lg border ${
                          predictionResult.recurrence ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'
                        }`}
                      >
                        <h3
                          className={`font-semibold mb-3 flex items-center ${
                            predictionResult.recurrence ? 'text-red-900' : 'text-green-900'
                          }`}
                        >
                          {predictionResult.recurrence ? (
                            <AlertCircle className="w-4 h-4 mr-2" />
                          ) : (
                            <CheckCircle className="w-4 h-4 mr-2" />
                          )}
                          Recurrence Prediction
                        </h3>
  
                        <div className="flex items-center justify-between">
                          <div>
                            <div
                              className={`text-2xl font-bold ${
                                predictionResult.recurrence ? 'text-red-700' : 'text-green-700'
                              }`}
                            >
                              {predictionResult.recurrence ? 'Positive' : 'Negative'}
                            </div>
                            <div
                              className={`text-sm ${
                                predictionResult.recurrence ? 'text-red-600' : 'text-green-600'
                              }`}
                            >
                              {predictionResult.recurrence ? 'High risk of recurrence' : 'Low risk of recurrence'}
                            </div>
                          </div>
  
                          <div className="text-right">
                            <div className="text-sm text-gray-600 mb-1">Probability</div>
                            <div
                              className={`text-lg font-bold ${
                                predictionResult.recurrence ? 'text-red-700' : 'text-green-700'
                              }`}
                            >
                              {(predictionResult.probability * 100).toFixed(1)}%
                            </div>
                          </div>
                        </div>
  
                        {/* Probability Bar */}
                        <div className="mt-4">
                          <div className="w-full bg-gray-200 rounded-full h-3">
                            <div
                              className={`h-3 rounded-full ${
                                predictionResult.recurrence ? 'bg-red-500' : 'bg-green-500'
                              }`}
                              style={{ width: `${predictionResult.probability * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
  
                      {/* Clinical Recommendation (dynamic) */}
                      {(() => {
                        const rec = getClinicalRecommendation(
                          predictionResult.probability,
                          predictionResult.recurrence,
                          patient
                        );
                        return (
                          <div className={`p-4 rounded-lg border ${rec.box}`}>
                            <h3 className="font-semibold mb-2 flex items-center">
                              <Zap className="w-4 h-4 mr-2" />
                              Clinical Recommendation — {rec.label}
                            </h3>
                            <ul className="list-disc pl-5 space-y-1">
                              {rec.actions.map((a, i) => (
                                <li key={i} className="text-sm">
                                  {a}
                                </li>
                              ))}
                            </ul>
                            {rec.note && <p className="text-sm mt-3 opacity-80">{rec.note}</p>}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )}
  
                {!predictionResult && !isPredicting && (
                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <div className="text-center py-12">
                      <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-700 mb-2">Ready for Prediction</h3>
                      <p className="text-gray-500">
                        Complete the patient information form and click "Predict" to analyze recurrence risk
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
                }  