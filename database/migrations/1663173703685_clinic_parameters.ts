import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'clinic_parameters';

  public async up() {
    this.schema.createTable(this.tableName, table => {
      table.uuid('id').primary();

      table.string('name').notNullable();
      table.string('tag').notNullable();
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
