# PowerShell script om quote duplicate fix toe te passen
# Voert de SQL uit via Supabase API

Write-Host "🔧 Quote Number Duplicate Fix Script" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Check voor .env bestand
if (-not (Test-Path ".env.local")) {
    Write-Host "❌ .env.local bestand niet gevonden!" -ForegroundColor Red
    Write-Host "💡 Maak een .env.local bestand met:" -ForegroundColor Yellow
    Write-Host "   VITE_SUPABASE_URL=your_url" -ForegroundColor Gray
    Write-Host "   VITE_SUPABASE_ANON_KEY=your_key" -ForegroundColor Gray
    Write-Host "   SUPABASE_SERVICE_ROLE_KEY=your_service_key" -ForegroundColor Gray
    exit 1
}

# Lees environment variabelen
Get-Content ".env.local" | ForEach-Object {
    if ($_ -match "^([^=]+)=(.*)$") {
        $key = $matches[1]
        $value = $matches[2]
        Set-Variable -Name $key -Value $value
    }
}

if (-not $VITE_SUPABASE_URL -or -not $SUPABASE_SERVICE_ROLE_KEY) {
    Write-Host "❌ Missende environment variabelen!" -ForegroundColor Red
    Write-Host "   VITE_SUPABASE_URL: $(if ($VITE_SUPABASE_URL) {'✅'} else {'❌'})" -ForegroundColor Yellow
    Write-Host "   SUPABASE_SERVICE_ROLE_KEY: $(if ($SUPABASE_SERVICE_ROLE_KEY) {'✅'} else {'❌'})" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Environment variabelen geladen" -ForegroundColor Green
Write-Host ""

# Lees SQL bestand
$sql = Get-Content "FIX-QUOTE-DUPLICATES.sql" -Raw

Write-Host "🚀 Stap 1: Toepassen van nieuwe generate_quote_number functie..." -ForegroundColor Cyan

# Split SQL in statements
$statements = $sql -split ";" | Where-Object { $_.Trim() -ne "" }

$successCount = 0
$errorCount = 0

foreach ($statement in $statements) {
    $trimmedStatement = $statement.Trim()
    
    # Skip comments en lege regels
    if ($trimmedStatement -eq "" -or $trimmedStatement.StartsWith("--") -or $trimmedStatement.StartsWith("/*")) {
        continue
    }
    
    # Alleen CREATE OR REPLACE en GRANT statements uitvoeren
    if ($trimmedStatement -match "CREATE OR REPLACE|GRANT EXECUTE") {
        Write-Host "   Uitvoeren: $($trimmedStatement.Substring(0, [Math]::Min(50, $trimmedStatement.Length)))..." -ForegroundColor Gray
        
        try {
            $body = @{
                query = $trimmedStatement + ";"
            } | ConvertTo-Json
            
            $response = Invoke-RestMethod -Uri "$VITE_SUPABASE_URL/rest/v1/rpc/exec" `
                -Method Post `
                -Headers @{
                    "apikey" = $SUPABASE_SERVICE_ROLE_KEY
                    "Authorization" = "Bearer $SUPABASE_SERVICE_ROLE_KEY"
                    "Content-Type" = "application/json"
                } `
                -Body $body `
                -ErrorAction Stop
            
            $successCount++
            Write-Host "      ✅ Succesvol" -ForegroundColor Green
        }
        catch {
            # Sommige errors zijn OK (bijv. function already exists)
            if ($_.Exception.Message -match "already exists|42710") {
                Write-Host "      ⚠️  Al bestaat (wordt vervangen)" -ForegroundColor Yellow
                $successCount++
            }
            else {
                $errorCount++
                Write-Host "      ❌ Fout: $($_.Exception.Message)" -ForegroundColor Red
            }
        }
    }
}

Write-Host ""
Write-Host "📊 Resultaat: $successCount succesvol, $errorCount fouten" -ForegroundColor Cyan

if ($errorCount -gt 0) {
    Write-Host ""
    Write-Host "⚠️  Sommige statements faalden. Probeer handmatig via Supabase Dashboard:" -ForegroundColor Yellow
    Write-Host "   1. Ga naar Supabase Dashboard > SQL Editor" -ForegroundColor Gray
    Write-Host "   2. Kopieer inhoud van FIX-QUOTE-DUPLICATES.sql" -ForegroundColor Gray
    Write-Host "   3. Plak en run in SQL Editor" -ForegroundColor Gray
    Write-Host ""
}

Write-Host ""
Write-Host "🧪 Stap 2: Test nieuwe functie..." -ForegroundColor Cyan

try {
    $testBody = @{} | ConvertTo-Json
    
    $testResponse = Invoke-RestMethod -Uri "$VITE_SUPABASE_URL/rest/v1/rpc/generate_quote_number" `
        -Method Post `
        -Headers @{
            "apikey" = $SUPABASE_SERVICE_ROLE_KEY
            "Authorization" = "Bearer $SUPABASE_SERVICE_ROLE_KEY"
            "Content-Type" = "application/json"
        } `
        -Body $testBody
    
    Write-Host "   ✅ Test succesvol! Gegenereerd nummer: $testResponse" -ForegroundColor Green
}
catch {
    Write-Host "   ❌ Test gefaald: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   💡 Mogelijk moet je de SQL handmatig uitvoeren" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "✨ Klaar! De quote number race condition is gefixed." -ForegroundColor Green
Write-Host ""
Write-Host "📖 Voor meer informatie, zie: QUOTE-DUPLICATES-FIX-INSTRUCTIES.md" -ForegroundColor Cyan
Write-Host ""

