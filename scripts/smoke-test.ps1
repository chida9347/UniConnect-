# =============================================================================
# UniConnect API smoke test (PowerShell 5.1+ / PowerShell 7+)
#
# Usage:
#   $env:UNICONNECT_ADMIN_EMAIL = "admin@klu.ac.in"
#   $env:UNICONNECT_ADMIN_PASSWORD = "your-admin-password"
#   powershell -ExecutionPolicy Bypass -File scripts/smoke-test.ps1
#
# Or pass -AdminEmail / -AdminPassword explicitly. The backend must be running
# and the account must have the ADMIN role. No credentials are stored here.
# =============================================================================
param(
    [string]$BaseUrl = "http://localhost:8080/api",
    [string]$AdminEmail = $env:UNICONNECT_ADMIN_EMAIL,
    [string]$AdminPassword = $env:UNICONNECT_ADMIN_PASSWORD
)

$ErrorActionPreference = "Stop"
$script:Passed = 0
$script:Failed = 0

if (-not $AdminEmail -or -not $AdminPassword) {
    Write-Host "Admin credentials are required." -ForegroundColor Red
    Write-Host "Set UNICONNECT_ADMIN_EMAIL and UNICONNECT_ADMIN_PASSWORD, or pass -AdminEmail and -AdminPassword." -ForegroundColor Yellow
    exit 2
}

function Write-Result {
    param([string]$Name, [bool]$Ok, [string]$Detail = "")
    if ($Ok) {
        $script:Passed++
        Write-Host ("  [PASS] {0}" -f $Name) -ForegroundColor Green
    } else {
        $script:Failed++
        Write-Host ("  [FAIL] {0} {1}" -f $Name, $Detail) -ForegroundColor Red
    }
}

function Invoke-Api {
    param(
        [string]$Method = "GET",
        [string]$Path,
        [string]$Token,
        $Body,
        [string]$ContentType = "application/json",
        [hashtable]$Headers = @{}
    )
    $uri = "$BaseUrl$Path"
    $requestHeaders = @{}
    foreach ($k in $Headers.Keys) { $requestHeaders[$k] = $Headers[$k] }
    if ($Token) { $requestHeaders["Authorization"] = "Bearer $Token" }

    $params = @{
        Uri             = $uri
        Method          = $Method
        Headers         = $requestHeaders
        UseBasicParsing = $true
        TimeoutSec      = 30
    }
    if ($null -ne $Body) {
        if ($Body -is [string]) {
            $params["Body"] = $Body
        } else {
            $params["Body"] = ($Body | ConvertTo-Json -Depth 10)
        }
        $params["ContentType"] = $ContentType
    }

    try {
        $response = Invoke-WebRequest @params
        $parsed = $null
        if ($response.Content) {
            try { $parsed = $response.Content | ConvertFrom-Json } catch { $parsed = $response.Content }
        }
        return [pscustomobject]@{ Status = [int]$response.StatusCode; Data = $parsed; Raw = $response.Content; Headers = $response.Headers }
    } catch {
        $status = 0
        $content = $_.Exception.Message
        if ($_.Exception.Response) {
            $status = [int]$_.Exception.Response.StatusCode
            try {
                $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
                $content = $reader.ReadToEnd()
            } catch { }
        }
        return [pscustomobject]@{ Status = $status; Data = $content; Raw = $content; Headers = @{} }
    }
}

function Test-Ok {
    param([string]$Name, $Response, [int]$Expected = 200)
    Write-Result -Name $Name -Ok ($Response.Status -eq $Expected) -Detail ("(expected {0}, got {1}: {2})" -f $Expected, $Response.Status, $Response.Raw)
}

function New-RandomSuffix { return (Get-Random -Minimum 100000 -Maximum 999999) }

$suffix = New-RandomSuffix
$studentEmail = "student$suffix@klu.ac.in"
$studentPassword = "Student@12345"
$studentUniversityId = "KLU-$suffix"
$studentToken = $null
$studentId = $null
$adminToken = $null

