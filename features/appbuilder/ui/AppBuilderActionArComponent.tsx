import {useAppBuilderActionAr} from "@AppBuilderLib/features/appbuilder/model/useAppBuilderActionAr";
import {Loader, Modal, Text} from "@mantine/core";
import {
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
	const {
		trigger,
		disabled: resolvedDisabled,
		loading,
		opened,
		close,
		arLink,
		arError,
	} = useAppBuilderActionAr({namespace, viewportId, disabled});

	return (
		<>
			<AppBuilderActionBase
				presentation={presentation}
				label={label}
				icon={icon}
				tooltip={tooltip}
				onClick={() => void trigger()}
				loading={loading}
				disabled={resolvedDisabled}
				toolbarButtonProps={toolbarButtonProps}
			/>
			<Modal
				opened={opened}
				onClose={close}
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
