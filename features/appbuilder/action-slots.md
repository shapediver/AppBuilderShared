# Action slots

`actionSlots` runs one App Builder action when an event happens. Multiple actions can be run via one `executeActions` action. We separate into action slots on nodes (every component that can be specified is a node) and the root.

## Nodes

Here you can see a table of all slots that are allowed on App Builder nodes. Widgets, tabs, containers, controls, and toolbar items are all nodes. Type: `IAppBuilderNodeActionSlots`.

| Slot                | When it runs                                                                                                                                               | Optional `eventProps` |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| `click`             | Left click on the node.                                                                                                                                    | None                  |
| `contextmenu`       | Right click on the node. The browser menu is suppressed.                                                                                                   | None                  |
| `pointerdown`       | Pointer pressed on the node.                                                                                                                               | None                  |
| `pointerup`         | Pointer released on the node.                                                                                                                              | None                  |
| `pointerenter`      | Pointer enters the node.                                                                                                                                   | None                  |
| `pointerleave`      | Pointer leaves the node.                                                                                                                                   | None                  |
| `custom:kebab-case` | The host calls `useDispatchAppBuilderCustomEvent` with that name, for example `custom:item-selected`. A miss bubbles to the parent node, then to the root. | None                  |

### Parameter controls

A control of `type: "parameter"` may also use the three computation slots of the root. They sit on the control, next to `type` and `props`, not inside `props.overrides`. The control's `name` and `sessionId` identify the parameter, so these slots have **no `eventProps`**, and the action stays static JSON (the event is not passed into `action.props`). Type: `IAppBuilderParameterControlActionSlots`.

| Slot               | When it runs                                                                                                                                                                                        |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `computationstart` | A customization that includes this parameter starts.                                                                                                                                                |
| `computationend`   | The last process manager of that customization is gone, so the scene from it exists, including instances it registered.                                                                             |
| `computationerror` | That customization failed. A customization that a newer one superseded is not an error. Its parameters are part of the newer customization, which then runs `computationend` or `computationerror`. |

```json
{
	"type": "parameter",
	"actionSlots": {
		"computationend": {
			"action": {
				"type": "setContainerVisibility",
				"props": {
					"container": {
						"name": "anchor2d",
						"props": {"id": "Artwork"}
					},
					"mode": "close"
				}
			}
		}
	},
	"props": {"name": "elements_select", "sessionId": "default_appbuilder"}
}
```

