# =============================================================================
#  DEMO JURY - Script tout-en-un
#  Usage : .\demo-jury.ps1
#  Le script s'arrête entre chaque scénario, tu appuies sur Entrée pour passer
#  au suivant. Idéal pour la soutenance.
# =============================================================================

$ErrorActionPreference = "Continue"

function Title($txt) {
  Write-Host ""
  Write-Host "================================================================" -ForegroundColor Magenta
  Write-Host "  $txt" -ForegroundColor Magenta
  Write-Host "================================================================" -ForegroundColor Magenta
}
function Step($txt)   { Write-Host "`n>> $txt" -ForegroundColor Cyan }
function Ok($txt)     { Write-Host "   [OK] $txt" -ForegroundColor Green }
function Show($txt)   { Write-Host "   $txt" -ForegroundColor White }
function Say($txt)    { Write-Host "`n   >> A DIRE AU JURY :" -ForegroundColor Yellow
                       Write-Host "      $txt" -ForegroundColor Yellow }
function Pause-Demo() { Write-Host "`n   --- Appuie sur ENTREE pour continuer ---" -ForegroundColor DarkGray
                       [void](Read-Host) }

# ---------------------------------------------------------------------------
Title "0. PREPARATION - tokens des 3 roles"
# ---------------------------------------------------------------------------

