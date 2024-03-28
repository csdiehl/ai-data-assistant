"use client"

import React, { useRef, useEffect, useState } from "react"
import * as Plot from "@observablehq/plot"
import Controls from "./Controls"

interface ChartSpec {
  type?: "line" | "scatter" | "area" | "heatmap" | "density" | "barX" | "barY"
  x: string
  y?: string
  color?: string
  size?: string
  data: any[]
  dataKey: string
  trace?: string // trace shows what the AI put in for the parameters
}

const Chart = ({
  data,
  x,
  y,
  color = "steelblue",
  size,
  type = "scatter",
  dataKey,
}: ChartSpec) => {
  const container = useRef<HTMLDivElement>(null)

  const [axes, setAxes] = useState<{
    x: string
    y: string | undefined
  }>({
    x,
    y,
  })

  function flip() {
    if (!x || !y) return
    //@ts-ignore
    setAxes((axes) => ({ x: axes.y, y: axes.x }))
  }

  useEffect(() => {
    if (!container.current) return

    const { x, y } = axes
    const plot = Plot.plot({
      height: 500,
      y: { grid: true },
      x: { grid: true, ticks: 5 },
      marginLeft: 80,
      color: { legend: true },
      r: { legend: true },
      marks: Mark({ data, x, y, color, type, dataKey, size }),
    })

    container.current.append(plot)

    return () => plot.remove()
  }, [axes, color, data, type, dataKey, size])
  return (
    <>
      <Controls data={data} flip={flip} />
      <div
        style={{ height: 500, background: "transparent" }}
        ref={container}
      ></div>
    </>
  )
}

// return a different type of chart depending on the request
function Mark({
  x,
  y,
  color = "steelblue",
  size,
  type,
  data,
  dataKey,
}: ChartSpec) {
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
        Plot.dot(data, { x, y, fill: color, r: size }),
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
    case "barX":
      return [Plot.barX(data, { x: x, y: y, fill: color, sort: { y: "-x" } })]
    case "barY":
      return [Plot.barY(data, { x: x, y: y, fill: color, sort: { x: "-y" } })]
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
