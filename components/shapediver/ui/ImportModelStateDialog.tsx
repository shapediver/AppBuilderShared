import ModalBase from "@AppBuilderShared/components/ui/ModalBase";
import {useImportModelState} from "@AppBuilderShared/hooks/shapediver/useImportModelState";
import {QUERYPARAM_MODELSTATEID} from "@AppBuilderShared/types/shapediver/queryparams";
import {Stack, TextInput} from "@mantine/core";
import React, {useCallback, useState} from "react";
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
	/** Namespace of session to use */
	namespace: string;
}

export default function ImportModelStateDialog({
	opened,
	onClose,
	namespace,
}: Props) {
	const [modelStateId, setModelStateId] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const {importModelState, isLoading: isLoadingModelState} =
		useImportModelState(namespace);

	const handleImport = useCallback(async (modelStateId: string) => {
		setError(null);
		setIsLoading(true);
		const result = await importModelState(modelStateId);
		setIsLoading(false);
		if (!result) {
			setError("Failed to import model state");
			return;
		}
		handleClose();
	}, []);

	const handleClose = () => {
		setModelStateId("");
		setError(null);
		setIsLoading(false);
		onClose();
	};

	const handleKeyPress = (event: React.KeyboardEvent) => {
		if (event.key === "Enter") {
			handleImport(modelStateId);
		}
	};

	return (
		<ModalBase
			opened={opened}
			onClose={handleClose}
			onConfirm={() => handleImport(modelStateId)}
			title="Import a model state"
			isLoading={isLoading || isLoadingModelState}
			cancelBtnTitle="Cancel"
			confirmBtnTitle="Load"
			isConfirmBtnDisabled={!modelStateId.trim()}
		>
			<Stack gap="md">
				<TextInput
					label={`Paste a model state ID or a URL containing a '${QUERYPARAM_MODELSTATEID}' parameter:`}
					placeholder="Model state ID or URL"
					value={modelStateId}
					onChange={(event) =>
						setModelStateId(event.currentTarget.value)
					}
					onKeyUp={handleKeyPress}
					error={error}
					disabled={isLoading || isLoadingModelState}
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
