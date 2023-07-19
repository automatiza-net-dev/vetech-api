import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'patient_exams';

  public async up() {
    this.schema.alterTable(this.tableName, table => {
      table.text('laboratory').alter();
      table.text('report').alter();
    });
  }

  public async down() {
    this.schema.dropTable(this.tableName);
  }
}
