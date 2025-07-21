import {IGenericParameterDefinition} from "@AppBuilderShared/types/store/shapediverStoreParameters";
import {
	ResParameter,
	ResParameterType,
	ResVisualizationType,
} from "@shapediver/sdk.geometry-api-sdk-v2";

export function addValidator(
	def: IGenericParameterDefinition,
): IGenericParameterDefinition {
	const isValid = (value: any, throwError?: boolean): boolean => {
		try {
			return validateParameterValue(def.definition, value);
		} catch (e) {
			if (throwError) throw e;

			return false;
		}
	};

	return {
		isValid,
		...def,
	};
}

function validateParameterValue(
	definition: ResParameter,
	value: unknown,
): boolean {
	const {id, type, min, max, decimalplaces, choices, visualization} =
		definition;
	switch (true) {
		case type === ResParameterType.BOOL:
			if (typeof value === "string") {
				if (!(value === "true" || value === "false"))
					throw new Error(
						`Parameter(${id}).isValid: The value ${value} is a string that is neither true or false.`,
					);
			} else {
				validateAndError(`Parameter(${id}).isValid`, value, "boolean");
			}
			break;
		case type === ResParameterType.COLOR:
			validateAndError(`Parameter(${id}).isValid`, value, "color");
			break;
		case type === ResParameterType.FILE:
			validateAndError(`Parameter(${id}).isValid`, value, "file");
			break;
		case type === ResParameterType.EVEN ||
			type === ResParameterType.FLOAT ||
			type === ResParameterType.INT ||
			type === ResParameterType.ODD:
			{
				let temp = value as number;
				if (typeof value === "string") temp = +value;
				validateAndError(`Parameter(${id}).isValid`, temp, "number");
				if (type === ResParameterType.EVEN) {
					if (temp % 2 !== 0)
						throw new Error(
							`Parameter(${id}).isValid: The value ${value} is not even.`,
						);
				} else if (type === ResParameterType.ODD) {
					if (temp % 2 === 0)
						throw new Error(
							`Parameter(${id}).isValid: The value ${value} is not odd.`,
						);
				} else if (type === ResParameterType.INT) {
					if (!Number.isInteger(temp))
						throw new Error(
							`Parameter(${id}).isValid: The value ${value} is not an integer.`,
						);
				}
				if (min || min === 0)
					if (temp < min)
						throw new Error(
							`Parameter(${id}).isValid: The value ${value} is smaller than the minimum ${min}.`,
						);

				if (max || max === 0)
					if (temp > max)
						throw new Error(
							`Parameter(${id}).isValid: The value ${value} is larger than the maximum ${max}.`,
						);

				if (decimalplaces || decimalplaces === 0) {
					const numStr = temp + "";
					let decimalplaces = 0;
					if (numStr.includes("."))
						decimalplaces = numStr.split(".")[1].length;
					if (decimalplaces < decimalplaces)
						throw new Error(
							`Parameter(${id}).isValid: The value ${value} has not the correct number of decimalplaces (${decimalplaces}).`,
						);
				}
			}
			break;
		case type === ResParameterType.STRINGLIST: {
			validateAndError(`Parameter(${id}).isValid`, value, "string");
			const choicesChecker = (v: string) => {
				// has to be a single value that is
				// 1. convertible to number
				// 2. between 0 and choices.length -1
				const temp = +v;
				validateAndError(`Parameter(${id}).isValid`, temp, "number");
				if (temp < 0 || temp > choices!.length - 1)
					throw new Error(
						`Parameter(${id}).isValid: The value ${v} is not within the range of the defined number choices.`,
					);
			};

			if (visualization === ResVisualizationType.CHECKLIST) {
				// comma separated numbers
				if ((value as string).includes(",")) {
					const values: string[] = (value as string).split(",");
					for (let i = 0; i < values.length; i++) {
						if (
							values.filter((item) => item === values[i])
								.length !== 1
						)
							throw new Error(
								`Parameter(${id}).isValid: The value ${values[i]} exists multiple times, but should only exist once.`,
							);
						choicesChecker(values[i]);
					}
				}
				// allow empty string
				else if (value) {
					// to number
					let temp = value as number;
					if (typeof value === "string") temp = +value;
					validateAndError(
						`Parameter(${id}).isValid`,
						temp,
						"number",
					);
					choicesChecker(value as string);
				}
			}
			// allow empty string
			else if (value) {
				// to number
				let temp = value as number;
				if (typeof value === "string") temp = +value;
				validateAndError(`Parameter(${id}).isValid`, temp, "number");
				choicesChecker(value as string);
			}
			break;
		}
		default:
			validateAndError(`Parameter(${id}).isValid`, value, "string");
			break;
	}

	return true;
}

