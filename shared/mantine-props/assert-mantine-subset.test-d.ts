import type {GroupProps} from "@mantine/core";
import type {MantineGroupProps} from "./group";
import type {MantinePropsSubset} from "./mantine-props-subset";

type _MantineGroupPropsSubset = MantinePropsSubset<GroupProps, MantineGroupProps>;

declare const assertGroup: _MantineGroupPropsSubset;
void assertGroup;
