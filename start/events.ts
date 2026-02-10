/*
|--------------------------------------------------------------------------
| Preloaded File
|--------------------------------------------------------------------------
|
| Any code written inside this file will be executed during the application
| boot.
|
*/

import Event from "@ioc:Adonis/Core/Event";
import Logger from "@ioc:Adonis/Core/Logger";
import { axiom } from "App/Lib/Axiom";
import Env from "@ioc:Adonis/Core/Env";

const shouldLog = true;

Event.on("db:query", async ({ sql, bindings, connection, method, model }) => {
  const _sql =
    bindings?.reduce((currSql: string, binding) => currSql.replace("?", `'${binding}'`), sql) ??
    sql;

  if (shouldLog) {
    Logger.info("[SQL] %s", _sql);
  }
});
