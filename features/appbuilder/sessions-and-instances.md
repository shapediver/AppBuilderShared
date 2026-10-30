# Sessions and instances

An App Builder app always has one main model, the **controller**. It is the first session from the theme, the settings, or the URL. Every component uses the controller unless it sets a `sessionId`.

The App output (the JSON that the controller's Grasshopper definition returns) can load more models in two ways:

- **Sessions** (`sessions`): additional models the user works with directly.
- **Instances** (`instances`): copies of a model's result, shown inside the controller's scene.

|                      | Session (`sessions`)                                             | Instance (`instances`)                                                  |
| -------------------- | ---------------------------------------------------------------- | ----------------------------------------------------------------------- |
| What it is           | A complete model with its own parameters, exports, and scene.    | The result of a model, copied and positioned in the controller's scene. |
| Use it when          | The user edits the model, reads its outputs, or exports from it. | You need several copies, each with its own values and position.         |
| Parameters in the UI | Yes. A control picks the session with `sessionId`.               | No. The values come from the instance definition.                       |
| Results on screen    | One. Each change replaces the current result.                    | Many. Each different set of values stays visible.                       |
| Scene                | Its own session node.                                            | A node under the controller, one per instance `name`.                   |

If the same id is in both arrays, the instance wins and the `sessions` entry is ignored.

## Which one to use

Ask what the user does with the extra model:

1. **The user wants to change parameters or download exports.** Use a session.
2. **Several variants are visible at the same time.** Use instances.
3. **A single copy, positioned or repeated with a matrix, driven by the controller.** Use an instance.
4. **The user edits one model and sees copies of another.** Use a session for the edited model and instances for the copies. The same id cannot be both.

### Sessions

| Pros                                                                           | Cons                                                        |
| ------------------------------------------------------------------------------ | ----------------------------------------------------------- |
| Parameter, export, and output controls work by setting `sessionId`.            | Only one result on screen. Each edit replaces the geometry. |
| Exports are available, so export controls and export action slots work.        | Each session costs its own credit to open.                  |
| `initialParameterValues` is applied when the session opens: one request.       | Each session adds controls and state to the app.            |
| Other parameters and instances can read its current outputs with `dataOutput`. |                                                             |

Sessions cannot be positioned or repeated with `transformations` yet. This is planned in SS-10247.

### Instances

| Pros                                                                                                | Cons                                                                         |
| --------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Many variants are visible at once.                                                                  | No parameter UI and no exports.                                              |
| All instances with the same `sessionId` share one session credit.                                   | To change values, the controller must recompute and return a new App output. |
| Identical value sets are computed once. Copies and matrices are free.                               |                                                                              |
| `transformations` positions and repeats copies without Grasshopper.                                 |                                                                              |
| Each instance's results flow back to the controller with `outputActions`, keyed by instance `name`. |                                                                              |

Both lists load as a group. The App Builder waits for every session in `sessions` before it registers their controls, and for every instance session before it places any instance. One slow model delays the others. This could in the future be resolved by a new setting.

## `sessionId`, `slug`, and `name`

Sessions and instances both have `sessionId` and `slug`.

| Property    | Meaning                                                                                                                     |
| ----------- | --------------------------------------------------------------------------------------------------------------------------- |
| `slug`      | The platform model to open. Optional. If omitted, `sessionId` is used as the slug.                                          |
| `sessionId` | The id that controls, exports, outputs, and action slots use to refer to the session. Required. One running session per id. |
| `name`      | Instances only. Identifies one copy: the name of its scene node and its key in `outputActions` data. Optional.              |

A session can also have `initialParameterValues`. The keys are parameter ids, names, or display names, and the values are strings. They are applied once, when the session opens.

An instance can also have `parameterValues` (a string, number, boolean, or value source), `name`, `transformations`, and `outputActions`.

Rules:

- **Sharing a session:** Several instances share one session by using the same `sessionId`. Give them all the same `slug`, or leave `slug` out on all of them. If they disagree, the first slug is used and a warning is logged. Different session ids may use the same slug. Each id opens its own session and costs its own credit.
- **Loading:** Each list loads as a group, as for `sessions`. No instance is shown until every instance session has loaded, so one slow model delays all instances.
- **Duplicates:** A repeated id in `sessions` logs a warning, and the later entry is skipped. The same happens for a `sessions` id that is already open, such as the controller's, or that an instance uses. A repeated instance `name` logs a warning, and the later instance is skipped. The first instance with that name is kept.
- **Default names:** An instance without `name` is called `instances[0]`, `instances[1]`, and so on, by its position in the array. Named neighbors do not change this numbering.
- **Scene structure:** Each instance node has one child per transformation: `transformations[0]`, `transformations[1]`, and so on. Each child holds a copy of the result. An instance without `transformations` gets one `transformations[0]` child with no offset. For example, the `left` chair in the scene below is the path `left` → `transformations[0]`, not a single node called `left_transformations_0`.

Two scenes side by side. On the left, the App output adds three sessions: `table`, `chair`, and `carpet`. On the right, it adds four chair instances: `left` with two matrices, `right` with one, and two instances without a name and without a matrix.

```text
Sessions (sessions)                  Instances (instances)

controller                           controller
└── <outputs>                        ├── <outputs>                  the controller's own outputs
                                     ├── left                       instances[0], named
table                                │   ├── transformations[0]     x = -1
└── <outputs>                        │   │   └── <outputs>          copy of the oak result
                                     │   └── transformations[1]     x = -2
chair                                │       └── <outputs>          copy of the oak result
└── <outputs>                        ├── right                      instances[1], named
                                     │   └── transformations[0]     x = 1
carpet                               │       └── <outputs>          copy of the black result
└── <outputs>                        ├── instances[2]               no name, no matrix
                                     │   └── transformations[0]     identity, at the origin
one root node per sessionId,         │       └── <outputs>          copy of the oak result
each with one result                 └── instances[3]               no name, no matrix
                                         └── transformations[0]     identity, at the origin
                                             └── <outputs>          copy of the black result
```

Each session is its own root node, named by its `sessionId`, next to the controller. An edit replaces the outputs under that node. Instances are children of the controller's node, and their session's own node shows nothing, because its outputs are never loaded into it. An instance without `name` is named by its position in the `instances` array. Each matrix adds one `transformations[i]` child with another copy. The oak and black results are each computed once and copied everywhere else.

## Performance

**A session** opens with its `initialParameterValues`, downloads its outputs, and shows its parameters. That is one computation and one result on screen. Each later edit recomputes the same session and replaces the geometry.

**An instance session** opens with the model's default values. Its parameters are hidden, and its own result is not shown directly. Only the instances are.

- **Values equal to the defaults** reuse the result from opening. Nothing is computed again.
- **Each other set of values** is computed once with `customizeParallel`. This does not change the session's own values, so several results can be visible at once.
- **A repeated set of values** is a copy of an existing result, and so is each entry in `transformations`. Neither sends a request to the server.

A transformation is a 4×4 matrix written as 16 numbers in column-major order, the same layout as gl-matrix. A shift of one unit along X is `[1,0,0,0, 0,1,0,0, 0,0,1,0, 1,0,0,1]`.

So ten oak chairs do not recompute when an eleventh chair is black. The tradeoff: if an instance's values are not the defaults, its first result waits for the session to open and then for the computation. A session with the same values in `initialParameterValues` needs only one computation.

Possible improvement: when a session id has only one instance, its `parameterValues` could be passed as `initialParameterValues` when the session opens. The open would then compute that instance directly, and the second computation would be skipped. This is not implemented yet.
