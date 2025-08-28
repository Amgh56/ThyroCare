import React, { useState } from 'react';
import { User, Calendar, FileText, Eye, Search, Plus, Activity, Clock, CheckCircle, X } from 'lucide-react';
import type { PatientCase } from '../types';
import type { NavMode } from '../types';



interface DashboardProps {
    doctorName: string;
    onSelectMode: (mode:NavMode) => void;
    onViewPatient: (patientId: string) => void;
  }
  
  export const Dashboard: React.FC<DashboardProps> = ({ doctorName, onSelectMode, onViewPatient }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [showCaseSelection, setShowCaseSelection] = useState(false);
  
    // Mock patient data
    const [patients] = useState<PatientCase[]>([
      {
        id: '1',
        name: 'Sara Al-Mahmoud',
        fileNumber: 'TC-2024-001',
        biopsiesExcluded: 2,
        caseSummary: 'Papillary thyroid carcinoma, post-surgical follow-up. TI-RADS 4 nodule with successful FNA.',
        lastSession: '2024-01-15',
        status: 'Follow-up Required'
      },
      {
        id: '2',
        name: 'Noor Hassan',
        fileNumber: 'TC-2024-002',
        biopsiesExcluded: 1,
        caseSummary: 'Benign thyroid nodule, surveillance imaging. Low-risk patient with stable findings.',
        lastSession: '2024-01-12',
        status: 'Active'
      },
      {
        id: '3',
        name: 'Fahad Al-Rashid',
        fileNumber: 'TC-2024-003',
        biopsiesExcluded: 3,
        caseSummary: 'Follicular thyroid cancer, recurrence monitoring. High-risk stratification.',
        lastSession: '2024-01-10',
        status: 'Completed'
      }
    ]);
  
    const filteredPatients = patients.filter(patient =>
      patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.fileNumber.toLowerCase().includes(searchTerm.toLowerCase())
    );
  
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
  
    const handleNewAnalysis = () => {
      setShowCaseSelection(true);
    };
  
    const handleCaseTypeSelect = (caseType: 'ultrasound' | 'recurrence') => {
      setShowCaseSelection(false);
      if (caseType === 'ultrasound') {
        onSelectMode('ultrasound-analysis');
      } else {
        onSelectMode('previously-diagnosed');
      }
    };
  
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Welcome Dr. {doctorName}
                </h1>
                <p className="text-gray-600">
                  ThryoCare Medical Dashboard - Manage your thyroid cases and patient records
                </p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleNewAnalysis}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  New Analysis
                </button>
              </div>
            </div>
          </div>
        </div>
  
        <div className="max-w-7xl mx-auto p-6">
          {/* Search Bar */}
          <div className="mb-8">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search patients by name or file number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
  
          {/* Patient Cases */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Patient Cases</h2>
            
            {filteredPatients.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">No patients found</h3>
                <p className="text-gray-500">
                  {searchTerm ? 'Try adjusting your search terms' : 'Start by creating a new patient case'}
                </p>
              </div>
            ) : (
              <div className="grid gap-6">
                {filteredPatients.map((patient) => (
                  <div key={patient.id} className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-3">
                          <h3 className="text-xl font-semibold text-gray-900 mr-3">{patient.name}</h3>
                          <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            {patient.fileNumber}
                          </span>
                          <div className={`ml-3 px-3 py-1 rounded-full text-sm font-semibold border flex items-center ${getStatusColor(patient.status)}`}>
                            {getStatusIcon(patient.status)}
                            <span className="ml-1">{patient.status}</span>
                          </div>
                        </div>
                        
                        <p className="text-gray-600 mb-4 leading-relaxed">{patient.caseSummary}</p>
                        
                        <div className="flex items-center space-x-6 text-sm text-gray-500">
                          <div className="flex items-center">
                            <FileText className="w-4 h-4 mr-2" />
                            <span>{patient.biopsiesExcluded} biopsies excluded</span>
                          </div>
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-2" />
                            <span>Last session: {new Date(patient.lastSession).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="ml-6">
                        <button
                          onClick={() => onViewPatient(patient.id)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Case
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
  
          {/* Quick Actions */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={handleNewAnalysis}
                  className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors flex items-center"
                >
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                    <Plus className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">New Analysis</div>
                    <div className="text-sm text-gray-500">Start a new patient case with AI analysis</div>
                  </div>
                </button>
                
                <button
                  onClick={handleNewAnalysis}
                  className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors flex items-center"
                >
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                    <FileText className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Patient Analysis</div>
                    <div className="text-sm text-gray-500">Choose analysis type for your patients</div>
                  </div>
                </button>
              </div>
            </div>
  
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
              <div className="space-y-3">
                <div className="flex items-center p-3 bg-blue-50 rounded-lg">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-gray-900">Sara Al-Mahmoud</div>
                    <div className="text-xs text-gray-500">Follow-up required - 3 days ago</div>
                  </div>
                </div>
                
                <div className="flex items-center p-3 bg-green-50 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-gray-900">Noor Hassan</div>
                    <div className="text-xs text-gray-500">Case updated - 5 days ago</div>
                  </div>
                </div>
                
                <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                  <div className="w-2 h-2 bg-gray-500 rounded-full mr-3"></div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-gray-900">Fahad Al-Rashid</div>
                    <div className="text-xs text-gray-500">Case completed - 1 week ago</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
  
        {/* Case Selection Modal */}
        {showCaseSelection && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full mx-4">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Select Analysis Type</h2>
                <button
                  onClick={() => setShowCaseSelection(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              
              <div className="space-y-4">
                <button
                  onClick={() => handleCaseTypeSelect('ultrasound')}
                  className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 text-left"
                >
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                      <Plus className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Ultrasound Analysis</h3>
                      <p className="text-sm text-gray-600">Upload and analyze thyroid ultrasound images with AI</p>
                    </div>
                  </div>
                </button>
                
                <button
                  onClick={() => handleCaseTypeSelect('recurrence')}
                  className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 text-left"
                >
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                      <Activity className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Recurrence Prediction</h3>
                      <p className="text-sm text-gray-600">Predict cancer recurrence risk for diagnosed patients</p>
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