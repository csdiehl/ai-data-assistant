"use client"

import React, { useRef, useEffect } from "react"
import * as Plot from "@observablehq/plot"
import { Card, Caption } from "./styles"

interface ChartSpec {
  type?: "line" | "scatter" | "area" | "heatmap"
  x: string
  y: string
  color?: string
  data: any[]
  description?: string
  dataKey: string
  trace?: string // trace shows what the AI put in for the parameters
  query?: string
}

const Chart = ({
  data,
  x,
  y,
  color = "steelblue",
  type = "scatter",
  description,
  dataKey,
  query,
}: ChartSpec) => {
  const container = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!container.current) return
    const plot = Plot.plot({
      y: { grid: true },
      x: { grid: true },
      marginLeft: 80,
      color: { legend: true },
      marks: Mark({ data, x, y, color, type, dataKey }),
    })

    container.current.append(plot)

    return () => plot.remove()
  }, [x, y, color, data, type, dataKey])
  return (
    <Card>
      {description && <p>{description}</p>}
      <div ref={container}></div>
      {query && <Caption>{query}</Caption>}
    </Card>
  )
}

// return a different type of chart depending on the request
function Mark({ x, y, color = "steelblue", type, data, dataKey }: ChartSpec) {
  switch (type) {
    case "line":
      return [
        Plot.axisX({ anchor: "bottom", ticks: 5 }),
        Plot.lineY(data, { x, y, stroke: color, sort: x }),
        Plot.dot(data, { x, y, fill: color, sort: x }),
      ]
    case "scatter":
      return [
        Plot.dot(data, { x, y, fill: color }),
        Plot.tip(data, Plot.pointerX({ x: x, y: y, title: (d) => d[dataKey] })),
      ]
    case "area":
      return [Plot.areaY(data, { x, y, fill: color, sort: x })]
    case "heatmap":
      return [
        Plot.rect(data, {
          x,
          y,
          fill: color,
          sort: x,
          interval: 1,
          inset: 0.5,
        }),
      ]
    default:
      return undefined
  }
}

export default Chart
