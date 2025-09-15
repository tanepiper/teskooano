---
aliases: [ZoneSelector]
tags: [systems, procedural]
type: Class
package: "@teskooano/systems-procedural-generation"
name: ZoneSelector
functions: ["selectZonesForPlacement", "getZoneForDistance"]
status: active
---

# ZoneSelector

Chooses active zones from adjusted zones using tuned probabilities and fallback strategies to ensure well-populated systems.

## Strategy

- Guarantee minBodies zones; prioritize inner zones; moderated outer inclusion
- Fallback adds 2–4 zones across inner/middle/outer if selection empty
- Final cap at 5–7 zones; sorted by minAU
