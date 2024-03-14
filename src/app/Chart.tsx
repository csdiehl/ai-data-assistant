import React, { useRef, useEffect } from "react"
import athletes from "./athletes.json"
import Plot from "@observablehq/plot"

interface ChartSpec {
  type: "line" | "bar" | "scatter"
  x: string
  y: string
  color: string
}

const Chart = ({ x, y, color, type }: ChartSpec) => {
  const container = useRef(null)

  useEffect(() => {
    if (!container.current) return
    const plot = Plot.barX(athletes, { x: x, y: y, fill: color }).plot()

    container.current.append(plot)

    return () => plot.remove()
  }, [x, y, color])
  return <div ref={container}></div>
}

export default Chart
