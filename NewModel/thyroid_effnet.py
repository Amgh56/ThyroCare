import argparse
import json
import os
from pathlib import Path
from typing import Tuple, Dict, List

import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, WeightedRandomSampler
from torchvision import datasets, transforms, models
from torchvision.models import EfficientNet_B0_Weights

# =========================
# Transforms
# =========================
def build_transforms(img_size: int):
    train_tfms = transforms.Compose([
        transforms.Resize((img_size, img_size)),
        transforms.RandomHorizontalFlip(p=0.5),
        transforms.RandomRotation(15),
        transforms.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.2),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406],
                             std=[0.229, 0.224, 0.225]),
    ])
    eval_tfms = transforms.Compose([
        transforms.Resize((img_size, img_size)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406],
                             std=[0.229, 0.224, 0.225]),
    ])
    return train_tfms, eval_tfms


# =========================
# Dataloaders
# =========================
def class_counts_from_dataset(ds: datasets.ImageFolder) -> List[int]:
    # torchvision ImageFolder doesn't expose targets directly pre-0.16,
    # but samples contains (path, class_idx)
    targets = [lbl for _, lbl in ds.samples]
    num_classes = len(ds.classes)
    counts = [0] * num_classes
    for t in targets:
        counts[t] += 1
    return counts

def make_weighted_sampler(ds: datasets.ImageFolder) -> WeightedRandomSampler:
    counts = class_counts_from_dataset(ds)
    # inverse freq weights per class
    class_weights = torch.tensor([1.0 / max(c, 1) for c in counts], dtype=torch.float)
    sample_weights = [class_weights[lbl].item() for _, lbl in ds.samples]
    return WeightedRandomSampler(weights=sample_weights, num_samples=len(sample_weights), replacement=True)

def build_dataloaders(
    data_dir: str,
    img_size: int,
    batch_size: int,
    num_workers: int,
    oversample: bool = False
) -> Tuple[DataLoader, DataLoader, List[str]]:
    train_tfms, eval_tfms = build_transforms(img_size)

    train_dir = Path(data_dir) / "train"
    val_dir   = Path(data_dir) / "val"
    if not train_dir.exists():
        raise FileNotFoundError(f"train directory not found: {train_dir}")
    if not val_dir.exists():
        raise FileNotFoundError(f"val directory not found: {val_dir}")

    train_ds = datasets.ImageFolder(root=str(train_dir), transform=train_tfms)
    val_ds   = datasets.ImageFolder(root=str(val_dir),   transform=eval_tfms)

    pin_memory = torch.cuda.is_available()

    if oversample:
        sampler = make_weighted_sampler(train_ds)
        train_loader = DataLoader(
            train_ds, batch_size=batch_size, sampler=sampler,
            num_workers=num_workers, pin_memory=pin_memory
        )
    else:
        train_loader = DataLoader(
            train_ds, batch_size=batch_size, shuffle=True,
            num_workers=num_workers, pin_memory=pin_memory
        )

    val_loader = DataLoader(
        val_ds, batch_size=batch_size, shuffle=False,
        num_workers=num_workers, pin_memory=pin_memory
    )

    return train_loader, val_loader, train_ds.classes


# =========================
# Model
# =========================
def build_model(num_classes: int) -> nn.Module:
    model = models.efficientnet_b0(weights=EfficientNet_B0_Weights.DEFAULT)
    in_features = model.classifier[1].in_features
    model.classifier[1] = nn.Linear(in_features, num_classes)
    return model


# =========================
# Train / Eval Epochs
# =========================
def train_one_epoch(
    model: nn.Module,
    loader: DataLoader,
    criterion: nn.Module,
    optimizer: optim.Optimizer,
    device: torch.device,
    scaler: "torch.amp.GradScaler",
    amp_enabled: bool
) -> Tuple[float, float]:
    model.train()
    total_loss, correct, total = 0.0, 0, 0

    for images, labels in loader:
        images, labels = images.to(device), labels.to(device)
        optimizer.zero_grad(set_to_none=True)

        with torch.amp.autocast(device_type=device.type, enabled=amp_enabled):
            outputs = model(images)
            loss = criterion(outputs, labels)

        if amp_enabled:
            scaler.scale(loss).backward()
            scaler.step(optimizer)
            scaler.update()
        else:
            loss.backward()
            optimizer.step()

        total_loss += loss.item() * images.size(0)
        _, preds = outputs.max(1)
        correct += (preds == labels).sum().item()
        total += labels.size(0)

    return total_loss / total, correct / total


@torch.no_grad()
def evaluate(
    model: nn.Module,
    loader: DataLoader,
    criterion: nn.Module,
    device: torch.device
) -> Tuple[float, float]:
    model.eval()
    total_loss, correct, total = 0.0, 0, 0

    for images, labels in loader:
        images, labels = images.to(device), labels.to(device)
        outputs = model(images)
        loss = criterion(outputs, labels)
        total_loss += loss.item() * images.size(0)
        _, preds = outputs.max(1)
        correct += (preds == labels).sum().item()
        total += labels.size(0)

    return total_loss / total, correct / total


