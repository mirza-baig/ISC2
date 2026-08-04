$Results = @();
$SubItems = Get-ChildItem  -Recurse . | Where-Object { $_.TemplateID -match '{6375E19E-96A2-44DC-9CCD-568D1894956C}'} 
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
        #$bodyContentItem = Get-ChildItem -Path $item.Paths.Path -Recurse | where-object {$_.TemplateID -eq "{46A8D427-F74C-421C-AEC1-18B2BBE7F358}"}
        $Properties = @{
                    ItemName = $item.Name
                    Title = $item["PageTitle"]
                    Description = $item['Body']
                    PageTitle = $item["Title"]
                    PageDescription = $item["Description"]
                    Date = $item.Created
                    TemplateId=$item.TemplateID
                }
       $Results += New-Object psobject -Property $Properties
        }
     $fields = $SubItems | Get-ItemField
     $Results|Show-ListView
}
