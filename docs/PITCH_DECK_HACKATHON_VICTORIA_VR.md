# WorldPilot: hackathon pitch and video guide

Author: Bruno DELB · brunodelb@gmail.com

Repository: https://github.com/lelab-ai/world-pilot

Research paper: https://zenodo.org/records/24059294

Companion to `WorldPilot_VictoriaVR_Hackathon_Product_Research_EN.pptx` (10 slides, including one appendix). Updated 10 November 2026.

## Narrative and speaker script

### 1. WorldPilot

“I'm Bruno DELB. WorldPilot is a browser prototype for creating interactive 3D worlds through natural language, then keeping their connected interactions working as the world changes. I developed this project for the Victoria VR hackathon and studied edit-order sensitivity in a research paper.”

### 2. A creator's problem

“Imagine a trainer building a car-maintenance workshop. A follow-up request moves a workbench in front of the engine bay. The objects still exist, but the application now detects a spatial conflict. This is the kind of problem a creator needs to understand and repair.”

### 3. Creation from a request

“This request sets up the workshop and a two-step task: inspect the battery, then install it. This captured scenario uses deterministic local rules and a built-in workshop. The scene and its executable task are available together.”

### 4. Repair and completion

“The local repair moves the workbench. I then use the application's interaction controls to inspect and install the battery. The quest reaches 100 percent completion. This demonstrates the event and quest flow after repair.”

### 5. The actual role of AI

“Supported commands use local rules. Other requests can go to a configured Gemini or DeepSeek model. Structured edits update the world, selected checks detect conflicts, and interactions execute in the browser. The captured workshop does not demonstrate open-ended LLM generation.”

### 6. Research paper and EO-Bench

“A related problem is the order of edits. EO-Bench compares A then B against B then A. For example, replace a plasma torch with a laser head, then set the laser's power. Reversing these instructions tries to configure a target that does not exist yet. The paper studies 200 synthetic cases.”

Full title: **Edit Order Sensitivity in Language-Driven Executable 3D Worlds: A Benchmark for Cross-Layer Semantic-State Divergence**.

### 7. Central research result

“Matching final states is not enough. Fixed hash ordering matches states in every case but satisfies both edits in only 67.5 percent. The C5 pipeline reaches 100 percent equivalence and 99.5 percent joint satisfaction in this study. These are results for one implementation and its internal evaluators.”

### 8. Contributions and scope

“WorldPilot brings together scene commands, connected quest state, local repair and a reproducible research question. The demonstrated scenarios cover workshop creation, repair and completion, plus a replacement variation. Reduced creator effort is a benefit to measure through user testing.”

### 9. Contact and access

“The repository contains the prototype and a hands-on guide. The research paper is available on Zenodo. You can contact me at brunodelb@gmail.com.”

### 10. Appendix, for questions

Use this slide for detailed results and limitations, rather than reading it during the short pitch.

| Paper condition | State equivalence | Joint instruction satisfaction |
| --- | --- | --- |
| C0, sequential | 86/200 (43.0%) | 129/200 (64.5%) |
| Hash canonicalization | 200/200 (100%) | 135/200 (67.5%) |
| C4, dependency lookahead | 184/200 (92.0%) | 199/200 (99.5%) |
| C5, invariant-guided local repair | 200/200 (100%) | 199/200 (99.5%) |

C5 reduces detected invariant-violation cases from 16 to 0. One satisfaction failure remains. Do not describe it as an intentional safety refusal without evidence for that interpretation.

## Video plan: approximately 2 minutes 40 seconds

The author confirmed that no video exists yet. This is a recording plan, not a video link. Rehearse the timing before recording.

| Time | Screen | Spoken focus |
| --- | --- | --- |
| 0:00–0:15 | Cover, then browser | Project, author and creator problem |
| 0:15–0:40 | Submit `Show how to change a car battery` | Supported local scenario creates a scene with a task |
| 0:40–1:00 | Submit `Move the workbench right in front of the engine compartment` | Show the visible conflict indicator |
| 1:00–1:30 | Submit `Fix the spatial conflict without cancelling my intent`, then use `Launch action` and `Drop on target` | Show the repair and the actual completed quest |
| 1:30–1:45 | Architecture slide | Distinguish local rules from configured LLM interpretation |
| 1:45–2:20 | Research example and results | Explain EO-Bench, then equivalence versus satisfaction |
| 2:20–2:40 | Contact slide | Repository, paper and closing |

Prefer a continuous recording of the core browser sequence. Do not replace the interaction with a completion screenshot and imply that a live action was shown. If a waiting period is cut, label the edit. Keep the optional generator variation for questions or a longer demonstration.

## Reproduction and evidence boundaries

- Local capture date: 10 November 2026. Served the existing `dist` build dated 8 November 2026. This is not a fresh rebuild or validation of every current source change.
- The captured request selects a built-in workshop through local rules. No live Gemini or DeepSeek request was exercised.
- Quest completion used visible application controls. `Launch action` dispatches an interaction event. `Drop on target` moves the object to its target and dispatches a drop event. This validates the selected quest flow, not physical walking, manual dragging, headset interaction or collision-free navigation.
- A second run replaced the battery with a generator and completed the quest. The quest text still mentioned the battery. Do not claim full semantic consistency or zero orphaned references from that observation.
- The conflict and repair scene images come from an earlier capture of the same supported scenario. The request, initial scene and completed-quest HUD come from the new run. The deck is not a recording of one uninterrupted session.
- Visible scene labels were translated into English for the captures. Geometry, diagnostics and completion state were not edited. Some original application strings remain untranslated outside the crops. Before filming, verify the entire visible recording area is in English.
- The benchmark example WP2-EO-002 was checked in archived raw results. It is not a newly recorded live benchmark. In those records, C0 satisfies AB but fails BA, while C5 satisfies both.
- Research figures reproduce the author's supplied paper abstract. The suite has 200 synthetic cases, 74 initial worlds and 68 unique edit pairs. Internal evaluators, repeated textual motifs and oracle coupling limit generalization.
- Neither observed UI badges nor a visual screenshot establishes an independently measured latency, physical clearance or frame rate. No claim of measured manual-edit savings is made.

## Remaining submission work

1. Record and publish the short demonstration video, then add its actual URL to slide 9 and the submission form.
2. Supply and test the hosted browser-demo URL. No verified hosted-demo URL was supplied for this revision. A local-run guide is not a hosted demo.
3. Test configured LLM interpretation on fresh, out-of-template requests before making a broader AI-generation claim. Record provider, model, prompt, result and failure handling without exposing keys.
4. Confirm the submission's focus category and short description. Check public access to the repository, demo and video from a signed-out browser.
5. Keep the submitted presentation, description and video on the same research snapshot. Any new-code benchmark requires a separately dated result set and reconciliation with the paper.

Official event references:

- https://www.victoriavr.com/news/ai-builder-hackathon-2026-the-building-period-2042daf3
- https://www.victoriavr.com/hackathon/2026/terms

## Reconciliation with the previous pitch draft

The inspected repository pitch draft reported hash satisfaction of 78.5% and C4 results of 43.0%/64.5%. These conflict with the author-supplied abstract (67.5% and 92.0%/99.5%). This presentation consistently uses the supplied paper results. Establish whether the other values describe a different implementation or are errors before citing them as research results.

The previous script also asserted specific clearances, repair times, 60 FPS, zero orphaned IDs and savings of four to six manual edits without matching evidence in this review. Those claims are omitted. The implementation inspected supports Gemini and DeepSeek. No OpenAI provider was established. Experimental exports and a proposed integration must not be described as proven Victoria VR integration.
