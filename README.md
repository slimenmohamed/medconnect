# MedConnect

Plateforme de gestion de cabinet médical, projet académique du module
**Applications Web Distribuées**. Architecture **microservices Spring Boot / Spring Cloud
+ Node.js + Angular**, sécurisée par **Keycloak**, communications **synchrones (OpenFeign)**
et **asynchrones (RabbitMQ)**, orchestrée par **Docker Compose**.

---

## 1. Architecture

```
                                  +-------------------+
                                  |     Angular SPA   |
                                  | (nginx, port 80)  |
                                  +---------+---------+
                                            |
                                            v
+-----------+        +-----------+   +-------------+   +--------------+
| Keycloak  |<------>|  API GW   |<--+   JWT       |   | RabbitMQ     |
| :8180     |  JWT   |  :8080    |   +-------------+   | :5672 / 15672|
+-----+-----+        +-----+-----+                     +------+-------+
      |                    |  lb://APPOINTMENT-SERVICE        |
      |                    |  lb://MEDICAL-RECORDS-SERVICE    |
      |                    v                                  |
      |        +-----------+------------+        +------------+-----------+
      |        | appointment-service     |        | medical-records-service|
      |        | Spring Boot/JPA/MySQL   |<-Feign-+ Node.js/Express/Mongo  |
      |        | :8081                   +------->+ :5001                  |
      |        +-----------+-------------+ RabbitMQ events                 |
      |                    |               appointment.confirmed (a)      |
      |                    |               prescription.created  (b)      |
      |              +-----+----+                  +----------+           |
      |              |  MySQL   |                  |  MongoDB |           |
      |              |  :3306   |                  |  :27017  |           |
      |              +----------+                  +----------+           |
      |
+-----+---------------+        +---------------------+
|  config-server      |        |  discovery-server   |
|  Spring Cloud Conf  |        |  Eureka :8761       |
|  :8888              |        +---------------------+
+---------------------+
```

> Tous les services Spring + le service Node s'enregistrent sur **Eureka** et
> chargent leur configuration depuis **config-server** (`config-repo/` versionné).

---

## 2. Services

| Service                  | Stack                                  | Port  | Rôle                                                                     |
| ------------------------ | -------------------------------------- | ----- | ------------------------------------------------------------------------ |
| `config-server`          | Spring Cloud Config (native)           | 8888  | Sert `config-repo/*.yml` aux autres services.                            |
| `discovery-server`       | Eureka                                 | 8761  | Registre de services. Dashboard : <http://localhost:8761>                |
| `appointment-service`    | Spring Boot 3, JPA, MySQL, AMQP, Feign | 8081  | CRUD patients/médecins/RDV, publie/consomme RabbitMQ, appelle records.   |
| `medical-records-service`| Node.js 20, Express, Mongoose, amqplib | 5001  | CRUD dossiers/prescriptions, consomme/publie RabbitMQ.                   |
| `api-gateway`            | Spring Cloud Gateway (WebFlux)         | 8080  | Routing, sécurité JWT, CORS, Swagger agrégé.                             |
| `keycloak`               | Keycloak 23                            | 8180  | Realm `medconnect`, 3 rôles, 3 utilisateurs, thème custom.               |
| `mysql`                  | MySQL 8                                | 3306  | Données relationnelles (appointment-service).                            |
| `mongo`                  | MongoDB 7                              | 27017 | Données documentaires (medical-records-service).                         |
| `rabbitmq`               | RabbitMQ 3.13 (mgmt)                   | 5672  | Bus d'événements. UI : <http://localhost:15672>                          |
| `frontend`               | Angular 17 + Bootstrap + keycloak-angular | 80 | Front PATIENT / DOCTOR / ADMIN.                                          |

---

## 3. Lancement (Docker Compose)

```bash
# 1) Copier le .env
cp .env.example .env

# 2) Build + run de TOUT l'écosystème
docker compose up -d --build

# 3) Suivre la santé
docker compose ps
docker compose logs -f api-gateway
```

