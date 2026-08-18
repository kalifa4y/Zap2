# Project Discovery — SnapCut

## 1. Project Overview
**SnapCut** est une application web locale tout-en-un conçue pour les créateurs de contenu vidéo et streamers. Elle automatise la transformation d'enregistrements vidéo bruts longs (ex: rediffusions de lives TikTok, Twitch, YouTube) en clips courts verticaux (Shorts / Reels / TikToks de 30s à 60s) optimisés, débarrassés des silences et tics de langage, recadrés en 9:16 avec arrière-plan immersif, et publiables directement sur les plateformes sociales via leurs APIs officielles.

---

## 2. Problem Statement
* **Problème :** L'édition manuelle de rediffusions de streams/lives (souvent de 1h à 4h) pour en extraire des moments forts au format court vertical est chronophage, répétitive et fastidieuse (détection manuelle des silences, coupe des "euh/hum", recadrage 9:16, export, puis ré-upload manuel plateforme par plateforme).
* **Personnes affectées :** Créateurs de contenu, streamers, podcasteurs, community managers.
* **Solution actuelle :** Utilisation d'éditeurs vidéo lourds (Premiere Pro, DaVinci Resolve, CapCut) nécessitant un montage manuel ou services SaaS cloud onéreux avec quotas stricts et upload lent de fichiers gigaoctets.
* **Limites actuelles :** Perte de temps, latence de transfert cloud sur de gros fichiers bruts, coûts d'abonnement récurrents, workflows fragmentés entre le montage et la publication multi-réseaux.
* **Pourquoi c'est important :** Les formats courts verticaux sont le premier vecteur d'acquisition d'audience. Maximiser la cadence de publication sans sacrifier des heures de montage manuel est un levier de croissance critique.

---

