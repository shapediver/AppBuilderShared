import Icon from "@AppBuilderShared/components/ui/Icon";
import {useParameterChanges} from "@AppBuilderShared/hooks/shapediver/parameters/useParameterChanges";
import {
	isParamDefinition,
	useSortedParametersAndExports,
} from "@AppBuilderShared/hooks/shapediver/parameters/useSortedParametersAndExports";
import {PropsParameter} from "@AppBuilderShared/types/components/shapediver/propsParameter";
import {IconTypeEnum} from "@AppBuilderShared/types/shapediver/icons";
import {Button, Group, Text} from "@mantine/core";
import React from "react";

interface Props {
	parameters?: PropsParameter[];
}

export default function AcceptRejectButtons({parameters}: Props) {
	// check if there are parameter changes to be confirmed
	const parameterChanges = useParameterChanges(parameters ?? []);

	// check if there is at least one parameter for which changes can be accepted or rejected
	const sortedParamsAndExports = useSortedParametersAndExports(parameters);
	const showButtons = sortedParamsAndExports.some(
		(p) => isParamDefinition(p) && p.parameter.acceptRejectMode,
	);

	// disable the accept and reject buttons if there are no changes or
	// if there are changes that are currently being executed
	const disableChangeControls =
		parameterChanges.length === 0 ||
		parameterChanges.some((c) => c.executing);
	const acceptChanges = async () => {
		for (let index = 0; index < parameterChanges.length; index++) {
			await parameterChanges[index].accept();
		}
	};
	const rejectChanges = () => {
		parameterChanges.forEach((c) => c.reject());
	};

	return !showButtons ? (
		<></>
	) : (
		<>
			<Group
				key="acceptOrReject"
				justify="space-between"
				w="100%"
				wrap="nowrap"
			>
				<Button
					fullWidth={true}
					leftSection={<Icon type={IconTypeEnum.Check} />}
					onClick={acceptChanges}
					disabled={disableChangeControls}
					variant="light"
				>
					<Text size="md">Accept</Text>
				</Button>
				<Button
					fullWidth={true}
					leftSection={<Icon type={IconTypeEnum.X} />}
					onClick={rejectChanges}
					disabled={disableChangeControls}
					variant="light"
				>
					<Text size="md">Reject</Text>
				</Button>
			</Group>
		</>
	);
}
