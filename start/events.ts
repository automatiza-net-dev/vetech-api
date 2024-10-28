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

Event.on("db:query", async ({ sql, bindings, connection, method, model }) => {
	if (!bindings) {
		Logger.info("[SQL] %s", sql);
		axiom.ingest(Env.get("AXIOM_DATASET"), [
			{
				_type: "sql",
				sql,
				connection,
				method,
				model: model ?? null,
			},
		]);
		await axiom.flush();
		return;
	}

	Logger.info(
		"[SQL] %s",
		bindings?.reduce(
			(currSql: string, binding) => currSql.replace("?", `'${binding}'`),
			sql,
		) ?? sql,
	);
	axiom.ingest(Env.get("AXIOM_DATASET"), [
		{
			_type: "sql",
			sql:
				bindings?.reduce(
					(currSql: string, binding) => currSql.replace("?", `'${binding}'`),
					sql,
				) ?? sql,
			connection,
			method,
			model: model ?? null,
		},
	]);
	await axiom.flush();
});
