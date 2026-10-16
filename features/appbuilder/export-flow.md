# Export request

`export.request` is the call that emits `export_request`. `session.requestExports` does not. When that batch call also loads outputs, it is a session customization instead, in [Session customization](action-slots-computation.md).

The task data is `sessionId`, `exportId`, `name`, and `displayname`. Gray boxes are processes on the viewer. Amber nodes are backend calls made from that process. Green nodes are where a path ends.

## From an export control

```mermaid
flowchart TD
  click[User runs an export control] --> which{Which session?}
  which -->|controller| fill[Missing parameter values are filled from the session. File parameters with no value are uploaded]
  which -->|instance| instances[TODO]:::final
  which -->|secondary session| secondary[TODO]:::final

  subgraph exportRequest [export_request]
    start["task.start export_request: Requesting export"]
    start --> http[The export request is sent]:::backend
    http --> ok{Result}
    ok -->|resolves| endNode["task.end: Returning export"]
    ok -->|throws| cancel["task.cancel: Export request failed"]:::final
  end

  fill --> start
  endNode --> ui[The UI downloads the file or shows the response message]:::final

  style exportRequest fill:#334155,stroke:#cbd5e1,color:#f8fafc
  classDef backend fill:#b45309,stroke:#fcd34d,color:#fffbeb
  classDef final fill:#047857,stroke:#6ee7b7,color:#ecfdf5
```

## From a parameter value source

```mermaid
flowchart TD
  user[User edits a parameter, or an action sets one] --> which{Which session?}
  which -->|controller| accept{The control is waiting for Accept?}
  which -->|instance| instances[TODO]:::final
  which -->|secondary session| secondary[TODO]:::final
  accept -->|yes| held[The value stays pending until Accept]
  accept -->|no| kind
  held --> kind{What is the source?}
  kind -->|not a download export| skip[export.request is not called. No export_request events]

  subgraph exportRequest [export_request]
    start["task.start export_request: Requesting export"]
    start --> http[The export request is sent]:::backend
    http --> ok{Result}
    ok -->|resolves| endNode["task.end: Returning export"]
    ok -->|throws| cancel["task.cancel: Export request failed"]
  end

  kind -->|download export| start
  endNode --> upload[The file is fetched and uploaded. That id is the parameter value]
  cancel --> empty[The source resolves empty]
  upload --> customize[The session customize starts. Its events are the customization sequence]:::final
  skip --> customize
  empty --> customize

  style exportRequest fill:#334155,stroke:#cbd5e1,color:#f8fafc
  classDef backend fill:#b45309,stroke:#fcd34d,color:#fffbeb
  classDef final fill:#047857,stroke:#6ee7b7,color:#ecfdf5
```