Write-Host "`nUniConnect API smoke test -> $BaseUrl`n" -ForegroundColor Cyan

# --- Health ------------------------------------------------------------------
Write-Host "Health"
$health = Invoke-Api -Path "/health"
Test-Ok "GET /health" $health
Write-Result "health status is UP" ($health.Data.status -eq "UP")

# --- Authentication ----------------------------------------------------------
Write-Host "`nAuthentication"
$badLogin = Invoke-Api -Method POST -Path "/auth/login" -Body @{ email = $AdminEmail; password = "definitely-wrong" }
Test-Ok "wrong password rejected" $badLogin 401

$adminLogin = Invoke-Api -Method POST -Path "/auth/login" -Body @{ email = $AdminEmail; password = $AdminPassword }
Test-Ok "admin login" $adminLogin
if ($adminLogin.Status -eq 200) { $adminToken = $adminLogin.Data.token }
Write-Result "admin login returns ADMIN role" ($adminLogin.Data.user.role -eq "ADMIN")
Write-Result "admin login returns token" ([bool]$adminToken)

$register = Invoke-Api -Method POST -Path "/auth/register" -Body @{
    fullName = "Smoke Student $suffix"
    universityId = $studentUniversityId
    email = $studentEmail
    password = $studentPassword
    confirmPassword = $studentPassword
    department = "Computer Science and Engineering"
    academicYear = "3rd Year"
}
Test-Ok "student registration" $register 201
if ($register.Status -eq 201) {
    $studentToken = $register.Data.token
    $studentId = $register.Data.user.id
}
Write-Result "registration returns STUDENT role" ($register.Data.user.role -eq "STUDENT")

$duplicate = Invoke-Api -Method POST -Path "/auth/register" -Body @{
    fullName = "Duplicate $suffix"
    universityId = "KLU-D$suffix"
    email = $studentEmail
    password = $studentPassword
    confirmPassword = $studentPassword
    department = "Computer Science and Engineering"
    academicYear = "3rd Year"
}
Test-Ok "duplicate email rejected" $duplicate 409

$badDomain = Invoke-Api -Method POST -Path "/auth/register" -Body @{
    fullName = "Wrong Domain"
    universityId = "KLU-X$suffix"
    email = "wrong$suffix@gmail.com"
    password = $studentPassword
    confirmPassword = $studentPassword
    department = "Computer Science and Engineering"
    academicYear = "3rd Year"
}
Test-Ok "non-university email rejected" $badDomain 400

$me = Invoke-Api -Path "/auth/me" -Token $studentToken
Test-Ok "GET /auth/me as student" $me
Write-Result "me returns registered email" ($me.Data.email -eq $studentEmail)

$unauth = Invoke-Api -Path "/posts"
Test-Ok "unauthenticated request rejected" $unauth 401

$tampered = Invoke-Api -Path "/auth/me" -Token "$studentToken-tampered"
Test-Ok "tampered token rejected" $tampered 401

# --- Dashboard ---------------------------------------------------------------
Write-Host "`nDashboard"
$dashboard = Invoke-Api -Path "/dashboard" -Token $studentToken
Test-Ok "GET /dashboard as student" $dashboard
Write-Result "dashboard returns counts" ($null -ne $dashboard.Data.postCount)

# --- Posts -------------------------------------------------------------------
Write-Host "`nPosts"
$post = Invoke-Api -Method POST -Path "/posts" -Token $studentToken -Body @{
    title = "Smoke test post $suffix"
    content = "This post was created by the automated smoke test to verify post CRUD, authorization, and pagination."
}
Test-Ok "create post" $post 201
$postId = $post.Data.id

$postList = Invoke-Api -Path "/posts?search=Smoke%20test%20post%20$suffix" -Token $studentToken
Test-Ok "list posts with search" $postList
Write-Result "search finds created post" ($postList.Data.content.Count -ge 1)