## 3. Target Users & Personas
* **Créateur Solo / Streamer (Utilisateur Principal) :**
  * *Besoins :* Automatiser l'extraction rapide de pépites sans passer 3h sur un logiciel de montage complexe.
  * *Compétence technique :* Intermédiaire à avancée (confortable avec le lancement d'une app locale, maîtrise de ses comptes réseaux sociaux).
  * *Contraintes :* Ressources machine locales (CPU/GPU) pour le traitement Whisper et FFmpeg, stockage disque local.
* **Community Manager / Monteur Débutant (Utilisateur Secondaire) :**
  * *Besoins :* Traitement par lots, prévisualisation rapide, édition simple des métadonnées (titres, hashtags, descriptions) et déclenchement de publication multi-comptes en 1 clic.

---

## 4. Value Proposition
* **Traitement 100% Local & Gratuit :** Pas d'upload cloud de vidéos de plusieurs Go vers un serveur tiers ; confidentialité totale et rapidité de traitement sur le matériel local.
* **Pipeline Intelligent IA & Audio :** Détection automatique des silences (FFmpeg `silencedetect`) couplée à la transcription horodatée précise (Faster-Whisper CTranslate2) pour éradiquer les hésitations verbales ("euh", "hum").
* **Mise en Page Verticale Automatisée :** Recadrage intelligent 1080x1920 (9:16) avec arrière-plan flouté dynamique et centrage sujet.
* **Multi-Posting Instantané :** Connexion OAuth2 sécurisée à YouTube Data API v3, TikTok Content Posting API et Instagram Graph API pour prévisualiser et publier directement.

---

## 5. Primary Objective
Permettre à un créateur d'importer un live de 1h à 2h et d'obtenir en moins de 10 minutes une liste de 5 à 15 Shorts verticaux épurés, prêts à être validés et publiés simultanément sur YouTube Shorts, TikTok et Instagram Reels.

---

## 6. Success Criteria & Metrics
1. **Temps de traitement :** Traitement de 30 min de vidéo en moins de 3 à 5 minutes (selon GPU/CPU local).
2. **Précision du découpage :** Suppression propre des silences (> -30dB / > 0.5s paramétrable) sans coupure de début ou fin de mot.
3. **Qualité vidéo 9:16 :** Rendu fluide en 1080x1920 (H.264/AAC) sans désynchronisation audio/vidéo.
4. **Taux de succès de publication :** 100% des requêtes OAuth2 valides parviennent à uploader les métadonnées et le média vers les APIs cibles.

---

## 7. Scope Definition

### In Scope (MVP)
* Ingestion locale de fichiers vidéo (.mp4, .mov, .mkv, .webm).
* Analyse audio : détection des silences via FFmpeg.
* Transcription locale : Faster-Whisper avec timestamps au niveau du mot pour repérer et couper les tics de langage et isoler les séquences pertinentes.
* Découpage et segmentation automatique en clips verticaux de 30s à 60s.
* Rendu vidéo 1080x1920 (9:16) avec flou d'arrière-plan esthétique et centrage.
* Studio UI : Visualisation des clips générés, lecteur vidéo intégré, ajustement fin des timecodes (start/end), édition du titre, de la description et des hashtags.
* Authentification OAuth2 locale et gestion des tokens (YouTube, TikTok, Instagram) persistés dans SQLite.
* Upload direct multi-plateforme avec barre de progression et suivi d'état.

### Out of Scope (Pour le MVP)
* Détection faciale dynamique en temps réel avec suivi de mouvement complexe (face tracking IA multi-personnes en temps réel) — une composition propre avec flou d'arrière-plan + centrage est ciblée pour le MVP.
* Sous-titres dynamiques animés style "Karaoke/Alex Hormozi" (réservé pour V2).
* Planification avancée dans le temps (scheduling avec calendrier complexe et file d'attente sur plusieurs semaines).

### Future Possibilities (V2+)
* Génération automatique de sous-titres animés avec mise en valeur des mots-clés.
* Intégration de LLM local (Ollama / Gemini) pour générer automatiquement les titres viraux et hashtags optimisés.
* Détection automatique des moments forts basée sur l'émotion et l'intonation vocale.

---

## 8. MVP Definition
Le MVP se compose de 3 modules interconnectés :
1. **Module A (Pipeline Ingestion & Cut) :** Découpe intelligente silences + tics verbaux + format 9:16.
2. **Module B (Studio Preview & Édition) :** Liste des clips, lecteur interactif, ajustement début/fin, formulaires SEO (titres/hashtags).
3. **Module C (Publication Sociale) :** Gestion des comptes connectés OAuth2 et upload vers YouTube Shorts, TikTok et Instagram Reels.

---

## 9. Assumptions
* `[CONFIRMED]` Le système s'exécute localement sur la machine de l'utilisateur (Windows/Linux/macOS).
* `[CONFIRMED]` FFmpeg est disponible ou packagé sur la machine hôte.
* `[ASSUMPTION]` L'utilisateur dispose de clés API d'application développeur (Google Cloud Console, Meta for Developers, TikTok Developer Portal) pour configurer ses identifiants OAuth2 client.
* `[ASSUMPTION]` La machine dispose de ressources suffisantes (4+ Go de RAM, CPU multi-cœur ou GPU NVIDIA CUDA compatible pour accélérer Whisper).

---

## 10. Constraints
* **Performance :** L'analyse Whisper et l'encodage FFmpeg doivent être exécutés de manière asynchrone (BackgroundTasks) sans bloquer l'API FastAPI ni geler l'interface React.
* **Sécurité locale :** Stockage sécurisé des Client Secrets et Access/Refresh Tokens dans une base locale SQLite protégée.
* **Quotas API :** Respect des limites de taille et de format imposées par les plateformes (ex: YouTube API 10,000 quota units/jour, Instagram Reels max 60s/90s).

---

## 11. Risks & Mitigations
| Risque | Impact | Probabilité | Mitigation |
|---|---|---|---|
| Saturation mémoire ou crash sur très longs fichiers (2h+ 4K) | Élevé | Moyenne | Traitement par flux (streaming/chunks), extraction de l'audio seul pour Whisper, ré-encodage uniquement des segments utiles. |
| Expiration ou révocation des tokens OAuth2 | Moyen | Élevée | Gestion automatique du rafraîchissement des tokens (`refresh_token`) et statut visuel clair dans l'interface. |
| Absence de GPU / Lenteur Faster-Whisper | Moyen | Moyenne | Utilisation du modèle `tiny` ou `base` avec quantification `int8` sur CPU par défaut, sélection du modèle paramétrable. |

---

## 12. Open Questions & User Clarifications
1. Les identifiants API (Client ID / Client Secret) pour YouTube, TikTok et Instagram seront-ils saisis via un fichier `.env` ou directement configurables depuis une page Paramètres dans l'interface ? *(Recommandé : support des deux — `.env` pour le dev/défaut + interface de configuration)*.
2. Modèle Faster-Whisper par défaut : Préférence pour `base` (rapide et léger pour CPU) avec possibilité de basculer sur `small` ou `medium` si GPU disponible ? *(Recommandé : `base` avec fallback CPU int8)*.

---

## 13. Discovery Status
**Status : READY**
Le projet est clairement défini, le périmètre MVP est délimité, les besoins utilisateurs et contraintes sont identifiés. Le projet peut progresser vers la phase 02 — Requirements Engineering.

---

## 14. Key Decisions
* **Decision 01 :** Architecture découplée Frontend SPA (React/Vite/TS) + Backend API REST & WebSocket/SSE (FastAPI/Python).
  * *Reason :* Séparation nette des responsabilités, réactivité de l'UI et accès direct aux bibliothèques multimédia Python (FFmpeg, Faster-Whisper, OpenCV).
* **Decision 02 :** Base SQLite locale avec SQLAlchemy.
  * *Reason :* Zéro configuration externe requise pour l'utilisateur, persistance locale idéale pour une application de bureau/locale.
