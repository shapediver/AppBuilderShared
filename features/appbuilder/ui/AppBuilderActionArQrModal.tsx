import {useAppBuilderActionArQrStore} from "@AppBuilderLib/features/appbuilder/model/useAppBuilderActionArQrStore";
import {Modal, Text} from "@mantine/core";

/** Always-mounted QR modal used by the host-registered AR `run`. */
export default function AppBuilderActionArQrModal() {
	const opened = useAppBuilderActionArQrStore((state) => state.opened);
	const arLink = useAppBuilderActionArQrStore((state) => state.arLink);
	const error = useAppBuilderActionArQrStore((state) => state.error);
	const close = useAppBuilderActionArQrStore((state) => state.close);

	return (
		<Modal opened={opened} onClose={close} title="Scan the code" centered>
			{error ? (
				<Text c="red">{error}</Text>
			) : (
				<>
					<Text>
						Scan the QR code below using your mobile device to see
						the model in AR. The code is compatible with Android and
						iOS devices.
					</Text>
					{arLink ? (
						<img
							alt="Augment reality"
							height="180px"
							src={arLink}
						/>
					) : null}
				</>
			)}
		</Modal>
	);
}