type Types =
	| "string"
	| "boolean"
	| "function"
	| "enum"
	| "number"
	| "factor"
	| "positive"
	| "vec3"
	| "mat4"
	| "cubeMap"
	| "array"
	| "stringArray"
	| "object"
	| "file"
	| "color"
	| "quat";

function validate(
	value: any,
	stringLiteral: Types,
	defined: boolean = true,
	enumValues: string[] = [],
): boolean {
	if (defined === false && typeof value === "undefined") return true;

	switch (stringLiteral) {
		case "array":
			if (Array.isArray(value)) return true;
			break;
		case "string":
			if (isTypeOf(value, "string")) return true;
			break;
		case "boolean":
			if (isTypeOf(value, "boolean")) return true;
			break;
		case "function":
			if (isTypeOf(value, "function")) return true;
			break;
		case "number":
			if (isTypeOf(value, "number") && !isNaN(value)) return true;
			break;
		case "factor":
			if (isTypeOf(value, "number") && value >= 0 && value <= 1)
				return true;
			break;
		case "positive":
			if (isTypeOf(value, "number") && value >= 0) return true;
			break;
		case "enum":
			if (isTypeOf(value, "string") && enumValues.includes(value))
				return true;
			break;
		case "vec3":
			if (value.constructor === Float32Array) value = Array.from(value);
			if (
				Array.isArray(value) &&
				isTypeOf(value[0], "number") &&
				isTypeOf(value[1], "number") &&
				isTypeOf(value[2], "number")
			)
				return true;
			break;
		case "quat":
			if (value.constructor === Float32Array) value = Array.from(value);
			if (
				Array.isArray(value) &&
				isTypeOf(value[0], "number") &&
				isTypeOf(value[1], "number") &&
				isTypeOf(value[2], "number") &&
				isTypeOf(value[3], "number")
			)
				return true;
			break;
		case "cubeMap":
			if (
				Array.isArray(value) &&
				value.length === 6 &&
				isTypeOf(value[0], "string") &&
				isTypeOf(value[1], "string") &&
				isTypeOf(value[2], "string") &&
				isTypeOf(value[3], "string") &&
				isTypeOf(value[4], "string") &&
				isTypeOf(value[5], "string")
			)
				return true;
			if (isTypeOf(value, "string")) return true;
			break;
		case "stringArray":
			if (Array.isArray(value)) {
				let check = true;
				for (let i = 0; i < value.length; i++)
					if (typeof value[i] !== "string") check = false;
				if (check === true) return true;
			}
			break;
		case "object":
			if (isTypeOf(value, "object")) return true;
			break;
		case "file":
			if (
				isTypeOf(value, "string") ||
				value instanceof File ||
				value instanceof Blob
			)
				return true;
			break;
		case "color":
			if (
				isTypeOf(value, "string") ||
				(Array.isArray(value) &&
					isTypeOf(value[0], "number") &&
					isTypeOf(value[1], "number") &&
					isTypeOf(value[2], "number")) ||
				isTypeOf(value, "number")
			)
				return true;
			break;
		case "mat4":
			if (value.constructor === Float32Array) value = Array.from(value);
			if (
				Array.isArray(value) &&
				isTypeOf(value[0], "number") &&
				isTypeOf(value[1], "number") &&
				isTypeOf(value[2], "number") &&
				isTypeOf(value[3], "number") &&
				isTypeOf(value[4], "number") &&
				isTypeOf(value[5], "number") &&
				isTypeOf(value[6], "number") &&
				isTypeOf(value[7], "number") &&
				isTypeOf(value[8], "number") &&
				isTypeOf(value[9], "number") &&
				isTypeOf(value[10], "number") &&
				isTypeOf(value[11], "number") &&
				isTypeOf(value[12], "number") &&
				isTypeOf(value[13], "number") &&
				isTypeOf(value[14], "number") &&
				isTypeOf(value[15], "number")
			)
				return true;
			break;
		default:
			return false;
	}

	return false;
}

function validateAndError(
	scope: string,
	value: any,
	type: Types,
	defined: boolean = true,
	enumValues: string[] = [],
) {
	const res = validate(value, type, defined, enumValues);
	if (res) return;

	throw new Error(
		`${scope}: Input could not be validated. ${value} is not of type ${type}.${defined === false ? " (Can also be undefined)" : ""}`,
	);
}

function isTypeOf(value: any, type: string): boolean {
	return typeof value === type;
}
