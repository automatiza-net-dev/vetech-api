import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'patient_animals';

  public async up() {
    this.schema.alterTable(this.tableName, table => {
      table.boolean('registered');
      table.boolean('death').defaultTo(false);
      table.dateTime('death_date');
      table.string('microchip');
    });
  }

  public async down() {
    this.schema.alterTable(this.tableName, table => {
      table.dropColumn('registered');
      table.dropColumn('death');
      table.dropColumn('death_date');
      table.dropColumn('microchip');
    });
  }
}
