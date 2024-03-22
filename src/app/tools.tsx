import { z } from "zod"
import { sum, max, mean, rollups } from "d3-array"

export function unionOfLiterals<T extends string | number>(
  constants: readonly T[]
) {
  const literals = constants.map((x) => z.literal(x)) as unknown as readonly [
    z.ZodLiteral<T>,
    z.ZodLiteral<T>,
    ...z.ZodLiteral<T>[]
  ]
  return z.union(literals)
}

// Data summary tool.
export function summarizeData(
  data: any[],
  {
    variable,
    operation,
    category,
  }: {
    variable: string
    operation: "sum" | "max" | "mean" | "count"
    category?: string
  }
): Array<{ category: string; value: number }> {
  const f = (dataset: any[]) => {
    switch (operation) {
      case "sum":
        return sum(dataset, (d) => d[variable])
      case "max":
        return max(dataset, (d) => d[variable])
      case "mean":
        return mean(dataset, (d) => d[variable])
      case "count":
        return dataset.length
    }
  }

  return category
    ? rollups(
        data,
        (v) => f(v),
        (d) => d[category]
      ).map((d) => ({ category: d[0], value: d[1] }))
    : [{ category: "all", value: f(data) }]
}

// Data sorting tool
export function sortData(
  data: any[],
  {
    category,
    order,
    topK = 20,
  }: {
    category: string
    order: "ascending" | "descending"
    topK?: number
  }
) {
  return data
    .toSorted((a, b) =>
      order === "ascending"
        ? a[category] - b[category]
        : b[category] - a[category]
    )
    .slice(0, topK)
}
