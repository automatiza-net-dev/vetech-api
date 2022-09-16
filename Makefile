admin:
	node ace db:seed --files "./database/seeders/Initial.ts"

animals:
	node ace db:seed --files "./database/seeders/Species.ts"
	node ace db:seed --files "./database/seeders/Race.ts"

timeline:
	node ace db:seed --files "./database/seeders/TimelineSeeder.ts"

schedule-statuses:
	node ace db:seed --files "./database/seeders/ScheduleStatus.ts"

variations:
	node ace db:seed --files "./database/seeders/VariationSeeder.ts"

units:
	node ace db:seed --files "./database/seeders/UnitSeeder.ts"
