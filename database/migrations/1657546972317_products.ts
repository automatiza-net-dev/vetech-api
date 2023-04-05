import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'products';

  public async up() {
    this.schema.createTable(this.tableName, table => {
      table.uuid('id').primary();

      table.uuid('economic_group_id').references('economic_groups.id');

      table.string('description').notNullable();
      table.string('type').notNullable();
      table.string('reference_code').notNullable();
      table.integer('collection_year').notNullable();
      table.string('ncm').notNullable();
      table.string('cest').notNullable();
      table.string('features').notNullable();
      table.string('unity_type').notNullable();
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
