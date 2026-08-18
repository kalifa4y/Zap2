# Repository Research — SnapCut

## 1. Repository Overview
* **Repository Path :** `c:\Users\legion\Desktop\SnapCut`
* **Status :** Nouveau projet initialisé à partir de zéro (Greenfield Project).
* **Documentation existante :**
  - `docs/project-discovery.md`
  - `docs/requirements.md`
  - `docs/technical-research.md`

---

## 2. Planned Repository Structure
Conformément aux spécifications validées, le projet s'organisera en deux répertoires principaux :

```text
snapcut/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── v1/
│   │   │       ├── endpoints/ (videos.py, cut.py, social.py, auth.py)
│   │   │       └── router.py
│   │   ├── core/ (config.py, database.py)
│   │   ├── models/ (project.py, clip.py, social.py)
│   │   ├── services/
│   │   │   ├── video_processor.py (FFmpeg + silencedetect + 9:16 filtergraph)
│   │   │   ├── speech_analyzer.py (faster-whisper word-level transcription)
│   │   │   └── social_publisher.py (YouTube, TikTok, Instagram OAuth & upload)
│   │   └── main.py
│   ├── storage/ (uploads/, exports/, temp/)
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/ (Dashboard, VideoUploader, ClipPreview, SocialAccounts, InteractiveTimeline)
│   │   ├── services/ (api.ts)
│   │   ├── hooks/ (useVideoProcessing.ts, useSocialAccounts.ts)
│   │   ├── types/ (index.ts)
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── vite.config.ts
├── docs/
└── README.md
```

---

## 3. Conventions & Standards
* **Backend :** PEP 8, Pydantic v2 pour les schémas, SQLAlchemy 2.0 ORM pour les modèles, gestion d'erreurs HTTP uniforme via `HTTPException` et handlers personnalisés.
* **Frontend :** TypeScript strict, architecture par composants modulaires, Tailwind CSS pour le style utilitaire avec palette Dark Studio, TanStack Query pour la gestion du cache et invalidation.
* **Environnement & Sécurité :** Variables d'environnement configurées via `.env`, stockage SQLite isolé dans `backend/snapcut.db`.

---

## 4. Discovery Summary & Status
* **Status :** PASS (Greenfield repository context mapped)
* **Next Phase :** 05 — task-planning
