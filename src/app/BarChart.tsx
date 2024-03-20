"use client"

import React, { useRef, useEffect } from "react"
import * as Plot from "@observablehq/plot"
import { Card, Label } from "./styles"

interface ChartSpec {
  x: string
  y: string
  color?: string
  data: any[]
  sortOrder?: "ascending" | "descending"
  description?: string
}

const BarChart = ({
  data,
  x,
  y,
  color = "steelblue",
  sortOrder = "ascending",
  description = "",
}: ChartSpec) => {
  const container = useRef(null)

  useEffect(() => {
    if (!container.current) return
    const plot = Plot.plot({
      y: { grid: true },
      marginLeft: 70,
      marks: [
        Plot.barX(data, {
          x: x,
          y: y,
          fill: color,
          sort: { y: sortOrder === "descending" ? "-x" : "x" },
        }),
      ],
    })

    container.current.append(plot)

    return () => plot.remove()
  }, [x, y, color, data, sortOrder])
  return (
    <Card>
      <p>{description}</p>
      <ul>
        {data.slice(0, 5).map((d, i) => (
          <Label key={i}>{d["Name"]}</Label>
        ))}
      </ul>
      <div ref={container}></div>
    </Card>
  )
}

export default BarChart
