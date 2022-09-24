import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'hospitalization_medical_prescriptions';

  public async up() {
    this.schema.alterTable(this.tableName, table => {
      table.dateTime('execution_start').defaultTo(null);
    });
  }

  public async down() {
    this.schema.alterTable(this.tableName, table => {
      table.dropColumn('execution_start');
    });
  }
}
