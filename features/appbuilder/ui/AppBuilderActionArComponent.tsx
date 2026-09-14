import {useHasPendingParameterChanges} from "@AppBuilderLib/entities/parameter/model/useHasPendingParameterChanges";
import {useShapeDiverStoreViewport} from "@AppBuilderLib/entities/viewport/model/useShapeDiverStoreViewport";
import {useViewportId} from "@AppBuilderLib/entities/viewport/model/useViewportId";
import {createActionClickHandler} from "@AppBuilderLib/features/appbuilder/lib/createActionClickHandler";
import {runAppBuilderActionAr} from "@AppBuilderLib/features/appbuilder/model/runAppBuilderActionAr";
import {Logger} from "@AppBuilderLib/shared/lib/logger";
import {Loader, Modal, Text} from "@mantine/core";
import {useState} from "react";
import {
	AppBuilderActionType,
	IAppBuilderActionPropsAr,
	IAppBuilderActionPropsCommon,
} from "../config/appbuilder";
import AppBuilderActionBase, {
	AppBuilderActionRenderProps,
} from "./AppBuilderActionBase";

type Props = IAppBuilderActionPropsAr &
	IAppBuilderActionPropsCommon &
	AppBuilderActionRenderProps & {
		namespace: string;
		viewportId?: string;
	};

export default function AppBuilderActionArComponent(props: Props) {
	const {
		label = "View in AR",
		icon = "tabler:augmented-reality",
		tooltip,
		namespace,
		presentation,
		viewportId,
		toolbarButtonProps,
		disabled,
	} = props;
	const [loading, setLoading] = useState(false);
	const [opened, setOpened] = useState(false);
	const [arLink, setArLink] = useState("");
	const [arError, setArError] = useState("");
	const {viewportId: defaultViewportId} = useViewportId();
	const actionViewportId = viewportId ?? defaultViewportId;
	const hasPendingChanges = useHasPendingParameterChanges(namespace);
	const viewportApi = useShapeDiverStoreViewport(
		(state) => state.viewports[actionViewportId],
	);
	const resolvedDisabled = disabled || hasPendingChanges || !viewportApi;
	const onClick = createActionClickHandler(
		async () => {
			if (!viewportApi) return;
			setArError("");
			try {
				if (viewportApi.viewableInAR()) {
					await runAppBuilderActionAr(
						{type: AppBuilderActionType.Ar, props: {}},
						{namespace, viewportId: actionViewportId},
					);
				} else {
					setArLink(await viewportApi.createArSessionLink());
					setOpened(true);
				}
			} catch (e) {
				setArError("Error while creating QR code");
				Logger.error(e);
				setOpened(true);
			}
		},
		{disabled: resolvedDisabled, setLoading},
	);

	return (
		<>
			<AppBuilderActionBase
				presentation={presentation}
				label={label}
				icon={icon}
				tooltip={tooltip}
				onClick={onClick}
				loading={loading}
				disabled={resolvedDisabled}
				toolbarButtonProps={toolbarButtonProps}
			/>
			<Modal
				opened={opened}
				onClose={() => setOpened(false)}
				title="Scan the code"
				centered
			>
				{arError ? (
					<Text c="red">{arError}</Text>
				) : (
					<>
						<Text>
							Scan the QR code below using your mobile device to
							see the model in AR. The code is compatible with
							Android and iOS devices.
						</Text>
						{loading ? (
							<Loader />
						) : (
							<img
								alt="Augment reality"
								height="180px"
								src={arLink}
							/>
						)}
					</>
				)}
			</Modal>
		</>
	);
}
