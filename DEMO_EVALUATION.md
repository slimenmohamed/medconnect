# Guide de démonstration — Soutenance MedConnect

> Suis ce document **dans l'ordre**, étape par étape, pendant la soutenance.
> Durée estimée : **20 à 25 min de démo + 5 min de Q/R**.
>
> Pour chaque étape tu as :
> - **TU FAIS** : l'action concrète (commande, clic…)
> - **TU MONTRES** : la fenêtre/onglet à l'écran
> - **TU DIS** : la phrase à prononcer pour expliquer
> - **CE QUI DOIT APPARAÎTRE** : la sortie attendue (pour ne pas te perdre)

---

## 📋 Préparation (5 min avant la soutenance)

### 0.1 — Ouvrir tous les onglets utiles à l'avance

Ouvre **dans cet ordre** ces onglets dans ton navigateur (en navigation **normale** pour les outils, **privée** pour le front) :

| # | URL | À quoi ça sert |
|---|---|---|
| 1 | http://localhost | Frontend Angular (en privé) |
| 2 | http://localhost:8761 | Eureka — registre de services |
| 3 | http://localhost:15672 | RabbitMQ Management (guest/guest) |
| 4 | http://localhost:8180/admin | Keycloak Admin (admin/admin) |
| 5 | http://localhost:8080/swagger-ui.html | Swagger central agrégé |
| 6 | http://localhost:8080/actuator/prometheus | Métriques Prometheus |

### 0.2 — Lancer toute la stack (une seule commande)

```powershell
cd "C:\Users\LeGion\Desktop\projet web dustribie"
docker compose up -d
```

Attendre **~2 min** que tout passe healthy.

### 0.3 — Vérifier que tout est healthy

```powershell
docker compose ps
```

**Tu dois voir 10 conteneurs `(healthy)`** :

```
mc-appointment   (healthy)
mc-config-server (healthy)
mc-discovery     (healthy)
mc-frontend      (healthy)
mc-gateway       (healthy)
mc-keycloak      (healthy)
mc-mongo         (healthy)
mc-mysql         (healthy)
mc-rabbitmq      (healthy)
mc-records       (healthy)
```

> ✅ Si tout est vert → tu es prêt. Sinon attends 1 min de plus.

---

# 🎬 LA DÉMO

## ÉTAPE 1 — Présenter l'architecture (2 min, sans rien lancer)

**TU MONTRES** : le README.md (section "Architecture")

**TU DIS** :

> « MedConnect est une plateforme de gestion de cabinet médical bâtie sur une **architecture microservices** Spring Cloud avec **2 langages** : Java/Spring Boot et Node.js/Express, ce qui démontre l'interopérabilité.
>
> J'ai **8 composants** orchestrés par Docker Compose :
> - 2 services d'infrastructure Spring Cloud : **Config Server** (port 8888) et **Discovery Server / Eureka** (port 8761)
> - 1 **API Gateway** Spring Cloud Gateway (port 8080) qui centralise le routage, la sécurité JWT et la documentation
> - 2 microservices métier : **appointment-service** en Java/Spring Boot avec MySQL et **medical-records-service** en Node.js avec MongoDB
> - 1 **Keycloak** (port 8180) pour l'authentification OAuth2/OIDC
> - 1 **RabbitMQ** (port 5672/15672) pour le messaging asynchrone
> - 1 **frontend Angular** (port 80)
>
> Les services communiquent en **synchrone** via OpenFeign (avec fallback Resilience4j) et en **asynchrone** via RabbitMQ. J'ai implémenté **3 scénarios SYNC + 3 scénarios ASYNC** que je vais démontrer. »

---

## ÉTAPE 2 — Montrer le Service Registry (1 min)

**TU FAIS** : ouvre l'onglet **http://localhost:8761**

**CE QUI DOIT APPARAÎTRE** : sous "Instances currently registered with Eureka", tu vois exactement 3 lignes :

