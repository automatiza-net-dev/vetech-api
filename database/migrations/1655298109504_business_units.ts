import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'business_units';

  public async up() {
    this.schema.createTable(this.tableName, table => {
      table.uuid('id').primary();

      table.string('identification', 80).nullable();
      table.string('document', 14).nullable();
      table.string('fantasy_name', 80).nullable();
      table.string('company_name', 80).nullable();
      table.string('email', 300).nullable();
      table.string('phone', 14).nullable();
      table.string('origin', 300).nullable();
      table.string('postal_code', 255).nullable();
      table.string('address', 255).nullable();
      table.string('number', 255).nullable();
      table.string('complement', 255).nullable();
      table.string('district', 255).nullable();
      table.string('city', 255).nullable();
      table.string('state', 255).nullable();
      table.string('lat', 255).nullable();
      table.string('lng', 255).nullable();
      table.boolean('active').defaultTo(true);

      table.uuid('economic_group_id').references('economic_groups.id');

      table.timestamp('created_at', { useTz: true });
      table.timestamp('updated_at', { useTz: true });
      table.dateTime('deleted_at').defaultTo(null);
    });
  }

  public async down() {
    this.schema.dropTable(this.tableName);
  }
}
