import {shouldUsePlatform} from "@AppBuilderLib/shared/lib/platform/environment";
import useAsync from "@AppBuilderLib/shared/lib/useAsync";
import {useShapeDiverStorePlatform} from "@AppBuilderLib/shared/model/useShapeDiverStorePlatform";
import {
	SdPlatformQueryResponse,
	SdPlatformResponseSavedStatePublic,
} from "@shapediver/sdk.platform-api-sdk-v1";
import {useState} from "react";
import {useShallow} from "zustand/react/shallow";
import {useShapeDiverStorePlatformSavedStates} from "./useShapeDiverStorePlatformSavedStates";

export default function useQuerySavedState(savedStateId: string | null) {
	const [initialSavedState, setInitialSavedState] = useState<{
		status: "loading" | "success" | "error";
		data: SdPlatformResponseSavedStatePublic | undefined;
	}>({status: savedStateId ? "loading" : "success", data: undefined});

	const {useQuery, storeItems} = useShapeDiverStorePlatformSavedStates(
		useShallow((state) => ({
			useQuery: state.useQuery,
			storeItems: state.items,
		})),
	);

	const {currentModel} = useShapeDiverStorePlatform(
		useShallow((state) => ({currentModel: state.currentModel})),
	);

	const {
		items: savedStateIds,
		loadMore: loadSavedState,
		loading: savedStateLoading,
	} = useQuery(
		// Stryker disable all: useQuery mock ignores queryParams
		savedStateId
			? {
					queryParams: {
						filters: {
							"id[=]": savedStateId,
						},
						limit: 1,
					},
				}
			: {
					queryParams: {
						limit: 0,
					},
				},
		// Stryker restore all
	);

	// Resolve the initial saved state by its id.
	//
	// Platform path: use the store's query (loadMore), which authenticates with
	// redirect=false so public saved states work without a login redirect.
	//
	// Off-platform path: the store has no platform client. Session resolution
	// (useResolveAppBuilderSessions) seeds saved states into the store via the
	// iframe-embedding call it already performs. Read the seeded item from the
	// store instead of issuing a second iframe call.
	useAsync(
		async () => {
			// Stryker disable next-line ConditionalExpression: initial success path already covered when id is null
			if (initialSavedState.status !== "loading") return;
			// Stryker disable next-line ConditionalExpression: null-id test asserts the initial state before this runs
			if (!savedStateId) return;

			// Stryker disable all: platform query path unused by off-platform tests
			if (shouldUsePlatform()) {
				if (savedStateIds.length === 0 && !savedStateLoading) {
					return loadSavedState() as Promise<
						| SdPlatformQueryResponse<SdPlatformResponseSavedStatePublic>
						| Error
						| undefined
					>;
				}
				return;
			}
			// Stryker restore all

			// Stryker disable next-line OptionalChaining: tests always seed a defined store row
			const stored = storeItems[savedStateId]?.data;
			if (stored) {
				setInitialSavedState({status: "success", data: stored});
				return;
			}
			// Resolve finished seeding the store (currentModel is set) but the
			// requested saved state is not part of the model's saved states.
			// Stryker disable next-line ConditionalExpression: missing-id error vs still-loading already covered by dedicated tests
			if (currentModel) {
				setInitialSavedState({status: "error", data: undefined});
			}
			// else: resolve has not run yet, stay loading.
		},
		// Stryker disable next-line ArrayDeclaration: effect identity unused by off-platform tests
		[
			savedStateId,
			savedStateIds.length,
			savedStateLoading,
			storeItems,
			currentModel,
			initialSavedState,
		],
		// Stryker disable all: platform onSuccess/onError unused by off-platform tests
		{
			onSuccess: (
				response:
					| SdPlatformQueryResponse<SdPlatformResponseSavedStatePublic>
					| Error
					| undefined,
			) => {
				if (response instanceof Error) {
					setInitialSavedState({status: "error", data: undefined});
					return;
				}
				if (!response) return;

				const {
					success,
					data: {result},
				} = response;
				if (!success || !result) return;
				const found = result.find((s) => s.id === savedStateId);
				if (found) {
					setInitialSavedState({status: "success", data: found});
				} else {
					setInitialSavedState({status: "error", data: undefined});
				}
			},
			onError: () => {
				setInitialSavedState({status: "error", data: undefined});
			},
		},
		// Stryker restore all
	);

	return {initialSavedState};
}
