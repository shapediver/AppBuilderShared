import {useViewportId} from "@AppBuilderShared/hooks/shapediver/viewer/useViewportId";
import {useShapeDiverStoreProcessManager} from "@AppBuilderShared/store/useShapeDiverStoreProcessManager";
import {useShapeDiverStoreViewport} from "@AppBuilderShared/store/useShapeDiverStoreViewport";
import {useShapeDiverStoreViewportAccessFunctions} from "@AppBuilderShared/store/useShapeDiverStoreViewportAccessFunctions";
import {ViewportCreateDto} from "@AppBuilderShared/types/shapediver/viewport";
import {PROCESS_STATUS} from "@AppBuilderShared/types/store/shapediverStoreProcessManager";
import {FLAG_TYPE} from "@shapediver/viewer.session";
import {useEffect, useRef, useState} from "react";
import {useShallow} from "zustand/react/shallow";

/**
 * Hook for creating a viewport of the ShapeDiver 3D Viewer.
 * Typically, you want to directly use the {@link ViewportComponent} instead
 * of calling this hook yourself.
 * @see {@link useShapeDiverStoreViewport} to access the API of the viewport.
 * @param props
 * @returns
 */
export function useViewport(props: ViewportCreateDto) {
	const {createViewport, closeViewport} = useShapeDiverStoreViewport(
		useShallow((state) => ({
			createViewport: state.createViewport,
			closeViewport: state.closeViewport,
		})),
	);
	const {addViewportAccessFunctions, removeViewportAccessFunctions} =
		useShapeDiverStoreViewportAccessFunctions();
	const {processManagers} = useShapeDiverStoreProcessManager(
		useShallow((state) => ({
			processManagers: state.processManagers,
		})),
	);

	const [error, setError] = useState<Error | undefined>(undefined);
	const promiseChain = useRef(Promise.resolve());
	const canvasRef = useRef(null);
	const {viewportId: defaultViewportId} = useViewportId();
	const _props = {...props, id: props.id ?? defaultViewportId};

	useEffect(() => {
		processManagersRef.current = processManagers;
	}, [processManagers]);
	const processManagersRef = useRef(processManagers);

	useEffect(() => {
		promiseChain.current = promiseChain.current.then(async () => {
			let flags: {[key: string]: FLAG_TYPE} | undefined = undefined;
			if (processManagersRef.current) {
				flags = {};
				for (const processManager of Object.values(
					processManagersRef.current,
				)) {
					if (
						processManager.status === PROCESS_STATUS.CREATED ||
						processManager.status === PROCESS_STATUS.RUNNING
					) {
						processManager.addFlag(_props.id, (flag: FLAG_TYPE) => {
							const token = Math.random()
								.toString(36)
								.substring(2, 15);
							flags![token] = flag;
							return token;
						});
					}
				}
			}

			const viewportApi = await createViewport(
				{
					canvas: canvasRef.current!,
					..._props,
					flags,
				},
				{onError: setError},
			);
			if (viewportApi && props.showStatistics)
				viewportApi.showStatistics = true;

			if (viewportApi)
				addViewportAccessFunctions(_props.id, {
					convertToGlTF: async () => {
						return viewportApi.convertToGlTF(undefined, true);
					},
					getScreenshot: async () => {
						const screenshot = viewportApi.getScreenshot();
						// sometimes the screenshot is not ready immediately (even though it should be)
						await new Promise((resolve) => setTimeout(resolve, 0));

						return screenshot;
					},
					addFlag: (flag: FLAG_TYPE) => {
						return viewportApi.addFlag(flag);
					},
					removeFlag: (token: string) =>
						viewportApi.removeFlag(token),
				});
		});

		return () => {
			promiseChain.current = promiseChain.current
				.then(() => closeViewport(_props.id))
				.then(() => removeViewportAccessFunctions(_props.id));
		};
	}, [props.id]);

	return {
		canvasRef,
		error,
	};
}
