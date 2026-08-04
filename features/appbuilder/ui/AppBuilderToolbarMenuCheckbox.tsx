import {Checkbox} from "@mantine/core";
import classes from "./AppBuilderToolbarMenuCheckbox.module.css";

type Props = {
	label: string;
	checked: boolean;
	readOnly?: boolean;
	disabled?: boolean;
	onChange: () => void;
};

/**
 * Checkbox row for toolbar menus. It deliberately shares the toolbar
 * menu spacing and hover treatment instead of relying on Mantine's default
 * form-control layout.
 */
export default function AppBuilderToolbarMenuCheckbox({
	label,
	checked,
	readOnly = false,
	disabled = false,
	onChange,
}: Props) {
	return (
		<Checkbox
			checked={checked}
			readOnly={readOnly}
			// Keep the label readable while visually distinguishing always-active
			// selections from user-toggleable checkboxes.
			color={readOnly ? "gray" : undefined}
			disabled={disabled || readOnly}
			aria-readonly={readOnly || undefined}
			data-read-only={readOnly || undefined}
			label={label}
			classNames={{
				root: classes.root,
				label: classes.label,
			}}
			onChange={onChange}
			onClick={readOnly ? (event) => event.preventDefault() : undefined}
		/>
	);
}
