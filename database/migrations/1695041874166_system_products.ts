import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'system_products';

  public async up() {
    this.schema.createTable(this.tableName, table => {
      table.increments('id');

      table
        .integer('system_id')
        .unsigned()
        .references('id')
        .inTable('systems')
        .onDelete('CASCADE');
      table
        .integer('system_variation_group_id')
        .references('system_variation_groups.id');
      table
        .integer('system_taxation_group_id')
        .references('system_taxation_groups.id');

      table.string('description');
      table.string('type');
      table.string('reference_code');
      table.integer('collection_year');
      table.string('ncm');
      table.string('cest');
      table.string('features');
      table.string('icms_origin');
      table.string('tax_benefit_code');
      table.string('anvisa_code');
      table.string('service_code');
      table.string('purpose');
      table.string('service_type');
      table.boolean('active').defaultTo(true);

      table.timestamp('created_at', { useTz: true });
      table.timestamp('updated_at', { useTz: true });
    });
  }

  public async down() {
    this.schema.dropTable(this.tableName);
  }
}
