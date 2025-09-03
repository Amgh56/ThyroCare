import argparse
import os
import re
import shutil
import sys
import hashlib
from pathlib import Path
from collections import defaultdict
from random import shuffle, seed

IMG_EXTS = {".jpg", ".jpeg", ".png", ".bmp", ".gif", ".tif", ".tiff"}

def is_image(p: Path) -> bool:
    return p.suffix.lower() in IMG_EXTS

def md5sum(path: Path, chunk=1024 * 1024):
    h = hashlib.md5()
    with open(path, "rb") as f:
        for c in iter(lambda: f.read(chunk), b""):
            h.update(c)
    return h.hexdigest()

def safe_copy_or_move(src: Path, dst: Path, move: bool):
    dst.parent.mkdir(parents=True, exist_ok=True)
    if move:
        shutil.move(str(src), str(dst))
    else:
        shutil.copy2(str(src), str(dst))

def infer_split_from_path(p: Path) -> str:
    """
    إن وُجد مجلد test/ أو train/ في المسار الأصلي سنحترمه.
    خلاف ذلك سنعتبره ضمن train (ليُقسّم لاحقًا إلى train/val).
    """
    parts = [s.lower() for s in p.parts]
    if "test" in parts:
        return "test"
    if "train" in parts:
        return "train"
    return "train"

def infer_class_from_path(p: Path) -> str | None:
    """
    نُوحّد التسميات:
    - Benign: أي مسار يحتوي 'benign' أو مجلدات 'Tiroides*' تحت قسم benign
    - Malignant: أي مسار يحتوي 'malignant' أو فئات TI-RADS مثل 4A/4B/4C/5
    - Normal: مجلد 'normal thyroid' أو أي مسار يحوي 'normal'
    """
    parts = [s.lower() for s in p.parts]
    path_l = "/".join(parts)

    # Normal
    if "normal thyroid" in path_l or re.search(r"\bnormal\b", path_l):
        return "Normal"

    # Malignant
    if "malignant" in parts or re.search(r"\b(4a|4b|4c|5)\b", path_l):
        return "Malignant"

    # Benign
    if "benign" in parts or any("tiroides" in s for s in parts):
        return "Benign"

    # فشل الاستدلال
    return None

def unique_name(dst_dir: Path, filename: str) -> Path:
    """يتفادى التعارض بزيادة عداد."""
    base = Path(filename).stem
    ext = Path(filename).suffix
    candidate = dst_dir / (base + ext)
    k = 1
    while candidate.exists():
        candidate = dst_dir / f"{base}_{k}{ext}"
        k += 1
    return candidate

def scan_images(src_root: Path):
    files = []
    for p in src_root.rglob("*"):
        if p.is_file() and is_image(p):
            files.append(p)
    return files

def main():
    ap = argparse.ArgumentParser(description="Reorganize thyroid ultrasound dataset")
    ap.add_argument("--src", required=True, type=Path,
                    help="مسار الجذر الحالي للبيانات (مثال: C:\\datasets\\thyroid\\dataset thyroid)")
    ap.add_argument("--dst", required=True, type=Path,
                    help="مسار الإخراج (مثال: C:\\datasets\\thyroid_clean)")
    ap.add_argument("--val-split", type=float, default=0.1,
                    help="نسبة التحقق من train (بين 0 و 1)")
    ap.add_argument("--seed", type=int, default=42, help="بذرة العشوائية لتكرار النتائج")
    ap.add_argument("--move", action="store_true", help="انقل الملفات بدل نسخها")
    ap.add_argument("--dedup", action="store_true", help="حذف التكرارات حسب MD5 في داخل كل فئة/مجموعة")
    args = ap.parse_args()

    src = args.src.resolve()
    dst = args.dst.resolve()
    dst_train = dst / "train"
    dst_val   = dst / "val"
    dst_test  = dst / "test"

    if not src.exists():
        print(f"[ERROR] Source not found: {src}", file=sys.stderr)
        sys.exit(1)

    # مسح جميع الصور
    imgs = scan_images(src)
    if not imgs:
        print(f"[ERROR] No images found under: {src}", file=sys.stderr)
        sys.exit(1)

    seed(args.seed)

    # صنّف الصور مؤقتًا حسب (split_inferred, class_inferred)
    buckets = defaultdict(list)  # (split, cls) -> [paths]
    unclassified = []

    for p in imgs:
        split = infer_split_from_path(p)
        cls = infer_class_from_path(p)
        if cls is None:
            unclassified.append(p)
            continue
        buckets[(split, cls)].append(p)

    if unclassified:
        print(f"[WARN] {len(unclassified)} images couldn't be classified; they will be skipped.")
        # لو حاب لاحقًا: نقدر نرميها في Benign مثلًا، أو نحفظ قائمة بها.

    # الآن ننقل/ننسخ:
    # 1) أي صور تحت split=test توضع مباشرة في dst/test/<Class>/
    # 2) أي صور تحت split=train سنقسّمها إلى train/val بنسبة val-split
    summary = defaultdict(int)

    # معالجة TEST كما هو
    for (split, cls), files in buckets.items():
        if split != "test":
            continue
        out_dir = dst_test / cls
        out_dir.mkdir(parents=True, exist_ok=True)

        # dedup داخل هذا المجلد (اختياري)
        seen = set()
        if args.dedup:
            for f in files:
                h = md5sum(f)
                if h in seen:
                    continue
                seen.add(h)
                dst_path = unique_name(out_dir, f.name)
                safe_copy_or_move(f, dst_path, move=args.move)
                summary[f"test/{cls}"] += 1
        else:
            for f in files:
                dst_path = unique_name(out_dir, f.name)
                safe_copy_or_move(f, dst_path, move=args.move)
                summary[f"test/{cls}"] += 1

    # معالجة TRAIN → تقسيم إلى TRAIN/VAL
    train_classes = defaultdict(list)  # cls -> files (from any train subfolders)
    for (split, cls), files in buckets.items():
        if split == "train":
            train_classes[cls].extend(files)

    for cls, files in train_classes.items():
        shuffle(files)
        n = len(files)
        n_val = int(round(n * args.val_split))
        val_files = files[:n_val]
        train_files = files[n_val:]

        # dedup داخل كل مجلد هدف
        for group_name, group_files, base_out in [
            ("train", train_files, dst_train),
            ("val",   val_files,   dst_val)
        ]:
            out_dir = base_out / cls
            out_dir.mkdir(parents=True, exist_ok=True)

            seen = set()
            if args.dedup:
                for f in group_files:
                    h = md5sum(f)
                    if h in seen:
                        continue
                    seen.add(h)
                    dst_path = unique_name(out_dir, f.name)
                    safe_copy_or_move(f, dst_path, move=args.move)
                    summary[f"{group_name}/{cls}"] += 1
            else:
                for f in group_files:
                    dst_path = unique_name(out_dir, f.name)
                    safe_copy_or_move(f, dst_path, move=args.move)
                    summary[f"{group_name}/{cls}"] += 1

    print("\n== Summary ==")
    grand_total = 0
    for k in sorted(summary.keys()):
        print(f"{k:20s}: {summary[k]}")
        grand_total += summary[k]
    print(f"Total images moved/copied: {grand_total}")

    if unclassified:
        print("\nUnclassified examples (first 20):")
        for p in unclassified[:20]:
            print(" -", p)

if __name__ == "__main__":
    main()
