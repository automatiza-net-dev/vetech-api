@echo off
REM Atualiza o repositório
git fetch
git pull origin main

REM Instala dependências e gera build
yarn
yarn build

REM Copia .env para a pasta build
copy /Y .env build\.env

REM Copia a pasta public para dentro de build
xcopy public build\public /E /I /Y

REM Executa migrações
node ace migration:run

REM Reinicia processos do PM2
pm2 restart Api
pm2 restart cron

echo Deploy finalizado com sucesso!
pause
