[CmdletBinding(DefaultParameterSetName = "no-arguments")]
Param (
    [Parameter(HelpMessage = "Enables initialization of values in the .env file, which may be placed in source control.")]
    [switch]$InitEnv,

    [Parameter(Mandatory = $true,
        HelpMessage = "The path to a valid Sitecore license.xml file.")]
    [string]$LicenseXmlPath,

    # We do not need to use [SecureString] here since the value will be stored unencrypted in .env,
    # and used only for transient local development environments.
    [Parameter(Mandatory = $true,
        HelpMessage = "Sets the sitecore\\admin password for this environment via environment variable.")]
    [string]$AdminPassword,

    [Parameter(Mandatory = $false, HelpMessage = "Specifies os version of the base image.")]
    [ValidateSet("ltsc2019", "ltsc2022")]
    [string]$baseOs = "ltsc2022",
	
    [Parameter(HelpMessage = "Enables initialization the ValtechHelix platform")]
    [switch]$InitValtechHelix,
	
    [Parameter(Mandatory = $true, HelpMessage = "The name for the ValtechHelix platform")]
	[string]$ValtechHelixName = "ValtechHelix",

	[Parameter(Mandatory = $false, HelpMessage = "The JSS template(s) to be installed, default value: nextjs,nextjs-xmcloud,nextjs-sxa,nextjs-multisite")]
	[string]$JSSTemplate
)

$ErrorActionPreference = "Stop";

#Get valtechhelix variables 
Get-Content ".\.valtechhelix" | foreach-object -begin {$vhsettings=@{}} -process { if($_.Contains("=")){  $value = [regex]::split($_,'='); if(($value[0].CompareTo("") -ne 0) -and ($value[0].StartsWith("[") -ne $True) -and ($value[0].StartsWith("#") -ne $True) ) { if(-Not $vhsettings.ContainsKey($value[0])) { $vhsettings.Add($value[0], $value[1]) }  } } }

########################
# Check Required Variables
########################
if ([string]::IsNullOrEmpty($vhsettings.VHTOOLS_REPOSITORY_USERNAME)){
    Write-Error "Please provide a value for the VHTOOLS_REPOSITORY_USERNAME setting in .valtechhelix."
}
if ([string]::IsNullOrEmpty($vhsettings.VHTOOLS_REPOSITORY_PASSWORD)){
    Write-Error "Please provide a value for the VHTOOLS_REPOSITORY_PASSWORD setting in .valtechhelix."
}

################################################
# Get credentials for scripts and templates repo
################################################
if($vhsettings.VHTOOLS_REPOSITORY -like 'https://nuget.pkg.github.com/ENG-Valtech/*'){
	$password = ConvertTo-SecureString $vhsettings.VHTOOLS_REPOSITORY_PASSWORD -AsPlainText -Force
	$Credentials = New-Object System.Management.Automation.PSCredential -ArgumentList ($vhsettings.VHTOOLS_REPOSITORY_USERNAME, $password)
} else {
	$nugetRepo = [System.Uri]"$($vhsettings.VHTOOLS_REPOSITORY)"
	$Credentials = Get-Credential -Message "Credentials are required to access the nuget repository on the server ($($nugetRepo.Host)). Please provide your credentials."
}

#################################################
# Install the .net new templates for ValtechHelix
#################################################
Write-Host "Uninstalling the .net new templates for ValtechHelix"
dotnet new -u ValtechHelix.NetNewTemplates
try{
	Write-Host "Downloading the .net new templates for ValtechHelix: $($vhsettings.VHTOOLS_REPOSITORY)ValtechHelix.NetNewTemplates/$($vhsettings.VHTEMPLATES_VERSION)"
	$templates = Invoke-RestMethod -Uri "$($vhsettings.VHTOOLS_REPOSITORY)download/ValtechHelix.NetNewTemplates/$($vhsettings.VHTEMPLATES_VERSION)/ValtechHelix.NetNewTemplates.$($vhsettings.VHTEMPLATES_VERSION).nupkg" -Credential $Credentials -OutFile ".\ValtechHelix.NetNewTemplates.$($vhsettings.VHTEMPLATES_VERSION).nupkg"
	
	$ValtechHelixDotNetNewTemplates = Get-ChildItem -Path ./ *.nupkg | Sort-Object -Property Name | Select-Object -Last 1
	Write-Host "Installing the .net new templates for ValtechHelix ($($ValtechHelixDotNetNewTemplates.Name))" -ForegroundColor Green
	dotnet new -i "./$($ValtechHelixDotNetNewTemplates.Name)"
} catch {
	Write-Warning $_.Exception.Message
	exit
} finally {
	Remove-Item "./$($ValtechHelixDotNetNewTemplates.Name)"	
}

