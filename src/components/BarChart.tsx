"use client"

import React, { useRef, useEffect, useState } from "react"
import * as Plot from "@observablehq/plot"
import Controls from "./Controls"
import { primary } from "./settings"

interface ChartSpec {
  type?: "barX" | "barY"
  x: string
  y?: string
  color?: string
  data: any[]
  dataKey: string
}

const Chart = ({ data, x, y, color = primary, dataKey, type }: ChartSpec) => {
  const container = useRef<HTMLDivElement>(null)

  const axes = useRef<{
    x: string
    y: string | undefined
  }>({
    x,
    y,
  })

  useEffect(() => {
    if (!container.current || !axes.current) return
    const { x, y } = axes.current

    // if the llm messed up the axes, flip it around
    if (
      (type === "barX" && typeof x != "number") ||
      (type === "barY" && typeof y != "number")
    ) {
      //@ts-ignore
      axes.current.x = y
      axes.current.y = x
    }

    const sharedOptions = { x, y, fill: color }

    const marks =
      type === "barX"
        ? [Plot.barX(data, { ...sharedOptions, sort: { y: "-x" } })]
        : [Plot.barY(data, { ...sharedOptions, sort: { x: "-y" } })]

    const plot = Plot.plot({
      y: {},
      x: {},
      marginLeft: 100,
      color: { legend: true },
      marks,
    })

    container.current.append(plot)

    return () => plot.remove()
  }, [axes, color, data, dataKey, type])
  return (
    <div>
      <Controls data={data} />
      <div
        style={{ width: "100%", background: "transparent" }}
        ref={container}
      ></div>
    </div>
  )
}

export default Chart
