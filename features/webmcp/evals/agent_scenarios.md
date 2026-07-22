# WebMCP live agent QA scenarios — SS-8076

Weak-model stress tests. Run against `http://localhost:3000/?g=SS-8076.json` via Chrome DevTools MCP.

## Harness

1. Navigate to the URL, wait for model + parameters loaded.
2. In the page console, `mc` is the WebMCP client (`document.modelContext` / `navigator.modelContext`).
3. Resolve tools once: `const tools = await mc.getTools(); const tool = (name) => tools.find((t) => t.name === name);`
4. Call tools: `const r = await mc.executeTool(tool("list_parameter_definitions"), JSON.stringify(input));`
   - First arg is the **RegisteredTool** from `getTools()` (not a string name).
   - Second arg MUST be a JSON string.
5. `await mc.getTools()` lists registered tools (4 expected, snake_case names).

**Schema reject:** invalid input returns `{ errors: [{ name: "*", message }] }` or `{ success: false, message }` — does **not** throw.

Record per scenario: tool called, input sent, raw result, pass/fail vs expectation.

## Model note (SS-8076.json)

This JSON exposes **StringList UI widgets only** (ButtonChipGroup, DropDown, Checklist, **Color** trap, …). There is **no** Width / Material / Paint / Enabled — scenarios 4–6, 8–12, 15–16, 25 are **N/A** on this model. Use headless `evals.json` fixtures or another slug for INT/COLOR/BOOL coverage.

## Conventions

- Discover params first with `list_parameter_definitions` `{filter:"all"}` to learn real names/ids/types.
- On SS-8076, **Color** = StringList trap (label vs index). Width/Material/Paint apply only on other models.
- Indices are 0-based integers.

## Scenarios

### 1. discover_all
Task: "List every parameter of this model."
Tool: `list_parameter_definitions`, input `{"filter":"all"}`
Expect: `parameters` array, each has `settable` boolean. No `errors`.

### 2. discover_visible
Task: "List only the visible (non-hidden) parameters."
Tool: `list_parameter_definitions`, input `{"filter":"visible"}`
Expect: `parameters` array; count <= all; no param with `hidden:true`.

### 3. reject_visibleOnly_alias
Task: "List visibleOnly true." (weak-model alias)
Tool: `list_parameter_definitions`, input `{"visibleOnly":true}`
Expect: schema reject (error / `unrecognized_keys`), NOT a silent all-params list.

### 4. set_valid_int
Task: "Set Width to a valid value within range."
Tool: `set_parameter_values`, input `{"updates":[{"name":"<WidthName>","value":7}]}`
Expect: `applied` contains the width id; `errors:[]`.

### 5. set_out_of_range
Task: "Set Width to 999."
Tool: `set_parameter_values`, input `{"updates":[{"name":"<WidthName>","value":999}]}`
Expect: `applied:[]`, one error for Width (not valid / out of range).

### 6. set_wrong_type
Task: "Set Width to the string 'wide'."
Tool: `set_parameter_values`, input `{"updates":[{"name":"<WidthName>","value":"wide"}]}`
Expect: `applied:[]`, error (not valid for parameter).

### 7. set_unknown_param
Task: "Set a parameter named Foo to 5."
Tool: `set_parameter_values`, input `{"updates":[{"name":"Foo","value":5}]}`
Expect: `applied:[]`, error message includes "does not exist".

### 8. reject_parameters_alias
Task: "Set width using the parameters field with id." (weak-model alias)
Tool: `set_parameter_values`, input `{"parameters":[{"id":"<WidthId>","value":7}]}`
Expect: schema reject (`unrecognized_keys`), NOT applied.

### 9. reject_id_in_update
Task: "Set width using id inside the update item." (weak-model alias)
Tool: `set_parameter_values`, input `{"updates":[{"id":"<WidthId>","value":7}]}`
Expect: schema reject.

### 10. stringlist_label_trap
Task: "Set Material to Metal." (label, not index)
Tool: `set_parameter_values`, input `{"updates":[{"name":"<MaterialName>","value":"Metal"}]}`
Expect: `applied:[]`, error (not valid for parameter).

### 11. stringlist_index_correct
Task: "Set Material to choice index 1."
Tool: `set_parameter_values`, input `{"updates":[{"name":"<MaterialName>","value":1}]}`
Expect: `applied` contains material id; `errors:[]`.

