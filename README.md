# JanVaani

> Public services, made easier to understand.

**JanVaani** (ಜನವಾಣಿ, meaning *"people's voice"*) is a planned Kannada-first civic assistant designed to help citizens access and understand Karnataka government-service information through a web chat interface and WhatsApp.

It aims to make public-service information easier to understand by supporting Kannada and English, explaining application processes in simple language, and directing users to trustworthy official sources.

---

## About the Project

Accessing public services often requires navigating fragmented government portals, complex departmental notifications, and administrative jargon. Language barriers further complicate this process for citizens who are most comfortable in their regional language.

JanVaani intends to help citizens find reliable information by bridging these gaps. By offering a conversational assistant grounded in verified official guidance, JanVaani aims to simplify the discovery of public schemes, clarify what documents are required, and guide users directly to official channels.

---

## The Problem

Navigating citizen-facing public services presents several recurring challenges:

- **Difficulty discovering relevant services**: Citizens often struggle to identify which department administers a specific scheme or service and where to find the correct application portal.
- **Confusing application procedures and requirements**: Eligibility criteria, document checklists, and process steps are frequently difficult to parse or scattered across multiple websites and circulars.
- **Language and accessibility barriers**: Key procedural information is often published primarily in administrative English or formats that are cumbersome to read and navigate on mobile devices.

---

## Our Solution

JanVaani proposes a unified civic-assistant system focused on reliability, clarity, and accessibility:

- **Shared Civic-Assistant Backend**: A centralized backend handling message processing, validation, and information retrieval across channels.
- **Web Chat and WhatsApp Interfaces**: Dual-interface access meeting citizens on the web and on messaging platforms they already use every day.
- **Kannada and English Support**: Multilingual communication designed from the start to serve both regional-language and English-speaking users.
- **Source-Grounded Answers**: Responses grounded in verified official information, accompanied by direct source links to government portals.

---

## Planned MVP

The initial Minimum Viable Product (MVP) focuses on core informational query flows:

- Allow users to ask questions about selected Karnataka government services.
- Explain application steps and document requirements when verified information is available.
- Provide official links and handle unknown answers transparently rather than guessing.
- Support both web chat and WhatsApp interfaces with consistent information.

---

## Planned Architecture

> **Note:** This section describes the intended system architecture for future development. These components are not yet implemented.

- **Frontend**: Web chat application built with React, Vite, and TypeScript.
- **Backend**: Service built with Node.js, Express, and TypeScript.
- **Input Validation**: Request payload and message schema validation using Zod.
- **Knowledge & Retrieval**: Curated Karnataka government-service information repository, with retrieval and AI-assisted responses planned.
- **Messaging Integration**: WhatsApp integration via the Meta WhatsApp Cloud API.

```
+-------------------------------------------------------------+
|                        User Channels                        |
|        [ Web Chat (React) ]          [ WhatsApp ]           |
+----------------------+----------------------+---------------+
                       |                      |
                       v                      v
          +---------------------------------------+
          |          Backend API Service          |
          |       (Node.js / Express / TS)        |
          |       - Input Validation (Zod)        |
          |       - Channel Adapters              |
          +-------------------+-------------------+
                              |
                              v
          +---------------------------------------+
          |          Information Engine           |
          |   - Curated Government Service Data   |
          |   - Source Grounding & Retrieval      |
          |   - AI-Assisted Response Generation   |
          +---------------------------------------+
```

---

## Development Roadmap

The planned milestones for the project include:

1. Establish the project documentation and foundation.
2. Build and test the backend.
3. Add shared message validation and the text-processing workflow.
4. Build the web chat interface.
5. Add verified Karnataka government-service information.
6. Integrate source-grounded responses.
7. Integrate WhatsApp via Meta WhatsApp Cloud API.
8. Add Kannada voice-message support as a later milestone.

---

## Responsible Information

Civic tools require rigorous attention to factual accuracy and transparency:

- **Prefer Official Sources**: Guidance and links must be sourced directly from official Karnataka government portals and verified public resources.
- **Do Not Invent Criteria or Deadlines**: The assistant must never fabricate eligibility criteria, procedural steps, fees, or deadlines.
- **Make Uncertainty Clear**: When verified information is unavailable, incomplete, or out of scope, the assistant must state this transparently.
- **Clear Capabilities & Scope**: The project does not claim to submit applications, process payments, or check live application status unless those specific capabilities are officially implemented and verified.

---

## Project Status

JanVaani is at the **initial planning and documentation stage**. The application code, external service integrations, AI retrieval pipelines, and voice processing are not yet implemented.

---

## Contributing

Contributions, feedback, and suggestions are welcome! Whether you are interested in civic technology, documentation, Kannada localization, or full-stack development, your input helps shape the project.

At this stage, we welcome:
- Feedback and suggestions on architecture and service design.
- Documentation reviews and improvements.
- Identification of priority Karnataka government services for initial curation.

As code development begins, detailed contribution guidelines and development workflows will be added. In the meantime, feel free to open an issue to share ideas or get involved.

---

## License

A license has not yet been selected for this project. Licensing details will be determined and added as project development progresses.
