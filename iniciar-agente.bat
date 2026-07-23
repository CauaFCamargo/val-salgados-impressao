@echo off
title Val Salgados - Impressao
rem Vai para a pasta deste arquivo (funciona em qualquer maquina).
cd /d "%~dp0"

:loop
call npm start
echo.
echo O agente parou. Reiniciando em 5 segundos...
echo (Para encerrar de vez, feche esta janela.)
timeout /t 5 /nobreak >nul
goto loop
