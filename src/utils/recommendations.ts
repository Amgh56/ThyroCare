// src/utils/recommendations.ts
import type { Patient } from "../types/index.ts";

// rectangle decoration   
export type Rec = {
    label: string;
    box: string;       
    actions: string[]; 
    note?: string;
  };


  // // Convert model probability to include the meaningful recommendation in the right place
  export function getClinicalRecommendation(
    prob: number,                
    recurrence: boolean,
    patient: Partial<Patient>
  ): Rec {
    let band =
      prob < 0.10 ? 0 :
      prob < 0.30 ? 1 :
      prob < 0.50 ? 2 :
      prob < 0.70 ? 3 : 4;

     // If guideline high-risk features exist, up-tier one level (max 4) for safety.
      const highRisk =
    patient.riskATA === "High" ||
    patient.metastasis === "M1" ||
    patient.nodeStage === "N1b" ||
    patient.tumorStage === "T4a" ||
    patient.tumorStage === "T4b";
  if (highRisk && band < 4) band++;

  const RECS: Rec[] = [
    {
      label: "Very Low",
      box: "bg-green-50 border-green-200 text-green-900",
      actions: [
        "Follow-up in 6–12 months",
        "Serum Tg/TgAb every 6–12 months",
        "Neck ultrasound at 12 months",
        
      ],
    },
    {
      label: "Low",
      box: "bg-emerald-50 border-emerald-200 text-emerald-900",
      actions: [
        "Clinic review in 6–12 months",
        "Tg/TgAb every 6 months during the first year",
        "Neck ultrasound at 6–12 months",
      ],
    },
    {
      label: "Moderate",
      box: "bg-amber-50 border-amber-200 text-amber-900",
      actions: [
        "Clinic visits every 3–6 months during the first year",
        "Neck ultrasound at 6 months, then every 6–12 months",
        "Review surgical margins: consider RAI based on risk assessment",
      ],
    },
    {
      label: "High",
      box: "bg-orange-50 border-orange-200 text-orange-900",
      actions: [
        "Clinic review every 3 months",
        "Neck ultrasound every 3–6 months",
        "CT/MRI if suspicious lymph nodes or masses are identified",
        "Maintain TSH suppression: consider adjuvant therapy or tumor board referral",
      ],
    },
    {
      label: "Very High",
      box: "bg-red-50 border-red-200 text-red-900",
      actions: [
        "Clinic review every 4–8 weeks, if needed",
        "Ultrasound every 3 months: consider CT/MRI/PET as clinically indicated",
        "Evaluate for RAI  or other adjuvant therapy",
        "Multidisciplinary tumor board review",
      ],
    },
  ];

  const rec = RECS[band];

  // Borderline “negative” predictions still near 50%
  if (!recurrence && prob >= 0.40) {
    rec.note = "Borderline risk despite negative class — consider moderate-intensity surveillance.";
  }

  return rec;
}
  
  
