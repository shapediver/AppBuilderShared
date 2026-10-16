# Sessions and instances

The controller is the first session from the theme, the settings, or the URL. A control that omits `sessionId` uses it.

The App output can add two further kinds of model:

|                      | Session (`sessions`)                                       | Instance (`instances`)                                                                |
| -------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| What it is           | A full model, with its own parameters, exports, and scene. | Placed results of a model, drawn in the controller scene.                             |
| Use it when          | The user edits that model, reads its outputs, or exports.  | Several copies, each with its own values and position. The user edits the controller. |
| Parameters in the UI | Yes. A control sets `sessionId`.                           | Hidden. Values are set on the instance.                                               |
| Visible states       | One. A change replaces the current result.                 | Many. Each distinct parameter set stays on screen.                                    |
| Scene                | Its own session node.                                      | Cloned under the controller, one node per instance `name`.                            |

An id listed in both arrays belongs to the instances. The `sessions` entry is skipped.

Settings sessions use `id`, not `sessionId`. Entries after the first, without `instance: true`, are full sessions as well. `instance: true` only hides that settings session. Placements come from the App output `instances` array.

## `sessionId`, `slug`, and `name`

| Property    | What it answers                                                                                            |
| ----------- | ---------------------------------------------------------------------------------------------------------- |
| `slug`      | Which platform model to open. Optional. When omitted, `sessionId` is the slug.                             |
| `sessionId` | Which session controls, exports, outputs, and action slots refer to. Required. One running session per id. |
| `name`      | Which copy. Instances only. The scene node, and the key in output-action data. Optional.                   |

Both have `sessionId` and `slug`.

A session adds `initialParameterValues`. Each value is a string. The key is the parameter id, name, or display name. The strings are applied once, when that session opens.

An instance adds `parameterValues` (a string, number, boolean, or a value source), plus `name`, `transformations`, and `outputActions`.

Several instances share one session by repeating `sessionId`. Put the same `slug` on each of them, or omit `slug` on all of them. A second session id on a slug that is already used never opens, and no instance is placed until every session id in the list has loaded.

A repeated id in `sessions` is skipped. A repeated instance `name` is warned, and the later instance replaces the earlier one. When `name` is omitted the node is `instances[0]` for the first array entry, `instances[1]` for the second, and so on, even when a neighbor has a name.

### A session the user edits

`Length` is applied as the string `"180"` when `table` opens. The control edits that session afterwards.

```json
{
	"version": "1.0",
	"sessions": [
		{
			"sessionId": "table",
			"slug": "oak-table",
			"initialParameterValues": {"Length": "180"}
		}
	],
	"containers": [
		{
			"name": "right",
			"widgets": [
				{
					"type": "controls",
					"props": {
						"controls": [
							{
								"type": "parameter",
								"props": {
									"name": "Length",
									"sessionId": "table"
								}
							}
						]
					}
				}
			]
		}
	]
}
```

### Three chairs in the controller scene

Oak is the model default, so opening `chair` already computes oak. `left` and `center` share that result. `right` is one further computation. The matrices place copies at x = -1 and x = 1. `center` has no matrix, so it sits at the origin.

```json
{
	"version": "1.0",
	"instances": [
		{
			"sessionId": "chair",
			"slug": "dining-chair",
			"name": "left",
			"parameterValues": {"Color": "oak"},
			"transformations": [
				[1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, -1, 0, 0, 1]
			]
		},
		{
			"sessionId": "chair",
			"slug": "dining-chair",
			"name": "center",
			"parameterValues": {"Color": "oak"}
		},
		{
			"sessionId": "chair",
			"slug": "dining-chair",
			"name": "right",
			"parameterValues": {"Color": "black"},
			"transformations": [
				[1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 1]
			]
		}
	],
	"containers": []
}
```

A color slider stays on the controller. Grasshopper writes the chosen color into each chair's `parameterValues`. Chairs that still share a color still share one result.

## Performance

A session opens with its `initialParameterValues`, downloads its outputs, and registers its parameters. That is one computation, and one state on screen. The next edit customizes that same session and replaces the geometry.

An instance session opens on the model defaults. Its parameters stay hidden, and its own outputs are kept out of the viewer.

- A parameter set equal to those defaults reuses the open. The geometry is downloaded once.
- Each other distinct set calls `customizeParallel`. The session's current values stay as they are, so several sets can be visible together.
- A repeated set is a clone. Each entry in `transformations` is another clone. Neither sends a request. The matrix is 16 numbers, column-major, the same layout as gl-matrix. One unit on X is `[1,0,0,0, 0,1,0,0, 0,0,1,0, 1,0,0,1]`.

Ten chairs that stay oak do not recompute when one more chair is black. If the instance values are not the defaults, the first paint waits for the open and then for `customizeParallel`. The same values in a session's `initialParameterValues` are a single computation.

## Credits

A slug is opened with an embedding ticket, so [browser mode](https://help.shapediver.com/doc/credits) applies. A settings session that brings its own backend ticket is general mode, where each output request costs 1 credit.

| Event                                                                      | Credits                                                              |
| -------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Opening a session, and each further 10-minute chunk of activity            | 1                                                                    |
| Another output request in the current chunk, including `customizeParallel` | 0                                                                    |
| Computation under 10 seconds                                               | 0                                                                    |
| Computation of 10 seconds or more                                          | 1 per complete 10-second chunk (13 s → 1, 22 s → 2, 44 s → 4)        |
| The next request after that chunk has ended                                | 1 for the new chunk                                                  |
| An export request                                                          | 1, plus the computation row when the export takes 10 seconds or more |
| Downloading a result that was already returned                             | 0                                                                    |

An idle tab does not start a new chunk. The next request does.

Each `sessionId` costs one session credit, shared by every instance of that id. A clone and a matrix send no request. Export controls exist on sessions, because a session registers its exports.

The three chairs above, with every computation under 10 seconds and the tab closed within 10 minutes, cost 1 credit: opening `chair`. The oak download, the black customization, and the third chair reusing oak add 0. The same scene as three sessions would cost 3 credits to open.

## Parameters and data

A parameter, export, or output control names an id, a name, or a display name on a session whose parameters and exports are registered. Set `sessionId`, or omit it for the controller. The `table` example above is that control.

Instance values live in `parameterValues`. The usual update is a new App output from the controller: Grasshopper writes new literals, and only parameter sets that changed are computed.

`dataOutput` copies an output of a registered session into a String or File parameter. Omit `sessionId` on the source to read the controller. A String parameter receives the text `{"content":[...]}`, and the array is that output's content. A File parameter receives the same JSON as a file.

```json
"parameterValues": {
	"Label": {"type": "dataOutput", "props": {"name": "Chair label"}}
}
```

`outputActions` writes an instance output into a controller parameter. The action type is `setParameterValue`. `output` may be an id, a name, or a display name. `parameter` must be the controller parameter's name or id. Only the first transformation is read; the others are clones of that result.

```json
"outputActions": [
	{
		"type": "setParameterValue",
		"props": {"output": "Price", "parameter": "ChairPrices"}
	}
]
```

`ChairPrices` receives one object. The first key is the instance `name`, or `instances[i]` for an omitted name, where `i` is that entry's index in the `instances` array. The second key is the `output` string you wrote. The value is that output's content array. Chairs that write the same parameter are merged:

```json
{"left": {"Price": []}, "right": {"Price": []}}
```
