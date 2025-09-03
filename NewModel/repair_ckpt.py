# repair_ckpt.py
import os, torch

CKPT_IN  = r"C:\models\thyroid_effnet\best_model.pt"
CKPT_OUT = r"C:\models\thyroid_effnet\best_model_clean.pt"

state = torch.load(CKPT_IN, map_location="cpu")

def extract_state_dict(obj):
    # حالة: الملف نفسه هو state_dict (مفاتيح أوزان)
    if isinstance(obj, dict) and any(isinstance(v, torch.Tensor) for v in obj.values()):
        return obj

    # حالة: ديكشنري يحتوي على state_dict تحت مفاتيح شائعة
    if isinstance(obj, dict):
        for k in ("model_state", "state_dict", "model"):
            if k in obj:
                v = obj[k]
                # لو dict وفيه أوزان — ممتاز
                if isinstance(v, dict) and any(isinstance(t, torch.Tensor) for t in v.values()):
                    return v
                # لو نص لمسار ملف — نحمله ونحاول نطلع state_dict منه
                if isinstance(v, str) and os.path.exists(v):
                    nested = torch.load(v, map_location="cpu")
                    return extract_state_dict(nested)

    raise RuntimeError("لم أجد state_dict صالح داخل الـcheckpoint.")

sd = extract_state_dict(state)
torch.save(sd, CKPT_OUT)
print(f"✅ تمت كتابة state_dict النظيف إلى: {CKPT_OUT}")
print(f"عدد المفاتيح: {len(sd)}")
