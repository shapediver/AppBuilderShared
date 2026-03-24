import {useParameterImportExport} from "@AppBuilderLib/entities/parameter";
import React from "react";
import {CommonButtonProps} from "../config";
import ViewportIconButton from "./ViewportIconButton";

interface ReloadButtonProps extends CommonButtonProps {
	disabled?: boolean;
	namespace: string;
	hasPendingChanges: boolean;
	executing: boolean;
}

export default function ReloadButton({
	disabled = false,
	namespace,
	hasPendingChanges,
	executing,
}: ReloadButtonProps) {
	const {resetParameters} = useParameterImportExport(namespace);
	const isDisabled = disabled || executing || hasPendingChanges;

	return (
		<ViewportIconButton
			iconType="tabler:reload"
			label="Reset to default parameters"
			onClick={resetParameters}
			disabled={isDisabled}
		/>
	);
}
