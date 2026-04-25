param (
    [Parameter(Mandatory = $true)]
    [string]$PathToWorkspace
)

# Parses PnP PowerShell documentation markdown files and produces:
#   - snippets/pnpPowerShell.code-snippets : VS Code snippet definitions
#   - data/pnpPsModel.json                 : list of commands with doc URLs
#
# Parsing rules (per command markdown file):
#   * Command name  -> markdown filename (without .md)
#   * description   -> contents of the "## DESCRIPTION" section, with markdown
#                      links [text](url) reduced to "text" and whitespace
#                      collapsed to a single line.
#   * body          -> first ```powershell``` code block under "## SYNTAX".
#                      Parameters wrapped in [..] (optional / positional
#                      switches such as [-Verbose], [-Connection ...]) are
#                      skipped. Remaining parameters become $1, $2, ...
#                      placeholders in declaration order, deduplicated.
#   * prefix        -> command name.

$docsRoot = Join-Path -Path $PathToWorkspace -ChildPath 'powershell\documentation'
$allCommands = Get-ChildItem -Path (Join-Path $docsRoot '*.md') -Recurse -Force -Exclude '_global*'

$commandSnippets = [ordered]@{}
$commands = @()

foreach ($commandFile in $allCommands) {
    $commandTitle = [System.IO.Path]::GetFileNameWithoutExtension($commandFile.Name)
    $content = Get-Content -Path $commandFile.FullName -Raw

    # ----- description -----
    $description = ''
    $descMatch = [regex]::Match(
        $content,
        '(?ms)^##\s+DESCRIPTION\s*\r?\n(.*?)(?=^##\s+|\z)'
    )
    if ($descMatch.Success) {
        $descText = $descMatch.Groups[1].Value.Trim()
        # [text](url) -> text
        $descText = [regex]::Replace($descText, '\[([^\]]+)\]\([^\)]+\)', '$1')
        # collapse whitespace / newlines into single spaces
        $descText = [regex]::Replace($descText, '\s+', ' ').Trim()
        $description = $descText
    }

    # ----- body -----
    $body = $commandTitle
    $syntaxMatch = [regex]::Match(
        $content,
        '(?ms)^##\s+SYNTAX\s*\r?\n.*?```powershell\s*\r?\n(.*?)\r?\n\s*```'
    )
    if ($syntaxMatch.Success) {
        $syntaxText = $syntaxMatch.Groups[1].Value
        # Strip optional/bracketed parameters: [-Foo <T>], [-Bar], [<CommonParameters>]
        $cleaned = [regex]::Replace($syntaxText, '\[[^\]]*\]', '')
        $paramMatches = [regex]::Matches($cleaned, '(?<!\w)-([A-Za-z][A-Za-z0-9]*)')

        $params = New-Object System.Collections.Generic.List[string]
        foreach ($m in $paramMatches) {
            $name = $m.Groups[1].Value
            if ($name -ieq 'Verbose' -or $name -ieq 'Debug' -or
                $name -ieq 'WhatIf'  -or $name -ieq 'Confirm') { continue }
            if (-not $params.Contains($name)) { [void]$params.Add($name) }
        }

        if ($params.Count -gt 0) {
            $bodyParts = @($commandTitle)
            for ($i = 0; $i -lt $params.Count; $i++) {
                $bodyParts += ('-{0} ${1}' -f $params[$i], ($i + 1))
            }
            $body = ($bodyParts -join ' ')
        }
        else {
            # Match historical snippet style: trailing space when no params
            $body = "$commandTitle "
        }
    }

    $commandSnippets[$commandTitle] = [ordered]@{
        description = @($description)
        body        = @($body)
        prefix      = @($commandTitle)
    }

    $commands += [pscustomobject]@{
        name = $commandTitle
        url  = "https://raw.githubusercontent.com/pnp/powershell/dev/documentation/$commandTitle.md"
        docs = "https://pnp.github.io/powershell/cmdlets/$commandTitle.html"
    }
}

# Sort commands alphabetically
$sortedSnippets = [ordered]@{}
foreach ($key in ($commandSnippets.Keys | Sort-Object)) {
    $sortedSnippets[$key] = $commandSnippets[$key]
}

$snippetsOutPath = Join-Path $PathToWorkspace 'vscode-pnp-powershell\snippets\pnpPowerShell.code-snippets'
$modelOutPath    = Join-Path $PathToWorkspace 'vscode-pnp-powershell\data\pnpPsModel.json'

$sortedSnippets | ConvertTo-Json -Depth 10 | Out-File -FilePath $snippetsOutPath -Encoding utf8

$pnpPsModel = [ordered]@{ commands = $commands }
$pnpPsModel | ConvertTo-Json -Depth 10 | Out-File -FilePath $modelOutPath -Encoding utf8
