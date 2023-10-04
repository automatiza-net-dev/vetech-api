import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'business_units';

  public async up() {
    this.schema.alterTable(this.tableName, table => {
      table.string('document', 255).alter();
    });
  }

  public async down() {}
}
