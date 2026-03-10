# Vetech - API

1. Iniciar em produção:
   pm2 start ecosystem.config.js --env=production

2. Salvar configuração:
   pm2 save

3. Configurar startup automático (como Administrador):

Opção A - Serviço Windows (recomendado):
npm install -g pm2-windows-service
pm2-service-install -n VetechAPI

Opção B - Registro (mais simples):
npm install -g pm2-windows-startup
pm2-startup install

4. Verificar:

- Abra services.msc e confirme que o serviço "VetechAPI" está como "Automático"
- Ou reinicie o Windows e teste

Comandos úteis:

- pm2 status - ver processos
- pm2 logs - ver logs
- pm2 monit - monitoramento
- pm2 restart vetech-api - reiniciar app