Premier démarrage : ~3-5 min (build Maven + Angular + import realm Keycloak).
Les `depends_on: condition: service_healthy` garantissent que chaque service
n'attaque pas tant que ses dépendances ne sont pas prêtes.

### URLs utiles

| Outil                     | URL                                              |
| ------------------------- | ------------------------------------------------ |
| **Frontend MedConnect**   | <http://localhost>                               |
| Keycloak admin console    | <http://localhost:8180/admin> (admin/admin)      |
| Eureka dashboard          | <http://localhost:8761>                          |
| API Gateway Swagger agrégé| <http://localhost:8080/swagger-ui.html>          |
| Swagger appointment       | <http://localhost:8081/swagger-ui.html>          |
| Swagger medical-records   | <http://localhost:5001/swagger-ui.html>          |
| RabbitMQ Management       | <http://localhost:15672> (medconnect/medconnectpass) |

---

## 4. Comptes de test (créés automatiquement via `realm-export.json`)

| Rôle    | Username   | Password    |
| ------- | ---------- | ----------- |
| PATIENT | `patient`  | `patient123`|
| DOCTOR  | `doctor`   | `doctor123` |
| ADMIN   | `admin`    | `admin123`  |

> Au premier login PATIENT, la fiche patient correspondante doit avoir le bon
> `keycloakId` (le `sub` du JWT). Le jeu de données `data.sql` met déjà
> `sub-patient` / `sub-doctor` à titre d'exemple ; en production le mapping
> serait fait par un script Keycloak Event Listener ou côté admin via l'UI.
> **Workaround démo** : connectez-vous en ADMIN, copiez le `sub` du PATIENT
> depuis Keycloak (Users > patient > Details), et collez-le dans la fiche du
> patient via la page `Admin > Patients`.

---

## 5. Scénarios démonstratifs

### 5.1 Communications SYNCHRONES (Feign / Resilience4j) — **3 scénarios**

**Scénario SYNC #1 — vérification du dossier médical avant confirmation d'un RDV**

1. Login `doctor` -> page **Planning**.
2. Cliquer **Confirmer** sur un RDV `PENDING`.
3. Côté serveur, `AppointmentService.confirm(id)` appelle (Feign synchrone) :

   ```
   GET http://medical-records-service/api/records/patient/{patientId}
   ```

4. Si le service Node est down, le **CircuitBreaker** `medicalRecordsCB`
   (Resilience4j) bascule sur `MedicalRecordsFallback` -> on continue malgré
   tout (le listener Rabbit créera le dossier).
5. Logs visibles : `docker compose logs appointment-service`.

**Scénario SYNC #2 — historique des prescriptions affiché dans le détail d'un RDV**

`AppointmentController#patientPrescriptions(patientId)` délègue via Feign :

```
GET http://medical-records-service/api/prescriptions/patient/{patientId}
```

Exposé sur la route :
`GET /api/appointments/patient/{patientId}/prescriptions` (consommée par le frontend).

**Scénario SYNC #3 — cascade SQL→NoSQL lors de la suppression d'un patient**

1. ADMIN supprime un patient via `DELETE /api/patients/{id}`.
2. `PatientService.delete()` supprime la ligne MySQL puis appelle **synchronement** :

   ```
   DELETE http://medical-records-service/api/records/patient/{patientId}
   ```

3. Node purge en parallèle `MedicalRecord` + toutes les `Prescription` du patient
   (Mongo). Garantit la **cohérence cross-database** (pattern saga compensatoire).
