export const regexCPF = /^\d{3}.\d{3}.\d{3}-\d{2}$/;
export const regexCNPJ = /^\d{2}.\d{3}.\d{3}\/\d{4}-\d{2}$/;

export function validate(value: string | number | number[] = "") {
	if (matchNumbers(value).length <= 11) {
		return validCPF(value);
	}

	return validCNPJ(value);
}

export function validCPF(value: string | number | number[] = "") {
	if (!value) return false;

	const isString = typeof value === "string";
	const validTypes =
		isString || Number.isInteger(value) || Array.isArray(value);

	if (!validTypes) return false;

	if (isString) {
		const digitsOnly = /^\d{11}$/.test(value);

		const validFormat = regexCPF.test(value);

		const isValid = digitsOnly || validFormat;

		if (!isValid) return false;
	}

	const numbers = matchNumbers(value);

	if (numbers.length !== 11) return false;

	const items = [...new Set(numbers)];
	if (items.length === 1) return false;

	const base = numbers.slice(0, 9);
	const digits = numbers.slice(9);

	const calc0 = base
		.map((n, i) => baseCalc(n, i, numbers.length - 1))
		.reduce(sumCalc, 0);

	const digit0 = digitCalc(calc0, numbers);

	if (digit0 !== digits[0]) return false;

	const calc1 = base
		.concat(digit0)
		.map((n, i) => baseCalc(n, i, numbers.length))
		.reduce(sumCalc, 0);

	const digit1 = digitCalc(calc1, numbers);

	return digit1 === digits[1];
}

export function formatCPF(value: string | number | number[] = "") {
	const valid = validCPF(value);

	if (!valid) return "";

	const numbers = matchNumbers(value);
	const text = numbers.join("");

	const format = text.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");

	return format;
}

function baseCalc(n: number, i: number, x: number) {
	return n * (x - i);
}

function sumCalc(a: number, b: number) {
	return a + b;
}

function digitCalc(n: number, numbers: number[]) {
	const rest = n % numbers.length;
	return rest < 2 ? 0 : numbers.length - rest;
}

function matchNumbers(value: string | number | number[] = "") {
	const match = value.toString().match(/\d/g);
	return Array.isArray(match) ? match.map(Number) : [];
}

export function validCNPJ(value: string | number | number[] = "") {
	if (!value) return false;

	const isString = typeof value === "string";
	const validTypes =
		isString || Number.isInteger(value) || Array.isArray(value);

	if (!validTypes) return false;

	if (isString) {
		const digitsOnly = /^\d{14}$/.test(value);

		const validFormat = regexCNPJ.test(value);

		const isValid = digitsOnly || validFormat;

		if (!isValid) return false;
	}

	const numbers = matchNumbers(value);

	if (numbers.length !== 14) return false;

	const items = [...new Set(numbers)];
	if (items.length === 1) return false;

	const digits = numbers.slice(12);

	const digit0 = validCalc(12, numbers);
	if (digit0 !== digits[0]) return false;

	const digit1 = validCalc(13, numbers);
	return digit1 === digits[1];
}

export function formatCNPJ(value: string | number | number[] = "") {
	const valid = validCNPJ(value);

	if (!valid) return "";

	const numbers = matchNumbers(value);
	const text = numbers.join("");

	const format = text.replace(
		/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
		"$1.$2.$3/$4-$5",
	);

	return format;
}

function validCalc(x: number, numbers: number[]) {
	const slice = numbers.slice(0, x);
	let factor = x - 7;
	let sum = 0;

	for (let i = x; i >= 1; i--) {
		const n = slice[x - i];
		sum += n * factor--;
		if (factor < 2) factor = 9;
	}

	const result = 11 - (sum % 11);

	return result > 9 ? 0 : result;
}

export function validateCPF(cpf: string) {
	cpf = cpf.replace(/[^\d]+/g, "");
	if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) {
		return false;
	}
	let sum = 0,
		rest;
	for (var i = 1; i <= 9; i++) {
		sum = sum + parseInt(cpf.substring(i - 1, i)) * (11 - i);
	}
	rest = (sum * 10) % 11;
	if (rest == 10 || rest == 11) {
		rest = 0;
	}
	if (rest != parseInt(cpf.substring(9, 10))) {
		return false;
	}
	sum = 0;
	for (var i = 1; i <= 10; i++) {
		sum = sum + parseInt(cpf.substring(i - 1, i)) * (12 - i);
	}
	rest = (sum * 10) % 11;
	if (rest == 10 || rest == 11) {
		rest = 0;
	}
	if (rest != parseInt(cpf.substring(10, 11))) {
		return false;
	}
	return true;
}