$postGet = Invoke-Api -Path "/posts/$postId" -Token $studentToken
Test-Ok "get post" $postGet

$postUpdate = Invoke-Api -Method PUT -Path "/posts/$postId" -Token $studentToken -Body @{
    title = "Smoke test post updated $suffix"
    content = "Updated content from the automated smoke test. Ownership checks must allow the author to edit this post."
}
Test-Ok "update own post" $postUpdate
Write-Result "post update persisted" ($postUpdate.Data.title -eq "Smoke test post updated $suffix")

$invalidPost = Invoke-Api -Method POST -Path "/posts" -Token $studentToken -Body @{ title = "x"; content = "short" }
Test-Ok "invalid post rejected" $invalidPost 400

$postDelete = Invoke-Api -Method DELETE -Path "/posts/$postId" -Token $studentToken
Test-Ok "delete own post" $postDelete
$postGone = Invoke-Api -Path "/posts/$postId" -Token $studentToken
Test-Ok "deleted post is gone" $postGone 404

# --- Questions & answers -----------------------------------------------------
Write-Host "`nQuestions and answers"
$question = Invoke-Api -Method POST -Path "/questions" -Token $studentToken -Body @{
    title = "Smoke test question $suffix"
    content = "Is the automated smoke test able to create a question, add an answer, and clean both up correctly?"
}
Test-Ok "create question" $question 201
$questionId = $question.Data.id

$questionList = Invoke-Api -Path "/questions?search=Smoke%20test%20question%20$suffix" -Token $studentToken
Test-Ok "list questions with search" $questionList

$questionGet = Invoke-Api -Path "/questions/$questionId" -Token $studentToken
Test-Ok "get question detail" $questionGet

$answer = Invoke-Api -Method POST -Path "/questions/$questionId/answers" -Token $studentToken -Body @{
    content = "Yes, the smoke test can answer questions through the API."
}
Test-Ok "create answer" $answer 201
$answerId = $answer.Data.id

$answerDelete = Invoke-Api -Method DELETE -Path "/answers/$answerId" -Token $studentToken
Test-Ok "delete own answer" $answerDelete

$questionDelete = Invoke-Api -Method DELETE -Path "/questions/$questionId" -Token $studentToken
Test-Ok "delete own question" $questionDelete

# --- Study notes -------------------------------------------------------------
Write-Host "`nStudy notes"
$noteFile = Join-Path $env:TEMP "uniconnect-smoke-$suffix.txt"
$noteBody = "UniConnect smoke test note $suffix`nLine two of the downloadable note."
Set-Content -Path $noteFile -Value $noteBody -Encoding ASCII
$noteTitle = "Smoke test note $suffix"
$curlArgs = @(
    "-s", "-w", "`n%{http_code}", "-X", "POST", "$BaseUrl/notes",
    "-H", "Authorization: Bearer $studentToken",
    "-F", "title=$noteTitle",
    "-F", "subject=Software Engineering",
    "-F", "description=Automated smoke test upload",
    "-F", "file=@$noteFile;type=text/plain"
)
$noteRaw = & curl.exe @curlArgs
$noteLines = $noteRaw -split "`n"
$noteStatus = [int]$noteLines[-1]
$noteJson = ($noteLines[0..($noteLines.Length - 2)] -join "`n") | ConvertFrom-Json
Write-Result "upload note (multipart)" ($noteStatus -eq 201) "(got $noteStatus)"
$noteId = $noteJson.id
Write-Result "note stores original filename" ($noteJson.originalFilename -like "*.txt")

$noteList = Invoke-Api -Path "/notes?search=Smoke%20test%20note%20$suffix" -Token $studentToken
Test-Ok "list notes with search" $noteList

