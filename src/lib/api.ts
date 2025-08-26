export const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:8000";

// Raw API response before normalization recurrence may arrive as string/number/boolean.
type PredictResponseRaw = {
  stage: string;
  recurrence: string | number | boolean; 
  probability: number;
  model: string;
};

// the types of the objects that will be in our ui 
export type PredictResponse = {
  stage: string;
  recurrence: boolean;                    
  probability: number;
  model: string;
};

// POST the patient data to the FastAPI /predict endpoint as JSON
export async function postPredict(payload: any): Promise<PredictResponse> {
  const res = await fetch(`${API_BASE}/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  // if response is not okay error is raised 
  if (!res.ok) {
    const detail = await res.text(); 
    throw new Error(`Predict failed: ${res.status} ${detail}`);
  }

  // Parse the HTTP response body as JSON and cast it to PredictResponseRaw to make sure the types are alright
  const data = (await res.json()) as PredictResponseRaw;

  const recurrence =
    typeof data.recurrence === "boolean"
      ? data.recurrence
      : String(data.recurrence).toLowerCase() === "yes" ||
        data.recurrence === 1 ||
        data.recurrence === "1";

   // Return the final normalized PredictResponse object for the UI
  return {
    stage: data.stage,
    recurrence,
    probability: data.probability,
    model: data.model,
  };
}
