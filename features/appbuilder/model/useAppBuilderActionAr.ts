import {useHasPendingParameterChanges} from "@AppBuilderLib/entities/parameter/model/useHasPendingParameterChanges";
import {useShapeDiverStoreViewport} from "@AppBuilderLib/entities/viewport/model/useShapeDiverStoreViewport";
import {useViewportId} from "@AppBuilderLib/entities/viewport/model/useViewportId";
import {Logger} from "@AppBuilderLib/shared/lib/logger";
import {FLAG_TYPE} from "@shapediver/viewer.session";
import {useCallback, useState} from "react";

export interface UseAppBuilderActionArProps {
	namespace: string;
	viewportId?: string;
	disabled?: boolean;
}

/** Logic for the "ar" action. Can be used without the action component. */
export function useAppBuilderActionAr(props: UseAppBuilderActionArProps) {
	const {namespace, viewportId, disabled} = props;
	const [loading, setLoading] = useState(false);
	const [opened, setOpened] = useState(false);
	const [arLink, setArLink] = useState("");
	const [arError, setArError] = useState("");
	const {viewportId: defaultViewportId} = useViewportId();
	const actionViewportId = viewportId ?? defaultViewportId;
	const hasPendingChanges = useHasPendingParameterChanges(namespace);
	const resolvedDisabled = disabled || hasPendingChanges;
	const {viewportApi} = useShapeDiverStoreViewport((state) => ({
		viewportApi: state.viewports[actionViewportId],
	}));

	const trigger = useCallback(async () => {
		if (resolvedDisabled || !viewportApi) return;
		setLoading(true);
		setArError("");
		try {
			if (viewportApi.viewableInAR()) {
				const token = viewportApi.addFlag(FLAG_TYPE.BUSY_MODE);
				try {
					await viewportApi.viewInAR();
				} finally {
					viewportApi.removeFlag(token);
				}
			} else {
				setArLink(await viewportApi.createArSessionLink());
				setOpened(true);
			}
		} catch (e) {
			setArError("Error while creating QR code");
			Logger.error(e);
			setOpened(true);
		} finally {
			setLoading(false);
		}
	}, [resolvedDisabled, viewportApi]);

	const close = useCallback(() => {
		setOpened(false);
	}, []);

	return {
		trigger,
		disabled: resolvedDisabled || !viewportApi,
		loading,
		opened,
		close,
		arLink,
		arError,
	};
}