4. Test :

   ```powershell
   # Supprimer un patient -> son dossier Mongo doit être purgé instantanément
   Invoke-RestMethod -Method DELETE -Headers @{Authorization="Bearer $tokAdmin"} `
     -Uri http://localhost:8080/api/patients/10
   # Vérifier (doit renvoyer 404)
   Invoke-RestMethod -Uri http://localhost:8080/api/records/patient/10 -Headers @{Authorization="Bearer $tokAdmin"}
   ```

### 5.2 Communications ASYNCHRONES (RabbitMQ) — **3 scénarios**

Topologie : exchange topic `medconnect.exchange` avec **3 routing keys / 3 queues**.

**Scénario ASYNC #1 — `appointment.confirmed`** (Java -> Node, création auto de dossier)

1. `doctor` confirme un RDV (cf. ci-dessus).
2. `AppointmentEventPublisher` publie un `AppointmentConfirmedEvent` sur
   `appointment.confirmed.q`.
3. Le **consumer Node** (`src/config/rabbit.js`) reçoit l'événement et,
   via `MedicalRecord.findOne({ patientId })`, crée un **dossier vide**
   si le patient n'en a pas.
4. Visualiser dans RabbitMQ Management
   (<http://localhost:15672> > Queues > `appointment.confirmed.q` > Get messages).

**Scénario ASYNC #2 — `prescription.created`** (Node -> Java, RDV passe COMPLETED)

1. `doctor` crée une prescription depuis la page **Prescription** du frontend.
2. Le contrôleur Node publie un `prescription.created` sur RabbitMQ.
3. `PrescriptionEventListener` (côté Java) reçoit l'événement et marque le
   RDV correspondant en `COMPLETED`.

**Scénario ASYNC #3 — `appointment.cancelled`** (Java -> Node, note de traçabilité)

1. Un PATIENT ou ADMIN annule un RDV via `POST /api/appointments/{id}/cancel?reason=...`.
2. `AppointmentService.cancel()` publie un `AppointmentCancelledEvent` sur
   `appointment.cancelled.q` avec `appointmentId`, `patientId`, `doctorId`, `reason`, `cancelledAt`.
3. Le **consumer Node** (handler `onAppointmentCancelled`) ajoute automatiquement
   une note `[Annulation] RDV #X annulé le DATE. Motif: ...` dans le dossier
   médical du patient -> traçabilité métier.
