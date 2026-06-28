# User Manual

## Start

Run `start-routeflow.bat`, then use the frontend at `http://127.0.0.1:5173`.

## Planning Workspace

1. Choose a scenario in the left control rail.
2. Select A*, D* Lite, RRT*, or ACO.
3. Adjust grid size, obstacle density, execution speed, and dynamic obstacle settings.
4. Use the map editing tools to draw obstacles, erase cells, set the start point, or set the goal point.
5. Click `规划并运行` to generate and animate the route.

## Workspace Data

- `保存草稿` stores the current map through the backend workspace API.
- `加载草稿` restores a saved map.
- `保存记录` sends the latest successful run to the review history.
- `导出` and `导入` move maps through local JSON files.

If the backend is offline, planning and import/export still work, but backend draft/history sync is disabled.
