import {IAppBuilderActionPropsSetParameterValue} from "@AppBuilderLib/features/appbuilder/config/appbuilder";

export interface FormWidgetParameterValue {
	readonly name: string;
	readonly sessionId?: string;
	readonly value: string;
}

/**
 * Merges export-control parameter values with form field values for form submit.
 * Export values are applied first; form values add missing parameters or override by name.
 */
export function mergeFormExportParameterValues(
	exportParameterValues: IAppBuilderActionPropsSetParameterValue[] | undefined,
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
