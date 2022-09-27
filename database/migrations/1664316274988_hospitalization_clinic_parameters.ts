import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'hospitalization_clinic_parameters';

  public async up() {
    this.schema.createTable(this.tableName, table => {
      table.uuid('id').primary();

      table.uuid('hospitalization_id').references('hospitalizations.id');
      table.uuid('user_id').references('users.id');
      table.uuid('clinic_parameter_id').references('clinic_parameters.id');

      table.dateTime('executed_at');
      table.dateTime('released_at');
      table.text('value');
      table.text('resume');
      table.string('status');

      table.timestamp('created_at', { useTz: true });
      table.timestamp('updated_at', { useTz: true });
      table.dateTime('deleted_at').defaultTo(null);
    });
  }

  public async down() {
    this.schema.dropTable(this.tableName);
  }
}
