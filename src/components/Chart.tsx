"use client"

import React, { useRef, useEffect, useState } from "react"
import * as Plot from "@observablehq/plot"
import Controls from "./Controls"
import { primary } from "./settings"

const chartHeight = 400
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

type ScaleType = "linear" | "log"

const Chart = ({
  data,
  x,
  y,
  color = primary,
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
  const [scale, setScale] = useState<{ x: ScaleType; y: ScaleType }>({
    x: "linear",
    y: "linear",
  })

  function flip() {
    if (!x || !y) return
    //@ts-ignore
    setAxes((axes) => ({ x: axes.y, y: axes.x }))
  }

  function handleScaleChange(axis: "x" | "y") {
    if (axis === "x") {
      setScale((scale) => ({
        ...scale,
        x: scale.x === "linear" ? "log" : "linear",
      }))
    } else {
      setScale((scale) => ({
        ...scale,
        y: scale.y === "linear" ? "log" : "linear",
      }))
    }
  }

  useEffect(() => {
    if (!container.current) return

    const yOptions = type === "scatter" ? { grid: true, type: scale.y } : {}

    const xOptions =
      type === "scatter"
        ? { grid: true, type: scale.x }
        : type === "line"
        ? { ticks: 5 }
        : {}

    const { x, y } = axes
    const plot = Plot.plot({
      height: chartHeight,
      y: yOptions,
      x: xOptions,
      marginLeft: 80,
      color: { legend: true },
      r: { legend: true },
      marks: Mark({ data, x, y, color, type, dataKey, size }),
    })

    container.current.append(plot)

    return () => plot.remove()
  }, [axes, color, data, type, dataKey, size, scale])
  return (
    <div>
      <Controls
        scale={scale}
        data={data}
        flip={flip}
        setScale={type === "scatter" ? handleScaleChange : null}
      />
      <div
        style={{ height: chartHeight, background: "transparent" }}
        ref={container}
      ></div>
    </div>
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
        Plot.lineY(data, {
          x,
          y,
          stroke: color,
          fill: "none",
          sort: x,
        }),
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
