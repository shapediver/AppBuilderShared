# WebMCP live agent QA — all-parameters.json

Weak-model stress tests. Run against `http://localhost:3000/?g=all-parameters.json` via Chrome DevTools MCP (`user-chrome-devtools`).

Goal: exercise **every in-scope generic tool** and **every parameter type this model exposes**.

## Harness

1. Open the URL. Wait until sliders/labels exist (`KnobAngle`, `Material`, `Message`).
2. `mc` = `document.modelContext || navigator.modelContext`. Need `mc` and `crossOriginIsolated === true`.
3. Once: `const tools = await mc.getTools(); const tool = (name) => tools.find((t) => t.name === name);`
4. Call: `const r = await mc.executeTool(tool("<name>"), JSON.stringify(input));`
   - First arg is the **RegisteredTool** from `getTools()`, not a string name.
   - Second arg is a **JSON string**.
   - Chrome 154+: `tool.inputSchema` is an **object**. Older Chrome: string. Normalize with `typeof tool.inputSchema === "string" ? JSON.parse(tool.inputSchema) : tool.inputSchema`.
5. Default toolset (8 names, snake_case): `list_parameter_definitions`, `get_parameter_values`, `set_parameter_values`, `list_action_controls`, `trigger_action_control`, `set_camera_position`, `get_screenshot`, `get_metric`. No `create_model_state` / `import_model_state` / `ask_user_question` tools.

**Schema reject:** invalid input returns JSON (`errors: [{ name: "*", message }]` or `{ success: false, message }` or `{ found: false, message }`) — does **not** throw.

Record per scenario: tool, input, raw result, pass/fail vs expectation.

## Model note (`?g=all-parameters.json`)

Session JSON is ticket-only. Parameters come from the live ShapeDiver model.

| Type | Count | Settable | Use these names (or id if name collides) |
|---|---|---|---|
| StringList | 7 | yes | `Legend`, `Type`, `Material`; **four params named `List`** — must use **id** |
| Float | 3 | yes | `Textsize` (0.5–2), `Slider2Digit`, `Slider1Digit` (0–10) |
| Int | 2 | yes | `KnobAngle` (0–360), `SliderNatural` (0–10) |
| Even | 1 | yes | `SliderEven` (0–10) |
| Odd | 1 | yes | `SliderOdd` (1–9) |
| Color | 2 | yes | `Textcolor`, `Colour` — real Color type `{red,green,blue,alpha}` |
| Bool | 2 | yes | `Show Date`, `Show Time` |
| String | 1 | yes | `Message` (max 100) |
| Time | 2 | **no** | `Calendar`, `Clock` |
| File | 2 | **no** | `ImportImage`, `ImportText` |

**23** parameters listed; **19** settable. `get_parameter_values` `{}` returns 23 values.

**Duplicate name `List` (always use id):**

| id | choices |
|---|---|
| `6ba40159-f0e9-45ec-97ff-9e5fd5d99679` | jpg, png, tiff, bmp, gif |
| `9b586343-cfaf-4482-a35d-580a056eee96` | txt, g, gcode, csv, xml, json, ifc |
| `0a5aa59b-5846-4d2d-89fa-a1b22d873549` | CRLF, LF, CR |
| `5fb9d177-a807-4d0d-891b-6bf177f25ed5` | ASCII, UTF_8 |

`Material` choices: Basic, Plastic, Metal, Glass (0–3). `Type`: Arrow2d, Arrow3d, Sphere. `Legend`: Ticks, Text2d, Tag2d, Tag3d.

**Actions** from `list_action_controls` `{}`: camera views (`Zoom extents`, `Perspective`, `Top`, …), `Undo`, `Redo`, `Reset to default parameters`, `Create model state`, `Import model state`. Save/restore go through these actions, not deleted create/import tools.

**Outputs:** `get_metric` `{}` → `{ found: false }` (no `AgentMetric` output).

StringList values are **0-based integer indices**, never labels, never `{index:N}`.

## Conventions

- Discover with `list_parameter_definitions` `{}` first. Hidden/visibility is agent settings, not tool input.
- Trust **type** over display name (`Colour` is Color; `List` is StringList).
- After mutating params, later scenarios may see new currentValues. Re-list if needed. Prefer ids for `List`.

---

## Scenarios

### A. Discovery

#### 1. discover_all
Task: List every parameter.
Tool: `list_parameter_definitions`, `{}`
Expect: `parameters.length === 23`. Each has `settable`. Types include Color, StringList, Float, Int, Odd, Even, Bool, String, Time, File. No `errors`.

#### 2. discover_settable_split
Task: Which parameters cannot be set?
Expect from list: `Calendar`/`Clock` (Time) and `ImportImage`/`ImportText` (File) have `settable: false`.

