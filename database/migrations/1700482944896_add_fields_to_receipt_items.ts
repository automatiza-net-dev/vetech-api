import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
	protected tableName = "receipt_items";

	public async up() {
		this.schema.alterTable(this.tableName, (table) => {
			table.string("product_supplier_xml");
			table.string("barcode_xml");
			table.string("description_xml");
			table.string("ncm_xml");
		});
	}

	public async down() {
		this.schema.alterTable(this.tableName, (table) => {
			table.dropColumn("product_supplier_xml");
			table.dropColumn("barcode_xml");
			table.dropColumn("description_xml");
			table.dropColumn("ncm_xml");
		});
	}
}
