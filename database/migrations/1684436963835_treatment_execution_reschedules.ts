import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'treatment_execution_reschedules';

  public async up() {
    this.schema.createTable(this.tableName, table => {
      table.integer('id');

      table.uuid('economic_group_id').references('economic_groups.id');
      table.uuid('business_unit_id').references('business_units');
      table.integer('treatment_id').references('id').inTable('treatments');
      table.integer('treatment_item_id'); // deveria referenciar treatment_items.id, mas como é chave composta :z
      table.integer('treatment_item_execution_id'); // deveria referenciar treatment_item_executions.id, mas como é chave composta :z
      table.uuid('schedule_user_id').references('users.id');
      table.uuid('reschedule_user_id').references('users.id');
      table.uuid('reason_id').references('reasons.id');

      table.string('evaluation_id');
      table.dateTime('schedule_date');
      table.dateTime('reschedule_date');
      table.text('observations');

      table.timestamp('created_at', { useTz: true });
      table.timestamp('updated_at', { useTz: true });

      table.primary([
        'id',
        'treatment_id',
        'treatment_item_id',
        'treatment_item_execution_id',
      ]);
    });
  }

  public async down() {
    this.schema.dropTable(this.tableName);
  }
}
