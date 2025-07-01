import {useShapeDiverStoreProcessManager} from "@AppBuilderShared/store/useShapeDiverStoreProcessManager";
import {useShapeDiverStoreSession} from "@AppBuilderShared/store/useShapeDiverStoreSession";
import {
	addListener,
	EVENTTYPE_SESSION,
	IEvent,
	ISessionEvent,
	removeListener,
} from "@shapediver/viewer.session";
import {useEffect, useState} from "react";
import {useShallow} from "zustand/react/shallow";

/**
 * Hook for loading SDTF data for all ShapeDiver sessions.
 *
 * This hook ensures that the SDTF data is loaded for all sessions
 * and provides a flag to indicate when the data is fully loaded.
 */
export function useSdTFData() {
	const sessions = useShapeDiverStoreSession(
		useShallow((state) => state.sessions),
	);
	const {addProcess, createProcessManager} =
		useShapeDiverStoreProcessManager();
	const [sdTFDataLoaded, setSdTFDataLoaded] = useState(false);

	useEffect(() => {
		const promises: Promise<void>[] = [];

		for (const sessionApi of Object.values(sessions)) {
			if (sessionApi.loadSdtf) {
				promises.push(Promise.resolve());
			} else {
				// the data is not loaded yet, so we need to wait for it
				// we create a process manager for the session
				const processManagerId = createProcessManager(sessionApi.id);

				// we get the resolve function for the process
				// and create a promise that will be resolved when the SDTF data is loaded
				let resolveProcess: () => void;
				const processPromise = new Promise<void>((resolve) => {
					resolveProcess = resolve;
				});
				promises.push(processPromise);

				// we add the process to the process manager
				addProcess(processManagerId, {
					name: "Initial loading of SDTF data",
					promise: processPromise,
				});

				// we add a listener for the SDTF data loaded event
				// and resolve the process when the event is fired
				const token = addListener(
					EVENTTYPE_SESSION.SESSION_SDTF_DELAYED_LOADED,
					(e: IEvent) => {
						const sessionEvent = e as ISessionEvent;
						if (sessionEvent.sessionId === sessionApi.id) {
							resolveProcess();
							removeListener(token);
						}
					},
				);

				// we set the loadSdtf flag to true to indicate that we want to load the SDTF data
				// this will trigger the loading of the SDTF data
				sessionApi.loadSdtf = true;
			}
		}

		// wait for all promises to be resolved
		Promise.all(promises).then(() => {
			setSdTFDataLoaded(true);
		});
	}, [sessions]);

	return {
		sdTFDataLoaded,
	};
}