$downloadPath = Join-Path $env:TEMP "uniconnect-smoke-download-$suffix.txt"
$downloadStatus = & curl.exe -s -o $downloadPath -w "%{http_code}" -H "Authorization: Bearer $studentToken" "$BaseUrl/notes/$noteId/download"
Write-Result "download note" ($downloadStatus -eq "200") "(got $downloadStatus)"
$downloaded = Get-Content -Path $downloadPath -Raw
Write-Result "downloaded content matches upload" ($downloaded.Trim() -eq $noteBody.Trim())

$badFile = Join-Path $env:TEMP "uniconnect-smoke-$suffix.exe"
Set-Content -Path $badFile -Value "not executable" -Encoding ASCII
$badUpload = & curl.exe -s -o NUL -w "%{http_code}" -X POST "$BaseUrl/notes" -H "Authorization: Bearer $studentToken" -F "title=Bad file" -F "subject=Test" -F "file=@$badFile;type=application/octet-stream"
Write-Result "disallowed file type rejected" ($badUpload -eq "400") "(got $badUpload)"

$noteDelete = Invoke-Api -Method DELETE -Path "/notes/$noteId" -Token $studentToken
Test-Ok "delete own note" $noteDelete

Remove-Item -Path $noteFile, $badFile, $downloadPath -ErrorAction SilentlyContinue

# --- Faculty directory -------------------------------------------------------
Write-Host "`nFaculty directory"
$faculty = Invoke-Api -Method POST -Path "/faculty" -Token $adminToken -Body @{
    name = "Dr. Smoke Test $suffix"
    department = "Computer Science and Engineering"
    designation = "Professor"
    email = "faculty$suffix@klu.ac.in"
    specialization = "Distributed Systems"
    contactInfo = "+91 90000 00000"
}
Test-Ok "admin creates faculty" $faculty 201
$facultyId = $faculty.Data.id

$facultyList = Invoke-Api -Path "/faculty?search=Smoke%20Test%20$suffix" -Token $studentToken
Test-Ok "student lists faculty" $facultyList

$facultyDepartments = Invoke-Api -Path "/faculty/departments" -Token $studentToken
Test-Ok "list faculty departments" $facultyDepartments

$studentFacultyCreate = Invoke-Api -Method POST -Path "/faculty" -Token $studentToken -Body @{
    name = "Unauthorized Faculty"
    department = "Computer Science and Engineering"
    designation = "Professor"
    email = "unauthorized$suffix@klu.ac.in"
    specialization = "Testing"
}
Test-Ok "student cannot create faculty" $studentFacultyCreate 403

$facultyUpdate = Invoke-Api -Method PUT -Path "/faculty/$facultyId" -Token $adminToken -Body @{
    name = "Dr. Smoke Test Updated $suffix"
    department = "Computer Science and Engineering"
    designation = "Professor"
    email = "faculty$suffix@klu.ac.in"
    specialization = "Cloud Computing"
    contactInfo = "+91 90000 00000"
}
Test-Ok "admin updates faculty" $facultyUpdate

$facultyDelete = Invoke-Api -Method DELETE -Path "/faculty/$facultyId" -Token $adminToken
Test-Ok "admin deletes faculty" $facultyDelete

# --- Opportunities -----------------------------------------------------------
Write-Host "`nOpportunities"
$deadline = (Get-Date).AddDays(30).ToString("yyyy-MM-dd")
$opportunity = Invoke-Api -Method POST -Path "/opportunities" -Token $adminToken -Body @{
    title = "Smoke Test Internship $suffix"
    description = "A twelve week internship used by the automated smoke test to verify opportunity management."
    category = "INTERNSHIP"
    organization = "UniConnect Labs"
    applicationUrl = "https://example.com/apply/$suffix"
    deadline = $deadline
}
Test-Ok "admin creates opportunity" $opportunity 201
$opportunityId = $opportunity.Data.id

$opportunityList = Invoke-Api -Path "/opportunities?search=Smoke%20Test%20Internship%20$suffix" -Token $studentToken
Test-Ok "student lists opportunities" $opportunityList

