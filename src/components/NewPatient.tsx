import React, { useState } from 'react';
import { Upload, FileImage, Brain, Activity, AlertTriangle, CheckCircle, Info, ArrowLeft, User, Save } from 'lucide-react';
import type { AIAnalysisResult, Patient } from '../types';
import { THYROID_FUNCTION_OPTIONS, PHYSICAL_EXAM_OPTIONS, PATHOLOGY_OPTIONS, TUMOR_STAGES, NODE_STAGES, AGE_OPTIONS } from '../utils/constants';

interface NewPatientProps {
  onBack: () => void;
}

export const NewPatient: React.FC<NewPatientProps> = ({ onBack }) => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AIAnalysisResult | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [patient, setPatient] = useState<Patient>({
    age: 45,
    gender: 'F',
    smoking: false,
    smokingHistory: false,
    radiotherapyHistory: false,
    thyroidFunction: THYROID_FUNCTION_OPTIONS[0],
    physicalExam: PHYSICAL_EXAM_OPTIONS[0],
    adenopathy: 'Unilateral',
    pathology: PATHOLOGY_OPTIONS[0],
    focality: 'Uni-Focal',
    riskATA: 'Low',
    tumorStage: TUMOR_STAGES[0],
    nodeStage: NODE_STAGES[0],
    metastasis: 'M0'
  });
  const [activeTab, setActiveTab] = useState<'upload' | 'patient-info'>('upload');

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

  const updatePatient = (field: keyof Patient, value: any) => {
    setPatient(prev => ({ ...prev, [field]: value }));
  };

  const savePatientInfo = () => {
    // Here you would typically save to a database
    console.log('Saving patient info:', patient);
    // Show success message or handle save logic
  };

  const analyzeImage = async () => {
    if (!uploadedFile) return;
    
    setIsAnalyzing(true);
    
    // Simulate AI analysis
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
            <h1 className="text-2xl font-bold text-gray-900">New Patient Analysis</h1>
          </div>
          <div className="text-sm text-gray-500">
            Thyroid Ultrasound Diagnostic Tool
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('upload')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'upload'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Upload className="w-4 h-4 inline mr-2" />
                Ultrasound Analysis
              </button>
              <button
                onClick={() => setActiveTab('patient-info')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'patient-info'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <User className="w-4 h-4 inline mr-2" />
                Patient Information
              </button>
            </nav>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Panel - Upload */}
          {activeTab === 'upload' && (
            <div className="space-y-6">
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
          )}

          {/* Left Panel - Patient Information Form */}
          {activeTab === 'patient-info' && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                <User className="w-5 h-5 mr-2 text-blue-600" />
                Patient Information
              </h2>
              
              <div className="space-y-6 max-h-96 overflow-y-auto">
                {/* Demographics */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Age</label>
                    <select
                      value={patient.age}
                      onChange={(e) => updatePatient('age', Number(e.target.value))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {AGE_OPTIONS.map(age => (
                        <option key={age} value={age}>{age}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Gender</label>
                    <select
                      value={patient.gender}
                      onChange={(e) => updatePatient('gender', e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="F">Female</option>
                      <option value="M">Male</option>
                    </select>
                  </div>
                </div>

                {/* Lifestyle Factors */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">Lifestyle Factors</h3>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <label className="text-sm font-semibold text-gray-700">Smoking</label>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => updatePatient('smoking', true)}
                          className={`px-3 py-1 rounded text-sm font-semibold ${
                            patient.smoking ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-600'
                          }`}
                        >
                          Yes
                        </button>
                        <button
                          onClick={() => updatePatient('smoking', false)}
                          className={`px-3 py-1 rounded text-sm font-semibold ${
                            !patient.smoking ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'
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
                            patient.smokingHistory ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-600'
                          }`}
                        >
                          Yes
                        </button>
                        <button
                          onClick={() => updatePatient('smokingHistory', false)}
                          className={`px-3 py-1 rounded text-sm font-semibold ${
                            !patient.smokingHistory ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'
                          }`}
                        >
                          No
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <label className="text-sm font-semibold text-gray-700">Radiotherapy History</label>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => updatePatient('radiotherapyHistory', true)}
                          className={`px-3 py-1 rounded text-sm font-semibold ${
                            patient.radiotherapyHistory ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-600'
                          }`}
                        >
                          Yes
                        </button>
                        <button
                          onClick={() => updatePatient('radiotherapyHistory', false)}
                          className={`px-3 py-1 rounded text-sm font-semibold ${
                            !patient.radiotherapyHistory ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'
                          }`}
                        >
                          No
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Clinical Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">Clinical Information</h3>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Thyroid Function</label>
                    <select
                      value={patient.thyroidFunction}
                      onChange={(e) => updatePatient('thyroidFunction', e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {THYROID_FUNCTION_OPTIONS.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Physical Exam</label>
                    <select
                      value={patient.physicalExam}
                      onChange={(e) => updatePatient('physicalExam', e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {PHYSICAL_EXAM_OPTIONS.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Adenopathy</label>
                      <select
                        value={patient.adenopathy}
                        onChange={(e) => updatePatient('adenopathy', e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="Unilateral">Unilateral</option>
                        <option value="Bilateral">Bilateral</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Pathology</label>
                      <select
                        value={patient.pathology}
                        onChange={(e) => updatePatient('pathology', e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {PATHOLOGY_OPTIONS.map(option => (
                          <option key={option} value={option}>{option}</option>
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
                        value={patient.focality}
                        onChange={(e) => updatePatient('focality', e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="Uni-Focal">Uni-Focal</option>
                        <option value="Multi-Focal">Multi-Focal</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Risk (ATA 2015)</label>
                      <select
                        value={patient.riskATA}
                        onChange={(e) => updatePatient('riskATA', e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
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
                        value={patient.tumorStage}
                        onChange={(e) => updatePatient('tumorStage', e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {TUMOR_STAGES.map(stage => (
                          <option key={stage} value={stage}>{stage}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">N (Node)</label>
                      <select
                        value={patient.nodeStage}
                        onChange={(e) => updatePatient('nodeStage', e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {NODE_STAGES.map(stage => (
                          <option key={stage} value={stage}>{stage}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">M (Metastasis)</label>
                      <select
                        value={patient.metastasis}
                        onChange={(e) => updatePatient('metastasis', e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="M0">M0</option>
                        <option value="M1">M1</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={savePatientInfo}
                className="w-full mt-6 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center"
              >
                <Save className="w-5 h-5 mr-2" />
                Save Patient Information
              </button>
            </div>
          )}

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
                </div>
              </div>
            )}

            {!analysisResult && !isAnalyzing && activeTab === 'upload' && (
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

            {activeTab === 'patient-info' && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="text-center py-12">
                  <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Patient Information</h3>
                  <p className="text-gray-500">Complete the patient information form and save the data</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};