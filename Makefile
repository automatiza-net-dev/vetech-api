admin:
	node ace db:seed --files "./database/seeders/Initial.ts"

animals:
	node ace db:seed --files "./database/seeders/Species.ts"
	node ace db:seed --files "./database/seeders/Race.ts"
