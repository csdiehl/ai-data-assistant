"use client"

import React, { useRef, useEffect } from "react"
import data from "./cars.json"
import * as Plot from "@observablehq/plot"
import styled from "styled-components"

interface ChartSpec {
  type?: "line" | "bar" | "scatter"
  x: string
  y: string
  color?: string
}

const Card = styled.div`
  border: 1px solid #ccc;
  background: #fff;
  padding: 8px;
  border-radius: 8px;

  h2 {
    margin: 16px 0;
  }
`

const Chart = ({ x, y, color = "steelblue", type }: ChartSpec) => {
  const container = useRef(null)

  useEffect(() => {
    if (!container.current) return
    const plot = Plot.plot({
      y: { grid: true },
      marks: [Plot.ruleY([0]), Plot.dot(data, { x: x, y: y })],
    })

    container.current.append(plot)

    return () => plot.remove()
  }, [x, y, color])
  return <Card ref={container}></Card>
}

export default Chart
