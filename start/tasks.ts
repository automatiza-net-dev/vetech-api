import Scheduler from "@ioc:Verful/Scheduler";
import ScheduleService from "App/Services/ScheduleService";
import BusinessUnitFiscalDocumentService from "App/Services/BusinessUnitFiscalDocumentService";
import ProductInventoryService from "App/Services/ProductInventoryService";

Scheduler.call(async () => {
	const result = await ScheduleService.RunSyncLateOrMissingSchedules();

	console.log({ result });
}).cron("*/10  * * * *");

Scheduler.call(async () => {
	await BusinessUnitFiscalDocumentService.UpdateOldNfeRecords();
}).cron("0 6 * * *");

Scheduler.call(async () => {
	await ProductInventoryService.ProcessItems();
}).cron("0 4 1 * *");
