$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$sdkRoot = $env:ANDROID_SDK_ROOT
$javaHome = $env:JAVA_HOME
$buildTools = $env:LIBRETV_ANDROID_BUILD_TOOLS
$androidJar = $env:LIBRETV_ANDROID_JAR
if (-not $sdkRoot -or -not $javaHome -or -not $buildTools -or -not $androidJar) {
    throw 'Set ANDROID_SDK_ROOT, JAVA_HOME, LIBRETV_ANDROID_BUILD_TOOLS, and LIBRETV_ANDROID_JAR.'
}
$aapt2 = Join-Path $buildTools 'aapt2.exe'
$d8 = Join-Path $buildTools 'd8.bat'
$zipalign = Join-Path $buildTools 'zipalign.exe'
$apksigner = Join-Path $buildTools 'apksigner.bat'

foreach ($required in @(
    (Join-Path $javaHome 'bin\javac.exe'),
    $androidJar, $aapt2, $d8, $zipalign, $apksigner
)) {
    if (-not (Test-Path -LiteralPath $required)) {
        throw "Missing Android build dependency: $required"
    }
}

$env:JAVA_HOME = $javaHome
$env:ANDROID_HOME = $sdkRoot
$env:ANDROID_SDK_ROOT = $sdkRoot
$env:PATH = "$javaHome\bin;$buildTools;$env:PATH"

$buildRoot = Join-Path $projectRoot 'build'
$classesDir = Join-Path $buildRoot 'classes'
$dexDir = Join-Path $buildRoot 'dex'
$generatedDir = Join-Path $buildRoot 'generated'
$distDir = Join-Path $projectRoot 'dist'
New-Item -ItemType Directory -Force -Path $classesDir, $dexDir, $generatedDir, $distDir | Out-Null

$manifest = Join-Path $projectRoot 'app\src\main\AndroidManifest.xml'
$assets = Join-Path $projectRoot 'app\src\main\assets'
$javaSource = Join-Path $projectRoot 'app\src\main\java\com\libretv\mobile\MainActivity.java'
$unsignedApk = Join-Path $buildRoot 'libretv-mobile-unsigned.apk'
$withDexApk = Join-Path $buildRoot 'libretv-mobile-with-dex.apk'
$alignedApk = Join-Path $buildRoot 'libretv-mobile-aligned.apk'
$keystore = $env:LIBRETV_ANDROID_KEYSTORE
$finalApk = Join-Path $distDir 'LibreTV-Mobile.apk'

Remove-Item -LiteralPath $classesDir, $dexDir, $generatedDir -Recurse -Force
New-Item -ItemType Directory -Force -Path $classesDir, $dexDir, $generatedDir | Out-Null

& $aapt2 link --manifest $manifest -I $androidJar --min-sdk-version 24 --target-sdk-version 34 --java $generatedDir -o $unsignedApk
if ($LASTEXITCODE -ne 0) { throw "aapt2 link failed with exit code $LASTEXITCODE" }

& (Join-Path $javaHome 'bin\javac.exe') -encoding UTF-8 -source 8 -target 8 -classpath $androidJar -d $classesDir $javaSource
if ($LASTEXITCODE -ne 0) { throw "javac failed with exit code $LASTEXITCODE" }

$classFiles = Get-ChildItem -LiteralPath $classesDir -Filter '*.class' -File -Recurse | ForEach-Object { $_.FullName }
& $d8 --min-api 24 --lib $androidJar --output $dexDir $classFiles
if ($LASTEXITCODE -ne 0) { throw "d8 failed with exit code $LASTEXITCODE" }

Copy-Item -LiteralPath $unsignedApk -Destination $withDexApk -Force
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
$archive = [System.IO.Compression.ZipFile]::Open($withDexApk, [System.IO.Compression.ZipArchiveMode]::Update)
try {
    $oldDex = $archive.GetEntry('classes.dex')
    if ($oldDex) { $oldDex.Delete() }
    [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile(
        $archive,
        (Join-Path $dexDir 'classes.dex'),
        'classes.dex',
        [System.IO.Compression.CompressionLevel]::Optimal
    ) | Out-Null

    foreach ($assetFile in Get-ChildItem -LiteralPath $assets -File -Recurse) {
        $relativeAssetPath = $assetFile.FullName.Substring($assets.Length + 1).Replace('\', '/')
        $apkAssetPath = "assets/$relativeAssetPath"
        [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile(
            $archive,
            $assetFile.FullName,
            $apkAssetPath,
            [System.IO.Compression.CompressionLevel]::Optimal
        ) | Out-Null
    }
} finally {
    $archive.Dispose()
}

& $zipalign -f 4 $withDexApk $alignedApk
if ($LASTEXITCODE -ne 0) { throw "zipalign failed with exit code $LASTEXITCODE" }

if (-not $keystore -or -not (Test-Path -LiteralPath $keystore)) {
    throw 'Set LIBRETV_ANDROID_KEYSTORE to an existing signing keystore.'
}
if (-not $env:LIBRETV_ANDROID_KEY_ALIAS -or -not $env:LIBRETV_ANDROID_KEYSTORE_PASSWORD -or -not $env:LIBRETV_ANDROID_KEY_PASSWORD) {
    throw 'Set LIBRETV_ANDROID_KEY_ALIAS and the signing password environment variables.'
}

& $apksigner sign --ks $keystore --ks-key-alias $env:LIBRETV_ANDROID_KEY_ALIAS --ks-pass "env:LIBRETV_ANDROID_KEYSTORE_PASSWORD" --key-pass "env:LIBRETV_ANDROID_KEY_PASSWORD" --out $finalApk $alignedApk
if ($LASTEXITCODE -ne 0) { throw "apksigner sign failed with exit code $LASTEXITCODE" }
& $apksigner verify --verbose $finalApk
if ($LASTEXITCODE -ne 0) { throw "APK signature verification failed with exit code $LASTEXITCODE" }

Get-Item -LiteralPath $finalApk | Select-Object FullName, Length, LastWriteTime





