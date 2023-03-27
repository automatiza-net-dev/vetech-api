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

occurrences:
	node ace db:seed --files "./database/seeders/OccurrenceSeeder.ts"

reason:
	node ace db:seed --files "./database/seeders/ReasonSeeder.ts"

client-origin:
	node ace db:seed --files "./database/seeders/ClientOrigin.ts"

bank:
	node ace db:seed --files "./database/seeders/BankSeeder.ts"
	
tef:
	node ace db:seed --files "./database/seeders/TefSeeder.ts"
	
icms:
	node ace db:seed --files "./database/seeders/UfIcmsSeeder.ts"

initial:
		node ace db:seed --files "./database/seeders/Subgroup.ts"
		node ace db:seed --files "./database/seeders/ServiceSchedule.ts"
		node ace db:seed --files "./database/seeders/ScheduleServiceTypesSeeder.ts"
		node ace db:seed --files "./database/seeders/ScheduleStatus.ts"
		node ace db:seed --files "./database/seeders/ClientOrigin.ts"
		node ace db:seed --files "./database/seeders/DocumentTemplateSeeder.ts"
		node ace db:seed --files "./database/seeders/MedicalDocumentTemplateSeeder.ts"
		node ace db:seed --files "./database/seeders/Species.ts"
		node ace db:seed --files "./database/seeders/Race.ts"
		node ace db:seed --files "./database/seeders/BrandSeeder.ts"
		node ace db:seed --files "./database/seeders/PatientAnimalHairSeeder.ts"
		node ace db:seed --files "./database/seeders/UnitSeeder.ts"
		# node ace db:seed --files "./database/seeders/ProductsSeeder.ts"
		node ace db:seed --files "./database/seeders/ServiceSeeder.ts"
		node ace db:seed --files "./database/seeders/DrugAdministrationSeeder.ts"
		node ace db:seed --files "./database/seeders/TemplateReplacementSeeder.ts"
		node ace db:seed --files "./database/seeders/TaxOperationSeeder.ts"
		