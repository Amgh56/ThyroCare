import React from 'react';
import { UserPlus, FileText, ArrowRight, Upload, BarChart3 } from 'lucide-react';

interface ModeSelectionProps {
  onSelectMode: (mode: 'new-patient' | 'previously-diagnosed') => void;
}

export const ModeSelection: React.FC<ModeSelectionProps> = ({ onSelectMode }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12 pt-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">ThryoCare Dashboard</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Choose your workflow to access specialized thyroid diagnostic and monitoring tools
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* New Patient Mode */}
          <div className="bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
                <UserPlus className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">New Patient</h2>
              <p className="text-gray-600">Initial diagnosis and ultrasound analysis</p>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex items-center text-sm text-gray-600">
                <Upload className="w-4 h-4 mr-3 text-blue-500" />
                Upload thyroid ultrasound images
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <BarChart3 className="w-4 h-4 mr-3 text-blue-500" />
                AI-powered TI-RADS scoring
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <FileText className="w-4 h-4 mr-3 text-blue-500" />
                Automated biopsy recommendations
              </div>
            </div>

            <button
              onClick={() => onSelectMode('new-patient')}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-4 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 flex items-center justify-center group"
            >
              Start New Patient Analysis
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Previously Diagnosed Mode */}
          <div className="bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-purple-100 rounded-full mb-4">
                <FileText className="w-10 h-10 text-purple-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Previously Diagnosed</h2>
              <p className="text-gray-600">Recurrence prediction and monitoring</p>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex items-center text-sm text-gray-600">
                <FileText className="w-4 h-4 mr-3 text-purple-500" />
                Comprehensive patient history
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <BarChart3 className="w-4 h-4 mr-3 text-purple-500" />
                ML-based recurrence prediction
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <UserPlus className="w-4 h-4 mr-3 text-purple-500" />
                Risk stratification analysis
              </div>
            </div>

            <button
              onClick={() => onSelectMode('previously-diagnosed')}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-4 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 flex items-center justify-center group"
            >
              Access Patient Records
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        <div className="text-center mt-12">
          <p className="text-gray-500 text-sm">
            All data is encrypted and HIPAA compliant • AI models trained on validated medical datasets
          </p>
        </div>
      </div>
    </div>
  );
};