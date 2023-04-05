import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'fiscal_documents';

  public async up() {
    this.schema.alterTable(this.tableName, table => {
      table.string('image_name');
    });
  }

  public async down() {
    this.schema.alterTable(this.tableName, table => {
      table.dropColumn('image_name');
    });
  }
}
