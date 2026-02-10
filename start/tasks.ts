import Scheduler from "@ioc:Verful/Scheduler";
import Drive from "@ioc:Adonis/Core/Drive";
import ScheduleService from "App/Services/ScheduleService";
import BusinessUnitFiscalDocumentService from "App/Services/BusinessUnitFiscalDocumentService";
import ProductInventoryService from "App/Services/ProductInventoryService";

Scheduler.call(async () => {
  const result = await ScheduleService.RunSyncLateOrMissingSchedules();

  console.log({ result });
}).cron("*/10  * * * *");

Scheduler.call(async () => {
  const nfeResult = await BusinessUnitFiscalDocumentService.UpdateOldNfeRecords();

  await Drive.use("s3").put(`cron-nfe/${Date.now()}.json`, JSON.stringify(nfeResult), {
    contentType: "application/json",
  });
}).cron("0 6 * * *");

Scheduler.call(async () => {
  const nfseResult = await BusinessUnitFiscalDocumentService.UpdateOldNfseRecords();

  await Drive.use("s3").put(`cron-nfse/${Date.now()}.json`, JSON.stringify(nfseResult), {
    contentType: "application/json",
  });
}).cron("0 6 * * *");

Scheduler.call(async () => {
  await ProductInventoryService.ProcessItems();
}).cron("0 4 1 * *");
