$psi = New-Object System.Diagnostics.ProcessStartInfo
$psi.FileName = "cmd.exe"
$psi.Arguments = '/c "npm run dev"'
$psi.WorkingDirectory = "C:\Users\Q\OneDrive\Desktop\storge\warehouse-rental\frontend"
$psi.UseShellExecute = $true
$psi.CreateNoWindow = $false
$psi.WindowStyle = [System.Diagnostics.ProcessWindowStyle]::Normal
[System.Diagnostics.Process]::Start($psi)