### 12. stringlist_out_of_range
Task: "Set Material to index 99."
Tool: `set_parameter_values`, input `{"updates":[{"name":"<MaterialName>","value":99}]}`
Expect: `applied:[]`, error.

### 13. color_named_stringlist_trap
Task: "Set Color to Red." (param named Color but type is StringList)
Tool: `set_parameter_values`, input `{"updates":[{"name":"Color","value":"Red"}]}`
Expect: `applied:[]`, error (not valid for parameter). Weak models must NOT assume "Color" = color type.

### 14. color_named_stringlist_index
Task: "Set Color to index 0."
Tool: `set_parameter_values`, input `{"updates":[{"name":"Color","value":0}]}`
Expect: `applied` contains the color-list id; `errors:[]`.

### 15. color_object_valid
Task: "Set Paint to red." (send decomposed color object)
Tool: `set_parameter_values`, input `{"updates":[{"name":"<PaintName>","value":{"red":255,"green":0,"blue":0,"alpha":255}}]}`
Expect: `applied` contains paint id; `errors:[]`.

### 16. color_object_on_noncolor
Task: "Set Width to a color object."
Tool: `set_parameter_values`, input `{"updates":[{"name":"<WidthName>","value":{"red":1,"green":2,"blue":3,"alpha":4}}]}`
Expect: `applied:[]`, error "Color object value is only valid for Color parameters."

### 17. partial_batch
Task: "Set Width to 7 and Foo to 1 in one call."
Tool: `set_parameter_values`, input `{"updates":[{"name":"<WidthName>","value":7},{"name":"Foo","value":1}]}`
Expect: `applied` contains width id; one error for Foo ("does not exist").

### 18. duplicate_update
Task: "Set Width to 7 and also set the same parameter by id to 8 in one call."
Tool: `set_parameter_values`, input `{"updates":[{"name":"<WidthName>","value":7},{"name":"<WidthId>","value":8}]}`
Expect: `applied` contains width id once; one error ("twice").

### 19. create_model_state
Task: "Create a model state of the current configuration."
Tool: `create_model_state`, input `{}`
Expect: `success:true`, `modelStateId` returned.

### 20. import_model_state_roundtrip
Task: "Import the model state just created."
Tool: `import_model_state`, input `{"modelStateId":"<id from #19>"}`
Expect: `success:true`, `appliedParameterIds` array (possibly empty if no diff).

### 21. import_invalid_id
Task: "Import a non-existent model state id."
Tool: `import_model_state`, input `{"modelStateId":"does-not-exist-xyz"}`
Expect: `success:false` with a message (fetch error).

### 22. import_wrong_type
Task: "Import model state with a numeric id."
Tool: `import_model_state`, input `{"modelStateId":12345}`
Expect: schema reject.

### 23. unknown_tool
Task: "Call a tool named get_params."
Expect: tool not registered / error. Only 4 tools exist.

### 24. full_workflow
Task: "List visible params, set the first settable one to a valid value, create a state, import it back."
Expect: each step succeeds; final import `success:true`.

### 25. bool_toggle
Task: "Set the Enabled boolean to true."
Tool: `set_parameter_values`, input `{"updates":[{"name":"<EnabledName>","value":true}]}`
Expect: `applied` contains enabled id; `errors:[]`.

## Report format

For each scenario return:
- id
- status: pass / fail / partial
- tool + input actually sent
- result snippet (applied / errors / success)
- failure cause (if any): schema reject missed, wrong field, label-vs-index, type confusion, etc.

End with: aggregate pass rate, list of weak-model failure patterns observed, suggestions.

## Weak-model patterns (Haiku 4.5, observed)

| Pattern | Example | Mitigation |
|---------|---------|------------|
| camelCase tool names | `listParameterDefinitions` | `getTools()` — only snake_case registered |
| Wrong input keys | `visibleOnly`, `parameters`, `id`, `visible` | `strictObject` + `unrecognized_keys` in errors |
| `updates` as object | `{"Width": 7}` | Schema requires `updates: [{ name, value }]` |
| StringList label | `Color: "Red"` | Error hints with choices + index range |
| Color shape | `{r,g,b}` | Schema/docs: `{red,green,blue,alpha}` |
| Import key | `id` not `modelStateId` | `strictObject` on import input |
