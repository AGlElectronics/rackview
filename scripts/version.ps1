# Version management script for RackView (PowerShell)

param(
    [Parameter(Position=0)]
    [string]$Command,
    
    [Parameter(Position=1)]
    [string]$Argument
)

$VERSION_FILE = "VERSION"
$SCRIPT_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path
$PROJECT_ROOT = Split-Path -Parent $SCRIPT_DIR

Set-Location $PROJECT_ROOT

function Get-Version {
    if (Test-Path $VERSION_FILE) {
        Get-Content $VERSION_FILE -Raw | ForEach-Object { $_.Trim() }
    } else {
        "0.0.0"
    }
}

function Set-Version {
    param([string]$NewVersion)
    Set-Content -Path $VERSION_FILE -Value $NewVersion
    Write-Host "Version set to: $NewVersion"
}

function Bump-Version {
    param([string]$Part)  # major, minor, patch
    
    $current = Get-Version
    $parts = $current -split '\.'
    
    $major = if ($parts[0]) { [int]$parts[0] } else { 0 }
    $minor = if ($parts[1]) { [int]$parts[1] } else { 0 }
    $patch = if ($parts[2]) { [int]$parts[2] } else { 0 }
    
    switch ($Part) {
        "major" {
            $major++
            $minor = 0
            $patch = 0
        }
        "minor" {
            $minor++
            $patch = 0
        }
        "patch" {
            $patch++
        }
        default {
            Write-Host "Invalid version part: $Part. Use: major, minor, or patch"
            exit 1
        }
    }
    
    $newVersion = "$major.$minor.$patch"
    Set-Version $newVersion
    Write-Output $newVersion
}

function New-Tag {
    $version = Get-Version
    $tag = "v$version"
    
    $existingTag = git tag -l $tag
    if ($existingTag) {
        Write-Host "Tag $tag already exists"
        exit 1
    }
    
    git tag -a $tag -m "Release version $version"
    Write-Host "Created tag: $tag"
    Write-Host "Push with: git push origin $tag"
}

# Main command handling
switch ($Command) {
    "get" {
        Get-Version
    }
    "set" {
        if (-not $Argument) {
            Write-Host "Usage: .\version.ps1 set <version>"
            exit 1
        }
        Set-Version $Argument
    }
    "bump" {
        if (-not $Argument) {
            Write-Host "Usage: .\version.ps1 bump <major|minor|patch>"
            exit 1
        }
        Bump-Version $Argument
    }
    "tag" {
        New-Tag
    }
    default {
        Write-Host "Usage: .\version.ps1 {get|set|bump|tag}"
        Write-Host ""
        Write-Host "Commands:"
        Write-Host "  get              - Get current version"
        Write-Host "  set <version>    - Set version (e.g., 1.2.3)"
        Write-Host "  bump <part>      - Bump version (major|minor|patch)"
        Write-Host "  tag              - Create git tag for current version"
        Write-Host ""
        Write-Host "Examples:"
        Write-Host "  .\version.ps1 get                    # Get current version"
        Write-Host "  .\version.ps1 set 1.2.3              # Set version to 1.2.3"
        Write-Host "  .\version.ps1 bump patch             # Bump patch version"
        Write-Host "  .\version.ps1 bump minor             # Bump minor version"
        Write-Host "  .\version.ps1 bump major             # Bump major version"
        Write-Host "  .\version.ps1 tag                   # Create git tag v1.2.3"
        exit 1
    }
}
