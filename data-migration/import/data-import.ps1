#Upload the file on the Server in temporary folder

<#
    .SYNOPSIS
        Import data based on given templates
        
  
#>

$database = "master"
$root = Get-Item -Path (@{$true="$($database):\content\ISC2\Main\Home"; $false="$($database):\content"}[(Test-Path -Path "$($database):\content\ISC2\Main\Home")])
$baseTemplate = Get-Item "master:\templates\Project\ISC2\Custom Pages"
$pageType = Get-Item "master:\sitecore\content\ISC2\Main\Data\Page Types"
$isBucket = "Yes"
$dropListOptions = [ordered]@{
    "Yes"="Yes"
    "No"= "No"
}

$props = @{
    Parameters = @(
        @{Name="root"; Title="Choose the root item where you wish to import the data"; Tooltip="Make sure the root selected is the right path."; }
        @{ Name = "baseTemplate"; Title="Base Template"; Tooltip="Select the item to use as a base template for the import"; Root="/sitecore/templates/Project/ISC2/Custom Pages"}
        @{ Name = "pageType"; Title="Page Type"; Tooltip="Select the page type associated with the imported data"; Root="/sitecore/content/ISC2/Main/Data/Page Types"}
        @{Name="isBucket"; Title="Create bucket items"; Options=$dropListOptions; Tooltip="Create items in a folder heirarchy year/month/{item}."}

    )
    Title = "Import Data from CSV"
    Description = "Choose the criteria for the import."
    Width = 550
    Height = 300
    ShowHints = $true
}

function Write-LogExtended {
    param(
        [string]$Message,
        [System.ConsoleColor]$ForegroundColor = $host.UI.RawUI.ForegroundColor,
        [System.ConsoleColor]$BackgroundColor = $host.UI.RawUI.BackgroundColor
    )
    
    Write-Log -Object $message
    Write-Host -Object $message -ForegroundColor $ForegroundColor -BackgroundColor $backgroundColor
}

$result = Read-Variable @props
Write-LogExtended ">Selected root path $($root.FullPath)" -ForegroundColor Yellow
Write-LogExtended  "Selected base template path $($baseTemplate.FullPath)"-ForegroundColor Yellow
Write-LogExtended "Selected Import Page Type: $($pageType.Name)"  -ForegroundColor Yellow
Write-LogExtended "Create Buckets: $($isBucket)"  -ForegroundColor Yellow
if($result -eq "cancel") {
    exit
}

function Import-CSVData
{
    
$dataFolder = [Sitecore.Configuration.Settings]::DataFolder
$tempFolder = $dataFolder + "\temp\upload"
$filePath = Receive-File -Path $tempFolder -overwrite

if($filePath -eq "cancel"){
    exit
}
$resultSet =  Import-Csv $filePath
#check if data exist in the csv
$rowsCount = ( $resultSet | Measure-Object ).Count;
Write-LogExtended "Total Items to be imported:$($rowsCount)"  -ForegroundColor Yellow
    if($rowsCount -le 0){
        Remove-Item $filePath
        exit
    }
    
switch ($isBucket) {
    "Yes" {
        Import-Articles -resultSet $resultSet -parentPath $root.FullPath -importpageType $pageType.Name
    }
    default {
        Import-Data -resultSet $resultSet -parentPath $root.FullPath -importpageType $pageType.Name
        
    }
  }
#Import-Articles -resultSet $resultSet -parentPath $root.FullPath -importpageType $pageType.Name

Remove-Item $filePath

}


