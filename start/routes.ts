/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
|
| This file is dedicated for defining HTTP routes. A single file is enough
| for majority of projects, however you can define routes in different
| files and just make sure to import them inside this file. For example
|
| Define routes in following two files
| ├── start/routes/cart.ts
| ├── start/routes/customer.ts
|
| and then import them inside `start/routes.ts` as follows
|
| import './routes/cart'
| import './routes/customer'
|
*/

import Route from '@ioc:Adonis/Core/Route';

Route.get('/', () => {
  return 'Vetech API - Desenvolvimento: CreativeCode 2022';
});

Route.group(() => {
  Route.get('me', 'AuthController.whoAmI').middleware('auth');
  Route.post('login', 'AuthController.login');
  Route.post('register', 'AuthController.register');
  Route.post('forgot-password', 'AuthController.forgotPassword');
  Route.post('reset-password', 'AuthController.resetPassword');
}).prefix('auth');

Route.group(() => {
  Route.get('', 'UsersController.index');
  Route.get('/:id', 'UsersController.show');
  Route.get('/check-email/:email', 'UsersController.checkEmail');

  Route.put('/', 'UsersController.update').middleware('auth');
  Route.delete('/', 'UsersController.destroy').middleware('auth');
}).prefix('users');

Route.group(() => {
  Route.get('', 'PlansController.index');
  Route.get('/:id', 'PlansController.show');
  Route.post('', 'PlansController.store');
  Route.put('/:id', 'PlansController.update');
  Route.delete('/:id', 'PlansController.destroy');
}).prefix('plans');

Route.group(() => {
  Route.get('', 'PlanPricesController.index');
  Route.post('', 'PlanPricesController.store');
  Route.get('/:id', 'PlanPricesController.show');
  Route.put('/:id', 'PlanPricesController.update');
  Route.delete('/:id', 'PlanPricesController.destroy');
}).prefix('plan-prices');

Route.group(() => {
  Route.get('', 'EconomicGroupsController.index');
  Route.get('/user', 'EconomicGroupsController.userEconomicGroups').middleware(
    'auth',
  );
  Route.get('/:id/users', 'EconomicGroupsController.users');
  Route.put('/:id', 'EconomicGroupsController.update');
}).prefix('economic-groups');

Route.group(() => {
  Route.get('/users', 'BusinessUnitsController.users').middleware('auth');
  Route.get('/user', 'BusinessUnitsController.user').middleware('auth');
  Route.put('/user/:id', 'BusinessUnitsController.updateUser').middleware(
    'auth',
  );
  Route.get('', 'BusinessUnitsController.index');
  Route.get(':id', 'BusinessUnitsController.show');

  Route.post('', 'BusinessUnitsController.store').middleware('auth');

  Route.put('/:id', 'BusinessUnitsController.update');
  Route.delete('/user/:id', 'BusinessUnitsController.deleteUser').middleware(
    'auth',
  );
}).prefix('business-units');

Route.post('roles/add-permission', 'RolesController.addPermission');
Route.delete('roles/:id/:permission', 'RolesController.deletePermission');
Route.resource('roles', 'RolesController').apiOnly();

Route.resource('permissions', 'PermissionsController').apiOnly();

Route.group(() => {
  Route.post('/additional', 'LicencesController.additional').middleware('auth');
  Route.post('/custom', 'LicencesController.custom');
}).prefix('licences');

Route.group(() => {
  Route.get('/check/:id', 'InvitesController.check');
  Route.get('/:id', 'InvitesController.show');

  Route.post('/accept-invite', 'InvitesController.acceptInvite');
  Route.post(
    '/accept-invite-new-user',
    'InvitesController.acceptInviteNewUser',
  );

  Route.group(() => {
    Route.get('/', 'InvitesController.index');
    Route.post('/', 'InvitesController.store');
    Route.put('/:id', 'InvitesController.update');
    Route.delete('/:id', 'InvitesController.destroy');
  }).middleware('auth');
}).prefix('invites');

Route.group(() => {
  Route.get('/search', 'PatientsController.search');
  Route.get('/animals', 'PatientsController.showAnimals');
  Route.get('/', 'PatientsController.index');
  Route.get('/:id', 'PatientsController.show');
  Route.post('/', 'PatientsController.store');
  Route.put('/:id', 'PatientsController.update');
  Route.delete('/:id', 'PatientsController.destroy');
})
  .prefix('patients')
  .middleware('auth');

