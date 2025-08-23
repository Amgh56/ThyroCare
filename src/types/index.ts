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
  
  export type AppMode = 'login' | 'mode-selection' | 'new-patient' | 'previously-diagnosed';