```
APPOINTMENT-SERVICE       UP (1)
API-GATEWAY               UP (1)
MEDICAL-RECORDS-SERVICE   UP (1)
```

**TU DIS** :

> « Eureka montre que mes 3 microservices se sont enregistrés automatiquement au démarrage. Le service Node.js utilise la librairie **eureka-js-client** pour s'enregistrer comme s'il était un service Spring, ce qui prouve l'interopérabilité du Service Discovery. »

---

## ÉTAPE 3 — Démontrer Keycloak (2 min)

**TU FAIS** : ouvre **http://localhost:8180/admin** → login `admin` / `admin`

**TU MONTRES (dans l'ordre)** :

1. Sélectionne le realm **`medconnect`** en haut à gauche
2. Va dans **Users** → tu vois `admin`, `doctor`, `patient`
3. Clique sur `patient` → onglet **Role mapping** → tu vois le rôle **PATIENT**
4. Va dans **Realm roles** → tu vois `PATIENT`, `DOCTOR`, `ADMIN`
5. Va dans **Clients** → clique sur `medconnect-frontend` → onglet **Settings**
   - Montre `Access Type = public` (PKCE)
   - Montre `Valid redirect URIs = http://localhost/*`
   - Montre `Web origins = +`

**TU DIS** :

> « J'ai un realm **medconnect** avec 3 rôles métiers : ADMIN, DOCTOR, PATIENT. Chaque utilisateur de test a un rôle. Le client `medconnect-frontend` est en mode **public avec PKCE**, c'est le flux recommandé pour les SPA Angular en 2026 — il n'y a aucun secret côté navigateur. »

---

## ÉTAPE 4 — Test du frontend (rôle ADMIN) (3 min)

**TU FAIS** : ouvre **http://localhost** en **navigation privée**

### 4.1 — Login admin

Clique **Se connecter** → tu es redirigé vers Keycloak → login `admin` / `admin123` → retour sur le frontend.

**TU DIS** :

> « Je viens d'être redirigé vers Keycloak, j'ai saisi mes credentials, et Keycloak m'a renvoyé un JWT que mon frontend Angular utilise pour appeler le gateway. C'est le flux **OAuth2 Authorization Code + PKCE**. »

### 4.2 — CRUD Patients

**TU FAIS** : clique sur **Patients** dans le menu

**CE QUI DOIT APPARAÎTRE** : tableau avec 3 patients (Sara Alaoui, etc.)

**TU FAIS** :
1. Clique **Ajouter** → remplis `Nom: Test`, `Prénom: Demo`, `Email: demo@x.local` → **Enregistrer**
2. Sur la ligne créée, clique l'icône **crayon** → modifie le nom → **Sauvegarder**
3. Clique l'icône **poubelle** → confirme

**TU DIS** :

> « J'ai du **CRUD complet** — Create, Read, Update inline, Delete — sur les patients, exposé par le `appointment-service` via le gateway. Le DELETE va d'ailleurs déclencher un **appel Feign en cascade** que je vais montrer dans 2 minutes. »

### 4.3 — CRUD Médecins

Pareil sur la page **Médecins**. Ajoute / modifie / vérifie qu'il y a 3 médecins.

### 4.4 — Voir tous les RDV

Va sur **Rendez-vous** → tu vois 6+ RDV avec leur statut (PENDING, CONFIRMED, COMPLETED, CANCELLED).

---

## ÉTAPE 5 — Test du frontend (rôle PATIENT) (3 min)

**TU FAIS** : déconnecte-toi (ou ouvre une **2e fenêtre privée**) → login `patient` / `patient123`

### 5.1 — Mes RDV

Va sur **Mes RDV** → tu vois UNIQUEMENT les RDV de Sara (patient connecté).

**TU DIS** :

> « Ici, le filtrage est fait côté backend : le service récupère le `sub` du JWT, le résout en `patientId` via le champ `keycloakId` en base, et ne renvoie que les RDV de ce patient. C'est une **autorisation au niveau ressource**, pas seulement au niveau endpoint. »

### 5.2 — Prendre un RDV

**TU FAIS** : clique **Nouveau RDV** → choisis un médecin, une date future, un motif → **Confirmer**

### 5.3 — Mon dossier médical

Va sur **Mon dossier** → tu vois les antécédents, allergies, **les prescriptions** et les **notes**.

**TU DIS** :

> « Mon dossier médical, c'est de la donnée stockée dans **MongoDB** côté `medical-records-service` en Node.js, alors que les RDV sont dans **MySQL** côté Java. La page agrège les deux, c'est le gateway qui route. »

---

## ÉTAPE 6 — Démontrer la SÉCURITÉ (2 min)

### 6.1 — 401 sans token

**TU FAIS** : ouvre une console PowerShell et tape :

```powershell
Invoke-RestMethod -Uri "http://localhost:8080/api/patients"
```

**CE QUI DOIT APPARAÎTRE** :

```
Invoke-RestMethod : Le serveur distant a retourné une erreur : (401) Non autorisé.
```

**TU DIS** :

> « Sans token JWT, le gateway rejette en **401 Unauthorized**. La sécurité est appliquée au niveau du gateway en tant que **OAuth2 Resource Server** WebFlux. »

### 6.2 — 403 mauvais rôle

```powershell
$token = (Invoke-RestMethod -Method POST -Uri "http://localhost:8180/realms/medconnect/protocol/openid-connect/token" `
  -ContentType "application/x-www-form-urlencoded" `
  -Body @{ grant_type="password"; client_id="medconnect-frontend"; username="patient"; password="patient123" }).access_token

Invoke-RestMethod -Uri "http://localhost:8080/api/patients" -Headers @{ Authorization = "Bearer $token" }
```

**CE QUI DOIT APPARAÎTRE** : erreur **403 Forbidden**.

**TU DIS** :

> « Avec un token valide mais un rôle insuffisant — ici un PATIENT qui essaie d'accéder à la liste de TOUS les patients réservée aux ADMIN — j'ai **403 Forbidden**. J'utilise `@PreAuthorize("hasRole('ADMIN')")` côté Java avec un `JwtAuthenticationConverter` personnalisé qui extrait les `realm_access.roles` du JWT Keycloak. »

---

## ÉTAPE 7 — SCÉNARIO SYNC #1 (Feign) — Confirmation de RDV (2 min)

**TU DIS** :

> « Premier scénario synchrone : quand un admin confirme un RDV, le `appointment-service` (Java) doit vérifier que le patient a bien un dossier médical avant de confirmer. Il appelle donc le `medical-records-service` (Node.js) via **OpenFeign**, avec un **fallback Resilience4j** si Node est down. »

**TU FAIS** : dans PowerShell (admin connecté) :

```powershell
$tokAdmin = (Invoke-RestMethod -Method POST -Uri "http://localhost:8180/realms/medconnect/protocol/openid-connect/token" `
  -ContentType "application/x-www-form-urlencoded" `
  -Body @{ grant_type="password"; client_id="medconnect-frontend"; username="admin"; password="admin123" }).access_token
$H = @{ Authorization = "Bearer $tokAdmin"; "Content-Type" = "application/json; charset=utf-8" }

$rdv = Invoke-RestMethod -Method POST -Uri "http://localhost:8080/api/appointments" -Headers $H -Body (@{
  patientId=1; doctorId=1; dateHeure="2026-12-15T10:00:00"; motif="Demo SYNC#1"; statut="PENDING"
} | ConvertTo-Json)
"RDV créé id=$($rdv.id)"

Invoke-RestMethod -Method POST -Uri "http://localhost:8080/api/appointments/$($rdv.id)/confirm" -Headers $H
```

**CE QUI DOIT APPARAÎTRE** : le RDV passe à `statut: CONFIRMED`.

**TU FAIS ENSUITE** :

```powershell
docker logs mc-appointment --tail 20 | Select-String "Feign|Dossier"
```

**CE QUI DOIT APPARAÎTRE** : un log style `[Feign SYNC #1] Dossier trouvé pour patient 1` prouvant que l'appel Feign Java→Node a bien eu lieu.

---

## ÉTAPE 8 — SCÉNARIO SYNC #2 (Feign) — Agrégation Prescriptions (1 min)

**TU FAIS** :

```powershell
Invoke-RestMethod -Uri "http://localhost:8080/api/appointments/patient/1/prescriptions" -Headers $H
```

**CE QUI DOIT APPARAÎTRE** : tableau JSON de prescriptions.

**TU DIS** :

> « Ici, l'endpoint est exposé par le service **Java**, mais les données sont dans **MongoDB côté Node.js**. Le Java fait l'agrégation via Feign et renvoie le tout au client. C'est un pattern **API composition / BFF**. »

---

## ÉTAPE 9 — SCÉNARIOS ASYNC #1 + #2 (RabbitMQ) — Workflow de prescription (3 min)

**TU DIS** :

> « Maintenant deux scénarios asynchrones chaînés. Quand un médecin crée une prescription :
> 1. Le service Node publie un événement `prescription.created` sur RabbitMQ
> 2. Le service Java le consomme et passe automatiquement le RDV en statut COMPLETED, sans que personne n'ait à le faire à la main.
>
> Ça démontre le **découplage** : si Java est down, l'événement reste en file et sera traité au redémarrage. »

### 9.1 — Ouvrir RabbitMQ UI

**TU FAIS** : va sur **http://localhost:15672** → login `guest`/`guest` → onglet **Queues and Streams**

**CE QUI DOIT APPARAÎTRE** : 3 queues :
- `appointment.confirmed.q` (consumers: 1)
- `appointment.cancelled.q` (consumers: 1)
- `prescription.created.q` (consumers: 1)

### 9.2 — Créer une prescription

Connecte-toi en **`doctor` / `doctor123`** sur le frontend → page **Mon planning** → choisis le RDV CONFIRMÉ → bouton **Créer prescription** → ajoute 2 médicaments → **Enregistrer**.

**TU MONTRES IMMÉDIATEMENT** : retourne dans RabbitMQ UI → onglet **Overview** → tu vois un pic dans le graph "Message rates" prouvant que le message a circulé.

**TU FAIS ENSUITE** : retourne en `admin` sur **Rendez-vous** → le RDV est passé automatiquement en **COMPLETED** sans qu'aucun humain ne l'ait modifié.

```powershell
docker logs mc-appointment --tail 20 | Select-String "ASYNC|prescription.created"
docker logs mc-records --tail 20 | Select-String "ASYNC|prescription"
```

**CE QUI DOIT APPARAÎTRE** : logs des 2 côtés montrant publication + consommation.

---

## ÉTAPE 10 — SCÉNARIO ASYNC #3 (RabbitMQ) — Annulation avec note auto (2 min)

**TU DIS** :

> « Troisième scénario asynchrone : quand un RDV est annulé, le service Node ajoute automatiquement une note d'annulation dans le dossier médical du patient, sans que le service Java ait à connaître la structure du dossier. C'est l'**event-driven architecture**. »

**TU FAIS** : en `patient` sur le frontend → **Mes RDV** → clique **Annuler** sur un RDV PENDING.

Ou en PowerShell :

```powershell
$rdv2 = Invoke-RestMethod -Method POST -Uri "http://localhost:8080/api/appointments" -Headers $H -Body (@{
  patientId=1; doctorId=1; dateHeure="2026-12-20T15:00:00"; motif="À annuler"; statut="PENDING"
} | ConvertTo-Json)

Invoke-RestMethod -Method POST -Headers $H `
  -Uri "http://localhost:8080/api/appointments/$($rdv2.id)/cancel?reason=Demo%20jury"

Start-Sleep -Seconds 2
$dossier = Invoke-RestMethod -Uri "http://localhost:8080/api/records/patient/1" -Headers $H
$dossier.notes[-1]
```

**CE QUI DOIT APPARAÎTRE** :

```
date     : 2026-...
contenu  : [Annulation] RDV #N avec medecin #1 annule le 2026-... Motif: Demo jury
auteurId : system
```

**TU DIS** :

> « La note a bien été ajoutée automatiquement par le consumer Node, déclenché par l'événement publié par Java. Et la date est en **ISO-8601** parce que j'ai configuré le Jackson2JsonMessageConverter de RabbitMQ avec le JavaTimeModule. »

---

## ÉTAPE 11 — SCÉNARIO SYNC #3 (Feign DELETE) — Suppression en cascade (2 min)

**TU DIS** :

> « Troisième scénario synchrone : conformité RGPD. Quand un admin supprime un patient, le service Java doit aussi supprimer son dossier médical côté Node. Ça se fait par un appel **Feign DELETE** en cascade. »

**TU FAIS** :

```powershell
$tmp = Invoke-RestMethod -Method POST -Uri "http://localhost:8080/api/patients" -Headers $H -Body (@{
  nom="ASupprimer"; prenom="Demo"; email="todelete@x.local"
} | ConvertTo-Json)
"Patient créé id=$($tmp.id)"

Invoke-RestMethod -Method POST -Uri "http://localhost:8080/api/records" -Headers $H -Body (@{
  patientId=$tmp.id; antecedents="demo"
} | ConvertTo-Json)
"Dossier créé pour patient $($tmp.id) dans MongoDB"

Invoke-RestMethod -Method DELETE -Uri "http://localhost:8080/api/patients/$($tmp.id)" -Headers $H
"DELETE envoyé"

Start-Sleep -Seconds 2
try {
  Invoke-RestMethod -Uri "http://localhost:8080/api/records/patient/$($tmp.id)" -Headers $H
} catch {
  "OK -> dossier purgé automatiquement (404 attendu)"
}
```

**CE QUI DOIT APPARAÎTRE** : la dernière ligne affiche `OK -> dossier purgé automatiquement (404 attendu)`.

---

## ÉTAPE 12 — Documentation Swagger centralisée (1 min)

**TU FAIS** : ouvre **http://localhost:8080/swagger-ui.html**

**CE QUI DOIT APPARAÎTRE** : sélecteur en haut à droite avec 2 specs :
- "appointment-service (Java)"
- "medical-records-service (Node)"

Switch entre les 2 → montre les 13 endpoints Java et les 7 endpoints Node.

**TU DIS** :

> « Une seule URL agrège la documentation OpenAPI des 2 microservices, qu'ils soient en Java ou en Node.js. Le gateway expose `/aggregate/appointment/v3/api-docs` et `/aggregate/records/v3/api-docs`, et Springdoc-openapi les unifie dans cette UI. »

---

## ÉTAPE 13 — Monitoring (1 min)

**TU FAIS** : ouvre **http://localhost:8080/actuator/prometheus**

**CE QUI DOIT APPARAÎTRE** : ~111 lignes de métriques type :

```
http_server_requests_seconds_count{...status="200",uri="/actuator/health"} 3.0
jvm_memory_used_bytes{...} 1.234E8
process_cpu_usage 0.05
```

**TU DIS** :

> « J'expose les métriques au format **Prometheus** sur tous mes services Spring via Micrometer. En production, un Prometheus + Grafana scrapent ces endpoints toutes les 15 secondes pour avoir un dashboard en temps réel. J'ai aussi des **healthchecks** sur tous les conteneurs Docker. »

---

## ÉTAPE 14 — Résilience (Circuit Breaker) — démo bonus (2 min)

**TU DIS** :

> « Pour démontrer la résilience, je vais arrêter le service Node et voir ce que fait Java. »

**TU FAIS** :

```powershell
docker compose stop medical-records-service
```

Attends 5 secondes, puis :

```powershell
Invoke-RestMethod -Uri "http://localhost:8080/api/appointments/patient/1/prescriptions" -Headers $H
```

**CE QUI DOIT APPARAÎTRE** : pas d'erreur 500, mais une **liste vide** ou une réponse de fallback.

```powershell
docker logs mc-appointment --tail 10 | Select-String "Fallback|fallback"
```

**CE QUI DOIT APPARAÎTRE** : log style `[Fallback] medical-records-service indisponible...`

**TU DIS** :

> « Le **circuit breaker Resilience4j** a détecté que Node est down, il a basculé sur la méthode de fallback, et le client reçoit une réponse dégradée mais valide au lieu d'une erreur 500. C'est la pattern **graceful degradation**. »

**TU FAIS** : remets Node en route :

```powershell
docker compose start medical-records-service
```

---

## ÉTAPE 15 — Bonus : Kubernetes (1 min, en option)

**TU FAIS** : ouvre le dossier `k8s/` dans VS Code.

**TU MONTRES** : `appointment-service.yaml`.

**TU DIS** :

> « J'ai aussi écrit les manifests Kubernetes prêts pour la production : **2 replicas en RollingUpdate**, **startup/readiness/liveness probes**, **resource requests/limits**, un **HorizontalPodAutoscaler** sur CPU et mémoire, et un **PodDisruptionBudget** pour ne jamais avoir 0 pod pendant un déploiement. La même stack tourne donc en local sur Docker Compose ou en production sur K8s. »

---

# 🎯 PHRASES DE CONCLUSION

> « En résumé, j'ai livré une plateforme microservices complète qui démontre :
>
> - **L'interopérabilité polyglotte** (Java + Node.js dans le même service registry)
> - **2 patterns de communication** : synchrone (Feign + Resilience4j) et asynchrone (RabbitMQ)
> - Une **sécurité industrielle** : OAuth2 / OIDC / JWT / PKCE avec Keycloak, autorisations RBAC au niveau endpoint et au niveau ressource
> - Une **observabilité** : Eureka, Actuator, Prometheus, RabbitMQ UI, Swagger central
> - Une **résilience** : circuit breakers, healthchecks, fallback
> - Un **déploiement portable** : Docker Compose pour le dev + manifests K8s pour la prod
> - Un **frontend Angular moderne** avec PKCE et UX par rôle
>
> Le code est sur GitHub : https://github.com/slimenmohamed/medconnect »

---

# 🆘 Plan B — Si quelque chose ne marche pas pendant la démo

| Problème | Solution rapide |
|---|---|
| Un conteneur en `unhealthy` | `docker compose restart <nom>` |
| Le port 80 est pris par XAMPP | Arrêter XAMPP dans le panneau de contrôle |
| Le navigateur garde le login en cache | Mode **navigation privée** + Ctrl+Shift+R |
| Keycloak met du temps | Patience, il prend ~30s au premier démarrage |
| Tout est cassé | `docker compose down -v && docker compose up -d` (perd les données) |

---

# ⏱️ Récap chronométré de la démo

| Étape | Temps | Cumul |
|---|---|---|
| 1. Présenter l'architecture | 2 min | 2 |
| 2. Eureka | 1 min | 3 |
| 3. Keycloak | 2 min | 5 |
| 4. Frontend admin (CRUD) | 3 min | 8 |
| 5. Frontend patient | 3 min | 11 |
| 6. Sécurité (401 + 403) | 2 min | 13 |
| 7. SYNC #1 (confirm) | 2 min | 15 |
| 8. SYNC #2 (agrégation) | 1 min | 16 |
| 9. ASYNC #1+#2 (prescription) | 3 min | 19 |
| 10. ASYNC #3 (cancel + note) | 2 min | 21 |
| 11. SYNC #3 (delete cascade) | 2 min | 23 |
| 12. Swagger | 1 min | 24 |
| 13. Prometheus | 1 min | 25 |
| 14. Resilience4j | 2 min | 27 |
| 15. K8s (bonus) | 1 min | 28 |

**Total ~25-28 min.** Adaptable : si tu manques de temps, saute les étapes 13, 14, 15.

Bonne soutenance ! 🚀
