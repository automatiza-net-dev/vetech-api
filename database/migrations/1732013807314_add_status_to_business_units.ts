import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
	protected tableName = "business_units";

	public async up() {
		this.schema.alterTable(this.tableName, (table) => {
			table
				.string("status", 15)
				.checkIn(["Ativa", "Inativa", "Consulta", "Excluida"])
				.defaultTo("Ativa");
		});
	}

	public async down() {
		this.schema.alterTable(this.tableName, (table) => {
			table.dropColumn("status");
		});
	}
}
