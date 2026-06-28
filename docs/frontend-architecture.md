# RouteFlow Frontend Architecture

RouteFlow has been migrated from a monolithic static HTML page to a Vite + React workspace.

## Entry Points

- `web/index.html` is the Vite shell and mounts `src/app/main.jsx`.
- `vite.config.js` owns React compilation and production output.

## Module Layout

```text
web/src/app/
  App.jsx                         Application state and workflow orchestration
  main.jsx                        React mount entry
  styles.css                      Product UI visual system
  data/catalog.js                 Algorithm metadata, scenario presets, quick prompts
  lib/planning.js                 Grid generation, dynamic obstacles, path planning
  lib/files.js                    Import/export helpers
  services/ai.js                  Backend chat API client
  services/workspace.js           Backend workspace persistence client
  components/HyperframesLayer.jsx HyperFrames-style animated field layer
  components/GlassInteractionLayer.jsx Pointer spotlight, shimmer, and glass hover interactions
  components/SimulationCanvas.jsx Editable canvas renderer for map/path/robot state
  components/SimulationCanvas3D.jsx Three.js renderer for 3D map/path preview
  components/TopCommandBar.jsx    Compact app command bar and navigation
  components/ControlRail.jsx      Scenario, planner parameter, and map editing controls
  components/CanvasToolbar.jsx    Draft/history/import/export actions
  components/MetricsRail.jsx      Metrics, guidance, legend, and workspace summary
  components/AssistantPanel.jsx   AI workflow surface
  components/InsightsPanel.jsx    Comparison and review surface
  components/Modal.jsx            Algorithm/API/code modals
  components/ui.jsx               Shared controls and metric widgets
```

## Current Capabilities

- Scenario presets for balanced, dense, dynamic, and exploration workloads.
- Local grid generation with guaranteed carved corridor between start and goal.
- A*, D* Lite-style grid planning, RRT*, and ACO planners behind a shared `planPath` API.
- Planner parameter controls for RRT* iteration/step/radius and ACO ants/iterations/evaporation.
- Editable map canvas for drawing obstacles, erasing cells, and setting start or goal points.
- Dynamic obstacle animation, execution playback, path glow, robot trail, and obstacle warning rings.
- Dynamic obstacles remain stationary until a planning run starts, then move only during execution.
- 2D editing view and 3D simulation preview share the same map, path, robot, and dynamic obstacle state.
- Run metrics, backend workspace draft saving, comparison history, map import/export, and algorithm guidance.
- AI assistant shell with local fallback and backend `/api/chat` integration.
- Responsive single-screen console UI with HyperFrames-style field motion, 21st.dev-inspired glass interactions, and dark/light themes.
- Canvas sizing is driven by `ResizeObserver` and a fixed layout box, avoiding frame-by-frame layout feedback.

## Next Refactor Targets

- Move `App.jsx` workflow state into custom hooks such as `usePlannerState`, `useChatState`, and `useTheme`.
- Add unit tests for workspace persistence, map editing invariants, and import/export shape.
- Add a visual regression path for desktop and mobile screenshots.
- Split `styles.css` into theme, layout, components, and responsive layers once the UI settles.