# =========================
# Checkpoint I/O
# =========================
def save_checkpoint(
    out_dir: str,
    model: nn.Module,
    class_to_idx: Dict[str, int],
    img_size: int,
    filename: str
):
    Path(out_dir).mkdir(parents=True, exist_ok=True)
    ckpt = {
        "model_state": model.state_dict(),
        "img_size": img_size,
        "class_to_idx": class_to_idx,
        "arch": "efficientnet_b0",
        "weights": "EfficientNet_B0_Weights.DEFAULT",
    }
    torch.save(ckpt, str(Path(out_dir) / filename))
    with open(Path(out_dir) / "class_to_idx.json", "w", encoding="utf-8") as f:
        json.dump(class_to_idx, f, ensure_ascii=False, indent=2)


def load_checkpoint(ckpt_path: str, map_location: str = "cpu"):
    state = torch.load(ckpt_path, map_location=map_location)
    # backward compatibility if someone saved raw state_dict
    if isinstance(state, dict) and "model_state" in state:
        return state
    elif isinstance(state, dict):
        # maybe it is a raw state_dict
        return {
            "model_state": state,
            "img_size": 224,
            "class_to_idx": None,
            "arch": "efficientnet_b0",
            "weights": "EfficientNet_B0_Weights.DEFAULT",
        }
    else:
        raise TypeError(f"Unexpected checkpoint type: {type(state)}")


# =========================
# Main Train
# =========================
def train_main(args):
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Using device: {device.type}")

    train_loader, val_loader, classes = build_dataloaders(
        args.data_dir, args.img_size, args.batch_size, args.num_workers, oversample=args.oversample
    )
    print(f"Classes ({len(classes)}): {classes}")

    model = build_model(num_classes=len(classes)).to(device)

    # criterion (optional weighted CE)
    if args.weighted_ce:
        # compute class counts on training set
        counts = class_counts_from_dataset(train_loader.dataset)
        # weight = total / (num_classes * count_c)  (common heuristic)
        total_n = sum(counts)
        num_c = len(counts)
        weights = [total_n / (num_c * max(c, 1)) for c in counts]
        class_weights = torch.tensor(weights, dtype=torch.float, device=device)
        criterion = nn.CrossEntropyLoss(weight=class_weights)
    else:
        criterion = nn.CrossEntropyLoss()

    optimizer = optim.AdamW(model.parameters(), lr=args.lr, weight_decay=args.wd)
    amp_enabled = (args.amp and device.type == "cuda")
    scaler = torch.amp.GradScaler(enabled=amp_enabled)

    best_val_acc = 0.0
    patience_counter = 0

    for epoch in range(1, args.epochs + 1):
        train_loss, train_acc = train_one_epoch(model, train_loader, criterion, optimizer, device, scaler, amp_enabled)
        val_loss, val_acc = evaluate(model, val_loader, criterion, device)

        print(f"Epoch {epoch:03d}/{args.epochs} | "
              f"train_loss={train_loss:.4f} acc={train_acc:.4f} | "
              f"val_loss={val_loss:.4f} acc={val_acc:.4f}")

        # save 'last' every epoch
        save_checkpoint(args.out_dir, model, train_loader.dataset.class_to_idx, args.img_size, "last_model.pt")

        # best
        if val_acc >= best_val_acc:
            best_val_acc = val_acc
            save_checkpoint(args.out_dir, model, train_loader.dataset.class_to_idx, args.img_size, "best_model.pt")
            print(f"  ✓ Saved new best to {Path(args.out_dir) / 'best_model.pt'} (val_acc={best_val_acc:.4f})")
            patience_counter = 0
        else:
            patience_counter += 1

        # optional early stopping
        if args.early_stop > 0 and patience_counter >= args.early_stop:
            print(f"Early stopping (no val improvement for {args.early_stop} epochs).")
            break


