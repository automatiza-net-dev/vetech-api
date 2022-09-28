import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'hospitalizations';

  public async up() {
    this.schema.createTable(this.tableName, table => {
      table.uuid('id').primary();

      table.uuid('economic_group_id').references('economic_groups.id');
      table.uuid('business_unit_id').references('business_units.id');
      table.uuid('patient_id').references('patients.id');
      table.uuid('tutor_id').references('patients.id');
      table.uuid('technician_id').references('users.id');
      table.uuid('bed_id').references('beds.id');

      table.integer('type');
      table.integer('risk');
      table.dateTime('expected_discharge');
      table.text('diagnosis');
      table.text('prognosis');
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
