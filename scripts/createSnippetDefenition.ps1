param (
    [Parameter(Mandatory = $true)]
    [string]$PathToWorkspace
)

$allCommands = Get-ChildItem -Path "$PathToWorkspace\powershell\documentation\*.md" -Recurse -Force -Exclude "_global*"

[hashtable]$commandSnippets = @{}
[hashtable]$pnpPsModel = @{}
$commands = @()

foreach ($command in $allCommands) {
    $commandDocs = ConvertFrom-Markdown -Path $command
    $html = New-Object -ComObject 'HTMLFile'
    $html.write([ref]$commandDocs.Html)
        
    $title = $html.all.tags('h1')[0]
    $commandTitle = $title.innerText

    $description = $html.all.tags('h2') | Where-Object { $_.tagName -eq 'H2' } | Select-Object -First 4
    $descriptionIndex = @($html.all).IndexOf($description[$description.Count - 1])
    $examples = $html.all.tags('h2') | Where-Object { $_.tagName -eq 'H2' } | Select-Object -First 5
    $examplesIndex = @($html.all).IndexOf($examples[$examples.Count - 1])
    $commandDescription = @($html.all)[($descriptionIndex + 1)..($examplesIndex - 1)]
    if (($descriptionIndex + 1) -le ($examplesIndex - 1)) {
        $commandDescription = $commandDescription | ForEach-Object { $_.innerText }
    }
    else {
        $commandDescription = ''
    }
    
    $syntax = $html.all.tags('h2') | Where-Object { $_.tagName -eq 'H2' } | Select-Object -First 3
    $syntaxIndex = @($html.all).IndexOf($syntax[$syntax.Count - 1])
    $commandOptions = @($html.all)[($syntaxIndex + 1)..($descriptionIndex - 1)]
    $commandOptions = $commandOptions | Where-Object { $_.nodeName -eq 'CODE' } | ForEach-Object { $_.innerText }
    $commandOptions = $commandOptions.split('[-')[0]
    $commandOptions = $commandOptions.split(' ')
    $commandOptions = $commandOptions | Where-Object { $_ -match '\-(.*?)' }
    if ($commandOptions.Count -gt 1) {
        $commandOptions = $commandOptions[1..($commandOptions.Length - 1)]
        $commandOptions = $commandOptions | ForEach-Object { $_.split('-')[1] }
        $commandOptions = $commandOptions | ForEach-Object { "-" + $_ + ' $' + $($commandOptions.IndexOf($_) + 1) }
        $commandOptions = $commandOptions -join " "
        $commandOptions = $commandOptions.replace(':$true', '')
    }
    else {
        $commandOptions = ''
    }

    [hashtable]$commandProperties = [ordered]@{}
    $commandProperties.Add('prefix', @("$commandTitle"))
    $commandProperties.Add('body', @("$commandTitle $commandOptions"))
    $commandProperties.Add('description', $commandDescription)
    $commandClass = New-Object -TypeName psobject -Property $commandProperties

    $commandSnippets.Add($commandTitle, $commandClass)

    $commands += [pscustomobject]@{
        name    = "$commandTitle"; 
        url     = "https://raw.githubusercontent.com/pnp/powershell/dev/documentation/$commandTitle.md" ;
        docs    = "https://pnp.github.io/powershell/cmdlets/$commandTitle.html" 
    }
}

$orderedCommandSnippets = [ordered]@{}
foreach ($Item in ($commandSnippets.GetEnumerator() | Sort-Object -Property Key)) {
    $orderedCommandSnippets[$Item.Key] = $Item.Value
}
New-Object -TypeName psobject -Property $orderedCommandSnippets | ConvertTo-Json | Out-File "$PathToWorkspace\vscode-pnp-powershell\snippets\pnpPowerShell.code-snippets"

$pnpPsModel.Add('commands', $commands)
$orderedPnpPsModel = [ordered]@{}
foreach ($Item in ($pnpPsModel.GetEnumerator() | Sort-Object -Property Key)) {
    $orderedPnpPsModel[$Item.Key] = $Item.Value
}
New-Object -TypeName psobject -Property $orderedPnpPsModel | ConvertTo-Json | Out-File "$PathToWorkspace\vscode-pnp-powershell\data\pnpPsModel.json"