#### 3. reject_visibleOnly_alias
Tool: `list_parameter_definitions`, `{"visibleOnly":true}`
Expect: schema reject (`unrecognized_keys`), `parameters: []`.

#### 4. reject_filter_key
Tool: `list_parameter_definitions`, `{"filter":"all"}`
Expect: schema reject, `parameters: []`.

### B. get_parameter_values

#### 5. get_all_values
Tool: `get_parameter_values`, `{}`
Expect: `values.length === 23`, no fatal `errors` (or empty).

#### 6. get_by_name
Tool: `get_parameter_values`, `{"names":["KnobAngle","Material","Message"]}`
Expect: three `values`; types/values match list.

#### 7. get_unknown_partial
Tool: `get_parameter_values`, `{"names":["KnobAngle","Foo"]}`
Expect: KnobAngle in `values`; Foo in `errors` (does not exist). Not an empty `values`.

#### 8. get_reject_extra
Tool: `get_parameter_values`, `{"filter":true}`
Expect: schema reject (`values: []`, `errors` on `*`).

### C. set_parameter_values — valid types

#### 9. set_int
`{"updates":[{"name":"KnobAngle","value":90}]}`
Expect: applied contains KnobAngle id; `errors: []`.

#### 10. set_float
`{"updates":[{"name":"Textsize","value":1.25}]}`
Expect: applied; `errors: []`.

#### 11. set_even
`{"updates":[{"name":"SliderEven","value":6}]}`
Expect: applied; `errors: []`.

#### 12. set_odd
`{"updates":[{"name":"SliderOdd","value":5}]}`
Expect: applied; `errors: []`.

#### 13. set_bool
`{"updates":[{"name":"Show Date","value":false}]}`
Expect: applied; `errors: []`.

#### 14. set_string
`{"updates":[{"name":"Message","value":"WebMCP QA"}]}`
Expect: applied; `errors: []`.

#### 15. set_stringlist_index
`{"updates":[{"name":"Material","value":1}]}`  (Plastic)
Expect: applied; `errors: []`.

#### 16. set_color_object
`{"updates":[{"name":"Colour","value":{"red":255,"green":0,"blue":0,"alpha":255}}]}`
Expect: applied; `errors: []`.

#### 17. set_duplicate_name_by_id
Set image List to png via **id**: `{"updates":[{"name":"6ba40159-f0e9-45ec-97ff-9e5fd5d99679","value":1}]}`
Expect: applied that id; `errors: []`. Must not guess among four `List` params.

### D. set_parameter_values — traps and rejects

#### 18. set_out_of_range_int
`{"updates":[{"name":"KnobAngle","value":999}]}`
Expect: `applied: []`, error (range).

#### 19. set_wrong_type_int
`{"updates":[{"name":"KnobAngle","value":"wide"}]}`
Expect: `applied: []`, error (not valid).

#### 20. set_even_odd_trap
`{"updates":[{"name":"SliderEven","value":3}]}`
Expect: `applied: []`, error (even constraint).

#### 21. set_odd_even_trap
`{"updates":[{"name":"SliderOdd","value":4}]}`
Expect: `applied: []`, error (odd constraint).

#### 22. stringlist_label_trap
`{"updates":[{"name":"Material","value":"Metal"}]}`
Expect: `applied: []`, error. Labels are not values.

#### 23. stringlist_index_object_trap
`{"updates":[{"name":"Material","value":{"index":2}}]}`
Expect: `applied: []`, error.

#### 24. stringlist_out_of_range
`{"updates":[{"name":"Material","value":99}]}`
Expect: `applied: []`, error.

#### 25. color_string_trap
`{"updates":[{"name":"Colour","value":"Red"}]}`
Expect: `applied: []`, error. This Color is **not** a StringList.

#### 26. color_rgb_alias
`{"updates":[{"name":"Textcolor","value":{"r":1,"g":2,"b":3}}]}`
Expect: `applied: []`, error. Keys must be `red,green,blue,alpha`.

#### 27. color_on_int
`{"updates":[{"name":"KnobAngle","value":{"red":1,"green":2,"blue":3,"alpha":4}}]}`
Expect: `applied: []`, error about Color object only for Color params.

#### 28. set_unsettable_file
`{"updates":[{"name":"ImportImage","value":"x"}]}`
Expect: `applied: []`, error (not settable / not valid).

#### 29. set_unsettable_time
`{"updates":[{"name":"Calendar","value":0}]}`
Expect: `applied: []`, error.

#### 30. set_unknown
`{"updates":[{"name":"Foo","value":5}]}`
Expect: `applied: []`, error includes "does not exist".

#### 31. reject_parameters_alias
`{"parameters":[{"id":"KnobAngle","value":10}]}`
Expect: schema reject (`unrecognized_keys`). Not applied.

