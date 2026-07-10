# --- Connexion ---
$response = Invoke-RestMethod -Uri "http://localhost:4000/api/auth/login" -Method POST -ContentType "application/json" -Body '{"email":"sup.cmn@onda.ma","password":"sup123"}'
$token = $response.accessToken
$headers = @{ Authorization = "Bearer $token" }
Write-Host "Token recupere: OK"

# --- Recuperation du marche existant ---
$marches = Invoke-RestMethod -Uri "http://localhost:4000/api/marches" -Method GET -Headers $headers
$marcheId = $marches[0].id
Write-Host "MarcheId: $marcheId"

# --- Recuperation de la societe existante ---
$societes = Invoke-RestMethod -Uri "http://localhost:4000/api/societes" -Method GET -Headers $headers
$societeId = $societes[0].id
Write-Host "SocieteId: $societeId"

# --- Creation d'un equipement valide ---
$bodyEquipement = @{
    marcheId       = $marcheId
    societeId      = $societeId
    codeEquipement = "EQ-CVC-001"
    designation    = "Climatiseur central Terminal 1"
    categorie      = "CVC"
    localisation   = "Terminal 1, niveau 2"
    criticite      = "IMPORTANT"
} | ConvertTo-Json

Write-Host "`n--- Creation equipement valide ---"
$equipement = Invoke-RestMethod -Uri "http://localhost:4000/api/equipements" -Method POST -Headers $headers -ContentType "application/json" -Body $bodyEquipement
$equipement

# --- Liste des equipements ---
Write-Host "`n--- Liste des equipements ---"
Invoke-RestMethod -Uri "http://localhost:4000/api/equipements" -Method GET -Headers $headers

# --- Test du cas d'erreur : societeId invente ---
Write-Host "`n--- Test erreur : societeId invalide (doit renvoyer 400) ---"
$bodyInvalide = @{
    marcheId       = $marcheId
    societeId      = "11111111-1111-1111-1111-111111111111"
    codeEquipement = "EQ-TEST-002"
    designation    = "Test equipement invalide"
    categorie      = "CVC"
    localisation   = "Test"
} | ConvertTo-Json

try {
    Invoke-RestMethod -Uri "http://localhost:4000/api/equipements" -Method POST -Headers $headers -ContentType "application/json" -Body $bodyInvalide
} catch {
    Write-Host "Erreur recue (attendue) :"
    $_.ErrorDetails.Message
}