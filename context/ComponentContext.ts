import {
	ButtonRenderContext,
	getViewportIconComponent,
} from "@AppBuilderShared/types/components/shapediver/componentTypes";
import {IComponentContext} from "@AppBuilderShared/types/context/componentcontext";
import {
	ViewportIconButtonEnum,
	ViewportIconLayoutItem,
} from "@AppBuilderShared/types/store/shapediverStoreViewportIcons";
import {Divider, DividerProps} from "@mantine/core";
import React, {createContext} from "react";

export const DummyComponent: IComponentContext = {};

export const ComponentContext =
	createContext<IComponentContext>(DummyComponent);

const renderButtonByKind = (
	kind: ViewportIconButtonEnum,
	componentContext: any,
	buttonContext: any,
) => {
	const {
		viewport,
		namespace,
		buttonsDisabled,
		executing,
		hasPendingChanges,
		iconsVisible,
		fullscreenId,
		...commonProps
	} = buttonContext;

	const ButtonComponent = getViewportIconComponent(componentContext, kind);
	if (!ButtonComponent) return null;

	switch (kind) {
		case ViewportIconButtonEnum.Ar:
			return React.createElement(ButtonComponent, {
				key: "ar",
				viewport,
				...commonProps,
			});
		case ViewportIconButtonEnum.Zoom:
			return React.createElement(ButtonComponent, {
				key: "zoom",
				viewport,
				...commonProps,
			});
		case ViewportIconButtonEnum.Fullscreen:
			return React.createElement(ButtonComponent, {
				key: "fullscreen",
				fullscreenId,
				enableFullscreenBtn: true,
				...commonProps,
			});
		case ViewportIconButtonEnum.Cameras:
			return React.createElement(ButtonComponent, {
				key: "cameras",
				viewport,
				visible: iconsVisible,
				...commonProps,
			});
		case ViewportIconButtonEnum.Undo:
			return React.createElement(ButtonComponent, {
				key: "undo",
				disabled: buttonsDisabled || executing || hasPendingChanges,
				hasPendingChanges,
				executing,
				...commonProps,
			});
		case ViewportIconButtonEnum.Redo:
			return React.createElement(ButtonComponent, {
				key: "redo",
				disabled: buttonsDisabled || executing || hasPendingChanges,
				hasPendingChanges,
				executing,
				...commonProps,
			});
		case ViewportIconButtonEnum.Reload:
			return React.createElement(ButtonComponent, {
				key: "reload",
				disabled:
					!namespace ||
					buttonsDisabled ||
					executing ||
					hasPendingChanges,
				namespace: namespace || "",
				hasPendingChanges,
				executing,
				...commonProps,
			});
		case ViewportIconButtonEnum.HistoryMenu:
			return React.createElement(ButtonComponent, {
				key: "historyMenu",
				disabled: !namespace || buttonsDisabled || hasPendingChanges,
				namespace: namespace || "",
				visible: iconsVisible,
				...commonProps,
			});
		default:
			return null;
	}
};

export const renderViewportIcons = (
	viewportIcons: ViewportIconLayoutItem[],
	componentContext: any,
	buttonContext: ButtonRenderContext,
	dividerProps: DividerProps = {},
) => {
	const sections: React.ReactNode[] = [];
	if (viewportIcons.length === 0) return sections;

	viewportIcons.forEach((item, index) => {
		if (item.type === "button") {
			const button = renderButtonByKind(
				item.button.type,
				componentContext,
				buttonContext,
			);
			if (button) sections.push(button);
		} else if (item.type === "group") {
			const groupButtons: React.ReactNode[] = [];
			item.sections.forEach((section) => {
				section.forEach((buttonDef) => {
					const button = renderButtonByKind(
						buttonDef.type,
						componentContext,
						buttonContext,
					);
					if (button) groupButtons.push(button);
				});
				// Add divider between sections within a group
				if (
					groupButtons.length > 0 &&
					section !== item.sections[item.sections.length - 1]
				) {
					groupButtons.push(
						React.createElement(Divider, {
							key: `divider-${index}-${section.length}`,
							...dividerProps,
						}),
					);
				}
			});
			sections.push(
				React.createElement(
					React.Fragment,
					{key: `group-${index}`},
					...groupButtons,
				),
			);
		}

		// Add divider between layout items
		if (index < viewportIcons.length - 1) {
			sections.push(
				React.createElement(Divider, {
					key: `layout-divider-${index}`,
					...dividerProps,
				}),
			);
		}
	});

	return sections;
};
