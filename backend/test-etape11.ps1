# ============================================
# Connexion
# ============================================
$response = Invoke-RestMethod -Uri "http://localhost:4000/api/auth/login" -Method POST -ContentType "application/json" -Body '{"email":"sup.cmn@onda.ma","password":"sup123"}'
$token = $response.accessToken
$headers = @{ Authorization = "Bearer $token" }

$marches = Invoke-RestMethod -Uri "http://localhost:4000/api/marches" -Method GET -Headers $headers
$marcheId = $marches[0].id
Write-Host "MarcheId: $marcheId (seuils attendus: PRR>=95, Dispo>=98.5, MRT<=60)"

# ============================================
# ETAPE PREALABLE : valider l'intervention preventive de l'Etape 10
# (sinon le PRR renverra null, faute d'intervention VALIDEE)
# ============================================
$preventifs = Invoke-RestMethod -Uri "http://localhost:4000/api/preventif" -Method GET -Headers $headers
$preventifId = $preventifs[0].id

$bodyValidation = @{ valide = $true } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:4000/api/preventif/$preventifId/validate" -Method PATCH -Headers $headers -ContentType "application/json" -Body $bodyValidation | Out-Null
Write-Host "Intervention preventive validee: OK"

# ============================================
# TEST : calcul des KPI sur juillet 2026
# ============================================
Write-Host "`n=== Calcul des KPI (periode 2026-07-01 a 2026-07-31) ==="
$kpi = Invoke-RestMethod -Uri "http://localhost:4000/api/kpi/marche/$marcheId`?dateDebut=2026-07-01&dateFin=2026-07-31" -Method GET -Headers $headers

Write-Host "`n--- PRR ---"
Write-Host "Valeur: $($kpi.kpi.prr.valeur) (attendu: 100 -> 2 realisees / 2 planifiees)"
Write-Host "Seuil : $($kpi.kpi.prr.seuil) (attendu: 95)"
Write-Host "Conforme: $($kpi.kpi.prr.conforme) (attendu: True)"

Write-Host "`n--- Disponibilite ---"
Write-Host "Valeur: $($kpi.kpi.disponibilite.valeur) (attendu: environ 99.8 -> 90 min d'arret sur 31 jours)"
Write-Host "Seuil : $($kpi.kpi.disponibilite.seuil) (attendu: 98.5)"
Write-Host "Conforme: $($kpi.kpi.disponibilite.conforme) (attendu: True)"

Write-Host "`n--- MRT ---"
Write-Host "Valeur: $($kpi.kpi.mrt.valeur) (attendu: 15 -> une seule reclamation de 15 min)"
Write-Host "Seuil : $($kpi.kpi.mrt.seuil) (attendu: 60)"
Write-Host "Conforme: $($kpi.kpi.mrt.conforme) (attendu: True)"