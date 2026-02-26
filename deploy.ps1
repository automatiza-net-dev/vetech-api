# Atualiza o repositório
git fetch
git pull origin master

pm2 stop 0 1

#Remove-Item -Recurse -Force -ErrorAction SilentlyContinue .\build

# Instala dependências e gera build
#npm install
npm run build

# Copia .env para a pasta build
Copy-Item .env build\.env -Force

# Copia a pasta public para dentro de build
Copy-Item -Recurse -Force public build\public

# Executa migrações
node ace migration:run

# Reinicia processos do PM2
pm2 start 0
#pm2 restart cron

Write-Host "Deploy finalizado com sucesso!"

