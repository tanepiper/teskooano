```dataview
TABLE
  length(dependencies) as "Dependency Count",
  dependencies as "Dependencies"
WHERE dependencies
SORT length(dependencies) DESC
```

## Dependency Usage Analysis

```dataview
TABLE
  length(dependencies) as "Count",
  dependencies as "Dependencies"
WHERE dependencies
SORT length(dependencies) DESC
```

## Most Used Dependencies

```dataview
LIST
  dependencies
WHERE dependencies
FLATTEN dependencies
GROUP BY dependencies
SORT length(rows) DESC
```

## Package Dependency Summary

```dataview
TABLE
  length(rows) as "Usage Count",
  dependencies as "Package"
WHERE dependencies
FLATTEN dependencies
GROUP BY dependencies
SORT length(rows) DESC
```

## Files by Dependency Count

```dataview
TABLE
  length(dependencies) as "Dependency Count",
  dependencies as "Dependencies"
WHERE dependencies
SORT length(dependencies) DESC
LIMIT 10
```

## Internal Components Analysis

```dataview
TABLE
  length(classes) as "Classes",
  length(functions) as "Functions",
  length(constants) as "Constants",
  length(types) as "Types"
WHERE classes OR functions OR constants OR types
SORT length(classes) + length(functions) + length(constants) + length(types) DESC
```
