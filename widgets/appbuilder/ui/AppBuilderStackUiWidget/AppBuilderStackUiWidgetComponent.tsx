import {
	IAppBuilderWidget,
	IAppBuilderWidgetPropsStackUi,
} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import {findStackUiWidgetByPath} from "@AppBuilderLib/features/appbuilder/lib/findStackUiWidgetByPath";
import {MantineThemeComponent} from "@mantine/core";
import React, {Suspense, lazy, useEffect, useRef} from "react";
import {AppBuilderStackUiWidgetAnimationWrapper} from "./AppBuilderStackUiWidgetAnimationWrapper";
import {StyleProps as StylePropsButton} from "./AppBuilderStackUiWidgetButtonComponent";
import type {StyleProps as StylePropsContent} from "./AppBuilderStackUiWidgetContentComponent";

// Breaks Component ↔ ContentComponent circular import (Content imports this file for nested stacks).
const AppBuilderStackUiWidgetContentComponent = lazy(
	() => import("./AppBuilderStackUiWidgetContentComponent"),
);

interface Props {
	namespace: string;
	/** Active stack names from root to the current level (from `useStackContext`). */
	stackPath: string[];
	/** Current widget tree at this level; re-resolved on every render so open stack content stays live. */
	liveWidgets?: IAppBuilderWidget[];
	/** Widget list shown when no stack is open (forward buttons, sibling widgets). */
	children: React.ReactNode;
	/** When true, fallback scrolls inside a constrained body slot (nested stack); top-level uses parent scroll. */
	fallbackScrolls?: boolean;
}

/**
 * Theme props for stack UI (merged content + button surfaces). Consumed via `useProps("AppBuilderStackUiWidgetComponent", …)` in child components.
 *
 * @docAttached
 * @category widget
 * @configPath themeOverrides.components.AppBuilderStackUiWidgetComponent.defaultProps
 * @displayName AppBuilderStackUiWidgetComponent
 */
export interface AppBuilderStackUiWidgetComponentStyleProps
	extends Partial<StylePropsContent>, Partial<StylePropsButton> {}

type AppBuilderStackUiWidgetComponentThemePropsType =
	AppBuilderStackUiWidgetComponentStyleProps;

export function AppBuilderStackUiWidgetComponentThemeProps(
	props: AppBuilderStackUiWidgetComponentThemePropsType,
): MantineThemeComponent {
	return {
		defaultProps: props,
	};
}

/**
 * Stack UI shell: slides between the widget list (`children`) and resolved stack content.
 *
 * Navigation state is a `stackPath` of names (not frozen props). On each render,
 * `findStackUiWidgetByPath` walks `liveWidgets` so content updates when `appBuilderData` changes
 * while a stack stays open (SS-9698).
 */
function AppBuilderStackUiWidgetComponent({
	namespace,
	stackPath,
	liveWidgets,
	children,
	fallbackScrolls = false,
}: Props) {
	const liveStack = findStackUiWidgetByPath(liveWidgets, stackPath);
	const snapshotRef = useRef<IAppBuilderWidgetPropsStackUi>();
	// Snapshot: if liveWidgets is not yet available (e.g. container loading) but the
	// path is non-empty, keep rendering the last-known props rather than showing blank.
	// Cleared when the path empties so a stale widget list is never shown on re-open.
	// Intentional render-phase write; ref is not reactive (safe under Strict Mode).
	if (liveStack) {
		snapshotRef.current = liveStack;
	}

	useEffect(() => {
		if (!stackPath.length) {
			snapshotRef.current = undefined;
		}
	}, [stackPath]);

	// Prefer live tree; snapshot only bridges a brief gap before widgets are available.
	const stack =
		liveStack ?? (stackPath.length > 0 ? snapshotRef.current : undefined);

	return (
		<AppBuilderStackUiWidgetAnimationWrapper
			isOpen={stackPath.length > 0}
			fallbackScrolls={fallbackScrolls}
			fallbackContent={children}
		>
			{stack && (
				<Suspense fallback={null}>
					<AppBuilderStackUiWidgetContentComponent
						namespace={namespace}
						{...stack}
					/>
				</Suspense>
			)}
		</AppBuilderStackUiWidgetAnimationWrapper>
	);
}

export default AppBuilderStackUiWidgetComponent;
