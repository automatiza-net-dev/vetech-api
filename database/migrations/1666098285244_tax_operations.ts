import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'tax_operations';

  public async up() {
    this.schema.createTable(this.tableName, table => {
      table.uuid('id').primary();

      table.uuid('economic_group_id').references('economic_groups.id');

      table.string('code');
      table.text('description');
      table.string('movement_type');
      table.string('movement_category');
      table.boolean('generates_financial').defaultTo(false);
      table.boolean('accounting_result').defaultTo(false);
      table.boolean('active').defaultTo(true);

      table.timestamp('created_at', { useTz: true });
      table.timestamp('updated_at', { useTz: true });
      table.dateTime('deleted_at').defaultTo(null);
    });
  }

  public async down() {
    this.schema.dropTable(this.tableName);
  }
}
