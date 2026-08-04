# --------------------------------------------------------------------------------------------
# Parameters
# --------------------------------------------------------------------------------------------

[CmdletBinding()]
param (
    [Parameter()]
    [string] $MainBranch = "CWPI-main",

    [Parameter()]
    [string] $ReleaseBranch = "release/$(Get-Date -Format 'yyyMMddHHmmss')",
    
    [Parameter()]
    [string] $BitBucketWorkspace = "isc2",

    [Parameter()]
    [string] $BitBucketRepo = "sitecorev10-phase2",

    [Parameter()]
    [string] $PullRequestTitle = "Generate Changelog for $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')",

    [Parameter()]
    [string] $PullRequestDescription = "Automated changelog generation and version bump",

    [Parameter()]
    [string] $BitBucketEmail,

    [Parameter()]
    [string] $BitBucketToken,

    [Parameter()]
    [string] $SlackWebhook
)

# --------------------------------------------------------------------------------------------
# Functions
# --------------------------------------------------------------------------------------------

function Approve-PullRequest {
    param(
        [string] $pullRequestId,
        [string] $workspace,
        [string] $repoSlug
    )

    # Authentication headers
    $headers = @{
        Authorization = "Bearer $BitBucketToken"
        Accept = "application/json"
    }

    # Approve the pull request
    Invoke-RestMethod -Uri "https://api.bitbucket.org/2.0/repositories/${workspace}/${repoSlug}/pullrequests/${pullRequestId}/approve" -Method Post -Headers $headers

    # Mergy request body
    $body = @{
        type = "pullrequest"
        close_source_branch = $true
    } | ConvertTo-Json

    # Merge the pull request
    Invoke-RestMethod -Uri "https://api.bitbucket.org/2.0/repositories/${workspace}/${repoSlug}/pullrequests/${pullRequestId}/merge" -Method Post -Headers $headers -Body $body
}

function New-PullRequest {
    param(
        [string] $workspace,
        [string] $repoSlug,
        [string] $title,
        [string] $description,
        [string] $sourceBranch,
        [string] $destinationBranch
    )

    # Authentication headers
    $headers = @{
        Authorization = "Bearer $BitBucketToken"
        Accept = "application/json"
        "Content-Type" = "application/json"
    }

    # The request body
    $body = @{
        title = $title
        description = $description
        source = @{
            branch = @{
                name = $sourceBranch
            }
        }
        destination = @{
            branch = @{
                name = $destinationBranch
            }
        }
    } | ConvertTo-Json

    Write-Host $body -ForegroundColor Yellow

    # Create the pull request
    return Invoke-RestMethod -Uri "https://api.bitbucket.org/2.0/repositories/${workspace}/${repoSlug}/pullrequests" -Method Post -Headers $headers -Body $body
}

# --------------------------------------------------------------------------------------------
# Main
# --------------------------------------------------------------------------------------------

# Set Git user info
git config user.email $BitBucketEmail
git config user.name "CI/CD Bot"

# Create a new branch for the release
git checkout $MainBranch
git checkout -b $ReleaseBranch

# Bump the version in the package.json. This will also generate the changelog and add it to the commit
npm version patch -m "ci: v%s"

# Push the changes to the remote repository
git push origin $ReleaseBranch
git push --tags

# Create a pull request
$pr = New-PullRequest -workspace $BitBucketWorkspace -repoSlug $BitBucketRepo -title $PullRequestTitle -description $PullRequestDescription -sourceBranch $ReleaseBranch -destinationBranch $MainBranch

# Approve the pull request
Approve-PullRequest -pullRequestId $pr.id -workspace $BitBucketWorkspace -repoSlug $BitBucketRepo

if (-not([string]::IsNullOrEmpty($SlackWebhook))) {
    # Get the changelog contents and trim to the maximum length of 3000 characters
    $content = Get-Content CHANGELOG.md -Raw
    $content = $content.Substring(0, [Math]::Min(4000, $content.Length))

    # Notify Slack via webhook
    # The changelog contents will be the notification message
    $body = @{
        "changelog" = $content
    } | ConvertTo-Json

    Invoke-RestMethod -Uri $SlackWebhook -Method Post -Body $body -ContentType "application/json"
}