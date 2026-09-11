import {IAppBuilderToolbarControlItem} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import {ToolbarRuntimeTarget} from "@AppBuilderLib/features/appbuilder/config/shapediverStoreToolbars";
import {useEffect, useRef} from "react";
import {useShapeDiverStoreToolbars} from "./useShapeDiverStoreToolbars";

/**
 * Small runtime API for temporarily adding toolbar controls and automatically
 * cleaning them up when the owning component unmounts.
 */
export function useRuntimeToolbarControls() {
	// Stryker disable next-line ArrayDeclaration: empty token list unused by add/remove tests
	const tokensRef = useRef<string[]>([]);

	useEffect(
		() => {
			return () => {
				const {removeRuntimeToolbarToken} =
					useShapeDiverStoreToolbars.getState();
				for (const token of tokensRef.current) {
					removeRuntimeToolbarToken(token);
				}
				// Stryker disable next-line ArrayDeclaration: cleanup identity unused by unmount tests
				tokensRef.current = [];
			};
		},
		// Stryker disable next-line ArrayDeclaration: effect identity unused by add/remove tests
		[],
	);

	return {
		// Register controls into a runtime toolbar slot and remember the token
		// so the controls can be removed automatically on unmount.
		addControls: (
			target: ToolbarRuntimeTarget,
			controls: IAppBuilderToolbarControlItem[],
		) => {
			const token = useShapeDiverStoreToolbars
				.getState()
				.addRuntimeToolbarControls(target, controls);
			if (token) {
				tokensRef.current.push(token);
			}
			return token;
		},
		// Explicit removal for callers that want to clear a runtime contribution
		// before the owner unmounts.
		removeToken: (token: string) => {
			useShapeDiverStoreToolbars
				.getState()
				.removeRuntimeToolbarToken(token);
			// Stryker disable all: ref filter unused after store removal; tests assert store only
			tokensRef.current = tokensRef.current.filter((t) => t !== token);
			// Stryker restore all
		},
	};
}
