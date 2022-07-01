seed:
	node ace db:seed --files "./database/seeders/Initial.ts"
	node ace db:seed --files "./database/seeders/Species.ts"
	node ace db:seed --files "./database/seeders/Race.ts"
