import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'template_replacements';

  public async up() {
    this.schema.createTable(this.tableName, table => {
      table.uuid('id').primary();

      table.uuid('economic_group_id').references('economic_groups.id');

      table.string('origin');
      table.string('attribute');
      table.string('replacer');

      table.timestamp('created_at', { useTz: true });
      table.timestamp('updated_at', { useTz: true });

      table.unique(['economic_group_id', 'replacer']);
    });
  }

  public async down() {
    this.schema.dropTable(this.tableName);
  }
}
