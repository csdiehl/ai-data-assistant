"use client"

import React, { useRef, useEffect } from "react"
import * as Plot from "@observablehq/plot"
import Controls from "./Controls"
import { primary } from "./settings"
//@ts-ignore
import { utcParse } from "d3-time-format"

const chartHeight = 400
interface ChartSpec {
  x: string
  y?: string
  color?: string
  data: any[]
  dataKey: string
  timeFormat?: string
  type?: "line" | "area"
}

const Chart = ({
  data,
  x,
  y,
  color = primary,
  dataKey,
  timeFormat,
  type = "line",
}: ChartSpec) => {
  const container = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!container.current) return

    const yOptions = {}
    const xOptions = {}

    const interval = getTimeInterval(x)

    const formatTime = (x: string | number) => {
      const dateString = typeof x === "number" ? x.toString() : x

      const formatter = utcParse(timeFormat)

      // try to parse using the LLM's specifier
      const formatted = formatter(dateString)

      // if it doesn't work, fall back to a javascript data object
      return formatted ?? new Date(dateString)
    }

    const sharedOptions = {
      x: (d: any) => formatTime(d[x]),
      y,
      stroke: color,
      interval,
    }

    const marks =
      type === "area"
        ? [
            Plot.areaY(data, {
              ...sharedOptions,
              fill: color,
            }),
          ]
        : [
            Plot.lineY(data, {
              ...sharedOptions,
              fill: "none",
            }),
          ]

    const plot = Plot.plot({
      height: chartHeight,
      y: yOptions,
      x: xOptions,
      marginLeft: 80,
      color: { legend: true },
      r: { legend: true },
      marks,
    })

    container.current.append(plot)

    return () => plot.remove()
  }, [x, y, color, data, dataKey, timeFormat, type])
  return (
    <div>
      <Controls data={data} />
      <div
        style={{ height: chartHeight, background: "transparent" }}
        ref={container}
      ></div>
    </div>
  )
}

// get the correct time interval from the variable name
function getTimeInterval(
  x: string
): "year" | "month" | "week" | "day" | undefined {
  const v = x.toLowerCase()
  if (v.includes("year")) return "year"
  if (v.includes("month")) return "month"
  if (v.includes("week")) return "week"
  if (v.includes("day")) return "day"
  return undefined // default to undefined if no time interval is found
}

export default Chart
