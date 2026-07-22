import {IAppBuilderActionPropsSetParameterValue} from "@AppBuilderLib/features/appbuilder/config/appbuilder";

export interface FormWidgetParameterValue {
	readonly name: string;
	readonly sessionId?: string;
	readonly value: string;
}

/**
 * Builds an export parameter value from a form field.
 *
 * Export requests use parameter ids as keys. A display name can contain spaces
 * and is not a stable request identifier, so it must not be used here.
 */
export function createFormExportParameterValue(
	parameterId: string,
	parameterNamespace: string,
	formNamespace: string,
	value: string,
): FormWidgetParameterValue {
	return {
		name: parameterId,
		...(parameterNamespace !== formNamespace
			? {sessionId: parameterNamespace}
			: {}),
		value,
	};
}

/**
 * Merges export-control parameter values with form field values for form submit.
 * Export values are applied first; form values add missing parameters or override by name.
 */
export function mergeFormExportParameterValues(
	exportParameterValues:
		| IAppBuilderActionPropsSetParameterValue[]
		| undefined,
	formParameterValues: FormWidgetParameterValue[],
): IAppBuilderActionPropsSetParameterValue[] {
	const merged: IAppBuilderActionPropsSetParameterValue[] = [
		...(exportParameterValues ?? []),
	];

	for (const formValue of formParameterValues) {
		const index = merged.findIndex(
			(entry) => entry.parameter.name === formValue.name,
		);
		const entry: IAppBuilderActionPropsSetParameterValue = {
			parameter: {
				name: formValue.name,
				...(formValue.sessionId
					? {sessionId: formValue.sessionId}
					: {}),
			},
			value: formValue.value,
		};

		if (index >= 0) {
			merged[index] = entry;
		} else {
			merged.push(entry);
		}
	}

	return merged;
}
