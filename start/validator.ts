/*
|--------------------------------------------------------------------------
| Preloaded File
|--------------------------------------------------------------------------
|
| Any code written inside this file will be executed during the application
| boot.
|
*/

import { validator } from "@ioc:Adonis/Core/Validator";
import { validDocument } from "App/Shared";

validator.rule("documento", (value, _, options) => {
	if (typeof value !== "string") {
		return;
	}

	if (!validDocument(value)) {
		options.errorReporter.report(
			options.pointer,
			"documento",
			"Documento inválido",
			options.arrayExpressionPointer,
		);
	}
});

declare module "@ioc:Adonis/Core/Validator" {
	interface Rules {
		documento(): Rule;
	}
}