4. Vérifier :

   ```powershell
   # Annuler
   Invoke-RestMethod -Method POST -Headers @{Authorization="Bearer $tokAdmin"} `
     -Uri "http://localhost:8080/api/appointments/6/cancel?reason=Patient%20indisponible"
   # Voir la note ajoutée dans le dossier
   (Invoke-RestMethod -Uri "http://localhost:8080/api/records/patient/1" `
     -Headers @{Authorization="Bearer $tokAdmin"}).notes
   ```

### 5.3 Documentation Swagger centralisée (bonus)

Le gateway expose une UI Swagger qui agrège les deux microservices :
<http://localhost:8080/swagger-ui.html> (sélecteur en haut à droite).

---

## 6. Sécurité Keycloak

- **Realm** : `medconnect`
- **Clients** :
  - `medconnect-gateway` (confidential, secret `medconnect-gateway-secret`)
    -> utilisé par les services backend (validation JWT)
  - `medconnect-frontend` (public, **PKCE S256**) -> utilisé par Angular
- **Rôles realm** : `PATIENT`, `DOCTOR`, `ADMIN`
- **Mapping des rôles** :
  - Côté Java : `SecurityConfig#keycloakAuthenticationConverter` lit
    `realm_access.roles` et expose des `ROLE_*` consommés par `@PreAuthorize`.
  - Côté Node : `middleware/keycloak.js` extrait les mêmes rôles et les
    confronte à `hasRole(...)`.
  - Côté Angular : `RoleGuard` étend `KeycloakAuthGuard` et compare aux
    `data.roles` de chaque route.
- **Thème de login custom** : `keycloak/themes/medconnect/login/` (couleurs
  bleu/blanc cohérentes avec l'UI Angular). Activé via `loginTheme: medconnect`
  dans le realm export.

---

## 7. Tester sans Docker (mode "local")

Chaque service Java a un profil `local` qui :
- bascule `appointment-service` sur **H2 en mémoire** + load `data.sql`,
- **désactive la sécurité Keycloak** (tout ouvert -> permet le test CRUD seul),
- pointe Eureka sur `localhost:8761`.

```bash
# Terminaux séparés
cd config-server     && mvn spring-boot:run
cd discovery-server  && mvn spring-boot:run
cd appointment-service && mvn spring-boot:run -Dspring-boot.run.profiles=local
cd api-gateway       && mvn spring-boot:run -Dspring-boot.run.profiles=local

cd medical-records-service && KEYCLOAK_DISABLED=true npm install && npm start

cd frontend && npm install && npm start  # http://localhost:4200
```

### Smoke tests `curl`

```bash
# Eureka : doit lister tous les services
curl http://localhost:8761/eureka/apps -H 'Accept: application/json'

# Config server : la config d'appointment-service
curl http://localhost:8888/appointment-service/default

# CRUD via le gateway (profil local, sans token)
curl http://localhost:8080/api/patients
curl http://localhost:8080/api/doctors
curl http://localhost:8080/api/appointments
curl http://localhost:5001/api/records
```

---

## 8. Bonus implémentés (grille)

- **Swagger centralisé** au niveau du gateway (springdoc-openapi WebFlux).
- **Spring Actuator + Micrometer Prometheus** sur les services Java.
- **CI GitHub Actions** : `.github/workflows/ci.yml` (build Maven + Node + Angular).
- **Kubernetes** : manifests `k8s/*.yaml` (Deployment + Service `LoadBalancer`).
- **Monitoring** :
  ```bash
  docker network create medconnect-net 2>/dev/null || true
  docker compose -f docker-compose.yml -f monitoring/docker-compose.monitoring.yml up -d
  ```
  Prometheus : <http://localhost:9090> - Grafana : <http://localhost:3000> (admin/admin)
- **Service Node consomme config-server** en JSON (voir `configClient.js`) —
  point "valeur ajoutée".
- **Resilience4j Circuit Breaker** sur les appels Feign vers le service Node.

### Déploiement Killercoda (procédure)

1. Ouvrir un scénario "Docker" sur Killercoda.
2. Cloner ce repo : `git clone <url> medconnect && cd medconnect`.
3. `cp .env.example .env && docker compose up -d --build`.
4. Killercoda expose les ports via leur proxy : remplacer `localhost` par
   l'URL exposée (panneau "Traffic / Ports").
5. Pour Kubernetes : `kubectl apply -f k8s/`.

---

## 9. Choix d'implémentation documentés

| Décision | Pourquoi |
|---|---|
| `config-server` en profil `native` (dossier local `config-repo`) | Évite la dépendance à un repo Git distant pour la correction. |
| Service Node consomme `/config-server/medical-records-service/default` | Démontre l'interop "valeur ajoutée" sans Spring Cloud Config Client (qui n'existe pas en Node). |
| H2 en profil `local` pour appointment-service | Permet de tester le CRUD instantanément sans MySQL. |
| Pas de MapStruct | Mappers manuels plus lisibles pour la lecture du code par l'évaluateur. |
| `KeycloakAuthGuard` étendu pour le RoleGuard | API officielle `keycloak-angular`, la plus simple. |
| Frontend en Bootstrap 5 | Plus léger que Angular Material (moins de deps à dockeriser), thème "médical" facile. |
| Frontend appelle UNIQUEMENT la gateway | Conformité avec la spec, single point of entry. |
| 2 queues distinctes (et pas une seule "événement") | Plus lisible, et respecte l'esprit "2 scénarios async" demandés. |
| `appointmentId` nullable dans `Prescription` | Permet à un médecin de créer une prescription hors rendez-vous (cas réel). |

---

## 10. Structure du repo

(Cf. l'arborescence complète proposée au début du projet.)

---

## 11. Auteur

Projet **MedConnect** - Session de rattrapage, Applications Web Distribuées 2025/2026.
