<#
.SYNOPSIS
    Очищення Git-репозиторію від файлу(ів) з секретами та форс-пушу (mirror).

.DESCRIPTION
    Скрипт створює дзеркальну копію репозиторія (mirror), видаляє вказаний шлях/файл
    з усієї історії за допомогою `git-filter-repo` (рекомендовано) або BFG (опціонально),
    виконує прибирання (reflog/gc) і робить форс-пуш назад. Перш ніж виконувати,
    ОБОВ'ЯЗКОВО відкличте/ротувайте скомпрометовані ключі у провайдера (GCP тощо).

.PARAMETER RepoUrl
    (Опційно) URL репозиторія для mirror-clone. Якщо не вказано — береться remote `origin`
    з поточного локального репозиторія.

.PARAMETER SecretPath
    Ім'я або шлях до файлу, який треба видалити з історії (за замовчуванням
    `serviceAccountKey.json.bak`).

.PARAMETER UseBFG
    Використовувати BFG замість git-filter-repo (потребує Java та bfg.jar).

.PARAMETER DryRun
    Показати дії без виконання змін.

.PARAMETER Force
    Пропустити підтвердження користувача (ВИКЛЮЧНО якщо ви вже відкликали ключі).

#>

param(
    [string]$RepoUrl = "",
    [string]$SecretPath = "serviceAccountKey.json.bak",
    [string]$Remote = "origin",
    [string]$Branch = "main",
    [switch]$UseBFG,
    [switch]$DryRun,
    [switch]$Force
)

function Fail([string]$msg){ Write-Host $msg -ForegroundColor Red; exit 1 }

Write-Host "УПЕРЕДЖЕННЯ: Переконайтесь, що скомпрометовані ключі вже відкликані або ротовані." -ForegroundColor Yellow
if (-not $Force) {
    $confirm = Read-Host "Продовжити (type 'yes' to continue)?"
    if ($confirm -ne 'yes') { Fail "Скасовано користувачем." }
}

# визначаємо URL віддаленого репозиторію
if ([string]::IsNullOrWhiteSpace($RepoUrl)) {
    $repoRoot = & git rev-parse --show-toplevel 2>$null
    if ($LASTEXITCODE -ne 0 -or -not $repoRoot) { Fail "Не в локальному git-репозиторії. Вкажіть -RepoUrl." }
    $remoteUrl = & git -C $repoRoot remote get-url $Remote 2>$null
    if ($LASTEXITCODE -ne 0 -or -not $remoteUrl) { Fail "Не вдалося отримати URL remote '$Remote' у репозиторії." }
} else {
    $remoteUrl = $RepoUrl
}

# клон-дзеркало
$tempDir = Join-Path $env:TEMP ("repo-clean-{0}" -f ([System.Guid]::NewGuid().ToString()))
Write-Host "Клоную дзеркало: $remoteUrl -> $tempDir"
if ($DryRun) { Write-Host "(dry-run) git clone --mirror $remoteUrl $tempDir"; exit 0 }

& git clone --mirror $remoteUrl $tempDir 2>&1 | Write-Host
if ($LASTEXITCODE -ne 0) { Fail "git clone --mirror не вдався" }

Set-Location $tempDir

if ($UseBFG) {
    # BFG підхід
    if (-not (Get-Command java -ErrorAction SilentlyContinue)) { Fail "Java не знайдено. BFG потребує Java." }
    $bfgJar = Join-Path $PSScriptRoot "bfg.jar"
    if (-not (Test-Path $bfgJar)) {
        Write-Host "BFG ($bfgJar) не знайдено. Спробую завантажити останню стабільну версію..." -ForegroundColor Yellow
        $bfgUrl = "https://repo1.maven.org/maven2/com/madgag/bfg/1.14.0/bfg-1.14.0.jar"
        try { Invoke-WebRequest $bfgUrl -OutFile $bfgJar -UseBasicParsing } catch { Fail "Не вдалося завантажити BFG: $_" }
    }
    Write-Host "Запускаю BFG для видалення файлу: $SecretPath"
    & java -jar $bfgJar --delete-files $SecretPath $tempDir
    if ($LASTEXITCODE -ne 0) { Fail "BFG завершився з помилкою" }
    & git reflog expire --expire=now --all
    & git gc --prune=now --aggressive
} else {
    # git-filter-repo підхід (рекомендовано)
    # знайти python
    $pythonCmd = $null
    foreach ($p in @('python','py')) { $c = Get-Command $p -ErrorAction SilentlyContinue; if ($c) { $pythonCmd = $c.Path; break } }
    if (-not $pythonCmd) { Fail "Python не знайдено. Потрібен для git-filter-repo або використайте --UseBFG." }

    # перевірити, чи встановлено git-filter-repo
    & $pythonCmd -c "import git_filter_repo" 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "git-filter-repo не встановлено. Встановлюю через pip (user) ..." -ForegroundColor Yellow
        & $pythonCmd -m pip install --user git-filter-repo
        if ($LASTEXITCODE -ne 0) { Fail "Не вдалося встановити git-filter-repo" }
    }

    Write-Host "Запускаю git-filter-repo для видалення: $SecretPath"
    & $pythonCmd -m git_filter_repo --invert-paths --paths $SecretPath --force
    if ($LASTEXITCODE -ne 0) { Fail "git-filter-repo завершився з помилкою" }

    & git reflog expire --expire=now --all
    & git gc --prune=now --aggressive
}

Write-Host "Пушу очищену історію назад (FORCE, mirror)" -ForegroundColor Yellow
& git push --force --mirror origin
if ($LASTEXITCODE -ne 0) { Fail "git push --force --mirror не вдався" }

Write-Host "Очищення завершено. Попросіть колег заново клонувати репозиторій." -ForegroundColor Green

# cleanup тимчасової папки
Set-Location $env:TEMP
try { Remove-Item -Recurse -Force $tempDir } catch { }

Write-Host "Тимчасова папка видалена: $tempDir"
