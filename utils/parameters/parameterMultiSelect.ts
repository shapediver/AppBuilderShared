export const parameterMultiSelect = (
	value: string | string[] | null | undefined,
	onChange: ((value: string[]) => void) | ((value: string | null) => void),
	multiselect: boolean,
) => {
	const getCurrentValues = (): string[] => {
		if (!value) return [];
		return value as string[];
	};

	const handleClick = (item: string) => {
		if (multiselect) {
			const currentValues = getCurrentValues();
			const isSelected = currentValues.includes(item);
			const newValues = isSelected
				? currentValues.filter((v) => v !== item)
				: [...currentValues, item];
			(onChange as (value: string[]) => void)(newValues);
		} else {
			(onChange as (value: string | null) => void)(item);
		}
	};

	const isSelected = (item: string) => {
		if (multiselect) {
			return getCurrentValues().includes(item);
		}
		return value === item;
	};

	return {
		handleClick,
		isSelected,
	};
};
