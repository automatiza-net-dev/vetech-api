# Atualiza o repositório
git fetch
git pull origin master

# Para a aplicação atual
pm2 stop vetech-api

# Instala dependências e gera build
#npm install
npm run build

# Copia .env para a pasta build
Copy-Item .env build\.env -Force

# Copia a pasta public para dentro de build
Copy-Item -Recurse -Force public build\public

# Executa migrações
node ace migration:run

# Recarrega a aplicação com a nova configuração
pm2 restart ecosystem.config.js --env=production

Write-Host "Deploy finalizado com sucesso!"

