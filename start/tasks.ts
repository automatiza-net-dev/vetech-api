import Scheduler from "@ioc:Verful/Scheduler";
import ScheduleService from "App/Services/ScheduleService";
import BusinessUnitFiscalDocumentService from "App/Services/BusinessUnitFiscalDocumentService";

Scheduler.call(async () => {
	const result = await ScheduleService.RunSyncLateOrMissingSchedules();

	console.log({ result });
}).cron("*/10  * * * *");

Scheduler.call(async () => {
	await BusinessUnitFiscalDocumentService.UpdateOldNfeRecords();
}).cron("0 6 * * *");
