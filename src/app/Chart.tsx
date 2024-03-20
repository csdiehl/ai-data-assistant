"use client"

import React, { useRef, useEffect } from "react"
import * as Plot from "@observablehq/plot"
import { Card } from "./styles"

interface ChartSpec {
  type?: "line" | "bar" | "scatter" | "area"
  x: string
  y: string
  color?: string
  data: any[]
  description?: string
}

const Chart = ({
  data,
  x,
  y,
  color = "steelblue",
  type = "scatter",
  description,
}: ChartSpec) => {
  const container = useRef(null)

  console.log("chart type", type)

  useEffect(() => {
    if (!container.current) return
    const plot = Plot.plot({
      marginLeft: 80,
      color: { legend: true },
      marks: [Mark({ data, x, y, color, type })],
    })

    container.current.append(plot)

    return () => plot.remove()
  }, [x, y, color, data, type])
  return (
    <Card>
      {description && <p>{description}</p>}
      <div ref={container}></div>
    </Card>
  )
}

// return a different type of chart depending on the request
function Mark({ x, y, color = "steelblue", type, data }: ChartSpec) {
  switch (type) {
    case "line":
      return Plot.lineY(data, { x, y, stroke: color, sort: x })
    case "bar":
      return Plot.barX(data, { x, y, fill: color })
    case "scatter":
      return Plot.dot(data, { x, y, fill: color })
    case "area":
      return Plot.areaY(data, { x, y, fill: color, sort: x })
    default:
      return null
  }
}

export default Chart