#################################################
# Install the nextjs gettingstarted template
#################################################
Write-Host "Uninstalling Sitecore.DevEx.Templates"
dotnet new -u Sitecore.DevEx.Templates
try{ 
	Write-Host "Installing the Sitecore.DevEx.Templates" -ForegroundColor Green
	dotnet new -i Sitecore.DevEx.Templates --nuget-source https://sitecore.myget.org/F/sc-packages/api/v3/index.json
} catch {
	Write-Warning $_.Exception.Message
	exit
} finally {
	 
}

#############################################
# Install powershell scripts for ValtechHelix
#############################################
Import-Module PowerShellGet
Try 
{
	$ToolsFolder = Join-Path $PSScriptRoot "tools\powershellscripts"
	$ScriptsFolder = Join-Path $PSScriptRoot "tools\powershellscripts"
	if([System.IO.Directory]::Exists($ToolsFolder))
	{
		Get-ChildItem -Path $ToolsFolder | Where-Object {$_.CreationTime -gt (Get-Date).Date}   
	}
	else
	{
		New-Item $ToolsFolder -ItemType Directory
	}
	if([System.IO.Directory]::Exists($ScriptsFolder))
	{
		Get-ChildItem -Path $ScriptsFolder | Where-Object {$_.CreationTime -gt (Get-Date).Date}   
	}
	else
	{
		New-Item $ScriptsFolder -ItemType Directory
	}


	$ValtechHelixLocalPath = Join-Path $PSScriptRoot "tools\powershellscripts"

	$ValtechHelixPowershellRepo = Get-PSRepository | Where-Object { $_.SourceLocation -eq $ValtechHelixLocalPath }
	if (-not $ValtechHelixPowershellRepo) {
		Write-Host "Downloading package..." -ForegroundColor Green 
		Invoke-RestMethod -Uri "$($vhsettings.VHTOOLS_REPOSITORY)download/ValtechHelixScripts/$($vhsettings.VHSCRIPTS_VERSION)/ValtechHelixScripts.$($vhsettings.VHSCRIPTS_VERSION).nupkg" -Credential $Credentials -OutFile (Join-Path $ValtechHelixLocalPath "\ValtechHelixScripts.$($vhsettings.VHSCRIPTS_VERSION).nupkg")
		Write-Host "Adding ValtechHelix PowerShell Repository..." -ForegroundColor Green 
		Register-PSRepository -Name ValtechHelixLocal -SourceLocation $ValtechHelixLocalPath -InstallationPolicy Trusted
		$ValtechHelixPowershellRepo = Get-PSRepository -Name ValtechHelixLocal
	}

	Get-InstalledModule ValtechHelixScripts | Uninstall-Module -Force -ErrorAction SilentlyContinue 
	Remove-Module ValtechHelixScripts -ErrorAction SilentlyContinue
	if (-not (Get-InstalledModule -Name SitecoreDockerTools -RequiredVersion $($vhsettings.VHSCRIPTS_VERSION) -ErrorAction SilentlyContinue)) {
		Write-Host "Installing ValtechHelixScripts..." -ForegroundColor Green
		Install-Module -Name ValtechHelixScripts -RequiredVersion "$($vhsettings.VHSCRIPTS_VERSION)" -Repository ValtechHelixLocal -Scope CurrentUser
	}
	Write-Host "Importing ValtechHelixScripts..." -ForegroundColor Green
	Import-Module ValtechHelixScripts -RequiredVersion $($vhsettings.VHSCRIPTS_VERSION) -DisableNameChecking
}
Finally 
{
	Unregister-PSRepository ValtechHelixLocal -ErrorAction SilentlyContinue
}

#######################################################
# Install Sitecore.CLI
#######################################################
if (!(dotnet nuget list source --format Short | Where-Object {$_ -match 'https://nuget.sitecore.com/resources/v3/index.json'})) {
	Write-Host "Adding Sitecore feed to dotnet nuget sources"
	dotnet nuget add source -n Sitecore https://nuget.sitecore.com/resources/v3/index.json
}
if (!(dotnet tool list | Where-Object {$_ -match "sitecore.cli      $($vhsettings.SITECORE_CLI_VERSION)"})) {
	Write-Host "Installing Sitecore.CLI..."
	dotnet tool install Sitecore.CLI --version $($vhsettings.SITECORE_CLI_VERSION)
	Write-Host "Updating Sitecore CLI Plugins..."
	dotnet sitecore plugin init --overwrite
}

################################
# Define local hostnames
################################
$cmHost = "xmcloudcm.localhost"
$renderingHost = "www.isc2.localhost"

