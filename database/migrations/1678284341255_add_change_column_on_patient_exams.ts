import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'patient_exams';

  public async up() {
    this.schema.alterTable(this.tableName, table => {
      table.datetime('realized_at').alter();
    });
  }

  public async down() {
    this.schema.dropTable(this.tableName);
  }
}
