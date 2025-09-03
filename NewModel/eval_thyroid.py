# eval_thyroid.py
import argparse, json, os, sys, math
from pathlib import Path
import numpy as np
import torch
import torch.nn as nn
from torchvision import datasets, transforms, models
from sklearn.metrics import (
    classification_report, confusion_matrix, roc_auc_score,
    roc_curve, precision_recall_curve, average_precision_score
)
import matplotlib.pyplot as plt

IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD  = [0.229, 0.224, 0.225]

def count_split(root):
    root = Path(root)
    if not root.exists(): return {}
    counts = {}
    for cls in sorted([d.name for d in root.iterdir() if d.is_dir()]):
        n = sum(1 for _ in Path(root/cls).rglob("*") if _.suffix.lower() in [".jpg",".jpeg",".png",".bmp",".tif",".tiff"])
        counts[cls] = n
    return counts

def pretty_dist(name, counts):
    total = sum(counts.values()) if counts else 0
    lines = [f"{name}:"]
    if total == 0:
        lines.append("  (no images)")
        return "\n".join(lines)
    width = max(len(k) for k in counts)
    for k in sorted(counts):
        p = 100.0*counts[k]/total if total else 0.0
        lines.append(f"  {k:<{width}} : {counts[k]:>5d}  ({p:6.2f}%)")
    lines.append(f"  TOTAL{' '*(width-5)} : {total:>5d}  (100.00%)")
    return "\n".join(lines)

def load_checkpoint(ckpt_path):
    # يدعم: torch.save(state_dict) أو {"model_state":..} أو {"model":..} أو safetensors غير مدعوم هنا
    if not os.path.isfile(ckpt_path):
        raise FileNotFoundError(f"Checkpoint not found: {ckpt_path}")
    state = torch.load(ckpt_path, map_location="cpu")
    # إذا كان نص (حالة خاطئة سابقًا)
    if isinstance(state, str):
        raise TypeError("Loaded checkpoint is a string—not a state_dict. Re-save your checkpoint correctly.")
    # جرّب استخراج state_dict
    if isinstance(state, dict):
        # احتمال يحتوي أشياء إضافية
        for key in ["model_state", "state_dict", "model"]:
            if key in state and isinstance(state[key], dict):
                return state, state[key]
        # أو state dict مباشرة
        looks_like_state = all(isinstance(k, str) for k in state.keys())
        if looks_like_state:
            return {}, state
    # آخر احتمال
    return {}, state

def build_model(num_classes):
    # نستخدم EfficientNet-B0 بوزن التحويلات الافتراضي (لا نحمّل أوزان ImageNet إذا ما نحتاج)
    model = models.efficientnet_b0(weights=None)
    in_feat = model.classifier[1].in_features
    model.classifier[1] = nn.Linear(in_feat, num_classes)
    return model

def get_transform(img_size):
    return transforms.Compose([
        transforms.Resize((img_size, img_size)),
        transforms.ToTensor(),
        transforms.Normalize(IMAGENET_MEAN, IMAGENET_STD),
    ])

def eval_split(model, loader, device, class_names, save_dir, prefix="test", make_plots=True):
    model.eval()
    y_true, y_prob, y_pred = [], [], []
    with torch.no_grad():
        for x, y in loader:
            x = x.to(device)
            logits = model(x)
            probs = torch.softmax(logits, dim=1).cpu().numpy()
            y_prob.append(probs)
            y_true.append(y.numpy())
    y_prob = np.concatenate(y_prob, axis=0)
    y_true = np.concatenate(y_true, axis=0)
    y_pred = y_prob.argmax(1)

    # تقارير أساسية
    print("\n=== Classification Report ===")
    print(classification_report(y_true, y_pred, target_names=class_names, digits=4))

    # مصفوفة الالتباس
    cm = confusion_matrix(y_true, y_pred, labels=list(range(len(class_names))))
    print("Confusion Matrix (counts):")
    print(cm)

    # مطبّعة (بالنِّسَب على الصف)
    with np.errstate(all='ignore'):
        cm_norm = cm.astype(float) / cm.sum(axis=1, keepdims=True)
    print("Confusion Matrix (row-normalized):")
    print(np.nan_to_num(cm_norm))

    # حساسية (recall) ونوعية (specificity) لكل فئة (ثنائي/متعدد)
    print("\n=== Sensitivity / Specificity per class ===")
    for c in range(len(class_names)):
        TP = cm[c, c]
        FN = cm[c, :].sum() - TP
        FP = cm[:, c].sum() - TP
        TN = cm.sum() - (TP + FN + FP)
        sens = TP / (TP + FN) if (TP + FN) > 0 else float('nan')
        spec = TN / (TN + FP) if (TN + FP) > 0 else float('nan')
        print(f"{class_names[c]}: sensitivity={sens:.4f}, specificity={spec:.4f}")

    # ROC/PR (لو ثنائي فقط)
    save_dir = Path(save_dir); save_dir.mkdir(parents=True, exist_ok=True)
    metrics = {
        "classes": class_names,
        "confusion_matrix": cm.tolist(),
        "confusion_matrix_norm": np.nan_to_num(cm_norm).tolist(),
    }

    if len(class_names) == 2:
        pos_idx = 1  # نفترض 'Malignant' هي الموجبة
        y_score = y_prob[:, pos_idx]
        try:
            roc_auc = roc_auc_score(y_true, y_score)
            fpr, tpr, _ = roc_curve(y_true, y_score)
            ap = average_precision_score(y_true, y_score)
            prec, rec, _ = precision_recall_curve(y_true, y_score)
            metrics.update({"roc_auc": float(roc_auc), "avg_precision": float(ap)})

            if make_plots:
                # ROC
                plt.figure()
                plt.plot(fpr, tpr, label=f"AUC={roc_auc:.3f}")
                plt.plot([0,1],[0,1],"--")
                plt.xlabel("FPR"); plt.ylabel("TPR"); plt.title(f"ROC - {prefix}")
                plt.legend(loc="lower right")
                plt.tight_layout(); plt.savefig(save_dir / f"{prefix}_roc.png", dpi=200)
                plt.close()

                # PR
                plt.figure()
                plt.plot(rec, prec, label=f"AP={ap:.3f}")
                plt.xlabel("Recall"); plt.ylabel("Precision"); plt.title(f"Precision-Recall - {prefix}")
                plt.legend(loc="lower left")
                plt.tight_layout(); plt.savefig(save_dir / f"{prefix}_pr.png", dpi=200)
                plt.close()
        except Exception as e:
            print(f"[WARN] ROC/PR skipped: {e}")

    # حفظ المخرجات
    (save_dir / f"{prefix}_y_true.npy").write_bytes(np.array(y_true).astype(np.int64).tobytes())
    np.save(save_dir / f"{prefix}_y_prob.npy", y_prob)
    np.save(save_dir / f"{prefix}_y_pred.npy", y_pred)

    with open(save_dir / f"{prefix}_classification_report.txt", "w", encoding="utf-8") as f:
        f.write(classification_report(y_true, y_pred, target_names=class_names, digits=4))
        f.write("\n\nConfusion Matrix (counts):\n")
        f.write(np.array2string(cm))
        f.write("\n\nConfusion Matrix (row-normalized):\n")
        f.write(np.array2string(np.nan_to_num(cm_norm)))

    with open(save_dir / f"{prefix}_metrics.json", "w", encoding="utf-8") as f:
        json.dump(metrics, f, indent=2)

    # إرجاع أشياء مهمّة لو بتستخدمها لاحقًا
    acc = (y_pred == y_true).mean()
    return acc, cm

