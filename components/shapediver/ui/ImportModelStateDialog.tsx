import ModalBase from "@AppBuilderShared/components/ui/ModalBase";
import {exceptionWrapperAsync} from "@AppBuilderShared/utils/exceptionWrapper";
import {Stack, TextInput} from "@mantine/core";
import React, {useState} from "react";
import Hint from "~/shared/components/ui/Hint";

interface Props {
	/**
	 * Whether the modal is opened
	 */
	opened: boolean;
	/**
	 * Callback when the modal should be closed
	 */
	onClose: () => void;
	/**
	 * Callback when a model state should be imported
	 */
	onImport: (modelStateId: string) => Promise<void>;
}

export default function ImportModelStateDialog({
	opened,
	onClose,
	onImport,
}: Props) {
	const [modelStateId, setModelStateId] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleImport = async () => {
		if (!modelStateId.trim()) {
			setError("Please enter a model state ID or URL");
			return;
		}

		setIsLoading(true);
		setError(null);

		const response = await exceptionWrapperAsync(
			() => onImport(modelStateId.trim()),
			() => setIsLoading(false),
		);

		if (response.error) {
			setError("Failed to import model state");
			console.error("Import error:", response.error);
			return;
		}

		handleClose();
	};

	const handleClose = () => {
		setModelStateId("");
		setError(null);
		setIsLoading(false);
		onClose();
	};

	const handleKeyPress = (event: React.KeyboardEvent) => {
		if (event.key === "Enter") {
			handleImport();
		}
	};

	return (
		<ModalBase
			opened={opened}
			onClose={handleClose}
			onConfirm={handleImport}
			title="Load a model state"
			isLoading={isLoading}
			cancelBtnTitle="Cancel"
			confirmBtnTitle="Load"
			isConfirmBtnDisabled={!modelStateId.trim()}
		>
			<Stack gap="md">
				<TextInput
					label="Copy the state id or URL:"
					placeholder="Enter model state ID or URL"
					value={modelStateId}
					onChange={(event) =>
						setModelStateId(event.currentTarget.value)
					}
					onKeyUp={handleKeyPress}
					error={error}
					disabled={isLoading}
					data-autofocus
				/>

				<Hint
					title="Learn how to create model states"
					docLink="https://help.shapediver.com/doc/model-states"
				/>
			</Stack>
		</ModalBase>
	);
}
