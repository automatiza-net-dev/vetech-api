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
  Route.get('', 'BusinessUnitsController.index');
  Route.get('/user', 'BusinessUnitsController.user').middleware('auth');

  Route.post('', 'BusinessUnitsController.store').middleware('auth');

  Route.get('/:id/users', 'BusinessUnitsController.users');
  Route.put('/:id', 'BusinessUnitsController.update');
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
  Route.get('/', 'InvitesController.index').middleware('auth');
  Route.post('/', 'InvitesController.store').middleware('auth');
  Route.get('/check/:id', 'InvitesController.check');
  Route.get('/:id', 'InvitesController.show');
  Route.put('/:id', 'InvitesController.update').middleware('auth');
  Route.post('/accept-invite', 'InvitesController.acceptInvite');
  Route.post(
    '/accept-invite-new-user',
    'InvitesController.acceptInviteNewUser',
  );
  Route.delete('/:id', 'InvitesController.destroy').middleware('auth');
}).prefix('invites');

Route.group(() => {
  Route.get('/animals', 'PatientsController.showAnimals').middleware('auth');
  Route.get('/', 'PatientsController.index').middleware('auth');
  Route.get('/:id', 'PatientsController.show').middleware('auth');
  Route.post('/', 'PatientsController.store').middleware('auth');
  Route.put('/:id', 'PatientsController.update').middleware('auth');
  Route.delete('/:id', 'PatientsController.destroy').middleware('auth');
}).prefix('patients');

Route.group(() => {
  Route.get('/', 'PatientTutorsController.index').middleware('auth');
  Route.post('/', 'PatientTutorsController.store').middleware('auth');
  Route.get('/:id', 'PatientTutorsController.show').middleware('auth');
  Route.put('/:id', 'PatientTutorsController.update').middleware('auth');
}).prefix('patient-tutors');

Route.group(() => {
  Route.get('/', 'SpeciesController.index').middleware('auth');
  Route.post('/', 'SpeciesController.store').middleware('auth');
  Route.get('/:id', 'SpeciesController.show').middleware('auth');
  Route.put('/:id', 'SpeciesController.update').middleware('auth');
  Route.delete('/:id', 'SpeciesController.destroy').middleware('auth');
}).prefix('species');

Route.group(() => {
  Route.get('/', 'RacesController.index').middleware('auth');
  Route.post('/', 'RacesController.store').middleware('auth');
  Route.get('/:id', 'RacesController.show').middleware('auth');
  Route.put('/:id', 'RacesController.update').middleware('auth');
  Route.delete('/:id', 'RacesController.destroy').middleware('auth');
}).prefix('races');

Route.group(() => {
  Route.get('/', 'ScheduleStatusesController.index').middleware('auth');
  Route.post('/', 'ScheduleStatusesController.store').middleware('auth');
  Route.get('/:id', 'ScheduleStatusesController.show').middleware('auth');
  Route.put('/:id', 'ScheduleStatusesController.update').middleware('auth');
  Route.delete('/:id', 'ScheduleStatusesController.destroy').middleware('auth');
}).prefix('schedule-statuses');

Route.group(() => {
  Route.get('/', 'ScheduleServiceGroupsController.index').middleware('auth');
  Route.post('/', 'ScheduleServiceGroupsController.store').middleware('auth');
  Route.get('/:id', 'ScheduleServiceGroupsController.show').middleware('auth');
  Route.put('/:id', 'ScheduleServiceGroupsController.update').middleware(
    'auth',
  );
  Route.delete('/:id', 'ScheduleServiceGroupsController.destroy').middleware(
    'auth',
  );
}).prefix('schedule-service-groups');

Route.group(() => {
  Route.get('/', 'ScheduleServiceTypesController.index').middleware('auth');
  Route.post('/', 'ScheduleServiceTypesController.store').middleware('auth');
  Route.get('/:id', 'ScheduleServiceTypesController.show').middleware('auth');
  Route.put('/:id', 'ScheduleServiceTypesController.update').middleware('auth');
  Route.delete('/:id', 'ScheduleServiceTypesController.destroy').middleware(
    'auth',
  );
}).prefix('schedule-service-types');

Route.group(() => {
  Route.get('/', 'WorkingDaysController.index').middleware('auth');
  Route.post('/', 'WorkingDaysController.store').middleware('auth');
  Route.get('/:id', 'WorkingDaysController.show').middleware('auth');
  Route.put('/:id', 'WorkingDaysController.update').middleware('auth');
  Route.delete('/:id', 'WorkingDaysController.destroy').middleware('auth');
}).prefix('working-days');

Route.group(() => {
  Route.get('/', 'UnavailableDaysController.index').middleware('auth');
  Route.post('/', 'UnavailableDaysController.store').middleware('auth');
  Route.get('/:id', 'UnavailableDaysController.show').middleware('auth');
  Route.put('/:id', 'UnavailableDaysController.update').middleware('auth');
  Route.delete('/:id', 'UnavailableDaysController.destroy').middleware('auth');
}).prefix('unavailable-days');

Route.group(() => {
  Route.get('/disponibility', 'SchedulesController.viewDisponibility');

  Route.get('/', 'SchedulesController.index').middleware('auth');
  Route.post('/', 'SchedulesController.store').middleware('auth');
  Route.get('/:id', 'SchedulesController.show').middleware('auth');
  Route.put('/:id', 'SchedulesController.update').middleware('auth');
  Route.delete('/:id', 'SchedulesController.destroy').middleware('auth');
}).prefix('schedules');

Route.group(() => {
  Route.get('/', 'GroupsController.index').middleware('auth');
  Route.post('/', 'GroupsController.store').middleware('auth');
  Route.get('/:id', 'GroupsController.show').middleware('auth');
  Route.put('/:id', 'GroupsController.update').middleware('auth');
  Route.delete('/:id', 'GroupsController.destroy').middleware('auth');
}).prefix('groups');

Route.group(() => {
  Route.get('/', 'SubgroupsController.index').middleware('auth');
  Route.post('/', 'SubgroupsController.store').middleware('auth');
  Route.get('/:id', 'SubgroupsController.show').middleware('auth');
  Route.put('/:id', 'SubgroupsController.update').middleware('auth');
  Route.delete('/:id', 'SubgroupsController.destroy').middleware('auth');
}).prefix('subgroups');

Route.group(() => {
  Route.get('/', 'VariationsController.index').middleware('auth');
  Route.post('/', 'VariationsController.store').middleware('auth');
  Route.get('/:id', 'VariationsController.show').middleware('auth');
  Route.put('/:id', 'VariationsController.update').middleware('auth');
  Route.delete('/:id', 'VariationsController.destroy').middleware('auth');
}).prefix('variations');

Route.group(() => {
  Route.get('/', 'VariationOptionsController.index').middleware('auth');
  Route.post('/', 'VariationOptionsController.store').middleware('auth');
  Route.get('/:id', 'VariationOptionsController.show').middleware('auth');
  Route.put('/:id', 'VariationOptionsController.update').middleware('auth');
  Route.delete('/:id', 'VariationOptionsController.destroy').middleware('auth');
}).prefix('variation-options');
