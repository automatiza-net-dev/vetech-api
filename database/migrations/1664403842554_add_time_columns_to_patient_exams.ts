import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'patient_exams';

  public async up() {
    this.schema.alterTable(this.tableName, table => {
      table.dateTime('released_at').nullable();
    });
  }

  public async down() {
    this.schema.alterTable(this.tableName, table => {
      table.dropColumn('released_at');
    });
  }
}
