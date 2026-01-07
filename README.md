```mermaid
flowchart TD

    subgraph Backend[Python Backend / Agent]
        RSS[RSS Feeds "(BBC, Bloomberg, VB, NHK)"]
        Fetch[RSS Fetcher (Python)]
        Summary[AI Summarizer (OpenAI API)]
        JSON[Generate summary_v2.json]
    end

    subgraph GitHub[GitHub Repository]
        Store[(summary_v2.json)]
    end

    subgraph Frontend[PWA Frontend]
        App[News PWA App]
        SW[Service Worker]
        UI[UI Components]
    end

    RSS --> Fetch --> Summary --> JSON --> Store
    Store --> App
    App --> SW
    App --> UI
    SW --> App
```

