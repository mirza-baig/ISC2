$Results = @();
$SubItems = Get-ChildItem  -Recurse . | Where-Object { $_.TemplateID -match "{11CEE539-F3E0-4B18-984D-EC810F1329F4}"} 
if($SubItems.Count -eq 0){
    Show-Alert "No items found!"
} else {
    $props = @{
        Title = "Export Item"
        InfoTitle = "Total $($SubItems.Count) items found!"
        InfoDescription = "Export Item Data"
        PageSize = 100
    }
    
    foreach($item in $SubItems){
        $bodyContentItem = Get-ChildItem -Path $item.Paths.Path -Recurse | where-object {$_.TemplateID -eq "{46A8D427-F74C-421C-AEC1-18B2BBE7F358}"}
        $Properties = @{
                    ItemName = $item.Name
                    Title = $item["PageTitle"]
                    PageTitle = $item["Title"]
                    PageDescription = $item["Description"]
                    Date = $item.Created
                    Description =  $bodyContentItem['BodyContent']
                }
       $Results += New-Object psobject -Property $Properties
        }
     $fields = $SubItems | Get-ItemField
     $Results|Show-ListView
}
