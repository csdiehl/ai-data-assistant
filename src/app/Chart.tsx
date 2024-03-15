"use client"

import React, { useRef, useEffect } from "react"
import data from "./cars.json"
import * as Plot from "@observablehq/plot"
import { Card } from "./styles"

interface ChartSpec {
  type?: "line" | "bar" | "scatter"
  x: string
  y: string
  color?: string
}

const Chart = ({ x, y, color = "steelblue", type }: ChartSpec) => {
  const container = useRef(null)

  useEffect(() => {
    if (!container.current) return
    const plot = Plot.plot({
      y: { grid: true },
      color: { legend: true },
      marks: [Plot.ruleY([0]), Plot.dot(data, { x: x, y: y, fill: color })],
    })

    container.current.append(plot)

    return () => plot.remove()
  }, [x, y, color])
  return <Card ref={container}></Card>
}

export default Chart
