import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'patient_tutors';

  public async up() {
    this.schema.alterTable(this.tableName, table => {
      table.string('residence');
    });
  }

  public async down() {
    this.schema.alterTable(this.tableName, table => {
      table.dropColumn('residence');
    });
  }
}
