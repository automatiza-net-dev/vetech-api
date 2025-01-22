import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
	protected tableName = "treatment_execution_reschedules";

	public async up() {
		this.schema.dropTable(this.tableName);
	}

	public async down() {}
}
