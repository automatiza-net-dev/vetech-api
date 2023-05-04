import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'patient_tutors';

  public async up() {
    this.schema.alterTable(this.tableName, table => {
      table
        .integer('profession_id')
        .unsigned()
        .references('id')
        .inTable('professions');

      table.string('nationality');
      table.string('civil_status');
    });
  }

  public async down() {
    this.schema.alterTable(this.tableName, table => {
      table.dropColumn('profession_id');
      table.dropColumn('nationality');
      table.dropColumn('civil_status');
    });
  }
}
