import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'patient_exams';

  public async up() {
    this.schema.alterTable(this.tableName, table => {
      table.uuid('solicitor_id').references('users.id');
      table.uuid('executioner_id').references('users.id');
      table.datetime('executed_at');
      table.datetime('result_date');
      table.string('status');
    });
  }

  public async down() {
    this.schema.alterTable(this.tableName, table => {
      table.dropColumn('solicitor_id');
      table.dropColumn('executioner_id');
      table.dropColumn('executed_at');
      table.dropColumn('result_date');
      table.dropColumn('status');
    });
  }
}
