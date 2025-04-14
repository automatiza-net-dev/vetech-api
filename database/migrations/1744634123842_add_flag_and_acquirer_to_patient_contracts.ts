import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
	protected tableName = "patient_contracts";

	public async up() {
		this.schema.alterTable(this.tableName, (table) => {
			table.uuid("payment_method_tef_flag_id").references("tef_flags.id");
			table
				.uuid("payment_method_tef_acquirer_id")
				.references("tef_acquirers.id");
		});
	}

	public async down() {
		this.schema.alterTable(this.tableName, (table) => {
			table.dropColumn("payment_method_tef_flag_id");
			table.dropColumn("payment_method_tef_acquirer_id");
		});
	}
}
