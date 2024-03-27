"use client"

import React, { useRef, useEffect } from "react"
import * as Plot from "@observablehq/plot"

interface ChartSpec {
  type?: "line" | "scatter" | "area" | "heatmap" | "density"
  x: string
  y: string
  color?: string
  data: any[]
  dataKey: string
  trace?: string // trace shows what the AI put in for the parameters
}

const Chart = ({
  data,
  x,
  y,
  color = "steelblue",
  type = "scatter",
  dataKey,
}: ChartSpec) => {
  const container = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!container.current) return
    const plot = Plot.plot({
      height: 500,
      y: { grid: true },
      x: { grid: true, ticks: 5 },
      marginLeft: 80,
      color: { legend: true },
      marks: Mark({ data, x, y, color, type, dataKey }),
    })

    container.current.append(plot)

    return () => plot.remove()
  }, [x, y, color, data, type, dataKey])
  return <div ref={container}></div>
}

// return a different type of chart depending on the request
function Mark({ x, y, color = "steelblue", type, data, dataKey }: ChartSpec) {
  switch (type) {
    case "line":
      return [
        Plot.axisX({ anchor: "bottom", ticks: 2 }),
        Plot.lineY(data, { x, y, stroke: color, sort: x }),
        Plot.dot(data, { x, y, fill: color, sort: x }),
        Plot.tip(data, Plot.pointerX({ x: x, y: y, title: (d) => d[x] })),
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
    case "density":
      return [
        Plot.density(data, {
          x: x,
          y: y,
          stroke: color,
          thresholds: 4,
        }),
        Plot.dot(data, {
          x: x,
          y: y,
          fill: color,
          r: 2,
        }),
      ]
    default:
      return undefined
  }
}

export default Chart
