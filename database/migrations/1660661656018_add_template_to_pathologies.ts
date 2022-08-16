import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'pathologies';

  public async up() {
    this.schema.alterTable(this.tableName, table => {
      table.uuid('template_id').references('document_templates.id');
    });
  }

  public async down() {
    this.schema.alterTable(this.tableName, table => {
      table.dropColumn('template_id');
    });
  }
}
