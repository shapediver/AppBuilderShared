# Session customization

This is one customize of one session. The task type is `session_customization`. `data.sessionId` is that session. A customize whose parameter values did not change returns the current node and emits no task events.

Gray boxes are processes on the viewer. Amber nodes are backend calls made from that process. Green nodes are where a path ends.

```mermaid
flowchart TD
  request[A customize is requested] --> values[Parameter values are written on that session]
  values --> path{How is it sent?}

  subgraph customize [session.customize]
    start["task.start: Customizing session. Category customize"]
    start --> upload["task.process: Uploading file parameters"]
    upload --> send["task.process: Sending customization request"]
    send --> run[The backend customize runs]:::backend
  end

  subgraph viaExports [customize_via_exports]
    via["task.start: Customizing session. Category customize_via_exports"]
    via --> up2["task.process: Uploading file parameters"]
    up2 --> send2["task.process: Sending customization request"]
    send2 --> run2[The backend customize runs]:::backend
  end

  path -->|session.customize| start
  path -->|default exports, requestExports with outputs| via
  path -->|instance| instances[TODO]:::final
  path -->|secondary session| secondary[TODO]:::final

  subgraph afterResponse [After the response]
    wait["Output loading reports task.process"]
    wait --> replaced{Was this customize replaced or the session closed?}
    replaced -->|newer customize| drop["task.cancel: The request was exceeded by another customization request. No task.end and no session.customized. The newer customize has its own task.start"]:::final
    replaced -->|session closed| closed["task.cancel: The session was closed during the request"]:::final
    replaced -->|no| scene["task.process: Updating scene"]
    scene --> updated[output.updated for each output whose version changed]
    updated --> end["session.customized, then task.end: Session customized"]
    end --> draw["The viewport updates. scene.boundingBoxChange if the box changed"]:::final
    wait --> failed[The request throws]
    failed --> err["task.cancel: Session customization failed"]:::final
  end

  run --> wait
  run2 --> wait

  style customize fill:#334155,stroke:#cbd5e1,color:#f8fafc
  style viaExports fill:#334155,stroke:#cbd5e1,color:#f8fafc
  style afterResponse fill:#334155,stroke:#cbd5e1,color:#f8fafc
  classDef backend fill:#b45309,stroke:#fcd34d,color:#fffbeb
  classDef final fill:#047857,stroke:#6ee7b7,color:#ecfdf5
```

`customize_via_exports` uses the same `session_customization` events. It does not emit `export_request`.

A parameter value source is resolved before these events. A download export source runs an export request first, then this customize uses the uploaded value.
