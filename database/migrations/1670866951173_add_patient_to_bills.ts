import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'bills';

  public async up() {
    this.schema.alterTable(this.tableName, table => {
      table.uuid('patient_id').references('patients.id');
    });
  }

  public async down() {
    this.schema.alterTable(this.tableName, table => {
      table.dropColumn('patient_id');
    });
  }
}
