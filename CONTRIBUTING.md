# Contributing to ZAP2 ⚡

Thank you for your interest in contributing to **ZAP2**! We welcome contributions to help make AI video repurposing faster, smarter, and more accessible for creators worldwide.

---

## 🛠️ Development Setup

### 1. Prerequisites
- **Python 3.11+**
- **Node.js 18+** & npm
- **FFmpeg 6.0+** (accessible in your system `PATH`)
- *(Optional)* NVIDIA GPU with CUDA for accelerated Whisper AI inference

### 2. Backend Setup
```bash
cd backend
python -m venv venv

# Windows:
.\venv\Scripts\activate
# Linux / macOS:
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env

# Run development server:
uvicorn app.main:app --reload --port 8000
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

---

## 🧪 Testing Guidelines

Before submitting a Pull Request, please ensure all automated tests pass:

### Run Backend Tests
```bash
cd backend
pytest -v
```

### Run Frontend Typecheck & Build
```bash
cd frontend
npm run build
```

---

## 📌 Pull Request Process

1. **Fork** the repository and create your feature branch:
   ```bash
   git checkout -b feature/my-new-feature
   ```
2. **Commit** your changes following conventional commits (`feat: ...`, `fix: ...`, `docs: ...`, `refactor: ...`).
3. **Ensure** all tests pass and no linter warnings are introduced.
4. **Push** to your branch and submit a Pull Request to `main`.
5. Describe clearly what your changes accomplish and link any related issues.

---

## 📄 License
By contributing to ZAP2, you agree that your contributions will be licensed under the project's [MIT License](LICENSE).
