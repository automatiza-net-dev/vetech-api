import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'treatment_items';

  public async up() {
    this.schema.createTable(this.tableName, table => {
      table.integer('id');

      table.uuid('economic_group_id').references('economic_groups.id');
      table.uuid('business_unit_id').references('business_units.id');
      table.integer('treatment_id').references('treatments.id');
      table.integer('kit_id').references('kits.id');
      table.uuid('product_variation_id').references('product_variations.id');

      table.integer('quantity');
      table.integer('quantity_executed');
      table.text('observations');
      table.string('status');

      table.timestamp('created_at', { useTz: true });
      table.timestamp('updated_at', { useTz: true });

      table.primary(['id', 'treatment_id']);
    });
  }

  public async down() {
    this.schema.dropTable(this.tableName);
  }
}
