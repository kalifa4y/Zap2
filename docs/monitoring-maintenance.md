# Monitoring & Maintenance Guide — SnapCut

## 1. Overview
Ce guide détaille les procédures d'observabilité, d'entretien périodique, de gestion des jetons OAuth2 et de résolution d'incidents pour l'application locale **SnapCut**.

---

## 2. Observability & Logging
* **Logs Backend :** Gérés par le module standard `logging` de Python avec formatage horodaté :
  ```text
  2026-08-18 18:30:00,123 [INFO] snapcut.video_processor: Detected 12 silence periods in live.mp4
  ```
* **Surveillance d'État (Healthcheck) :**
  - Endpoint : `GET /api/v1/health`
  - Fréquence recommandée pour l'UI : 5 secondes en arrière-plan.

---

## 3. Maintenance & Storage Housekeeping
1. **Purge des Fichiers Temporaires (`storage/temp/`) :**
   - Les fichiers `.wav` extraits pour Faster-Whisper sont supprimés automatiquement dès la fin de la transcription.
   - En cas d'arrêt forcé du processus, un nettoyage au démarrage vide les fichiers résiduels.
2. **Nettoyage des Exports Anciens :**
   - Les clips 9:16 exportés dans `storage/exports/` peuvent être archivés ou supprimés sans affecter la base de données.

---

## 4. OAuth2 Token Life-Cycle & Auto-Renewal
* **Détection d'Expiration :** Le service `SocialPublisher` vérifie systématiquement `token_expires_at` avant toute tentative d'upload.
* **Renouvellement Automatique :** Si le jeton expire dans moins de 5 minutes, une requête `refresh_token` est émise de manière transparente vers l'API OAuth2 de la plateforme (Google / TikTok / Meta).

---

## 5. Status
* **Status :** ACTIVE & OPERATIONAL
* **Lifecycle Completion :** TOUS LES JALONS (01 à 16) DU CYCLE DE VIE LOGICIEL SONT VALIDÉS AVEC SUCCÈS.
