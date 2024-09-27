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

Event.on("db:query", ({ sql, bindings }) => {
	if (!bindings) {
		Logger.info("[SQL] %s", sql);
		return;
	}

	Logger.info(
		"[SQL] %s",
		bindings?.reduce(
			(currSql: string, binding) => currSql.replace("?", `'${binding}'`),
			sql,
		) ?? sql,
	);
});
