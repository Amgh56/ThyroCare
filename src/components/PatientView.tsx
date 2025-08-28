import React, { useState } from 'react';
import { ArrowLeft, User, Calendar, FileText, Phone, Mail, MapPin, Activity, Clock, CheckCircle, AlertTriangle, Plus, Edit, Save, X } from 'lucide-react';
import type { PatientDetails, Patient, CaseHistory } from '../types';
import { THYROID_FUNCTION_OPTIONS, PHYSICAL_EXAM_OPTIONS, PATHOLOGY_OPTIONS, TUMOR_STAGES, NODE_STAGES, AGE_OPTIONS } from '../utils/constants';

interface PatientViewProps {
  patientId: string;
  onBack: () => void;
  onStartNewAnalysis: (type: 'ultrasound' | 'recurrence') => void;
}

export const PatientView: React.FC<PatientViewProps> = ({ patientId, onBack, onStartNewAnalysis }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showAddData, setShowAddData] = useState(false);

  // Mock patient details - in real app, this would be fetched based on patientId
  const [patientDetails] = useState<PatientDetails>({
    id: patientId,
    name: 'Sara Al-Mahmoud',
    fileNumber: 'TC-2024-001',
    biopsiesExcluded: 2,
    caseSummary: 'Papillary thyroid carcinoma, post-surgical follow-up. TI-RADS 4 nodule with successful FNA.',
    lastSession: '2024-01-15',
    status: 'Follow-up Required',
    patient: {
      age: 42,
      gender: 'F',
      smoking: false,
      smokingHistory: false,
      radiotherapyHistory: true,
      thyroidFunction: 'Hypothyroidism',
      physicalExam: 'Single nodule',
      adenopathy: 'Unilateral',
      pathology: 'Papillary',
      focality: 'Uni-Focal',
      riskATA: 'Intermediate',
      tumorStage: 'T2',
      nodeStage: 'N1a',
      metastasis: 'M0'
    },
    caseHistory: [
      {
        id: '1',
        date: '2024-01-15',
        type: 'Recurrence Prediction',
        results: 'Low risk - 15% probability',
        notes: 'Stable post-surgical findings, thyroglobulin levels within normal range'
      },
      {
        id: '2',
        date: '2023-11-20',
        type: 'Ultrasound Analysis',
        results: 'TI-RADS 4, Biopsy completed',
        notes: 'Papillary thyroid carcinoma confirmed via FNA. Recommended surgical consultation.'
      },
      {
        id: '3',
        date: '2023-10-05',
        type: 'Ultrasound Analysis',
        results: 'TI-RADS 3, Follow-up recommended',
        notes: 'Suspicious nodule characteristics, recommend biopsy if growth observed'
      }
    ],
    referrals: [
      {
        id: '1',
        date: '2023-11-25',
        referredTo: 'Dr. Ahmed Hassan - Endocrine Surgery',
        reason: 'Surgical evaluation for papillary thyroid carcinoma',
        status: 'Completed'
      },
      {
        id: '2',
        date: '2024-01-20',
        referredTo: 'Dr. Fatima Al-Zahra - Nuclear Medicine',
        reason: 'Radioiodine therapy consultation',
        status: 'Pending'
      }
    ]
  });

  const [editablePatient, setEditablePatient] = useState<Patient>(patientDetails.patient);

  const updatePatient = (field: keyof Patient, value: any) => {
    setEditablePatient(prev => ({ ...prev, [field]: value }));
  };

  const savePatientData = () => {
    // In real app, this would save to backend
    console.log('Saving patient data:', editablePatient);
    setIsEditing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Completed': return 'bg-green-100 text-green-700 border-green-200';
      case 'Follow-up Required': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'Cancelled': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Active': return <Activity className="w-4 h-4" />;
      case 'Completed': return <CheckCircle className="w-4 h-4" />;
      case 'Follow-up Required': return <Clock className="w-4 h-4" />;
      case 'Pending': return <Clock className="w-4 h-4" />;
      case 'Cancelled': return <X className="w-4 h-4" />;
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
              <h1 className="text-2xl font-bold text-gray-900">{patientDetails.name}</h1>
              <p className="text-gray-600">File Number: {patientDetails.fileNumber}</p>
            </div>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowAddData(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add New Data
            </button>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center"
            >
              <Edit className="w-4 h-4 mr-2" />
              {isEditing ? 'Cancel Edit' : 'Edit Patient'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Panel - Patient Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Patient Details */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                  <User className="w-5 h-5 mr-2 text-blue-600" />
                  Patient Information
                </h2>
                {isEditing && (
                  <button
                    onClick={savePatientData}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </button>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Demographics */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-800 border-b border-gray-200 pb-2">Demographics</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Age</label>
                      {isEditing ? (
                        <select
                          value={editablePatient.age}
                          onChange={(e) => updatePatient('age', Number(e.target.value))}
                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          {AGE_OPTIONS.map(age => (
                            <option key={age} value={age}>{age}</option>
                          ))}
                        </select>
                      ) : (
                        <p className="text-gray-900">{editablePatient.age} years</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Gender</label>
                      {isEditing ? (
                        <select
                          value={editablePatient.gender}
                          onChange={(e) => updatePatient('gender', e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="F">Female</option>
                          <option value="M">Male</option>
                        </select>
                      ) : (
                        <p className="text-gray-900">{editablePatient.gender === 'F' ? 'Female' : 'Male'}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Clinical Information */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-800 border-b border-gray-200 pb-2">Clinical Information</h3>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Thyroid Function</label>
                    {isEditing ? (
                      <select
                        value={editablePatient.thyroidFunction}
                        onChange={(e) => updatePatient('thyroidFunction', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {THYROID_FUNCTION_OPTIONS.map(option => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    ) : (
                      <p className="text-gray-900">{editablePatient.thyroidFunction}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Physical Exam</label>
                    {isEditing ? (
                      <select
                        value={editablePatient.physicalExam}
                        onChange={(e) => updatePatient('physicalExam', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {PHYSICAL_EXAM_OPTIONS.map(option => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    ) : (
                      <p className="text-gray-900">{editablePatient.physicalExam}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Lifestyle Factors */}
              <div className="mt-6">
                <h3 className="font-semibold text-gray-800 border-b border-gray-200 pb-2 mb-4">Lifestyle Factors</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <label className="text-sm font-semibold text-gray-700">Smoking</label>
                    {isEditing ? (
                        <div className="flex space-x-2">
                        <button
                            onClick={() => updatePatient('smoking', true)}
                            className={`px-2 py-1 rounded text-xs font-semibold ${
                            editablePatient.smoking === true ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'
                            }`}
                        >
                            Yes
                        </button>
                        <button
                            onClick={() => updatePatient('smoking', false)}
                            className={`px-2 py-1 rounded text-xs font-semibold ${
                            editablePatient.smoking === false ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-600'
                            }`}
                        >
                            No
                        </button>
                        </div>
                    ) : (
                        <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                            editablePatient.smoking ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}
                        >
                        {editablePatient.smoking ? 'Yes' : 'No'}
                        </span>
                    )}
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <label className="text-sm font-semibold text-gray-700">Smoking History</label>
                        {isEditing ? (
            <div className="flex space-x-2">
            <button
                onClick={() => updatePatient('smokingHistory', true)}
                className={`px-2 py-1 rounded text-xs font-semibold ${
                editablePatient.smokingHistory === true ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}
            >
                Yes
            </button>
            <button
                onClick={() => updatePatient('smokingHistory', false)}
                className={`px-2 py-1 rounded text-xs font-semibold ${
                editablePatient.smokingHistory === false ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}
            >
                No
            </button>
            </div>
        ) : (
            <span
            className={`px-2 py-1 rounded text-xs font-semibold ${
                editablePatient.smokingHistory ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}
            >
            {editablePatient.smokingHistory ? 'Yes' : 'No'}
            </span>
        )}
        </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <label className="text-sm font-semibold text-gray-700">Radiotherapy History</label>
                    {isEditing ? (
                <div className="flex space-x-2">
                <button
                    onClick={() => updatePatient('radiotherapyHistory', true)}
                    className={`px-2 py-1 rounded text-xs font-semibold ${
                    editablePatient.radiotherapyHistory === true ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'
                    }`}
                >
                    Yes
                </button>
                <button
                    onClick={() => updatePatient('radiotherapyHistory', false)}
                    className={`px-2 py-1 rounded text-xs font-semibold ${
                    editablePatient.radiotherapyHistory === false ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-600'
                    }`}
                >
                    No
                </button>
                </div>
            ) : (
                <span
                className={`px-2 py-1 rounded text-xs font-semibold ${
                    editablePatient.radiotherapyHistory ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}
                >
                {editablePatient.radiotherapyHistory ? 'Yes' : 'No'}
                </span>
            )}
            </div>
        </div>
        </div>
            </div>

            {/* Case History */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                <Clock className="w-5 h-5 mr-2 text-purple-600" />
                Case History
              </h2>
              <div className="space-y-4">
                {patientDetails.caseHistory.map((case_) => (
                  <div key={case_.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <FileText className="w-4 h-4 text-gray-500 mr-2" />
                        <span className="font-semibold text-gray-900">{case_.type}</span>
                      </div>
                      <span className="text-sm text-gray-500">{new Date(case_.date).toLocaleDateString()}</span>
                    </div>
                    <div className="mb-2">
                      <span className="text-sm font-semibold text-gray-700">Results: </span>
                      <span className="text-sm text-gray-600">{case_.results}</span>
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-gray-700">Notes: </span>
                      <span className="text-sm text-gray-600">{case_.notes}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Panel - Status & Referrals */}
          <div className="space-y-6">
            {/* Patient Status */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Patient Status</h3>
              <div className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-semibold border ${getStatusColor(patientDetails.status)}`}>
                {getStatusIcon(patientDetails.status)}
                <span className="ml-2">{patientDetails.status}</span>
              </div>
              <div className="mt-4 text-sm text-gray-600">
                <p><strong>Last Session:</strong> {new Date(patientDetails.lastSession).toLocaleDateString()}</p>
                <p><strong>Biopsies Excluded:</strong> {patientDetails.biopsiesExcluded}</p>
              </div>
            </div>

            {/* Referrals */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-blue-600" />
                Referrals
              </h3>
              <div className="space-y-3">
                {patientDetails.referrals.map((referral) => (
                  <div key={referral.id} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-gray-900 text-sm">{referral.referredTo}</span>
                      <div className={`px-2 py-1 rounded-full text-xs font-semibold border ${getStatusColor(referral.status)}`}>
                        {getStatusIcon(referral.status)}
                        <span className="ml-1">{referral.status}</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">{referral.reason}</p>
                    <p className="text-xs text-gray-500">{new Date(referral.date).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={() => onStartNewAnalysis('ultrasound')}
                  className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors flex items-center"
                >
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                    <Plus className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 text-sm">New Ultrasound</div>
                    <div className="text-xs text-gray-500">Add ultrasound analysis</div>
                  </div>
                </button>
                
                <button
                  onClick={() => onStartNewAnalysis('recurrence')}
                  className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors flex items-center"
                >
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                    <Activity className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 text-sm">Recurrence Check</div>
                    <div className="text-xs text-gray-500">Predict recurrence risk</div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add New Data Modal */}
      {showAddData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Add New Data</h2>
              <button
                onClick={() => setShowAddData(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="space-y-4">
              <button
                onClick={() => {
                  setShowAddData(false);
                  onStartNewAnalysis('ultrasound');
                }}
                className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 text-left"
              >
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                    <Plus className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">New Ultrasound Analysis</h3>
                    <p className="text-sm text-gray-600">Upload and analyze new ultrasound images</p>
                  </div>
                </div>
              </button>
              
              <button
                onClick={() => {
                  setShowAddData(false);
                  onStartNewAnalysis('recurrence');
                }}
                className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 text-left"
              >
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                    <Activity className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Recurrence Prediction</h3>
                    <p className="text-sm text-gray-600">Update recurrence risk assessment</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};