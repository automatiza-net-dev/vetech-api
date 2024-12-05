import Database from "@ioc:Adonis/Lucid/Database";
import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
	protected tableName = "patients";

	public async up() {
		await Database.from(this.tableName)
			.update({
				gender: "masculino",
			})
			.whereRaw("gender = 'male'", []);

		await Database.from(this.tableName)
			.update({
				gender: "feminino",
			})
			.whereRaw("gender = 'female'", []);
	}

	public async down() {}
}
