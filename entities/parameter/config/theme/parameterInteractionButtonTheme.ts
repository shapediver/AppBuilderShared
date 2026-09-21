import type {IAppBuilderIcon} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import {IAppBuilderActionPropsCommonSchema} from "@AppBuilderLib/features/appbuilder/config/appbuilderActionsTypecheck";
import {z} from "@AppBuilderLib/shared/lib/zod";
import type {IconType} from "@AppBuilderLib/shared/ui/icon/Icon.types";

/**
 * Theme chrome for one interaction control (Clear / Confirm / Cancel).
 * Matches the App Builder action shape of `label` + `tooltip` + `icon`.
 */
export const parameterInteractionButtonThemeSchema =
	IAppBuilderActionPropsCommonSchema.omit({id: true});

export type ParameterInteractionButtonThemeProps = {
	/** Widget button text / menu row label. Toolbar falls back to this for the tooltip. */
	label?: string;
	/** Toolbar and widget icon-button tooltip. Falls back to `label`. */
	tooltip?: string;
	/** Iconify name, image URL, or inline Iconify object. */
	icon?: IAppBuilderIcon;
};

export type ParameterInteractionConfirmCancelThemeProps = {
	/** Confirm control: widget label, toolbar tooltip, and icon. */
	confirmButton?: ParameterInteractionButtonThemeProps;
	/** Cancel control: widget label, toolbar tooltip, and icon. */
	cancelButton?: ParameterInteractionButtonThemeProps;
};

export type ParameterInteractionConfirmCancelClearThemeProps =
	ParameterInteractionConfirmCancelThemeProps & {
		/** Clear control: toolbar/widget tooltip and icon. Default tooltip is `Clear ${parameterName}`. */
		clearButton?: ParameterInteractionButtonThemeProps;
	};

/** `z.object` (not strict) so this can be intersected with viewer interaction schemas. */
export const parameterInteractionConfirmCancelThemeSchema = z.object({
	confirmButton: parameterInteractionButtonThemeSchema.optional(),
	cancelButton: parameterInteractionButtonThemeSchema.optional(),
});

export const parameterInteractionConfirmCancelClearThemeSchema =
	parameterInteractionConfirmCancelThemeSchema.extend({
		clearButton: parameterInteractionButtonThemeSchema.optional(),
	});

/** Drawing has no viewer interaction theme schema; reject unknown keys. */
export const ParameterDrawingComponentThemeDefaultPropsSchema = z.strictObject({
	clearButton: parameterInteractionButtonThemeSchema.optional(),
	confirmButton: parameterInteractionButtonThemeSchema.optional(),
	cancelButton: parameterInteractionButtonThemeSchema.optional(),
});

export const resolveParameterInteractionButtonTheme = (
	themed: ParameterInteractionButtonThemeProps | undefined,
	defaults: {label: string; icon: IconType},
): {label: string; tooltip: string; icon: IconType} => {
	const label = themed?.label ?? defaults.label;
	return {
		label,
		tooltip: themed?.tooltip ?? label,
		icon: (themed?.icon ?? defaults.icon) as IconType,
	};
};
