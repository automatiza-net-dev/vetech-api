import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'product_inventories'

  public async up () {
    this.schema.createTable(this.tableName, (table) => {
      table.bigIncrements('id')

      table.uuid('economic_group_id').references('id').inTable('economic_groups').notNullable()
      table.uuid('business_unit_id').references('id').inTable('business_units').notNullable()
      table.uuid('product_id').references('id').inTable('products').notNullable()
      table.uuid('product_variation_id').references('id').inTable('product_variations').notNullable()
      table.uuid('business_unit_product_id').references('id').inTable('business_unit_products').notNullable()

      table.date('date').notNullable()
      table.decimal('stock', 10, 3).notNullable()
      table.decimal('cost_price', 10, 3).notNullable()

      table.timestamp('created_at', { useTz: true })
    })
  }

  public async down () {
    this.schema.dropTable(this.tableName)
  }
}
