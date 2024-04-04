"use client"

import styled from "styled-components"
import { Label } from "./styles"
import { useRef, useEffect } from "react"
import * as Plot from "@observablehq/plot"
import { primary } from "./settings"

const Wrapper = styled.div`
  padding: 8px;
  border-radius: 8px;

  h2 {
    margin: 16px 0;
    font-size: 1rem;
    font-weight: bold;
    color: grey;
  }
`

const Variable = styled.div`
  display: flex;
  gap: 8px;
  align-items: flex-start;
  height: 48px;
`

// An example of a flight card component.
function Description({
  length,
  vars,
  data,
}: {
  length: number
  vars: string[]
  data: any[]
}) {
  return (
    <Wrapper>
      <h2>There are {length.toFixed(0)} rows here, with these variables</h2>
      <ul>
        {vars.map((d, i) => {
          const varType = typeof data[0][d]
          return (
            <Variable key={i}>
              <div>
                <Label key={d}>{d}</Label>
                <p
                  style={{
                    color: "grey",
                    fontWeight: 400,
                    fontSize: ".875rem",
                  }}
                >
                  {varType}
                </p>
              </div>
              {varType === "number" && (
                <BoxPlot data={data.map((row) => row[d])} />
              )}
            </Variable>
          )
        })}
      </ul>
    </Wrapper>
  )
}

function BoxPlot({ data }: { data: number[] }) {
  const container = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!container.current) return
    const plot = Plot.plot({
      width: 300,
      height: 48,
      marks: [
        Plot.boxX(data, { fill: primary, stroke: primary, fillOpacity: 0.3 }),
      ],
    })

    container.current.append(plot)

    return () => plot.remove()
  }, [data])

  return <div ref={container}></div>
}

export default Description
