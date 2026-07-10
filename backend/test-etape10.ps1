# ============================================
# Connexion + recuperation des IDs necessaires
# ============================================
$response = Invoke-RestMethod -Uri "http://localhost:4000/api/auth/login" -Method POST -ContentType "application/json" -Body '{"email":"sup.cmn@onda.ma","password":"sup123"}'
$token = $response.accessToken
$headers = @{ Authorization = "Bearer $token" }

$equipements = Invoke-RestMethod -Uri "http://localhost:4000/api/equipements" -Method GET -Headers $headers
$equipementId = $equipements[0].id
Write-Host "EquipementId: $equipementId"

# ============================================
# TEST 1 : Creer une panne SANS tReprise
# ============================================
Write-Host "`n=== TEST 1 : Panne ouverte (sans tReprise) ==="
$bodyPanne = @{
    equipementId = $equipementId
    tPanne       = "2026-07-10T08:00:00.000Z"
    causePanne   = "DEFAUT_ELECTRIQUE"
    description  = "Arret inopine du systeme"
    impact       = "MAJEUR"
} | ConvertTo-Json

$panne = Invoke-RestMethod -Uri "http://localhost:4000/api/pannes" -Method POST -Headers $headers -ContentType "application/json" -Body $bodyPanne
Write-Host "Statut: $($panne.statut) (attendu: OUVERTE)"
Write-Host "DureeArretMinutes: $($panne.dureeArretMinutes) (attendu: vide/null)"
$panneId = $panne.id

# ============================================
# TEST 2 : Cloturer la panne (calcul de duree)
# ============================================
Write-Host "`n=== TEST 2 : Cloture de la panne ==="
# tPanne = 08:00, tReprise = 09:30 -> difference attendue = 90 minutes
$bodyClose = @{
    tReprise           = "2026-07-10T09:30:00.000Z"
    actionsCorrectives = "Remplacement du disjoncteur"
} | ConvertTo-Json

$panneFermee = Invoke-RestMethod -Uri "http://localhost:4000/api/pannes/$panneId/close" -Method PATCH -Headers $headers -ContentType "application/json" -Body $bodyClose
Write-Host "Statut: $($panneFermee.statut) (attendu: RESOLUE)"
Write-Host "DureeArretMinutes: $($panneFermee.dureeArretMinutes) (attendu: 90)"

# ============================================
# TEST 3 : Creer une reclamation liee a cette panne
# ============================================
Write-Host "`n=== TEST 3 : Reclamation liee a la panne ==="
# tNotification = 08:05, tArrivee = 08:20 -> difference attendue = 15 minutes
$bodyReclamation = @{
    panneId           = $panneId
    tNotification     = "2026-07-10T08:05:00.000Z"
    moyenNotification = "APPEL"
    tArrivee          = "2026-07-10T08:20:00.000Z"
    commentaire       = "Intervention rapide de la societe"
} | ConvertTo-Json

$reclamation = Invoke-RestMethod -Uri "http://localhost:4000/api/reclamations" -Method POST -Headers $headers -ContentType "application/json" -Body $bodyReclamation
Write-Host "TempsReactionMinutes: $($reclamation.tempsReactionMinutes) (attendu: 15)"
Write-Host "ConformeSla: $($reclamation.conformeSla) (depend du slaMrt du marche)"

# ============================================
# TEST 4 : tReprise anterieur a tPanne -> doit echouer
# ============================================
Write-Host "`n=== TEST 4 : Erreur attendue (dates incoherentes) ==="
$bodyPanneErreur = @{
    equipementId = $equipementId
    tPanne       = "2026-07-10T10:00:00.000Z"
    causePanne   = "USURE"
    description  = "Test dates incoherentes"
    impact       = "MINEUR"
} | ConvertTo-Json
$panneErreur = Invoke-RestMethod -Uri "http://localhost:4000/api/pannes" -Method POST -Headers $headers -ContentType "application/json" -Body $bodyPanneErreur

$bodyCloseErreur = @{
    tReprise = "2026-07-10T09:00:00.000Z"   # anterieur a tPanne (10:00) -> doit echouer
} | ConvertTo-Json

try {
    Invoke-RestMethod -Uri "http://localhost:4000/api/pannes/$($panneErreur.id)/close" -Method PATCH -Headers $headers -ContentType "application/json" -Body $bodyCloseErreur
    Write-Host "ERREUR: la requete aurait du echouer !"
} catch {
    Write-Host "Erreur recue (attendue) :"
    $_.ErrorDetails.Message
}

# ============================================
# TEST 5 : Double saisie preventif meme mois -> doit echouer
# ============================================
Write-Host "`n=== TEST 5 : Doublon intervention preventive (meme mois) ==="
$bodyPreventif = @{
    equipementId              = $equipementId
    mois                       = "2026-07-01"
    nbInterventionsPlanifiees = 2
    nbInterventionsRealisees  = 2
} | ConvertTo-Json

$premierePreventif = Invoke-RestMethod -Uri "http://localhost:4000/api/preventif" -Method POST -Headers $headers -ContentType "application/json" -Body $bodyPreventif
Write-Host "Premiere saisie creee: OK (id: $($premierePreventif.id))"

try {
    Invoke-RestMethod -Uri "http://localhost:4000/api/preventif" -Method POST -Headers $headers -ContentType "application/json" -Body $bodyPreventif
    Write-Host "ERREUR: la deuxieme saisie aurait du echouer !"
} catch {
    Write-Host "Erreur recue (attendue) :"
    $_.ErrorDetails.Message
}