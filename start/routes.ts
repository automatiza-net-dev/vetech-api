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
  Route.get(
    '/resend-confirmation/:email',
    'UsersController.resendConfirmationToken',
  );
  Route.post('/send-confirmation', 'UsersController.createConfirmationToken');
  Route.post('/confirm-token', 'UsersController.confirmConfirmationToken');

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
  Route.get('/user/:id', 'BusinessUnitsController.searchUser').middleware(
    'auth',
  );
  Route.get('/user', 'BusinessUnitsController.user').middleware('auth');
  Route.put('/user/:id', 'BusinessUnitsController.updateUser').middleware(
    'auth',
  );
  Route.put('/roles', 'BusinessUnitsController.updateUsersRole').middleware(
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
    Route.get('/resend/:id', 'InvitesController.resendInvite');
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
  Route.get('/metadata/:id', 'PatientsController.metadata');
  Route.get('/sales-metadata/:id', 'PatientsController.salesMetadata');
  Route.get('/:id', 'PatientsController.show');

  Route.post('/fast', 'PatientsController.fastStore');
  Route.post('/', 'PatientsController.store');

  Route.put('/main/:patient/:tutor', 'PatientsController.setMainTutor');
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
  // Route.post('/', 'ScheduleStatusesController.store');
  // Route.get('/:id', 'ScheduleStatusesController.show');
  // Route.put('/:id', 'ScheduleStatusesController.update');
  // Route.delete('/:id', 'ScheduleStatusesController.destroy');
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
  Route.get('/home', 'SchedulesController.homeContent');
  Route.get('/disponibility', 'SchedulesController.viewDisponibility');
  Route.get('/user', 'SchedulesController.userDailySchedule');
  Route.get('/with-schedule', 'SchedulesController.withSchedule');
  Route.get('/appointsments/:id', 'SchedulesController.userAppointments');
  Route.get('/returnables/:patient', 'SchedulesController.returnableSchedules');

  Route.get('/', 'SchedulesController.index');
  Route.post('/', 'SchedulesController.store');
  Route.get('/:id', 'SchedulesController.show');
  Route.put('/reschedule/:id', 'SchedulesController.reschedule');
  Route.put('/status', 'SchedulesController.updateStatus');
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

Route.resource('vaccines', 'VaccinesController')
  .apiOnly()
  .middleware({
    '*': ['auth'],
  });

Route.resource('exams', 'ExamsController')
  .apiOnly()
  .middleware({
    '*': ['auth'],
  });

Route.group(() => {
  Route.get('/:id', 'TimelinesController.index');

  Route.group(() => {
    Route.get('/:id', 'TimelinesController.animalWeightIndex');
    Route.post('/', 'TimelinesController.storeAnimalWeight');
    Route.put('/:id', 'TimelinesController.updateAnimalWeight');
  }).prefix('weight');

  Route.group(() => {
    Route.get('/:id', 'TimelinesController.animalDocumentIndex');
    Route.post('/', 'TimelinesController.storeAnimalDocument');
    Route.put('/:id', 'TimelinesController.updateAnimalDocument');
  }).prefix('documents');

  Route.group(() => {
    Route.get('/:id', 'TimelinesController.animalPathologyIndex');
    Route.post('/', 'TimelinesController.storeAnimalPathology');
    Route.put('/:id', 'TimelinesController.updateAnimalPathology');
  }).prefix('pathologies');

  Route.group(() => {
    Route.get('/:id', 'TimelinesController.animalMedicalRecipeIndex');
    Route.post('/', 'TimelinesController.storeAnimalMedicalRecipe');
    Route.put('/:id', 'TimelinesController.updateAnimalMedicalRecipe');
  }).prefix('recipes');

  Route.group(() => {
    Route.get('/:id', 'TimelinesController.animalPhotoIndex');
    Route.post('/', 'TimelinesController.animalPhotoStore');
    Route.delete('/:id', 'TimelinesController.deleteAnimalPhoto');
  }).prefix('photos');

  Route.group(() => {
    Route.get('/:id', 'TimelinesController.animalVaccineIndex');
    Route.post('/', 'TimelinesController.animalVaccineStore');
    Route.put('/:id', 'TimelinesController.updateAnimalVaccine');
  }).prefix('vaccines');

  Route.group(() => {
    Route.get('/:id', 'TimelinesController.animalExamIndex');
    Route.post('/', 'TimelinesController.animalExamStore');
  }).prefix('exams');

  Route.group(() => {
    Route.get('/:id', 'TimelinesController.appointmentsIndex');
    Route.post('/', 'TimelinesController.appointmentsStore');
  }).prefix('appointments');

  Route.group(() => {
    Route.get('/:id', 'TimelinesController.appointmentsIndex');
    Route.post('/discharge', 'TimelinesController.dischargeStore');
    Route.post('/', 'TimelinesController.hospitalizaionStore');
  }).prefix('hospitalizations');

  Route.group(() => {
    Route.get('/:id', 'TimelinesController.observationsIndex');
    Route.post('/', 'TimelinesController.storeObservation');
    Route.put('/:id', 'TimelinesController.updateObservations');
  }).prefix('observations');
})
  .prefix('n-timeline')
  .middleware('auth');

Route.resource('vaccine-protocols', 'VaccineProtocolsController')
  .only(['index', 'store', 'update'])
  .middleware({
    '*': ['auth'],
  });

Route.resource('patient-vaccines', 'PatientVaccinesController')
  .apiOnly()
  .middleware({
    '*': ['auth'],
  });

Route.resource('vaccine-calendars', 'VaccineCalendarsController')
  .only(['index', 'update', 'destroy'])
  .middleware({
    '*': ['auth'],
  });

Route.group(() => {
  Route.get('/', 'PatientExamsController.index');
  Route.post('/', 'PatientExamsController.store');
  Route.post('/attachment/:id', 'PatientExamsController.storeAttachment');
  Route.get('/:id', 'PatientExamsController.show');
  Route.put('/:id', 'PatientExamsController.update');
  Route.delete('/:id/:attachment', 'PatientExamsController.destroyAttachment');
  Route.delete('/:id', 'PatientExamsController.destroy');
})
  .prefix('patient-exams')
  .middleware('auth');

Route.resource('units', 'UnitsController')
  .apiOnly()
  .middleware({
    '*': ['auth'],
  });

Route.resource('drug-administrations', 'DrugAdministrationsController')
  .apiOnly()
  .middleware({
    '*': ['auth'],
  });

Route.resource('beds', 'BedsController')
  .apiOnly()
  .middleware({
    '*': ['auth'],
  });

Route.resource('clinic-parameters', 'ClinicParametersController')
  .apiOnly()
  .middleware({
    '*': ['auth'],
  });

Route.resource('medical-prescriptions', 'MedicalPrescriptionsController')
  .apiOnly()
  .middleware({
    '*': ['auth'],
  });

Route.resource('occurrences', 'OccurrencesController')
  .apiOnly()
  .middleware({
    '*': ['auth'],
  });

Route.group(() => {
  Route.get('/completed', 'HospitalizationsController.completedIndex');
  Route.get('/', 'HospitalizationsController.index');
  Route.post('/', 'HospitalizationsController.store');
  Route.get('/timeline/:id', 'HospitalizationsController.showTimeline');
  Route.get('/scheduling/:id', 'HospitalizationsController.getScheduling');
  Route.get('/:id', 'HospitalizationsController.show');
  Route.put('/complete/:id', 'HospitalizationsController.complete');
  Route.put('/:id', 'HospitalizationsController.update');
  Route.delete('/:id', 'HospitalizationsController.destroy');
})
  .prefix('hospitalizations')
  .middleware('auth');

Route.group(() => {
  Route.get('/', 'HospitalizationMedicalPrescriptionsController.index');
  Route.post('/', 'HospitalizationMedicalPrescriptionsController.store');
  Route.put(
    '/schedule/:id',
    'HospitalizationMedicalPrescriptionsController.updateSchedule',
  );
  Route.put('/:id', 'HospitalizationMedicalPrescriptionsController.update');
  Route.delete('/:id', 'HospitalizationMedicalPrescriptionsController.destroy');
})
  .prefix('hospitalization-prescriptions')
  .middleware('auth');

Route.group(() => {
  Route.post('/', 'HospitalizationOccurrencesController.store');
  Route.post(
    '/attachment',
    'HospitalizationOccurrencesController.storeAttachment',
  );
  Route.put('/:id', 'HospitalizationOccurrencesController.update');
  Route.delete(
    '/:id/:attachment',
    'HospitalizationOccurrencesController.destroyAttachment',
  );
  Route.delete('/:id', 'HospitalizationOccurrencesController.destroy');
})
  .prefix('hospitalization-occurrences')
  .middleware('auth');

Route.resource(
  'hospitalization-parameters',
  'HospitalizationClinicParametersController',
)
  .only(['store', 'update', 'destroy'])
  .middleware({
    '*': ['auth'],
  });

Route.resource('taxation-groups', 'TaxationGroupsController')
  .apiOnly()
  .middleware({
    '*': ['auth'],
  });

Route.resource('tax-operations', 'TaxOperationsController')
  .apiOnly()
  .middleware({
    '*': ['auth'],
  });

Route.resource('taxation-group-rules', 'TaxationGroupRulesController')
  .apiOnly()
  .middleware({
    '*': ['auth'],
  });

Route.resource('reasons', 'ReasonsController')
  .apiOnly()
  .middleware({
    '*': ['auth'],
  });

Route.resource('client-origins', 'ClientOriginsController')
  .apiOnly()
  .middleware({
    '*': ['auth'],
  });

Route.group(() => {
  Route.get('/', 'DailyMovementsController.index');
  Route.post('/open', 'DailyMovementsController.openDailyMovement');
  Route.post('/close/:id', 'DailyMovementsController.closeDailyMovement');
  Route.post('/reopen/:id', 'DailyMovementsController.reopenDailyMovement');
  Route.post('/check/:id', 'DailyMovementsController.checkDailyMovement');
})
  .prefix('daily-movements')
  .middleware('auth');

Route.group(() => {
  Route.get('/info/:id', 'DailyCashiersController.check');
  Route.get('/', 'DailyCashiersController.index');
  Route.post('/open', 'DailyCashiersController.openDailyCashier');
  Route.post('/close/:id', 'DailyCashiersController.closeDailyCashier');
  Route.post('/reopen/:id', 'DailyCashiersController.reopenDailyCashier');
  Route.post('/check/:id', 'DailyCashiersController.checkDailyCashier');
  Route.post('/review/:id', 'DailyCashiersController.reviewDailyCashier');

  Route.post('/expense/:id', 'DailyCashiersController.createCashierExpense');
  Route.post('/receipt/:id', 'DailyCashiersController.createCashierReceipt');
})
  .prefix('daily-cashiers')
  .middleware('auth');

Route.resource('account-plans', 'AccountPlansController')
  .apiOnly()
  .middleware({
    '*': ['auth'],
  });

Route.resource('banks', 'BanksController')
  .only(['index'])
  .middleware({
    '*': ['auth'],
  });

Route.group(() => {
  Route.get('/', 'CheckingAccountsController.index');
  Route.get('/check/:id', 'CheckingAccountsController.check');
  Route.get('/:id', 'CheckingAccountsController.show');
  Route.post('/open', 'CheckingAccountsController.openAccount');
  Route.put('/balance/:id', 'CheckingAccountsController.updateAccountBalance');
  Route.put('/:id', 'CheckingAccountsController.updateAccount');
  Route.delete('/:id', 'CheckingAccountsController.deleteAccount');
})
  .prefix('checking-accounts')
  .middleware('auth');

Route.group(() => {
  Route.get('/tef-flags', 'PaymentMethodsController.searchTefFlags');
  Route.get('/tef-acquirers', 'PaymentMethodsController.searchTefAcquirers');
  Route.get('/partial', 'PaymentMethodsController.searchPartialPaymentMethods');
  Route.get(
    '/complete',
    'PaymentMethodsController.searchCompletePaymentMethods',
  );
  Route.post('/create', 'PaymentMethodsController.createPaymentMethod');
  Route.post(
    '/create-flag',
    'PaymentMethodsController.createPaymentMethodFlag',
  );

  Route.put('/update/:id', 'PaymentMethodsController.updatePaymentMethod');
  Route.put(
    '/update-flag/:id',
    'PaymentMethodsController.updatePaymentMethodFlag',
  );
  Route.post('/create-fee', 'PaymentMethodsController.createPaymentMethodFee');
})
  .prefix('payment-methods')
  .middleware('auth');

Route.group(() => {
  Route.get('/', 'FinancesController.index');
  Route.post('/create', 'FinancesController.storeFinance');
  Route.put('/update/:id', 'FinancesController.updateFinance');
  Route.put('/update-down/:id', 'FinancesController.updateFinanceDown');
  Route.put('/update-reversal/:id', 'FinancesController.updateFinanceReversal');
  Route.delete('/delete/:id', 'FinancesController.deleteFinance');
})
  .prefix('finances')
  .middleware('auth');

Route.group(() => {
  Route.get('/', 'BankingsController.index');
  Route.post('/create', 'BankingsController.storeBanking');
  Route.put('/update/:id', 'BankingsController.updateBanking');
})
  .prefix('bankings')
  .middleware('auth');

Route.group(() => {
  Route.get('/products', 'BudgetsController.searchProducts');
  Route.get('/partial', 'BudgetsController.partialIndex');
  Route.get('/complete', 'BudgetsController.completeIndex');
  Route.get('/:id', 'BudgetsController.show');
  Route.post('/create', 'BudgetsController.createBudget');
  Route.post('/create-item', 'BudgetsController.createBudgetItem');
  Route.put('/update-item/:id', 'BudgetsController.updateBudgetItem');
  Route.put('/cancel/:id', 'BudgetsController.cancelBudget');
  Route.put('/confirm/:id', 'BudgetsController.confirmBudget');
  // Route.delete('/delete/:id', 'BudgetsController.deleteBudget');
  // Route.put('/update/:id', 'BankingsController.updateBanking');
})
  .prefix('budgets')
  .middleware('auth');

Route.group(() => {
  Route.post('/create', 'BillsController.createBill');
  Route.post('/create-item', 'BillsController.createBillItem');
  Route.post('/create-payment', 'BillsController.createBillPayment');
  Route.get('/', 'BillsController.index');
  Route.get('/products', 'BillsController.searchProducts');
  Route.get('/taxes', 'BillsController.searchTax');
  Route.get('/show/:id', 'BillsController.show');

  Route.put('/disable-item/:id', 'BillsController.disableBillItem');

  Route.put('/close-bill/:id', 'BillsController.closeBill');
  Route.put('/reopen-bill/:id', 'BillsController.reopenBill');
  Route.delete('/delete-payment/:id', 'BillsController.deleteBillPayment');
})
  .prefix('bills')
  .middleware('auth');

Route.group(() => {
  Route.get('/', 'TemplateReplacementsController.index');
  Route.post('/create', 'TemplateReplacementsController.store');
  Route.put('/update/:id', 'TemplateReplacementsController.update');
  Route.delete('/delete/:id', 'TemplateReplacementsController.destroy');

  Route.post(
    '/replace-text',
    'TemplateReplacementsController.renderTemplateReplacement',
  );
})
  .prefix('template-replacements')
  .middleware('auth');

Route.group(() => {
  Route.get('/', 'FiscalDocumentsController.index');

  Route.get(
    '/business-unit/search',
    'BusinessUnitFiscalDocumentsController.index',
  );
  Route.post(
    '/business-unit/store',
    'BusinessUnitFiscalDocumentsController.store',
  );
  Route.post(
    '/business-unit/authorize',
    'BusinessUnitFiscalDocumentsController.authorize',
  );
  Route.post(
    '/business-unit/cancel',
    'BusinessUnitFiscalDocumentsController.cancel',
  );
  Route.post(
    '/business-unit/disable',
    'BusinessUnitFiscalDocumentsController.disable',
  );
  Route.post(
    '/business-unit/correct',
    'BusinessUnitFiscalDocumentsController.correct',
  );

  Route.get('/issued-documents', 'IssuedFiscalDocumentsController.index');
})
  .prefix('fiscal-documents')
  .middleware('auth');

Route.resource('account-plan-groups', 'AccountPlanGroupsController')
  .apiOnly()
  .middleware({
    '*': ['auth'],
  });

Route.resource('brands', 'BrandsController')
  .only(['index'])
  .middleware({
    '*': ['auth'],
  });

Route.resource('patient-animal-hairs', 'PatientAnimalHairsController')
  .only(['index'])
  .middleware({
    '*': ['auth'],
  });

Route.group(() => {
  Route.get('/', 'TreatmentsController.index');
  Route.get('/show/:id', 'TreatmentsController.show');

  Route.post('/open', 'TreatmentsController.open');
  Route.put('/update/:id', 'TreatmentsController.update');
  Route.put('/close/:id', 'TreatmentsController.close');
})
  .prefix('treatments')
  .middleware('auth');
