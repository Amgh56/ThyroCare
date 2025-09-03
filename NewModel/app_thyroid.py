# app_thyroid.py
import os, argparse, json
import numpy as np
from PIL import Image
import torch
import torch.nn as nn
from torchvision import transforms, models, datasets
import gradio as gr

MEAN = [0.485, 0.456, 0.406]
STD  = [0.229, 0.224, 0.225]

def build_model(num_classes: int):
    m = models.efficientnet_b0(weights=None)  # نعيد استخدام نفس المعمارية
    in_feat = m.classifier[1].in_features
    m.classifier[1] = nn.Linear(in_feat, num_classes)
    return m

def load_classes(train_dir: str):
    ds = datasets.ImageFolder(train_dir)
    idx_to_class = {v:k for k, v in ds.class_to_idx.items()}
    classes = [idx_to_class[i] for i in range(len(idx_to_class))]
    return classes

def load_model(ckpt_path: str, num_classes: int, device: torch.device):
    state = torch.load(ckpt_path, map_location="cpu")
    # دعم عدة صيغ حفظ (state_dict مباشر أو داخل مفاتيح)
    if isinstance(state, dict):
        for k in ["model_state", "state_dict", "model"]:
            if k in state and isinstance(state[k], dict):
                state = state[k]
                break
    model = build_model(num_classes)
    model.load_state_dict(state, strict=False)
    model.to(device).eval()
    return model

def get_transform(img_size: int):
    return transforms.Compose([
        transforms.Resize((img_size, img_size)),
        transforms.ToTensor(),
        transforms.Normalize(MEAN, STD)
    ])

def make_predict_fn(args):
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    classes = load_classes(os.path.join(args.data_dir, "train"))
    model = load_model(args.ckpt, len(classes), device)
    tfm = get_transform(args.img_size)

    def predict(image: Image.Image):
        if image is None:
            return "No image", {}, None
        if not isinstance(image, Image.Image):
            image = Image.fromarray(image)

        im = image.convert("RGB")
        x = tfm(im).unsqueeze(0).to(device)

        with torch.no_grad():
            logits = model(x)
            probs = torch.softmax(logits, dim=1)[0].cpu().numpy()

        top = int(np.argmax(probs))
        label = classes[top]
        conf = float(probs[top])

        # نُعيد مخطط احتمالات لكل الفئات
        prob_dict = {cls: float(probs[i]) for i, cls in enumerate(classes)}
        return f"{label}  (conf={conf:.3f})", prob_dict, json.dumps(prob_dict, indent=2)

    return predict, classes

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--data_dir", default=r"C:\datasets\thyroid_clean", help="جذر البيانات (لاستخراج ترتيب الفئات من train)")
    ap.add_argument("--ckpt", default=r"C:\models\thyroid_effnet_balanced\best_model.pt", help="مسار نموذج best_model.pt")
    ap.add_argument("--img_size", type=int, default=224)
    ap.add_argument("--server_port", type=int, default=7860)
    ap.add_argument("--server_name", default="127.0.0.1")  # غيّرها إلى 0.0.0.0 لو تبي من جهاز آخر على الشبكة
    args = ap.parse_args()

    predict, classes = make_predict_fn(args)

    with gr.Blocks(title="Thyroid Ultrasound Classifier") as demo:
        gr.Markdown("# 🧠 Thyroid Ultrasound Classifier")
        gr.Markdown(
            f"**Classes:** {classes}  \n"
            f"Model: `{os.path.basename(args.ckpt)}`  •  Image size: `{args.img_size}x{args.img_size}`"
        )

        with gr.Row():
            inp = gr.Image(type="pil", label="Upload ultrasound image")
            with gr.Column():
                out_label = gr.Label(label="Prediction (top-1)")
                out_probs = gr.Label(label="Class probabilities")
                out_json  = gr.Code(label="Raw probabilities (JSON)", language="json")

        btn = gr.Button("Predict")
        btn.click(fn=predict, inputs=inp, outputs=[out_label, out_probs, out_json])

        gr.Markdown("Tips: تأكد أن الصورة ultrasound فعلًا ومُمثّلة للغدة الدرقية.")

    demo.launch(server_name=args.server_name, server_port=args.server_port)

if __name__ == "__main__":
    main()
