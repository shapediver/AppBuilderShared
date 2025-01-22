import { useCallback } from "react";
import { useCreateModelState } from "@AppBuilderShared/hooks/shapediver/useCreateModelState";
import { useKeyBinding } from "@AppBuilderShared/hooks/shapediver/useKeyBinding";

interface Props {
	namespace: string
}

/**
 * Hook providing standard key bindings.
 * 
 * @param props 
 * @returns 
 */
export function useKeyBindings(props: Props) {
	
	const { namespace } = props;
	const { createModelState } = useCreateModelState({ namespace });
	
	const callback = useCallback(async () => {
		const modelStateId = await createModelState(
			undefined, // <-- use parameter values of the session
			false, // <-- use parameter values of the session
			true, // <-- includeImage,
			undefined, // <-- custom data
			false, // <-- includeGltf
		);

		// Save the modelStateId as a search parameter
		if (modelStateId) {
			const url = new URL(window.location.href);
			url.searchParams.set("modelStateId", modelStateId);
			history.replaceState(history.state, "", url.toString());
		}
		
	}, [createModelState]);

	useKeyBinding({
		key: "s",
		timeout: 750,
		hits: 3,
		callback
	});

	return {
	};
}