######################################
# Configure the Visual Studio Solution
######################################

# Generate an ID for the Sitecore API Key
$sitecoreApiKey = (New-Guid).Guid

if	($InitValtechHelix) {
	Write-Host "Configuring the Visual Studio Solution..." -ForegroundColor Green 
	# Creating the solution file
	dotnet new valtechhelix-xmc-solution -n $ValtechHelixName --force

	# Removing default solution files and project files if necessary
	Get-ChildItem *.sln | Where-Object { $_.Name -notmatch $ValtechHelixName } | Remove-Item -Force
	Get-ChildItem -Path ./src -Include *.csproj, *.targets, *.user -Recurse | Where-Object { $_.Name -notmatch $ValtechHelixName -and $_.Name -notmatch "Platform" } | Remove-Item -Force

	if ($JSSTemplate) {
		# Create Rendering/JSS project
		Write-Host "Scaffolding the JSS app..." -ForegroundColor Green 
		npx create-sitecore-jss@latest --appName $ValtechHelixName.ToLower() --templates $JSSTemplate --yes true --destination ./src/Front --hostName $cmHost --fetchWith GraphQL --prerender SSG --force true
	
		if($null -eq (get-command "jss" -ErrorAction SilentlyContinue))
		{
			Write-Host "JSS CLI not found, installing it now..." -ForegroundColor Orange
			npm i @sitecore-jss/sitecore-jss-cli@latest -g
		}

		Write-Host "Configuring JSS App"
		Set-Location .\src\Front
		jss setup --instancePath (Join-Path $PSScriptRoot "docker\deploy\platform") --deployUrl $cmHost --layoutServiceHost $cmHost --apiKey $sitecoreApiKey --nonInteractive true
		jss deploy config
		Set-Location -
	}
}

########################
# Check Sitecore License
########################
if ($InitEnv) {
    if (-not $LicenseXmlPath.EndsWith("license.xml")) {
        Write-Error "Sitecore license file must be named 'license.xml'."
    }
    if (-not (Test-Path $LicenseXmlPath)) {
        Write-Error "Could not find Sitecore license file at path '$LicenseXmlPath'."
    }
    # We actually want the folder that it's in for mounting
    $LicenseXmlPath = (Get-Item $LicenseXmlPath).Directory.FullName
}

Write-Host "Preparing your Sitecore Containers environment!" -ForegroundColor Green

################################################
# Retrieve and import SitecoreDockerTools module
################################################

# Check for Sitecore Gallery
Import-Module PowerShellGet
$SitecoreGallery = Get-PSRepository | Where-Object { $_.SourceLocation -eq "https://nuget.sitecore.com/resources/v2" }
if (-not $SitecoreGallery) {
    Write-Host "Adding Sitecore PowerShell Gallery..." -ForegroundColor Green
    Unregister-PSRepository -Name SitecoreGallery -ErrorAction SilentlyContinue
    Register-PSRepository -Name SitecoreGallery -SourceLocation https://nuget.sitecore.com/resources/v2 -InstallationPolicy Trusted
    $SitecoreGallery = Get-PSRepository -Name SitecoreGallery
}

# Install and Import SitecoreDockerTools
$dockerToolsVersion = "10.2.7"
Remove-Module SitecoreDockerTools -ErrorAction SilentlyContinue
if (-not (Get-InstalledModule -Name SitecoreDockerTools -RequiredVersion $dockerToolsVersion -ErrorAction SilentlyContinue)) {
    Write-Host "Installing SitecoreDockerTools..." -ForegroundColor Green
    Install-Module SitecoreDockerTools -RequiredVersion $dockerToolsVersion -Scope CurrentUser -Repository $SitecoreGallery.Name
}
Write-Host "Importing SitecoreDockerTools..." -ForegroundColor Green
Import-Module SitecoreDockerTools -RequiredVersion $dockerToolsVersion
Write-SitecoreDockerWelcome

##################################
# Configure TLS/HTTPS certificates
##################################

Push-Location docker\traefik\certs
try {
    $mkcert = ".\mkcert.exe"
    if ($null -ne (Get-Command mkcert.exe -ErrorAction SilentlyContinue)) {
        # mkcert installed in PATH
        $mkcert = "mkcert"
    } elseif (-not (Test-Path $mkcert)) {
        Write-Host "Downloading and installing mkcert certificate tool..." -ForegroundColor Green
        Invoke-WebRequest "https://github.com/FiloSottile/mkcert/releases/download/v1.4.1/mkcert-v1.4.1-windows-amd64.exe" -UseBasicParsing -OutFile mkcert.exe
        if ((Get-FileHash mkcert.exe).Hash -ne "1BE92F598145F61CA67DD9F5C687DFEC17953548D013715FF54067B34D7C3246") {
            Remove-Item mkcert.exe -Force
            throw "Invalid mkcert.exe file"
        }
    }
    Write-Host "Generating Traefik TLS certificate..." -ForegroundColor Green
    & $mkcert -install
    & $mkcert "*.isc2.localhost"
    & $mkcert "xmcloudcm.localhost"
    

    # stash CAROOT path for messaging at the end of the script
    $caRoot = "$(& $mkcert -CAROOT)\rootCA.pem"
}
catch {
    Write-Error "An error occurred while attempting to generate TLS certificate: $_"
}
finally {
    Pop-Location
}


