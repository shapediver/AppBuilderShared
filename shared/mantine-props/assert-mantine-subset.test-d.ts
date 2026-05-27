import type {ButtonProps, GroupProps} from "@mantine/core";
import type {MantineButtonProps} from "./button";
import type {MantineGroupProps} from "./group";
import type {MantinePropsSubset} from "./mantine-props-subset";

type _MantineGroupPropsSubset = MantinePropsSubset<GroupProps, MantineGroupProps>;
type _MantineButtonPropsSubset = MantinePropsSubset<ButtonProps, MantineButtonProps>;

declare const assertGroup: _MantineGroupPropsSubset;
declare const assertButton: _MantineButtonPropsSubset;
void assertGroup;
void assertButton;
