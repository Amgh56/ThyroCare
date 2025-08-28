export interface Patient {
    age: number;
    gender: 'M' | 'F';
    smoking: boolean;
    smokingHistory: boolean;
    radiotherapyHistory: boolean;
    thyroidFunction: string;
    physicalExam: string;
    adenopathy: 'Unilateral' | 'Bilateral';
    pathology: string;
    focality: 'Uni-Focal' | 'Multi-Focal';
    riskATA: 'Low' | 'Intermediate' | 'High';
    tumorStage: string;
    nodeStage: string;
    metastasis: 'M0' | 'M1';
  }
  
  export interface AIAnalysisResult {
    tiradsScore: number;
    biopsyRecommendation: boolean;
    riskLevel: 'Low' | 'Medium' | 'High';
    explanation: string;
  }
  
  export interface PredictionResult {
    cancerStage: string;
    aiModels: string[];
    recurrence: boolean;
    probability: number;
  }
  
  export interface PatientCase {
    id: string;
    name: string;
    fileNumber: string;
    biopsiesExcluded: number;
    caseSummary: string;
    lastSession: string;
    status: 'Active' | 'Completed' | 'Follow-up Required';
  }
  
  export interface CaseHistory {
    id: string;
    date: string;
    type: 'Ultrasound Analysis' | 'Recurrence Prediction';
    results: string;
    notes: string;
  }
  
  export interface PatientDetails extends PatientCase {
    patient: Patient;
    caseHistory: CaseHistory[];
    referrals: {
      id: string;
      date: string;
      referredTo: string;
      reason: string;
      status: 'Pending' | 'Completed' | 'Cancelled';
    }[];
  }
  
  export type AppMode = 'login' | 'dashboard' | 'ultrasound-analysis' | 'previously-diagnosed' | 'patient-view' | 'case-selection';

  export type NavMode = Exclude<AppMode, 'login'>;
