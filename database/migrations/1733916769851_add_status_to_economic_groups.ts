import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
	protected tableName = "economic_groups";

	public async up() {
		this.schema.alterTable(this.tableName, (table) => {
			table
				.string("status", 20)
				.defaultTo("Ativo")
				.checkIn(["Ativo", "Inativo", "Consulta", "Bloqueado"]);
		});
	}

	public async down() {
		this.schema.alterTable(this.tableName, (table) => {
			table.dropColumn("status");
		});
	}
}
