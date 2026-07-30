import {createModelStateTool} from "./createModelState";
import {importModelStateTool} from "./importModelState";
import {listParameterDefinitionsTool} from "./listParameterDefinitions";
import {listSessionsTool} from "./listSessions";
import {setParameterValuesTool} from "./setParameterValues";
import type {AnyToolDef} from "./toolDefinition";

export const ALL_TOOLS: readonly AnyToolDef[] = [
	listSessionsTool,
	listParameterDefinitionsTool,
	setParameterValuesTool,
	createModelStateTool,
	importModelStateTool,
];
