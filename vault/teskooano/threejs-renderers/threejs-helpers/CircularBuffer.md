---
aliases: [CircularBuffer]
tags: [renderer, helpers, memory]
type: Class
package: "@teskooano/renderer-threejs-helpers"
name: CircularBuffer
functions:
  [
    "push",
    "pushMany",
    "getOrderedItems",
    "peek",
    "peekOldest",
    "getAt",
    "getLast",
    "resize",
    "take",
    "pop",
    "clear",
    "isEmpty",
    "isFull",
    "size",
    "fillPercentage",
    "getStatistics",
    "resetStats",
    "[Symbol.iterator]",
    "reverseIterator",
    "find",
    "filter",
    "map",
  ]
status: active
---

# CircularBuffer<T>

Generic fixed-size ring buffer with O(1) push/pop and iterators. Ideal for history (e.g., trails) without reallocations.

## Features

- Ordered retrieval and tail queries
- Batch push/take; resize preserving most recent items
- Iteration (forward and reverse)