- **Which computation.** The slot runs only when the customization changes the control's parameter, that is, when its value differs from the value of its last computation. A customization of another parameter of the same session does not run it. One customization that changes several parameters runs the slots of each of them. Several controls for the same parameter each run.
- **Accept and reject.** With `acceptRejectMode`, the slots run when the accepted change is computed, not when it is queued. A rejected change computes nothing and runs nothing.
- **Root slots stay.** A root `computationend` still runs for every customization of its session, including one that also runs a parameter control's slot.
- **Only parameter controls.** Export, output, and action controls do not gain these events, and Zod rejects them there. Toolbar items do not either. Custom parameters (`sessionId` of the App Builder itself) are not computed by a session, so their slots never run.
- **Validation.** Zod rejects `eventProps` on these slots, and rejects `actionSlots` inside `props.overrides`.
- **Timing.** A customization that opens a process manager runs `computationstart` when that manager is created, before `TASK_START`, and `computationend` when the last process manager of that customization is gone. That is after `TASK_END`. Further managers of the same session that appear while it is open, such as the instance rebuild, belong to it. A customization that never opens a process manager, including the default-export path, still runs on the task events. `computationerror` stays on the failed `TASK_CANCEL`. See [Session customization](computation-flow.md#action-slots) for a `selection` action in `computationend`.

## Root

Here you can see all action slots that are allowed on the App Builder definition root. Type: `IAppBuilderRootActionSlots`.

The flows behind these events: [App Builder load](appready-flow.md) for `appready`, [Session customization](computation-flow.md) for the computation slots, and [Export request](export-flow.md) for the export slots.

_Note: Pointer and click slots here attach to the viewport host, because the viewport is not its own JSON node. In the future, we might support viewport nodes, if we support multiple viewports. I don't see any backwards compatibility issues if that is the case._

| Slot                | When it runs                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | Optional `eventProps`                                                                                                                                                                                                                                                            |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `click`             | Left click on the viewport.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | None                                                                                                                                                                                                                                                                             |
| `contextmenu`       | Right click on the viewport. The browser menu is suppressed.                                                                                                                                                                                                                                                                                                                                                                                                                                                              | None                                                                                                                                                                                                                                                                             |
| `pointerdown`       | Pointer pressed on the viewport.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | None                                                                                                                                                                                                                                                                             |
| `pointerup`         | Pointer released on the viewport.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | None                                                                                                                                                                                                                                                                             |
| `pointerenter`      | Pointer enters the viewport.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | None                                                                                                                                                                                                                                                                             |
| `pointerleave`      | Pointer leaves the viewport.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | None                                                                                                                                                                                                                                                                             |
| `appready`          | This happens once per controller session. It waits until the host has registered viewport access functions and the viewport is ready. ShapeDiver is ready when the viewport exists and the scene bounding box has settled: geometry is present, or the viewer reports an empty box because there is none. Another host can replace that wait with its own `waitUntilReady` (ijewel case). A host with no viewport skips the wait, and the slot runs as soon as the listeners are up.                                      | None                                                                                                                                                                                                                                                                             |
| `computationstart`  | A customization that opens a process manager runs this when that manager is created, before the viewer `TASK_START`. One that does not, including the default-export path, runs on `TASK_START` for `SESSION_CUSTOMIZATION`. A newer customize that replaces one in flight starts its own task.                                                                                                                                                                                                                           | [`session`](#session). Omit `sessionId` for the controller session.                                                                                                                                                                                                              |
| `computationend`    | When the last process manager of that customization is gone, after `TASK_END`, once the scene from it exists. Instances it registered are in the scene, so a `selection` action can select one. A customization that never opened a process manager runs on `TASK_END`. A cancelled or failed customize does not run this slot.                                                                                                                                                                                           | [`session`](#session). Omit `sessionId` for the controller session.                                                                                                                                                                                                              |
| `computationerror`  | When that customization is cancelled with status `Session customization failed` (viewer event `TASK_CANCEL`). If a newer customize replaces one that is still running, the viewer cancels the older one with a different status. That older one runs neither this slot nor `computationend` as we see this as expected behavior. The newer one still runs `computationstart`, then `computationend` or `computationerror` when it finishes.                                                                               | [`session`](#session). Omit `sessionId` for the controller session.                                                                                                                                                                                                              |
| `exportstart`       | Each time an export request starts (viewer event `TASK_START` for `EXPORT_REQUEST`). The viewer emits that task from `export.request`. The export UI calls it, and so does a download export used as a parameter value source. A value source that is not a download export never calls `request`, so it does not run this slot. The batch call `session.requestExports`, used while customizing, is a different method and does not emit this task. The task carries `sessionId`, `exportId`, `name`, and `displayname`. | [`export`](#export). `name` matches id, name, or display name, case-insensitively. Omit `name` for every export of that session. Omit `sessionId` for the controller session.                                                                                                    |
| `exportend`         | When that export request finishes (viewer event `TASK_END`). A cancelled export does not run this slot.                                                                                                                                                                                                                                                                                                                                                                                                                   | [`export`](#export). `name` matches id, name, or display name, case-insensitively. Omit `name` for every export of that session. Omit `sessionId` for the controller session.                                                                                                    |
| `exporterror`       | When that export request is cancelled (viewer event `TASK_CANCEL` for `EXPORT_REQUEST`). Any cancel runs this slot. A finished export runs `exportend` instead.                                                                                                                                                                                                                                                                                                                                                           | [`export`](#export). `name` matches id, name, or display name, case-insensitively. Omit `name` for every export of that session. Omit `sessionId` for the controller session.                                                                                                    |
| `selecton`          | A scene node is selected. Replaces an anchor's `selectionProperties`.                                                                                                                                                                                                                                                                                                                                                                                                                                                     | [`selection`](#selection). Omitted or empty `nameFilter` is `["*"]`. Omitted `viewportId` is the default viewport. `minimumSelection` defaults to 0, `maximumSelection` to 1, `hover` to true. `deselectOnEmpty` is always true. A color set to `null` turns that highlight off. |
| `selectoff`         | A scene node is deselected. Skipped while a reselection is in progress. Multi-select off uses this slot too. Replaces an anchor's `selectionProperties`.                                                                                                                                                                                                                                                                                                                                                                  | [`selection`](#selection). Omitted or empty `nameFilter` is `["*"]`. Omitted `viewportId` is the default viewport. `minimumSelection` defaults to 0, `maximumSelection` to 1, `hover` to true. `deselectOnEmpty` is always true. A color set to `null` turns that highlight off. |
| `hoveron`           | The pointer hovers a scene node.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | [`selection`](#selection). Omitted or empty `nameFilter` is `["*"]`. Omitted `viewportId` is the default viewport. `minimumSelection` defaults to 0, `maximumSelection` to 1, `hover` to true. `deselectOnEmpty` is always true. A color set to `null` turns that highlight off. |
| `hoveroff`          | The pointer leaves a scene node.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | [`selection`](#selection). Omitted or empty `nameFilter` is `["*"]`. Omitted `viewportId` is the default viewport. `minimumSelection` defaults to 0, `maximumSelection` to 1, `hover` to true. `deselectOnEmpty` is always true. A color set to `null` turns that highlight off. |
| `custom:kebab-case` | The host calls `useDispatchAppBuilderCustomEvent` and no node along the way handled that name.                                                                                                                                                                                                                                                                                                                                                                                                                            | None                                                                                                                                                                                                                                                                             |

These are the three objects, from `IAppBuilderActionSlotEventProps` in `config/appbuilderActionSlots.ts`.

### session

```ts
{
	type: "session";
	props: {
		/** Session to listen to. Defaults to the controller session. */
		sessionId?: string;
	};
}
```

### export

```ts
{
	type: "export";
	props: {
		/** Session to listen to. Defaults to the controller session. */
		sessionId?: string;
		/** Export id, name, or displayname. All exports of the session when omitted. */
		name?: string;
	};
}
```

### selection

```ts
{
	type: "selection";
	props: {
		nameFilter?: string[];
		viewportId?: string;
		minimumSelection?: number;
		maximumSelection?: number;
		hover?: boolean;
		hoverColor?: string | object | null;
		selectionColor?: string | object | null;
		availableColor?: string | object | null;
		occludeBySceneGeometry?: boolean;
	};
}
```

`deselectOnEmpty` is not a field. The listener always sets it to `true`.

## Multiple slots

One event name is either a single slot object, or an array of them. Use the array when each entry should listen to a different source. Each entry has its own `eventProps`.

Example: Let's say on the root, we want to define multiple slots for selection. When I select object A, X should happen and when I click object B, Y should happen. In this case we have a selection slot with two objects. That means both objects are selectable with different actions to be defined for each of them

```json
"selecton": [
	{
		"eventProps": {
			"type": "selection",
			"props": { "nameFilter": ["A"] }
		},
		"action": { "type": "..." }
	},
	{
		"eventProps": {
			"type": "selection",
			"props": { "nameFilter": ["B"] }
		},
		"action": { "type": "..." }
	}
]
```
