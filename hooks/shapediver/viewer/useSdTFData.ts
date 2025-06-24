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

export function useSdTFData() {
	const sessions = useShapeDiverStoreSession(
		useShallow((state) => state.sessions),
	);

	const [sdTFDataLoaded, setSdTFDataLoaded] = useState(false);

	useEffect(() => {
		const loadedPerSession: Record<string, boolean> = {};

		for (const sessionApi of Object.values(sessions)) {
			if (sessionApi.loadSdtf) {
				loadedPerSession[sessionApi.id] = true;
				return;
			} else {
				loadedPerSession[sessionApi.id] = false;
				sessionApi.loadSdtf = true;
				const token = addListener(
					EVENTTYPE_SESSION.SESSION_SDTF_DELAYED_LOADED,
					(e: IEvent) => {
						const sessionEvent = e as ISessionEvent;
						if (sessionEvent.sessionId === sessionApi.id) {
							loadedPerSession[sessionApi.id] = true;

							if (
								Object.values(loadedPerSession).every(
									(loaded) => loaded,
								)
							) {
								setSdTFDataLoaded(true);
							}

							removeListener(token);
						}
					},
				);
			}
		}

		if (Object.values(loadedPerSession).every((loaded) => loaded)) {
			setSdTFDataLoaded(true);
		}
	}, [sessions]);

	return {
		sdTFDataLoaded,
	};
}
