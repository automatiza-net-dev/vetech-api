import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'bankings';

  public async up() {
    this.schema.alterTable(this.tableName, table => {
      table.string('competence_date');
    });
  }

  public async down() {
    this.schema.alterTable(this.tableName, table => {
      table.dropColumn('competence_date');
    });
  }
}