Route.group(() => {
  Route.get('/nr/:id', 'PatientTutorsController.notRelated');
  Route.get('/', 'PatientTutorsController.index');
  Route.post('/', 'PatientTutorsController.store');
  Route.post('/assign', 'PatientTutorsController.assign');
  Route.get('/:id', 'PatientTutorsController.show');
  Route.put('/:id', 'PatientTutorsController.update');
})
  .prefix('patient-tutors')
  .middleware('auth');

Route.group(() => {
  Route.get('/', 'SpeciesController.index');
  Route.post('/', 'SpeciesController.store');
  Route.get('/:id', 'SpeciesController.show');
  Route.put('/:id', 'SpeciesController.update');
  Route.delete('/:id', 'SpeciesController.destroy');
})
  .prefix('species')
  .middleware('auth');

Route.group(() => {
  Route.get('/', 'RacesController.index');
  Route.post('/', 'RacesController.store');
  Route.get('/:id', 'RacesController.show');
  Route.put('/:id', 'RacesController.update');
  Route.delete('/:id', 'RacesController.destroy');
})
  .prefix('races')
  .middleware('auth');

Route.group(() => {
  Route.get('/', 'ScheduleStatusesController.index');
  Route.post('/', 'ScheduleStatusesController.store');
  Route.get('/:id', 'ScheduleStatusesController.show');
  Route.put('/:id', 'ScheduleStatusesController.update');
  Route.delete('/:id', 'ScheduleStatusesController.destroy');
})
  .prefix('schedule-statuses')
  .middleware('auth');

Route.group(() => {
  Route.get('/', 'ScheduleServiceGroupsController.index');
  Route.post('/', 'ScheduleServiceGroupsController.store');
  Route.get('/:id', 'ScheduleServiceGroupsController.show');
  Route.put('/:id', 'ScheduleServiceGroupsController.update');
  Route.delete('/:id', 'ScheduleServiceGroupsController.destroy');
})
  .prefix('schedule-service-groups')
  .middleware('auth');

Route.group(() => {
  Route.get('/', 'ScheduleServiceTypesController.index');
  Route.post('/', 'ScheduleServiceTypesController.store');
  Route.get('/:id', 'ScheduleServiceTypesController.show');
  Route.put('/:id', 'ScheduleServiceTypesController.update');
  Route.delete('/:id', 'ScheduleServiceTypesController.destroy');
})
  .prefix('schedule-service-types')
  .middleware('auth');

Route.group(() => {
  Route.get('/', 'WorkingDaysController.index');
  Route.post('/', 'WorkingDaysController.store');
  Route.get('/:id', 'WorkingDaysController.show');
  Route.put('/:id', 'WorkingDaysController.update');
  Route.delete('/:id', 'WorkingDaysController.destroy');
})
  .prefix('working-days')
  .middleware('auth');

Route.group(() => {
  Route.get('/', 'UnavailableDaysController.index');
  Route.post('/', 'UnavailableDaysController.store');
  Route.get('/:id', 'UnavailableDaysController.show');
  Route.put('/:id', 'UnavailableDaysController.update');
  Route.delete('/:id', 'UnavailableDaysController.destroy');
})
  .prefix('unavailable-days')
  .middleware('auth');

Route.group(() => {
  Route.get('/disponibility', 'SchedulesController.viewDisponibility');
  Route.get('/groups', 'SchedulesController.viewServiceGroups');
  Route.get('/user', 'SchedulesController.userDailySchedule');
  Route.get('/with-schedule', 'SchedulesController.withSchedule');
  Route.get('/appointsments/:id', 'SchedulesController.userAppointments');

  Route.get('/', 'SchedulesController.index');
  Route.post('/', 'SchedulesController.store');
  Route.get('/:id', 'SchedulesController.show');
  Route.put('/:id', 'SchedulesController.update');
  Route.delete('/:id', 'SchedulesController.destroy');
})
  .prefix('schedules')
  .middleware('auth');

Route.group(() => {
  Route.get('/', 'GroupsController.index');
  Route.post('/', 'GroupsController.store');
  Route.get('/:id', 'GroupsController.show');
  Route.put('/:id', 'GroupsController.update');
  Route.delete('/:id', 'GroupsController.destroy');
})
  .prefix('groups')
  .middleware('auth');

Route.group(() => {
  Route.get('/', 'ProductsController.index');
  Route.post('/', 'ProductsController.store');
  Route.get('/:id', 'ProductsController.show');
  Route.put('/:id', 'ProductsController.update');
  Route.delete('/:id', 'ProductsController.destroy');
})
  .prefix('products')
  .middleware('auth');

