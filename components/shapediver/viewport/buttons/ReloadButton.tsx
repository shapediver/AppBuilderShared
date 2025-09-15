import React from "react";
import {useParameterImportExport} from "~/shared/hooks/shapediver/parameters/useParameterImportExport";
import {CommonButtonProps} from "./types";
import ViewportIconButton from "./ViewportIconButton";

interface ReloadButtonProps extends CommonButtonProps {
	disabled: boolean;
	namespace: string;
	hasPendingChanges: boolean;
	executing: boolean;
}

export default function ReloadButton({
	disabled,
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
