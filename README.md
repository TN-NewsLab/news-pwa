```mermaid

flowchart TD

    subgraph Backend[Python Backend / Agent]
        RSS[RSS Feeds<br>(BBC / Bloomberg / Reuters / VentureBeat / Nikkei Asia)]
        Fetch[RSS Fetcher<br>(Python)]
        Summary[AI Summarizer<br>(OpenAI API)]
        JSON[summary_v2.json<br>Generator]
    end

    subgraph GitHub[GitHub Repository]
        Store[(summary_v2.json)]
    end

    subgraph Frontend[PWA Frontend]
        App[News PWA App]
        SW[Service Worker]
        UI[UI Components<br>(List / Detail / Filter)]
    end

    RSS --> Fetch --> Summary --> JSON --> Store
    Store --> App
    App --> SW
    App --> UI
    SW --> App
```

