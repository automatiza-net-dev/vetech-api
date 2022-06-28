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
  Route.get('/', 'PatientsController.index').middleware('auth');
  Route.post('/', 'PatientsController.store').middleware('auth');
}).prefix('patients');
