import type {ToolbarCommandItem} from "@AppBuilderLib/features/appbuilder/config/toolbarRenderTypes";
import type {IconType} from "@AppBuilderLib/shared/ui/icon/Icon.types";
import {useCallback, useState} from "react";
import AppBuilderToolbarIconButton from "./AppBuilderToolbarIconButton";
import AppBuilderToolbarMenuItemButton from "./AppBuilderToolbarMenuItemButton";

type Props = {
	item: ToolbarCommandItem;
	presentation: "toolbar" | "menu";
	defaultIcon?: IconType;
};

const useToolbarCommand = (item: ToolbarCommandItem) => {
	const [loading, setLoading] = useState(false);
	const execute = useCallback(() => {
		const result = item.props.execute();
		if (!result || typeof result.then !== "function") return;

		setLoading(true);
		void Promise.resolve(result).then(
			() => setLoading(false),
			() => setLoading(false),
		);
	}, [item]);

	return {execute, loading};
};

/** Renders a generic command using the toolbar or menu visual primitive. */
export default function AppBuilderToolbarCommandButton({
	item,
	presentation,
	defaultIcon,
}: Props) {
	const {execute, loading} = useToolbarCommand(item);

	if (presentation === "menu") {
		return (
			<AppBuilderToolbarMenuItemButton
				label={item.label}
				icon={item.icon}
				tooltip={item.tooltip}
				disabled={item.disabled}
				loading={loading}
				onClick={execute}
			/>
		);
	}

	return (
		<AppBuilderToolbarIconButton
			label={item.label}
			tooltipLabel={item.tooltip}
			iconType={item.icon ?? defaultIcon ?? "tabler:apps"}
			disabled={item.disabled}
			loading={loading}
			onClick={execute}
		/>
	);
}