def main():
    p = argparse.ArgumentParser("Thyroid EfficientNet evaluation (full details)")
    p.add_argument("--data_dir", required=True, help="root of dataset with train/val/test")
    p.add_argument("--out_dir", required=True, help="where best_model.pt and outputs reside")
    p.add_argument("--split", default="test", choices=["train","val","test"])
    p.add_argument("--batch_size", type=int, default=32)
    p.add_argument("--img_size", type=int, default=224)
    p.add_argument("--num_workers", type=int, default=0)
    p.add_argument("--ckpt", default="best_model.pt", help="checkpoint filename in out_dir")
    p.add_argument("--no_plots", action="store_true", help="disable saving plots")
    args = p.parse_args()

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Using device: {device.type}")

    # إحصاءات التوزيع والنِّسَب:
    for sp in ["train", "val", "test"]:
        counts = count_split(os.path.join(args.data_dir, sp))
        print(pretty_dist(sp, counts))

    # باني التحويلات والداتا
    tfm = get_transform(args.img_size)
    # نستخدم ImageFolder لكل split حتى نضمن class_to_idx ثابت
    ds_train = datasets.ImageFolder(os.path.join(args.data_dir, "train"), transform=tfm)
    class_to_idx = ds_train.class_to_idx
    idx_to_class = {v:k for k,v in class_to_idx.items()}
    class_names = [idx_to_class[i] for i in range(len(idx_to_class))]
    print(f"\nClasses ({len(class_names)}): {class_names}")

    # باني اللودر للـ split المطلوب
    target_root = os.path.join(args.data_dir, args.split)
    ds_eval = datasets.ImageFolder(target_root, transform=tfm)
    loader = torch.utils.data.DataLoader(ds_eval, batch_size=args.batch_size,
                                         shuffle=False, num_workers=args.num_workers,
                                         pin_memory=True)

    # بناء وتحميل النموذج
    model = build_model(num_classes=len(class_names))
    ckpt_path = os.path.join(args.out_dir, args.ckpt)
    meta, state = load_checkpoint(ckpt_path)
    # لو فيه mapping محفوظ، تأكد مطابق للفولدر
    if "class_to_idx_path" in meta and os.path.isfile(meta["class_to_idx_path"]):
        try:
            with open(meta["class_to_idx_path"], "r", encoding="utf-8") as f:
                saved_map = json.load(f)
            if saved_map != class_to_idx:
                print("[WARN] class_to_idx in checkpoint differs from dataset. Proceeding with current dataset mapping.")
        except Exception as e:
            print(f"[WARN] failed to read class_to_idx_path: {e}")

    missing, unexpected = model.load_state_dict(state, strict=False)
    if missing or unexpected:
        print(f"[WARN] load_state_dict: missing={len(missing)} unexpected={len(unexpected)}")
        if missing:   print("  missing:", missing[:10], "..." if len(missing)>10 else "")
        if unexpected:print("  unexpected:", unexpected[:10], "..." if len(unexpected)>10 else "")
    model.to(device)

    # تقييم
    acc, cm = eval_split(
        model, loader, device, class_names,
        save_dir=args.out_dir, prefix=args.split,
        make_plots=(not args.no_plots)
    )
    print(f"\nFinal {args.split} accuracy = {acc:.4f}")
    print(f"Outputs saved under: {args.out_dir}")

if __name__ == "__main__":
    main()