$studentOpportunityCreate = Invoke-Api -Method POST -Path "/opportunities" -Token $studentToken -Body @{
    title = "Unauthorized Opportunity"
    description = "Students must not be able to create opportunities through this endpoint."
    category = "INTERNSHIP"
    organization = "Nope"
    applicationUrl = "https://example.com"
    deadline = $deadline
}
Test-Ok "student cannot create opportunity" $studentOpportunityCreate 403

$opportunityUpdate = Invoke-Api -Method PUT -Path "/opportunities/$opportunityId" -Token $adminToken -Body @{
    title = "Smoke Test Internship Updated $suffix"
    description = "An updated twelve week internship used by the automated smoke test."
    category = "INTERNSHIP"
    organization = "UniConnect Labs"
    applicationUrl = "https://example.com/apply/$suffix"
    deadline = $deadline
}
Test-Ok "admin updates opportunity" $opportunityUpdate

$opportunityDelete = Invoke-Api -Method DELETE -Path "/opportunities/$opportunityId" -Token $adminToken
Test-Ok "admin deletes opportunity" $opportunityDelete

# --- Profile -----------------------------------------------------------------
Write-Host "`nProfile"
$profile = Invoke-Api -Path "/profile" -Token $studentToken
Test-Ok "get own profile" $profile

$profileUpdate = Invoke-Api -Method PUT -Path "/profile" -Token $studentToken -Body @{
    fullName = "Smoke Student Updated $suffix"
    department = "Information Technology"
    academicYear = "4th Year"
    role = "ADMIN"
    email = "hacker$suffix@klu.ac.in"
}
Test-Ok "update own profile" $profileUpdate
Write-Result "profile update applies allowed fields" ($profileUpdate.Data.department -eq "Information Technology")
Write-Result "profile update cannot escalate role" ($profileUpdate.Data.role -eq "STUDENT")
Write-Result "profile update cannot change email" ($profileUpdate.Data.email -eq $studentEmail)

# --- Admin -------------------------------------------------------------------
Write-Host "`nAdmin"
$adminUsers = Invoke-Api -Path "/admin/users?search=$studentEmail" -Token $adminToken
Test-Ok "admin lists users" $adminUsers

$studentAdminAccess = Invoke-Api -Path "/admin/users" -Token $studentToken
Test-Ok "student cannot access admin users" $studentAdminAccess 403

$moderationPost = Invoke-Api -Method POST -Path "/posts" -Token $studentToken -Body @{
    title = "Post for moderation $suffix"
    content = "This post exists so the administrator can verify moderation deletion through the admin API."
}
Test-Ok "create post for moderation" $moderationPost 201
$moderationPostId = $moderationPost.Data.id
$moderationDelete = Invoke-Api -Method DELETE -Path "/admin/posts/$moderationPostId" -Token $adminToken
Test-Ok "admin removes a post" $moderationDelete
$moderationGone = Invoke-Api -Path "/posts/$moderationPostId" -Token $studentToken
Test-Ok "moderated post is gone" $moderationGone 404

# --- Error handling ----------------------------------------------------------
Write-Host "`nError handling"
$notFound = Invoke-Api -Path "/posts/999999999" -Token $studentToken
Test-Ok "unknown resource returns 404" $notFound 404
$badJson = Invoke-Api -Method POST -Path "/posts" -Token $studentToken -Body "{ not valid json" -ContentType "application/json"
Test-Ok "malformed JSON rejected" $badJson 400
$unauthAdmin = Invoke-Api -Path "/admin/users"
Test-Ok "unauthenticated admin access rejected" $unauthAdmin 401

# --- Summary -----------------------------------------------------------------
Write-Host ""
Write-Host ("Result: {0} passed, {1} failed" -f $script:Passed, $script:Failed) -ForegroundColor $(if ($script:Failed -eq 0) { "Green" } else { "Red" })
if ($script:Failed -gt 0) { exit 1 } else { exit 0 }
