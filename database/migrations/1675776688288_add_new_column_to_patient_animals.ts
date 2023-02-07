import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'patient_animals';

  public async up() {
    this.schema.alterTable(this.tableName, table => {
      table.uuid('hair_id').references('patient_animal_hairs.id');
    });
  }

  public async down() {
    this.schema.alterTable(this.tableName, table => {
      table.dropColumn('hair_id');
    });
  }
}