#### 32. reject_id_in_update
`{"updates":[{"id":"bbe31535-75bd-412e-a3ae-a8e13c40ea90","value":10}]}`
Expect: schema reject (`name` required / unrecognized `id`).

#### 33. partial_batch
`{"updates":[{"name":"SliderNatural","value":3},{"name":"Foo","value":1}]}`
Expect: SliderNatural applied; one error for Foo.

#### 34. duplicate_update
`{"updates":[{"name":"KnobAngle","value":10},{"name":"bbe31535-75bd-412e-a3ae-a8e13c40ea90","value":20}]}`
Expect: applied once (KnobAngle id); error "twice".

#### 35. ambiguous_list_name
`{"updates":[{"name":"List","value":1}]}`
Current handler: **first name match wins** — applied id `6ba40159-…` (image formats), `errors: []`. Other three `List` params unchanged.
Expect: document this. Weak models that treat `List` as unique (text/newline/encoding) will set the **wrong** parameter. Prefer id from scenario 17.

### E. Actions

#### 36. list_actions
Tool: `list_action_controls`, `{}`
Expect: actions include types `camera`, `undo`, `redo`, `resetParameterValues`, `createModelState`, `importModelState`. No `errors` required.

#### 37. list_actions_reject
`{"filter":"all"}`
Expect: schema reject.

#### 38. trigger_camera_action
`list_action_controls` then `trigger_action_control` `{"name":"Zoom extents"}`
Expect: `{success: true}`.

#### 39. trigger_unknown_action
`{"name":"import"}`
Expect: `{success: false}`, action does not exist (use listed names).

#### 40. trigger_create_via_action
`{"name":"Create model state"}`
Expect: `{success: true}` or a clear `success: false` message (not a missing tool). There is **no** `create_model_state` tool.

#### 41. unknown_tool_name
Call `get_params` / `create_model_state` via `getTools().find`.
Expect: tool **undefined**. Do not invent a call.

### F. Camera, screenshot, metric

#### 42. set_camera_ok
`set_camera_position` `{"position":{"x":2,"y":2,"z":2},"target":{"x":0,"y":0,"z":0}}`
Expect: `{success: true}`.

#### 43. set_camera_missing_target
`{"position":{"x":1,"y":1,"z":1}}`
Expect: schema reject / `{success: false}`.

#### 44. set_camera_bad_viewport
`{"position":{"x":1,"y":1,"z":1},"target":{"x":0,"y":0,"z":0},"viewportId":"no-such-viewport"}`
Expect: `{success: false}`, viewport not found.

#### 45. get_screenshot
`get_screenshot` `{}`
Expect: `{success: true, image}` data URL (`data:image/`).

#### 46. get_screenshot_reject
`{"foo":1}`
Expect: schema reject / `{success: false}`.

#### 47. get_metric_missing
`get_metric` `{}`
Expect: `{found: false}` (no `message` required).

#### 48. get_metric_reject
`{"name":"AgentMetric"}`
Expect: `{found: false, message}` schema reject, not a fake metric.

### G. Workflow

#### 49. full_workflow
1. `list_parameter_definitions` `{}`
2. `get_parameter_values` `{"names":["Message"]}`
3. `set_parameter_values` valid Message string
4. `get_parameter_values` `{"names":["Message"]}` shows new value
5. `get_screenshot` `{}`
Expect: each step succeeds.

#### 50. tool_inventory
`getTools()` names sorted equal:
`get_metric`, `get_parameter_values`, `get_screenshot`, `list_action_controls`, `list_parameter_definitions`, `set_camera_position`, `set_parameter_values`, `trigger_action_control`.

## Report format

For each scenario:
- id
- status: pass / fail / partial
- tool + input actually sent
- result snippet
- failure cause: schema reject missed, wrong field, label-vs-index, Color-as-string, duplicate `List` name, camelCase tool, missing action tool, etc.

End with: pass rate, weak-model failure patterns, suggestions.

## Weak-model patterns (watch)

| Pattern | Example | Mitigation |
|---|---|---|
| camelCase tools | `listParameterDefinitions` | `getTools()` snake_case only |
| Wrong keys | `visibleOnly`, `parameters`, `id`, `filter` | `strictObject` |
| `updates` as map | `{"KnobAngle": 90}` | `updates: [{ name, value }]` |
| StringList label | `Material: "Metal"` | integer index |
| Color `{r,g,b}` or `"Red"` | `Colour` | `{red,green,blue,alpha}` |
| Duplicate `List` | set by name | use id |
| File/Time set | ImportImage | `settable: false` |
| Save as tool | `create_model_state` | `list_action_controls` + `trigger_action_control` |
| Metric assumed present | parse `value` | `{found:false}` is success |
