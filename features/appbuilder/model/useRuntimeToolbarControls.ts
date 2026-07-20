import {IAppBuilderToolbarControlItem} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import {ToolbarRuntimeTarget} from "@AppBuilderLib/features/appbuilder/config/shapediverStoreToolbars";
import {useEffect, useRef} from "react";
import {useShapeDiverStoreToolbars} from "./useShapeDiverStoreToolbars";

/**
 * Small runtime API for temporarily adding toolbar controls and automatically
 * cleaning them up when the owning component unmounts.
 */
export function useRuntimeToolbarControls() {
	const tokensRef = useRef<string[]>([]);

	useEffect(() => {
		return () => {
			const {removeRuntimeToolbarToken} =
				useShapeDiverStoreToolbars.getState();
			for (const token of tokensRef.current) {
				removeRuntimeToolbarToken(token);
			}
			tokensRef.current = [];
		};
	}, []);

	return {
		// Register controls into a runtime toolbar slot and remember the token
		// so the controls can be removed automatically on unmount.
		addControls: (
			target: ToolbarRuntimeTarget,
			controls: IAppBuilderToolbarControlItem[],
		) => {
			const token =
				useShapeDiverStoreToolbars.getState().addRuntimeToolbarControls(
					target,
					controls,
				);
			if (token) {
				tokensRef.current.push(token);
			}
			return token;
		},
		// Explicit removal for callers that want to clear a runtime contribution
		// before the owner unmounts.
		removeToken: (token: string) => {
			useShapeDiverStoreToolbars.getState().removeRuntimeToolbarToken(token);
			tokensRef.current = tokensRef.current.filter((t) => t !== token);
		},
	};
}