# =========================
# Eval Main (quick test/val)
# =========================
@torch.no_grad()
def eval_main(args):
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    ckpt_path = args.ckpt
    if ckpt_path is None:
        ckpt_path = str(Path(args.out_dir) / "best_model.pt")

    state = load_checkpoint(ckpt_path, map_location=device.type)
    img_size = state.get("img_size", args.img_size)
    class_to_idx = state.get("class_to_idx", None)

    # build loaders on the requested split (default: test if present else val)
    split = args.split
    data_dir = Path(args.data_dir)
    split_dir = data_dir / split
    if not split_dir.exists():
        fallback = "val"
        print(f"[WARN] {split!r} split not found. Falling back to '{fallback}'.")
        split = fallback

    _, eval_tfms = build_transforms(img_size)
    ds = datasets.ImageFolder(root=str(data_dir / split), transform=eval_tfms)
    loader = DataLoader(ds, batch_size=args.batch_size, shuffle=False, num_workers=args.num_workers,
                        pin_memory=torch.cuda.is_available())

    # build model with the right number of classes
    model = build_model(num_classes=len(ds.classes)).to(device)
    model.load_state_dict(state["model_state"], strict=False)
    model.eval()

    # infer
    criterion = nn.CrossEntropyLoss()
    total_loss, correct, total = 0.0, 0, 0
    all_preds, all_lbls = [], []

    for images, labels in loader:
        images, labels = images.to(device), labels.to(device)
        outputs = model(images)
        loss = criterion(outputs, labels)

        total_loss += loss.item() * images.size(0)
        _, preds = outputs.max(1)
        correct += (preds == labels).sum().item()
        total += labels.size(0)

        all_preds.append(preds.cpu())
        all_lbls.append(labels.cpu())

    total_loss /= max(total, 1)
    acc = correct / max(total, 1)
    print(f"Eval on '{split}': loss={total_loss:.4f} acc={acc:.4f} (n={total})")

    # optional confusion matrix / report (text only to keep deps minimal)
    if args.report:
        import numpy as np
        from collections import Counter

        y_true = torch.cat(all_lbls).numpy()
        y_pred = torch.cat(all_preds).numpy()
        classes = ds.classes

        # confusion
        num_c = len(classes)
        cm = [[0]*num_c for _ in range(num_c)]
        for t, p in zip(y_true, y_pred):
            cm[t][p] += 1

        print("\nConfusion Matrix:")
        header = " " * 12 + " ".join(f"{c[:9]:>10}" for c in classes)
        print(header)
        for i, row in enumerate(cm):
            print(f"{classes[i][:10]:>10} " + " ".join(f"{v:>10d}" for v in row))

        # precision/recall/f1 (micro)
        def safe_div(a, b): return a / b if b else 0.0
        stats = []
        for i in range(num_c):
            tp = cm[i][i]
            fp = sum(cm[r][i] for r in range(num_c) if r != i)
            fn = sum(cm[i][c] for c in range(num_c) if c != i)
            prec = safe_div(tp, tp + fp)
            rec  = safe_div(tp, tp + fn)
            f1   = safe_div(2*prec*rec, prec+rec) if (prec+rec) else 0.0
            stats.append((prec, rec, f1, sum(cm[i])))

        print("\nPer-class metrics:")
        for (prec, rec, f1, sup), name in zip(stats, classes):
            print(f"{name:>10} | P={prec:.3f} R={rec:.3f} F1={f1:.3f} (n={sup})")


# =========================
# CLI
# =========================
def parse_args():
    p = argparse.ArgumentParser("Thyroid EfficientNet-B0 Trainer/Evaluator")
    sub = p.add_subparsers(dest="cmd", required=True)

    # train
    pt = sub.add_parser("train")
    pt.add_argument("--data_dir", type=str, required=True)
    pt.add_argument("--out_dir", type=str, required=True)
    pt.add_argument("--epochs", type=int, default=20)
    pt.add_argument("--batch_size", type=int, default=32)
    pt.add_argument("--img_size", type=int, default=224)
    pt.add_argument("--num_workers", type=int, default=0)  # Windows-friendly
    pt.add_argument("--lr", type=float, default=3e-4)
    pt.add_argument("--wd", type=float, default=1e-4)
    pt.add_argument("--amp", action="store_true", help="Enable CUDA AMP (ignored on CPU).")
    pt.add_argument("--weighted_ce", action="store_true", help="Use class-weighted cross-entropy.")
    pt.add_argument("--oversample", action="store_true", help="Oversample minority class with WeightedRandomSampler.")
    pt.add_argument("--early_stop", type=int, default=0, help="Early stopping patience (0=disabled).")

    # eval
    pe = sub.add_parser("eval")
    pe.add_argument("--data_dir", type=str, required=True)
    pe.add_argument("--out_dir", type=str, required=True)
    pe.add_argument("--ckpt", type=str, default=None, help="Path to checkpoint (defaults to best_model.pt).")
    pe.add_argument("--split", type=str, default="test", choices=["train", "val", "test"])
    pe.add_argument("--batch_size", type=int, default=64)
    pe.add_argument("--img_size", type=int, default=224)
    pe.add_argument("--num_workers", type=int, default=0)
    pe.add_argument("--report", action="store_true", help="Print confusion matrix and per-class metrics.")

    return p.parse_args()


def main():
    args = parse_args()
    if args.cmd == "train":
        train_main(args)
    elif args.cmd == "eval":
        eval_main(args)
    else:
        raise ValueError(f"Unknown cmd: {args.cmd}")


if __name__ == "__main__":
    main()