function Import-Articles
{
    [CmdletBinding()]
    param(
       
        [Object]$resultSet,
        [string]$parentPath,
        [string]$importpageType
    )
    
Write-LogExtended "============================Begin Import====================" -ForegroundColor Green   
    $ctr=0
    foreach ($row in $resultSet )
    {
       $name = $row.ItemName.Replace(" ","-")
	#Check if Title is not empty
	if($name.Trim() -eq "")
	{
		Write-LogExtended "Item name should not be blank: $($name) "
        continue
	}
	$createdDate = $row.Date
	$csvDate = Get-Date $createdDate

	$itemPath = $parentPath + "/" +  $csvDate.Year + "/" +$csvDate.Month + "/" + $name #Create Item path
	$Item = Get-Item -Path $itemPath -ErrorAction SilentlyContinue #Get the sitecore Item

	if($null -eq $Item) #Check if Item is null then create new Item
	{
		try
		{
		    $yearPath =  $parentPath + "/" +  $csvDate.Year 
		    $yearFolderExist = Test-Path -Path $yearPath
		    if(-not ($yearFolderExist)) #Check if YearFolder exist
	        {
	            $createFolder = New-Item -Path  $parentPath  -Name  $csvDate.Year  -ItemType "/sitecore/templates/Project/ISC2/Folder Types/Article Folders"                                
	        }
	        
	        $monthPath =  $parentPath + "/" + $csvDate.Year + "/" +  $csvDate.Month
	        $monthFolderExist= Test-Path -Path $monthPath
	       
		    if(-not ($monthFolderExist)) #Check if Month Folder exist
	        {
	            $createMonth = New-Item -Path $yearPath -Name $csvDate.Month -ItemType "/sitecore/templates/Project/ISC2/Folder Types/Article Folders"                                
	        }
			$item = New-Item -Path $monthPath -Name $name -ItemType $baseTemplate.ID                                
			Write-LogExtended "Item created: $($itemPath)" -ForegroundColor Green         
		}             
		catch
		{
			Write-LogExtended "Failed to create Item:$($itemPath)"               
			Write-LogExtended $_.Exception.Message    
			continue
		}
	}
		    
	#Assign Field values to the Sitecore Item  
		$item.Editing.BeginEdit()
		$item["Title"] = $row.Title
   		$item["articleHeading"] = $row.ItemName.Replace("-"," ")
		$item["articleBody"] = $row.Description
		$item["pageTitle"] = $row.PageTitle
		$item["pageDescription"] = $row.PageDescription
		$item["articleDate"] = [Sitecore.DateUtil]::ToIsoDate($csvDate)   
		$item["ogTitle"] = $row.PageTitle
		$item["ogDescription"] = $row.PageDescription
		$item["type"]= $importpageType
		$item.Editing.EndEdit() 
		Write-LogExtended "Item updated succesfully:$($item.Name)" -ForegroundColor Green  
		$ctr=$ctr+1
    }
    
    Write-LogExtended "========================================================" -ForegroundColor Yellow   
    Write-LogExtended "Bulk Update is Completed!!!! Total numer of records imported $($ctr)"
}
function Import-Data
{
    [CmdletBinding()]
    param(
       
        [Object]$resultSet,
        [string]$parentPath,
        [string]$importpageType
    )
    
    Write-LogExtended "============================Begin Import====================" -ForegroundColor Green   
    $ctr=0
    foreach ($row in $resultSet )
    {
       $name = $row.ItemName.Replace(" ","-")
	#Check if Title is not empty
	if($name.Trim() -eq "")
	{
		Write-LogExtended "Item name should not be blank: $($name) "
        continue
	}
	$createdDate = $row.Date
	$csvDate = Get-Date $createdDate
	$itemPath = $parentPath + "/" + $name #Create Item path
	$Item = Get-Item -Path $itemPath -ErrorAction SilentlyContinue #Get the sitecore Item

	if($null -eq $Item) #Check if Item is null then create new Item
	{
		try
		{
			$item = New-Item -Path $parentPath -Name $name -ItemType $baseTemplate.ID                                
			Write-LogExtended "Item created: $($itemPath)" -ForegroundColor Green         
		}             
		catch
		{
			Write-LogExtended "Failed to create Item:$($itemPath)"               
			Write-LogExtended $_.Exception.Message    
			continue
		}
	}
	#Assign Field values to the Sitecore Item  
		$item.Editing.BeginEdit()
		$item["Title"] = $row.Title
		$item["articleBody"] = $row.Description
		$item["articleHeading"] = $row.ItemName.Replace("-"," ")
		$item["pageTitle"] = $row.PageTitle
		$item["pageDescription"] = $row.PageDescription
		$item["articleDate"] = [Sitecore.DateUtil]::ToIsoDate($csvDate)   
		$item["ogTitle"] = $row.PageTitle
		$item["ogDescription"] = $row.PageDescription
		$item["type"]= $importpageType
		$item.Editing.EndEdit() 
		Write-LogExtended "Item updated succesfully:$($item.Name)" -ForegroundColor Green  
		$ctr=$ctr+1
    }

    Write-LogExtended "========================================================" -ForegroundColor Yellow   
    Write-LogExtended "Bulk Update is Completed!!!! Total numer of records imported $($ctr)"

}

Import-CSVData