################################
# Add Windows hosts file entries
################################

Write-Host "Adding Windows hosts file entries..." -ForegroundColor Green

Add-HostsEntry $cmHost
Add-HostsEntry $renderingHost

 # Create .env file
 Write-Host "Creating .env file." -ForegroundColor Green
 Copy-Item ".\.valtechhelix" ".\.env" -Force

###############################
# Generate scjssconfig
###############################

Set-EnvFileVariable "JSS_DEPLOYMENT_SECRET_xmcloudpreview" -Value $xmCloudBuild.renderingHosts.xmcloudpreview.jssDeploymentSecret

################################
# Generate Sitecore Api Key
################################

Set-EnvFileVariable "SITECORE_API_KEY_xmcloudpreview" -Value $sitecoreApiKey

################################
# Generate JSS_EDITING_SECRET
################################
$jssEditingSecret = Get-SitecoreRandomString 64 -DisallowSpecial
Set-EnvFileVariable "JSS_EDITING_SECRET" -Value $jssEditingSecret

###############################
# Populate the environment file
###############################

if ($InitEnv) {

    Write-Host "Populating required .env file values..." -ForegroundColor Green

   

    # HOST_LICENSE_FOLDER
    Set-EnvFileVariable "HOST_LICENSE_FOLDER" -Value $LicenseXmlPath

    # CM_HOST
    Set-EnvFileVariable "CM_HOST" -Value $cmHost

    # RENDERING_HOST
    Set-EnvFileVariable "RENDERING_HOST" -Value $renderingHost

    # REPORTING_API_KEY = random 64-128 chars
    Set-EnvFileVariable "REPORTING_API_KEY" -Value (Get-SitecoreRandomString 128 -DisallowSpecial)

    # TELERIK_ENCRYPTION_KEY = random 64-128 chars
    Set-EnvFileVariable "TELERIK_ENCRYPTION_KEY" -Value (Get-SitecoreRandomString 128 -DisallowSpecial)

    # MEDIA_REQUEST_PROTECTION_SHARED_SECRET
    Set-EnvFileVariable "MEDIA_REQUEST_PROTECTION_SHARED_SECRET" -Value (Get-SitecoreRandomString 64 -DisallowSpecial)

    # SQL_SA_PASSWORD
    # Need to ensure it meets SQL complexity requirements
    Set-EnvFileVariable "SQL_SA_PASSWORD" -Value (Get-SitecoreRandomString 19 -DisallowSpecial -EnforceComplexity)

    # SQL_SERVER
    Set-EnvFileVariable "SQL_SERVER" -Value "mssql"

    # SQL_SA_LOGIN
    Set-EnvFileVariable "SQL_SA_LOGIN" -Value "sa"

    # SITECORE_ADMIN_PASSWORD
    Set-EnvFileVariable "SITECORE_ADMIN_PASSWORD" -Value $AdminPassword

    # SITECORE_VERSION
    Set-EnvFileVariable "SITECORE_VERSION" -Value "1-$baseOS"

    # EXTERNAL_IMAGE_TAG_SUFFIX
    Set-EnvFileVariable "EXTERNAL_IMAGE_TAG_SUFFIX" -Value $baseOS
}

Write-Host "Done!" -ForegroundColor Green

Push-Location docker\traefik\certs
try
{
    Write-Host
    Write-Host ("#"*75) -ForegroundColor Cyan
    Write-Host "To avoid HTTPS errors, set the NODE_EXTRA_CA_CERTS environment variable" -ForegroundColor Cyan
    Write-Host "using the following commmand:" -ForegroundColor Cyan
    Write-Host "setx NODE_EXTRA_CA_CERTS $caRoot"
    Write-Host
    Write-Host "You will need to restart your terminal or VS Code for it to take effect." -ForegroundColor Cyan
    Write-Host ("#"*75) -ForegroundColor Cyan
}
catch {
    Write-Error "An error occurred while attempting to generate TLS certificate: $_"
}
finally {
    Pop-Location
}