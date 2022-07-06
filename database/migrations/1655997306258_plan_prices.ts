import BaseSchema from '@ioc:Adonis/Lucid/Schema';
import { PlanPriceRecurrence } from 'App/Models/PlanPrice';

export default class extends BaseSchema {
  protected tableName = 'plan_prices';

  public async up() {
    this.schema.createTable(this.tableName, table => {
      table.uuid('id').primary();

      table.decimal('plan_price', 10, 2).unsigned().notNullable();
      table.uuid('plan_id').references('plans.id');
      table
        .enu(
          'recurrence',
          [
            PlanPriceRecurrence.MONTHLY,
            PlanPriceRecurrence.YEARLY,
            PlanPriceRecurrence.CUSTOM,
          ],
          {
            useNative: true,
            enumName: 'plan_price_recurrence',
            existingType: true,
          },
        )
        .notNullable();
      table.integer('expiration_days').unsigned().notNullable();

      table.timestamp('created_at', { useTz: true });
      table.timestamp('updated_at', { useTz: true });
      table.dateTime('deleted_at').defaultTo(null);
    });
  }

  public async down() {
    this.schema.dropTable(this.tableName);
  }
}