Route.group(() => {
  Route.get('/', 'ProductVariationsController.index');
  Route.post('/', 'ProductVariationsController.store');
  Route.get('/:id', 'ProductVariationsController.show');
  Route.put('/:id', 'ProductVariationsController.update');
  Route.delete('/:id', 'ProductVariationsController.destroy');
})
  .prefix('product-variations')
  .middleware('auth');

Route.group(() => {
  Route.get('/', 'BusinessUnitProductsController.index');
  Route.post('/', 'BusinessUnitProductsController.store');
  Route.get('/:id', 'BusinessUnitProductsController.show');
  Route.put('/:id', 'BusinessUnitProductsController.update');
  Route.delete('/:id', 'BusinessUnitProductsController.destroy');
})
  .prefix('business-unit-products')
  .middleware('auth');

Route.group(() => {
  Route.get('/', 'SubgroupsController.index');
  Route.post('/', 'SubgroupsController.store');
  Route.get('/:id', 'SubgroupsController.show');
  Route.put('/:id', 'SubgroupsController.update');
  Route.delete('/:id', 'SubgroupsController.destroy');
})
  .prefix('subgroups')
  .middleware('auth');

Route.group(() => {
  Route.get('/', 'VariationsController.index');
  Route.post('/', 'VariationsController.store');
  Route.get('/:id', 'VariationsController.show');
  Route.put('/:id', 'VariationsController.update');
  Route.delete('/:id', 'VariationsController.destroy');
})
  .prefix('variations')
  .middleware('auth');

Route.group(() => {
  Route.get('/', 'VariationOptionsController.index');
  Route.post('/', 'VariationOptionsController.store');
  Route.get('/:id', 'VariationOptionsController.show');
  Route.put('/:id', 'VariationOptionsController.update');
  Route.delete('/:id', 'VariationOptionsController.destroy');
})
  .prefix('variation-options')
  .middleware('auth');

Route.group(() => {
  Route.get('/', 'VariationGroupsController.index');
  Route.post('/assign', 'VariationGroupsController.assign');
  Route.post('/', 'VariationGroupsController.store');
  Route.get('/:id', 'VariationGroupsController.show');
  Route.put('/:id', 'VariationGroupsController.update');
  Route.delete('/:group/:variation', 'VariationGroupsController.detach');
  Route.delete('/:id', 'VariationGroupsController.destroy');
})
  .prefix('variation-groups')
  .middleware('auth');

Route.group(() => {
  Route.get('/', 'AttendanceStatusesController.index');
  Route.post('/', 'AttendanceStatusesController.store');
  Route.get('/:id', 'AttendanceStatusesController.show');
  Route.put('/:id', 'AttendanceStatusesController.update');
  Route.delete('/:id', 'AttendanceStatusesController.destroy');
})
  .prefix('attendance-statuses')
  .middleware('auth');

Route.group(() => {
  Route.get('/', 'TimelineTypesController.index');
  Route.post('/', 'TimelineTypesController.store');
  Route.get('/:id', 'TimelineTypesController.show');
  Route.put('/:id', 'TimelineTypesController.update');
  Route.delete('/:id', 'TimelineTypesController.destroy');
}).prefix('timeline');

Route.group(() => {
  Route.get('/', 'AttendancesController.index');
  Route.post('/', 'AttendancesController.store');
  Route.get('/:id', 'AttendancesController.show');
  Route.put('/:id', 'AttendancesController.update');
  Route.delete('/:id', 'AttendancesController.destroy');
})
  .prefix('attendances')
  .middleware('auth');

Route.group(() => {
  Route.get('/', 'PathologiesController.index');
  Route.post('/', 'PathologiesController.store');
  Route.get('/:id', 'PathologiesController.show');
  Route.put('/:id', 'PathologiesController.update');
  Route.delete('/:id', 'PathologiesController.destroy');
})
  .prefix('pathologies')
  .middleware('auth');

Route.group(() => {
  Route.get('/', 'MedicalDocumentTemplatesController.index');
  Route.post('/', 'MedicalDocumentTemplatesController.store');
  Route.get('/:id', 'MedicalDocumentTemplatesController.show');
  Route.put('/:id', 'MedicalDocumentTemplatesController.update');
  Route.delete('/:id', 'MedicalDocumentTemplatesController.destroy');
})
  .prefix('medical-document-templates')
  .middleware('auth');

Route.group(() => {
  Route.get('/', 'DocumentTemplatesController.index');
  Route.post('/', 'DocumentTemplatesController.store');
  Route.get('/:id', 'DocumentTemplatesController.show');
  Route.put('/:id', 'DocumentTemplatesController.update');
  Route.delete('/:id', 'DocumentTemplatesController.destroy');
})
  .prefix('document-templates')
  .middleware('auth');
