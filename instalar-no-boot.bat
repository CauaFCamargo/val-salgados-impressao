@echo off
rem Cria um atalho na pasta de Inicializacao do Windows para o agente subir
rem sozinho (minimizado) toda vez que o computador ligar. Rode UMA vez.
set "STARTUP=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"

powershell -NoProfile -Command ^
  "$s=(New-Object -ComObject WScript.Shell).CreateShortcut((Join-Path $env:APPDATA 'Microsoft\Windows\Start Menu\Programs\Startup\Val Salgados Impressao.lnk')); $s.TargetPath='%~dp0iniciar-agente.bat'; $s.WorkingDirectory='%~dp0'; $s.WindowStyle=7; $s.Save()"

echo.
echo Pronto! O agente vai iniciar sozinho quando o Windows ligar (janela minimizada).
echo Para DESFAZER, apague o atalho "Val Salgados Impressao" em:
echo   %STARTUP%
echo.
pause