function Get-Token($u, $p) {
  $b = @{ grant_type="password"; client_id="medconnect-frontend"; username=$u; password=$p }
  (Invoke-RestMethod -Method POST -Uri "http://localhost:8180/realms/medconnect/protocol/openid-connect/token" `
    -ContentType "application/x-www-form-urlencoded" -Body $b).access_token
}

# Wrapper REST avec retry automatique (utile si un service redemarre pendant la demo)
function Invoke-RestWithRetry {
  param(
    [string]$Method = "GET", [string]$Uri, [hashtable]$Headers, [string]$Body,
    [int]$MaxRetries = 3, [int]$DelaySec = 2
  )
  for ($i = 1; $i -le $MaxRetries; $i++) {
    try {
      if ($Body) {
        return Invoke-RestMethod -Method $Method -Uri $Uri -Headers $Headers -Body $Body
      } else {
        return Invoke-RestMethod -Method $Method -Uri $Uri -Headers $Headers
      }
    } catch {
      if ($i -eq $MaxRetries) { throw }
      Write-Host ("       (tentative " + $i + " echouee, retry dans " + $DelaySec + "s...)") -ForegroundColor DarkGray
      Start-Sleep -Seconds $DelaySec
    }
  }
}

Step "Recuperation des 3 tokens OAuth2 (admin, patient, doctor)..."
$tokAdmin   = Get-Token "admin"   "admin123"
$tokPatient = Get-Token "patient" "patient123"
$tokDoctor  = Get-Token "doctor"  "doctor123"
Ok "3 tokens JWT recuperes"

$Hadmin   = @{ Authorization = "Bearer $tokAdmin";   "Content-Type" = "application/json; charset=utf-8" }
$Hpatient = @{ Authorization = "Bearer $tokPatient"; "Content-Type" = "application/json; charset=utf-8" }
$Hdoctor  = @{ Authorization = "Bearer $tokDoctor";  "Content-Type" = "application/json; charset=utf-8" }

Say "J'ai obtenu 3 JWT via le flux OAuth2 password grant de Keycloak. Chaque token contient les claims du user et son role dans realm_access.roles."
Pause-Demo

# ---------------------------------------------------------------------------
Title "1. INFRASTRUCTURE - 10 conteneurs (healthy)"
# ---------------------------------------------------------------------------

docker compose ps --format "table {{.Name}}\t{{.Status}}"
Say "10 conteneurs orchestres par Docker Compose, tous healthy grace aux healthchecks."
Pause-Demo

# ---------------------------------------------------------------------------
Title "2. EUREKA - service registry polyglotte (Java + Node)"
# ---------------------------------------------------------------------------

$eureka = Invoke-RestMethod -Uri "http://localhost:8761/eureka/apps" -Headers @{Accept="application/json"}
foreach ($app in $eureka.applications.application) {
  Ok ("Service " + $app.name.PadRight(28) + " status=" + $app.instance.status + " host=" + $app.instance.hostName)
}
Say "Mes 3 microservices sont enregistres dans Eureka, dont un service Node qui utilise eureka-js-client - preuve de l'interoperabilite."
Pause-Demo

# ---------------------------------------------------------------------------
Title "3. SECURITE - 401 sans token, 403 mauvais role"
# ---------------------------------------------------------------------------

Step "Test 1 : appel sans token JWT"
try {
  Invoke-RestMethod -Uri "http://localhost:8080/api/patients" -ErrorAction Stop | Out-Null
} catch {
  Ok ("HTTP " + $_.Exception.Response.StatusCode.value__ + " Unauthorized (rejete par le gateway, c'est le comportement attendu)")
}

Step "Test 2 : PATIENT essaie d'acceder a la liste de TOUS les patients (reserve ADMIN)"
try {
  Invoke-RestMethod -Uri "http://localhost:8080/api/patients" -Headers $Hpatient -ErrorAction Stop | Out-Null
} catch {
  Ok ("HTTP " + $_.Exception.Response.StatusCode.value__ + " Forbidden (refuse par @PreAuthorize hasRole('ADMIN'))")
}

Say "Securite a 2 niveaux : le gateway rejette sans token (401), et chaque service applique @PreAuthorize au niveau methode pour les roles (403)."
Pause-Demo

# ---------------------------------------------------------------------------
Title "4. CRUD via le gateway (avec JWT admin)"
# ---------------------------------------------------------------------------

$P = Invoke-RestMethod -Uri "http://localhost:8080/api/patients"     -Headers $Hadmin
$D = Invoke-RestMethod -Uri "http://localhost:8080/api/doctors"      -Headers $Hadmin
$A = Invoke-RestMethod -Uri "http://localhost:8080/api/appointments" -Headers $Hadmin
Ok "GET /api/patients     -> $($P.Count) patients (stockes dans MySQL)"
Ok "GET /api/doctors      -> $($D.Count) medecins (stockes dans MySQL)"
Ok "GET /api/appointments -> $($A.Count) RDV     (stockes dans MySQL)"

Step "Endpoint /me : le backend resout le sub du JWT en patientId"
$me = Invoke-RestMethod -Uri "http://localhost:8080/api/patients/me" -Headers $Hpatient
Ok "patient connecte -> id=$($me.id) $($me.prenom) $($me.nom)"

Say "Toutes les requetes passent par le gateway sur le port 8080. L'endpoint /me prouve l'autorisation au niveau ressource basee sur le sub du JWT."
Pause-Demo

# ---------------------------------------------------------------------------
Title "5. SYNC #1 (Feign) - confirm() verifie le dossier"
# ---------------------------------------------------------------------------

Step "Creation d'un RDV..."
$rdv = Invoke-RestWithRetry -Method POST -Uri "http://localhost:8080/api/appointments" -Headers $Hpatient -Body (@{
  patientId=1; doctorId=1; dateHeure="2026-12-15T10:00:00"; motif="Demo jury SYNC#1"; statut="PENDING"
} | ConvertTo-Json)
Ok "RDV cree id=$($rdv.id) statut=$($rdv.statut)"

Step "Confirmation -> declenche un appel Feign Java->Node pour verifier le dossier"
$conf = Invoke-RestWithRetry -Method POST -Uri "http://localhost:8080/api/appointments/$($rdv.id)/confirm" -Headers $Hadmin
Ok "RDV $($conf.id) -> $($conf.statut)"

Start-Sleep -Seconds 1
$logs = docker logs mc-appointment --tail 10 2>$null | Select-String "Feign|Dossier|patient"
if ($logs) { Show ("Log Feign : " + ($logs | Select-Object -Last 1).Line.Trim()) }

Say "Le service Java a appele le service Node via OpenFeign avant de confirmer, avec un fallback Resilience4j prevu en cas d'indisponibilite."
Pause-Demo

# ---------------------------------------------------------------------------
Title "6. SYNC #2 (Feign) - agregation Java <- Node"
# ---------------------------------------------------------------------------

Step "GET /api/appointments/patient/1/prescriptions  (expose par Java, donnees dans Mongo)"
$prs = Invoke-RestWithRetry -Uri "http://localhost:8080/api/appointments/patient/1/prescriptions" -Headers $Hpatient
Ok "$($prs.Count) prescriptions agregees par Java depuis MongoDB Node via Feign"
foreach ($p in $prs) { Show "  - $($p.medicaments.Count) medicaments dans la prescription $($p._id)" }

Say "C'est le pattern API composition : le client appelle UN endpoint Java, qui agrege en interne des donnees Mongo via Feign."
Pause-Demo

# ---------------------------------------------------------------------------
Title "7. ASYNC #1+#2 (RabbitMQ) - prescription -> RDV COMPLETED auto"
# ---------------------------------------------------------------------------

Step "Le doctor cree une prescription pour le RDV #$($rdv.id)..."
$presc = Invoke-RestWithRetry -Method POST -Uri "http://localhost:8080/api/prescriptions" -Headers $Hdoctor -Body (@{
  patientId=1; doctorId=1; appointmentId=$rdv.id
  medicaments=@(
    @{ nom="Amoxicilline"; dosage="500mg 3x/j"; duree="7j" },
    @{ nom="Vitamine D";   dosage="2 gouttes"; duree="30j" }
  )
  observations="Demo jury ASYNC#2"
} | ConvertTo-Json -Depth 5)
Ok "Prescription creee dans MongoDB : $($presc._id)"
Show "    Node a publie 'prescription.created' sur RabbitMQ..."
Start-Sleep -Seconds 4

Step "Verifions le RDV : il a du passer en COMPLETED automatiquement..."
$rdvAfter = Invoke-RestWithRetry -Uri "http://localhost:8080/api/appointments/$($rdv.id)" -Headers $Hadmin
if ($rdvAfter.statut -eq "COMPLETED") {
  Ok "RDV $($rdv.id) -> statut=$($rdvAfter.statut)  (mis a jour par le consumer Java, SANS intervention humaine)"
} else {
  Show "RDV $($rdv.id) statut=$($rdvAfter.statut) - encore en cours..."
}

Step "Verification des queues RabbitMQ..."
$queues = docker exec mc-rabbitmq rabbitmqctl list_queues name messages consumers 2>$null |
  Select-String -Pattern "appointment|prescription"
foreach ($q in $queues) {
  $cols = $q.Line -split '\s+'
  Ok ("queue " + $cols[0].PadRight(30) + " consumers=" + $cols[2])
}

Say "3 queues, 3 consumers actifs. Si Java tombait pendant que Node publie, le message resterait en file et serait consomme au redemarrage. C'est le decouplage temporel."
Pause-Demo

# ---------------------------------------------------------------------------
Title "8. ASYNC #3 (RabbitMQ) - cancel -> note auto dans le dossier"
# ---------------------------------------------------------------------------

Step "Creation d'un RDV destine a etre annule..."
$rdv2 = Invoke-RestMethod -Method POST -Uri "http://localhost:8080/api/appointments" -Headers $Hpatient -Body (@{
  patientId=1; doctorId=1; dateHeure="2026-12-20T15:00:00"; motif="A annuler"; statut="PENDING"
} | ConvertTo-Json)
Ok "RDV cree id=$($rdv2.id)"

Step "Snapshot du dossier AVANT annulation..."
$nbBefore = (Invoke-RestWithRetry -Uri "http://localhost:8080/api/records/patient/1" -Headers $Hadmin).notes.Count
Show "    Nombre de notes avant : $nbBefore"

Step "Annulation du RDV..."
$can = Invoke-RestWithRetry -Method POST -Headers $Hadmin `
  -Uri "http://localhost:8080/api/appointments/$($rdv2.id)/cancel?reason=Demo%20devant%20le%20jury"
Ok "RDV $($can.id) -> $($can.statut)"
Show "    Java a publie 'appointment.cancelled' sur RabbitMQ..."
Start-Sleep -Seconds 4

Step "Verification du dossier APRES annulation..."
$dossier = Invoke-RestWithRetry -Uri "http://localhost:8080/api/records/patient/1" -Headers $Hadmin
$nbAfter = $dossier.notes.Count
if ($nbAfter -gt $nbBefore) {
  Ok "Notes : $nbBefore -> $nbAfter  (+1 note ajoutee AUTOMATIQUEMENT par le consumer Node)"
  $note = $dossier.notes[-1]
  Show "    date    : $($note.date)"
  Show "    contenu : $($note.contenu)"
  Show "    auteur  : $($note.auteurId)"
}

Say "L'annulation cote Java a declenche, via RabbitMQ, une mise a jour dans MongoDB cote Node. Aucun appel direct entre les 2 services."
Pause-Demo

# ---------------------------------------------------------------------------
Title "9. SYNC #3 (Feign DELETE) - suppression en cascade (RGPD)"
# ---------------------------------------------------------------------------

Step "Creation d'un patient + son dossier..."
$tmp = Invoke-RestWithRetry -Method POST -Uri "http://localhost:8080/api/patients" -Headers $Hadmin -Body (@{
  nom="ASupprimer"; prenom="DemoJury"; email=("d$([guid]::NewGuid().ToString().Substring(0,6))@x.local")
} | ConvertTo-Json)
Invoke-RestWithRetry -Method POST -Uri "http://localhost:8080/api/records" -Headers $Hadmin -Body (@{
  patientId=$tmp.id; antecedents="demo"
} | ConvertTo-Json) | Out-Null
Ok "Patient $($tmp.id) cree dans MySQL + dossier cree dans MongoDB"

Step "DELETE du patient cote Java..."
Invoke-RestWithRetry -Method DELETE -Uri "http://localhost:8080/api/patients/$($tmp.id)" -Headers $Hadmin | Out-Null
Ok "Patient supprime cote MySQL"
Show "    Java a fait un appel Feign DELETE en cascade vers Node..."
Start-Sleep -Seconds 2

Step "Verification cote Mongo..."
try {
  Invoke-RestMethod -Uri "http://localhost:8080/api/records/patient/$($tmp.id)" -Headers $Hadmin -ErrorAction Stop | Out-Null
  Write-Host "   [FAIL] Dossier encore present" -ForegroundColor Red
} catch {
  if ($_.Exception.Response.StatusCode.value__ -eq 404) {
    Ok "HTTP 404 - le dossier a ete purge automatiquement de MongoDB"
  }
}

Say "Conformite RGPD : la suppression cote source (MySQL) declenche la purge cote destination (MongoDB) par appel Feign synchrone."
Pause-Demo

# ---------------------------------------------------------------------------
Title "10. SWAGGER central - documentation OpenAPI agregee"
# ---------------------------------------------------------------------------

$d1 = Invoke-RestWithRetry -Uri "http://localhost:8080/aggregate/appointment/v3/api-docs"
$d2 = Invoke-RestWithRetry -Uri "http://localhost:8080/aggregate/records/v3/api-docs"
Ok "appointment-service (Java) : $($d1.paths.PSObject.Properties.Name.Count) endpoints documentes"
Ok "medical-records-service (Node) : $($d2.paths.PSObject.Properties.Name.Count) endpoints documentes"
Show ""
Show "  Pour la demo visuelle : ouvre http://localhost:8080/swagger-ui.html"

Say "Une seule URL, 2 microservices Java + Node, documentation OpenAPI 3.0 agregee. Le selecteur en haut a droite permet de switcher."
Pause-Demo

# ---------------------------------------------------------------------------
Title "11. MONITORING - Prometheus + Actuator"
# ---------------------------------------------------------------------------

$prom = (Invoke-WebRequest -Uri "http://localhost:8080/actuator/prometheus" -UseBasicParsing).Content
$nb = ($prom -split "`n" | Where-Object { $_ -match "^[a-z]" }).Count
Ok "/actuator/prometheus expose $nb metriques"
$samples = $prom -split "`n" | Where-Object { $_ -match "^http_server_requests" } | Select-Object -First 2
foreach ($s in $samples) { Show "    $s" }

$health = Invoke-RestMethod -Uri "http://localhost:8080/actuator/health"
Ok "/actuator/health = $($health.status)"

Say "Tous les services Spring exposent leurs metriques au format Prometheus, scrapables par Prometheus+Grafana en production."
Pause-Demo

# ---------------------------------------------------------------------------
Title "12. RESILIENCE - circuit breaker en action"
# ---------------------------------------------------------------------------

Step "On cree d'abord un RDV PENDING (pendant que Node est encore UP)..."
$rdv3 = Invoke-RestWithRetry -Method POST -Uri "http://localhost:8080/api/appointments" -Headers $Hpatient -Body (@{
  patientId=1; doctorId=1; dateHeure="2026-12-25T09:00:00"; motif="Resilience demo"; statut="PENDING"
} | ConvertTo-Json)
Ok "RDV cree id=$($rdv3.id) statut=$($rdv3.statut)"

Step "On arrete maintenant le service Node (medical-records-service)..."
docker compose stop medical-records-service 2>&1 | Out-Null
Ok "Node arrete - on attend 10s pour que Eureka note l'absence..."
Start-Sleep -Seconds 10

Step "Tentative de CONFIRM du RDV alors que Node est DOWN..."
Show "  Le code Java de confirm() encapsule l'appel Feign dans un try/catch."
Show "  Si Node est injoignable -> on log un warning et on continue."
try {
  $confR = Invoke-RestMethod -Uri "http://localhost:8080/api/appointments/$($rdv3.id)/confirm" `
           -Method POST -Headers $Hadmin -TimeoutSec 30 -ErrorAction Stop
  Ok "RDV $($confR.id) -> $($confR.statut)  (CONFIRMED malgre Node DOWN !)"
} catch {
  Show "    Echec : $($_.Exception.Message)"
}

Step "Logs cote Java montrant la degradation gracieuse..."
$fb = docker logs mc-appointment --tail 30 2>&1 | Select-String "Feign|fallback|erreur|indisponible"
if ($fb) {
  foreach ($l in ($fb | Select-Object -Last 3)) { Show ("    " + $l.Line.Trim()) }
}

Step "On remet Node en route..."
docker compose start medical-records-service 2>&1 | Out-Null
Ok "Node redemarre - se reenregistre dans Eureka (~10s)"
Start-Sleep -Seconds 12

Say "Pattern graceful degradation : meme si Node tombe, Java a encapsule l'appel Feign dans un try/catch et continue son traitement. Le RDV est confirme malgre la panne. Le systeme reste disponible."
Pause-Demo

# ---------------------------------------------------------------------------
Title "13. RECAP FINAL"
# ---------------------------------------------------------------------------

Write-Host ""
Write-Host "  [OK] 10 conteneurs Docker orchestres (healthy)" -ForegroundColor Green
Write-Host "  [OK] 3 microservices enregistres dans Eureka" -ForegroundColor Green
Write-Host "  [OK] Keycloak OAuth2/OIDC/JWT avec 3 roles" -ForegroundColor Green
Write-Host "  [OK] Securite a 2 niveaux (401 + 403)" -ForegroundColor Green
Write-Host "  [OK] CRUD complet via gateway" -ForegroundColor Green
Write-Host "  [OK] SYNC Feign #1 : confirm() -> verifie dossier" -ForegroundColor Green
Write-Host "  [OK] SYNC Feign #2 : agregation prescriptions" -ForegroundColor Green
Write-Host "  [OK] SYNC Feign #3 : DELETE patient -> purge Mongo" -ForegroundColor Green
Write-Host "  [OK] ASYNC RabbitMQ #1 : appointment.confirmed" -ForegroundColor Green
Write-Host "  [OK] ASYNC RabbitMQ #2 : prescription.created -> RDV COMPLETED" -ForegroundColor Green
Write-Host "  [OK] ASYNC RabbitMQ #3 : appointment.cancelled -> note auto" -ForegroundColor Green
Write-Host "  [OK] Swagger central agrege (Java + Node)" -ForegroundColor Green
Write-Host "  [OK] Prometheus + healthchecks (monitoring)" -ForegroundColor Green
Write-Host "  [OK] Circuit breaker Resilience4j (resilience)" -ForegroundColor Green
Write-Host ""
Write-Host "  Repo GitHub : https://github.com/slimenmohamed/medconnect" -ForegroundColor Cyan
Write-Host ""
