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

function validateCpf(val: string): boolean {
	let sum = 0;
	let rest = 0;

	for (let i = 1; i <= 9; i++) {
		sum += parseInt(val.substring(i - 1, i)) * (11 - i);
	}
	rest = (sum * 10) % 11;

	if (rest === 10 || rest === 11) {
		rest = 0;
	}

	if (rest !== parseInt(val.substring(9, 10))) {
		return false;
	}

	sum = 0;
	for (let i = 1; i <= 10; i++) {
		sum += parseInt(val.substring(i - 1, i)) * (12 - i);
	}
	rest = (sum * 10) % 11;

	if (rest === 10 || rest === 11) {
		rest = 0;
	}
	if (rest !== parseInt(val.substring(10, 11))) {
		return false;
	}

	return true;
}

function validateCnpj(val: string): boolean {
	const digitos = val.split("");
	let sum = 0;
	let factor = 5;
	for (let i = 0; i < 12; i++) {
		sum += parseInt(digitos[i]) * factor;
		factor = factor === 2 ? 9 : factor - 1;
	}
	let digit = sum % 11 < 2 ? 0 : 11 - (sum % 11);
	if (parseInt(digitos[12]) !== digit) {
		return false;
	}

	sum = 0;
	factor = 6;
	for (let i = 0; i < 13; i++) {
		sum += parseInt(digitos[i]) * factor;
		factor = factor === 2 ? 9 : factor - 1;
	}
	digit = sum % 11 < 2 ? 0 : 11 - (sum % 11);
	if (parseInt(digitos[13]) !== digit) {
		return false;
	}

	return true;
}

export function validDocument(val: string): boolean {
	const strippedValue = val.replace(/[^\d]/g, "").trim();

	if (strippedValue.length === 11) {
		return validateCpf(strippedValue);
	}

	if (strippedValue.length === 14) {
		return validateCnpj(strippedValue);
	}

	return false;
}

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
