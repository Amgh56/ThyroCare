import React, { useState } from 'react';
import { ArrowLeft, Brain, BarChart3, AlertCircle, CheckCircle, Target, Zap, Database } from 'lucide-react';
import type { Patient, PredictionResult } from '../types';
import { THYROID_FUNCTION_OPTIONS, PHYSICAL_EXAM_OPTIONS, PATHOLOGY_OPTIONS, TUMOR_STAGES, NODE_STAGES, AGE_OPTIONS } from '../utils/constants';
import { postPredict } from "../lib/api";
import { getClinicalRecommendation } from "../utils/recommendations";

interface PreviouslyDiagnosedProps {
  onBack: () => void;
}

export const PreviouslyDiagnosed: React.FC<PreviouslyDiagnosedProps> = ({ onBack }) => {
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
            <h1 className="text-2xl font-bold text-gray-900">Previously Diagnosed Patient</h1>
          </div>
          <div className="text-sm text-gray-500">
            Recurrence Prediction Analysis
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Panel - Form */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Patient Information</h2>
              
              <div className="space-y-6">
                {/* Demographics */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Age</label>
                    <select
                      value={patient.age ?? ""}
                      onChange={(e) => updatePatient("age", e.target.value === "" ? undefined : Number(e.target.value))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select age...</option>
                      {AGE_OPTIONS.map(age => (
                        <option key={age} value={age}>{age}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Gender</label>
                    <select
                      value={patient.gender ?? ""}
                      onChange={(e) => updatePatient('gender', e.target.value == "" ? undefined : e.target.value )}
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
                      {THYROID_FUNCTION_OPTIONS.map(option => (
                        <option key={option} value={option}>{option}</option>
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
                      {PHYSICAL_EXAM_OPTIONS.map(option => (
                        <option key={option} value={option}>{option}</option>
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
                        {TUMOR_STAGES.map(stage => (
                          <option key={stage} value={stage}>{stage}</option>
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
                        {NODE_STAGES.map(stage => (
                          <option key={stage} value={stage}>{stage}</option>
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
          </div>

          {/* Right Panel - Results */}
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
                    <div className="text-2xl font-bold text-purple-700">
                      {predictionResult.cancerStage}
                    </div>
                  </div>

                  {/* AI Models */}
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h3 className="font-semibold text-blue-900 mb-2 flex items-center">
                      <Database className="w-4 h-4 mr-2" />
                      AI Models Used
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {predictionResult.aiModels.map(model => (
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
                  <div className={`p-4 rounded-lg border ${
                    predictionResult.recurrence 
                      ? 'bg-red-50 border-red-200' 
                      : 'bg-green-50 border-green-200'
                  }`}>
                    <h3 className={`font-semibold mb-3 flex items-center ${
                      predictionResult.recurrence ? 'text-red-900' : 'text-green-900'
                    }`}>
                      {predictionResult.recurrence ? (
                        <AlertCircle className="w-4 h-4 mr-2" />
                      ) : (
                        <CheckCircle className="w-4 h-4 mr-2" />
                      )}
                      Recurrence Prediction
                    </h3>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <div className={`text-2xl font-bold ${
                          predictionResult.recurrence ? 'text-red-700' : 'text-green-700'
                        }`}>
                          {predictionResult.recurrence ? 'Positive' : 'Negative'}
                        </div>
                        <div className={`text-sm ${
                          predictionResult.recurrence ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {predictionResult.recurrence ? 'High risk of recurrence' : 'Low risk of recurrence'}
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-sm text-gray-600 mb-1">Probability</div>
                        <div className={`text-lg font-bold ${
                          predictionResult.recurrence ? 'text-red-700' : 'text-green-700'
                        }`}>
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
                        <li key={i} className="text-sm">{a}</li>
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
      </div>
    </div>
  );
};