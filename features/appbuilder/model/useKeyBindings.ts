import {useParameterImportExport} from "@AppBuilderLib/entities/parameter/model/useParameterImportExport";
import {ECommerceApiSingleton} from "@AppBuilderLib/features/ecommerce/api/singleton";
import {useCreateModelState} from "@AppBuilderLib/features/model-state/model/useCreateModelState";
import {useImportModelState} from "@AppBuilderLib/features/model-state/model/useImportModelState";
import {useNotificationStore} from "@AppBuilderLib/features/notifications/model/useNotificationStore";
import {INotificationModelStateCreatedProps} from "@AppBuilderLib/features/notifications/ui/NotificationModelStateCreated";
import {useKeyBinding} from "@AppBuilderLib/shared/lib/useKeyBinding";
import {useCallback, useEffect} from "react";

declare global {
	interface Window {
		/**
		 * Import parameter values from a JSON file (opens a file picker).
		 */
		importParameterValues: () => Promise<void>;
		/**
		 * Export current parameter values to a JSON file (triggers a download).
		 */
		exportParameterValues: () => Promise<void>;
		/**
		 * Create a model state (equivalent to pressing "s" three times).
		 * Resolves with the model state ID, or undefined on failure.
		 */
		createModelState: () => Promise<string | undefined>;
		/**
		 * Import a model state by ID or by a URL containing the model state ID query parameter.
		 * Resolves with true on success, false on failure.
		 */
		importModelState: (modelStateId: string) => Promise<boolean>;
	}
}

interface Props {
	namespace: string;
	getNotification: (
		props: INotificationModelStateCreatedProps,
	) => React.ReactNode;
}

/**
 * Hook providing standard key bindings and browser-console API.
 *
 * @param props
 * @returns
 */
export function useKeyBindings(props: Props) {
	const {namespace, getNotification} = props;
	const {createModelState} = useCreateModelState({namespace});
	const {importModelState} = useImportModelState(namespace);
	const {exportParameters, importParameters} =
		useParameterImportExport(namespace);
	const notifications = useNotificationStore();

	const callback = useCallback(async () => {
		const {modelStateId, screenshot} = await createModelState({
			parameterNamesToInclude: undefined, // <-- parameterNamesToInclude: use default according to the theme
			parameterNamesToExclude: undefined, // <-- parameterNamesToExclude: use default according to the theme
			includeImage: true, // <-- includeImage,
			image: undefined, // <-- image
			data: undefined, // <-- custom data
			includeGltf: false, // <-- includeGltf
		});

		// Save the modelStateId as a search parameter
		if (modelStateId) {
			// in case we are not running inside an iframe, the instance of
			// IEcommerceApi is a dummy implementation
			const api = await ECommerceApiSingleton;
			const {href} = await api.updateSharingLink({
				modelStateId,
				updateUrl: true,
				imageUrl: screenshot,
			});
			notifications.success({
				message: getNotification({
					modelStateId,
					link: href.toString(),
				}),
			});
		}
	}, [createModelState]);

	useKeyBinding({
		key: "s",
		timeout: 750,
		hits: 3,
		callback,
	});

	// Expose functions on window for console access
	useEffect(() => {
		window.importParameterValues = importParameters;
		window.exportParameterValues = exportParameters;
		window.createModelState = async () => {
			const {modelStateId} = await createModelState(
				undefined,
				undefined,
				true,
				undefined,
				undefined,
				false,
			);
			return modelStateId;
		};
		window.importModelState = importModelState;

		return () => {
			delete (window as Partial<Window>).importParameterValues;
			delete (window as Partial<Window>).exportParameterValues;
			delete (window as Partial<Window>).createModelState;
			delete (window as Partial<Window>).importModelState;
		};
	}, [
		importParameters,
		exportParameters,
		createModelState,
		importModelState,
	]);

	return {};
}
