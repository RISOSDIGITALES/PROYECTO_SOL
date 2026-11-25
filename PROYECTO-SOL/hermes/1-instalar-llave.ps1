# Instala una llave SSH de esta PC en el servidor de Hermes (una sola vez).
# Lo corre la usuaria: al final el servidor pide la contraseña y la escribe ella.
# Después, Claude y el script de chat entran con la llave, sin contraseña.
# La dirección del servidor se lee de .secrets.local.md (HERMES_SSH); no queda en el repo.

$ErrorActionPreference = 'Stop'
$raiz = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$secretos = Get-Content (Join-Path $raiz '.secrets.local.md') -Raw
if ($secretos -notmatch '(?m)^HERMES_SSH=(\S+)') { throw 'Falta HERMES_SSH en .secrets.local.md' }
$servidor = $Matches[1]

$llave = Join-Path $env:USERPROFILE '.ssh\id_ed25519_hermes'
if (-not (Test-Path $llave)) {
    New-Item -ItemType Directory -Force (Split-Path $llave) | Out-Null
    ssh-keygen -t ed25519 -f $llave -N '""' -C 'risos-hermes'
}

Write-Host ''
Write-Host 'Ahora el servidor te va a pedir la contraseña: escríbela (no se ve mientras escribes) y Enter.' -ForegroundColor Cyan
Get-Content "$llave.pub" | ssh $servidor 'umask 077; mkdir -p ~/.ssh; cat >> ~/.ssh/authorized_keys'

Write-Host ''
Write-Host 'Probando la llave...' -ForegroundColor Cyan
ssh -i $llave -o BatchMode=yes $servidor 'echo Listo: la llave funciona'
