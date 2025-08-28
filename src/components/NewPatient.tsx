import React, { useState } from 'react';
import { Upload, FileImage, Brain, Activity, AlertTriangle, CheckCircle, Info, ArrowLeft, User, Save, Search, Clock, FileText, Plus, UserPlus } from 'lucide-react';
import type { AIAnalysisResult, PatientCase } from '../types';

interface NewPatientProps {
  onBack: () => void;
}

export const NewPatient: React.FC<NewPatientProps> = ({ onBack }) => {
  const [currentStep, setCurrentStep] = useState<'patient-selection' | 'ultrasound-analysis'>('patient-selection');
  const [selectedPatient, setSelectedPatient] = useState<PatientCase | null>(null);
  const [isNewPatient, setIsNewPatient] = useState(false);
  const [newPatientName, setNewPatientName] = useState('');
  const [newPatientFileNumber, setNewPatientFileNumber] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AIAnalysisResult | null>(null);
  const [dragActive, setDragActive] = useState(false);

  // Mock existing patients
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

  const filteredPatients = existingPatients.filter(patient =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.fileNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectExistingPatient = (patient: PatientCase) => {
    setSelectedPatient(patient);
    setCurrentStep('ultrasound-analysis');
  };

  const handleCreateNewPatient = () => {
    if (!newPatientName.trim() || !newPatientFileNumber.trim()) return;
    
    const newPatient: PatientCase = {
      id: Date.now().toString(),
      name: newPatientName,
      fileNumber: newPatientFileNumber,
      biopsiesExcluded: 0,
      caseSummary: 'New patient case',
      lastSession: new Date().toISOString().split('T')[0],
      status: 'Active'
    };
    
    setSelectedPatient(newPatient);
    setCurrentStep('ultrasound-analysis');
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      setUploadedFile(files[0]);
      setAnalysisResult(null);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadedFile(e.target.files[0]);
      setAnalysisResult(null);
    }
  };

  const analyzeImage = async () => {
    if (!uploadedFile) return;
    
    setIsAnalyzing(true);
    
    setTimeout(() => {
      const mockResults: AIAnalysisResult[] = [
        {
          tiradsScore: 4,
          biopsyRecommendation: true,
          riskLevel: 'High',
          explanation: 'Multiple suspicious features detected including irregular margins and microcalcifications. Recommend FNA biopsy for definitive diagnosis.'
        },
        {
          tiradsScore: 2,
          biopsyRecommendation: false,
          riskLevel: 'Low',
          explanation: 'Benign appearing thyroid nodule with smooth margins and homogeneous echo pattern. Continue surveillance imaging.'
        },
        {
          tiradsScore: 3,
          biopsyRecommendation: false,
          riskLevel: 'Medium',
          explanation: 'Mixed echogenicity pattern with some concerning features. Recommend follow-up ultrasound in 6 months.'
        }
      ];
      
      setAnalysisResult(mockResults[Math.floor(Math.random() * mockResults.length)]);
      setIsAnalyzing(false);
    }, 3000);
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Low': return 'text-green-700 bg-green-100 border-green-200';
      case 'Medium': return 'text-yellow-700 bg-yellow-100 border-yellow-200';
      case 'High': return 'text-red-700 bg-red-100 border-red-200';
      default: return 'text-gray-700 bg-gray-100 border-gray-200';
    }
  };

  const getRiskIcon = (risk: string) => {
    switch (risk) {
      case 'Low': return <CheckCircle className="w-5 h-5" />;
      case 'Medium': return <Info className="w-5 h-5" />;
      case 'High': return <AlertTriangle className="w-5 h-5" />;
      default: return <Info className="w-5 h-5" />;
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
            <button
              onClick={onBack}
              className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Ultrasound Analysis</h1>
              <p className="text-gray-600">
                {currentStep === 'patient-selection' 
                  ? 'Select existing patient or create new patient record'
                  : `Analyzing ultrasound for ${selectedPatient?.name}`
                }
              </p>
            </div>
          </div>
          {currentStep === 'ultrasound-analysis' && (
            <button
              onClick={() => setCurrentStep('patient-selection')}
              className="text-blue-600 hover:text-blue-700 font-semibold"
            >
              Change Patient
            </button>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Step 1: Patient Selection */}
        {currentStep === 'patient-selection' && (
          <div className="max-w-4xl mx-auto">
            {/* Toggle between New/Existing Patient */}
            <div className="mb-8">
              <div className="flex bg-gray-100 rounded-lg p-1 max-w-md mx-auto">
                <button
                  onClick={() => setIsNewPatient(false)}
                  className={`flex-1 py-2 px-4 rounded-md font-semibold text-sm transition-colors ${
                    !isNewPatient 
                      ? 'bg-white text-blue-600 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Existing Patient
                </button>
                <button
                  onClick={() => setIsNewPatient(true)}
                  className={`flex-1 py-2 px-4 rounded-md font-semibold text-sm transition-colors ${
                    isNewPatient 
                      ? 'bg-white text-blue-600 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  New Patient
                </button>
              </div>
            </div>

            {/* New Patient Form */}
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

            {/* Existing Patient Search */}
            {!isNewPatient && (
              <div className="bg-white rounded-xl shadow-sm p-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
                  <Search className="w-6 h-6 mr-3 text-blue-600" />
                  Select Existing Patient
                </h2>
                
                {/* Search Bar */}
                <div className="mb-6">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Search by patient name or file number..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                    />
                  </div>
                </div>

                {/* Patient List */}
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {filteredPatients.length === 0 ? (
                    <div className="text-center py-8">
                      <User className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">
                        {searchTerm ? 'No patients found matching your search' : 'Start typing to search for patients'}
                      </p>
                    </div>
                  ) : (
                    filteredPatients.map((patient) => (
                      <div
                        key={patient.id}
                        onClick={() => handleSelectExistingPatient(patient)}
                        className="border border-gray-200 rounded-lg p-4 hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition-all duration-200"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center mb-2">
                              <h3 className="text-lg font-semibold text-gray-900 mr-3">{patient.name}</h3>
                              <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                {patient.fileNumber}
                              </span>
                              <div className={`ml-3 px-2 py-1 rounded-full text-xs font-semibold border flex items-center ${getStatusColor(patient.status)}`}>
                                {getStatusIcon(patient.status)}
                                <span className="ml-1">{patient.status}</span>
                              </div>
                            </div>
                            <p className="text-gray-600 text-sm">{patient.caseSummary}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              Last session: {new Date(patient.lastSession).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="ml-4">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <ArrowLeft className="w-4 h-4 text-blue-600 transform rotate-180" />
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

        {/* Step 2: Ultrasound Analysis */}
        {currentStep === 'ultrasound-analysis' && selectedPatient && (
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Left Panel - Upload */}
            <div className="space-y-6">
              {/* Patient Info Header */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <User className="w-5 h-5 mr-2 text-blue-600" />
                  Selected Patient
                </h2>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{selectedPatient.name}</h3>
                    <p className="text-gray-600">File: {selectedPatient.fileNumber}</p>
                    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold border mt-2 ${getStatusColor(selectedPatient.status)}`}>
                      {getStatusIcon(selectedPatient.status)}
                      <span className="ml-1">{selectedPatient.status}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Upload Section */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <Upload className="w-5 h-5 mr-2 text-blue-600" />
                  Upload Thyroid Ultrasound
                </h2>
                
                <div
                  className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
                    dragActive 
                      ? 'border-blue-400 bg-blue-50' 
                      : uploadedFile 
                        ? 'border-green-400 bg-green-50'
                        : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  {uploadedFile ? (
                    <div className="space-y-4">
                      <FileImage className="w-12 h-12 text-green-600 mx-auto" />
                      <div>
                        <p className="text-lg font-semibold text-green-700">File Uploaded</p>
                        <p className="text-sm text-gray-600">{uploadedFile.name}</p>
                        <p className="text-sm text-gray-500">
                          {(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Upload className="w-12 h-12 text-gray-400 mx-auto" />
                      <div>
                        <p className="text-lg font-semibold text-gray-700">
                          Drag and drop ultrasound image here
                        </p>
                        <p className="text-sm text-gray-500 mt-2">
                          Supports JPG, PNG, DICOM files up to 50MB
                        </p>
                      </div>
                    </div>
                  )}
                  
                  <input
                    type="file"
                    onChange={handleFileInput}
                    accept="image/*,.dcm"
                    className="hidden"
                    id="fileInput"
                  />
                  <label
                    htmlFor="fileInput"
                    className="inline-block mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer transition-colors"
                  >
                    Choose File
                  </label>
                </div>

                <button
                  onClick={analyzeImage}
                  disabled={!uploadedFile || isAnalyzing}
                  className="w-full mt-6 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center"
                >
                  {isAnalyzing ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Analyzing with AI...
                    </>
                  ) : (
                    <>
                      <Brain className="w-5 h-5 mr-2" />
                      Analyze with AI
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Right Panel - Results */}
            <div className="space-y-6">
              {analysisResult && (
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                    <Activity className="w-5 h-5 mr-2 text-purple-600" />
                    AI Analysis Results
                  </h2>

                  <div className="space-y-6">
                    {/* TI-RADS Score */}
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <h3 className="font-semibold text-blue-900 mb-2">TI-RADS Score</h3>
                      <div className="flex items-center">
                        <div className="text-3xl font-bold text-blue-700 mr-4">
                          {analysisResult.tiradsScore}
                        </div>
                        <div className="flex space-x-1">
                          {[1, 2, 3, 4, 5].map((score) => (
                            <div
                              key={score}
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                                score <= analysisResult.tiradsScore
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-gray-200 text-gray-400'
                              }`}
                            >
                              {score}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Biopsy Recommendation */}
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <h3 className="font-semibold text-gray-900 mb-2">Biopsy Recommendation</h3>
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                        analysisResult.biopsyRecommendation 
                          ? 'bg-red-100 text-red-700 border border-red-200'
                          : 'bg-green-100 text-green-700 border border-green-200'
                      }`}>
                        {analysisResult.biopsyRecommendation ? 'Yes - Recommended' : 'No - Not Required'}
                      </div>
                    </div>

                    {/* Risk Level */}
                    <div className="p-4 rounded-lg border">
                      <h3 className="font-semibold text-gray-900 mb-2">Risk Level</h3>
                      <div className={`inline-flex items-center px-4 py-2 rounded-lg border font-semibold ${getRiskColor(analysisResult.riskLevel)}`}>
                        {getRiskIcon(analysisResult.riskLevel)}
                        <span className="ml-2">{analysisResult.riskLevel} Risk</span>
                      </div>
                    </div>

                    {/* Explanation */}
                    <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                      <h3 className="font-semibold text-amber-900 mb-2 flex items-center">
                        <Info className="w-4 h-4 mr-2" />
                        Clinical Insight
                      </h3>
                      <p className="text-amber-800 text-sm leading-relaxed">
                        {analysisResult.explanation}
                      </p>
                    </div>

                    {/* Save Results Button */}
                    <button className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center">
                      <Save className="w-5 h-5 mr-2" />
                      Save Analysis Results
                    </button>
                  </div>
                </div>
              )}

              {!analysisResult && !isAnalyzing && (
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="text-center py-12">
                    <Brain className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">Ready for Analysis</h3>
                    <p className="text-gray-500">
                      Upload an ultrasound image and click "Analyze with AI" to get started
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};