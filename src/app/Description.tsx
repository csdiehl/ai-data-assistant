"use client"

import styled from "styled-components"
import { Label } from "./styles"
import { useRef, useEffect } from "react"
import * as Plot from "@observablehq/plot"

const Wrapper = styled.div`
  padding: 8px;
  border-radius: 8px;

  h2 {
    margin: 16px 0;
    font-size: 1rem;
    font-weight: bold;
  }
`

const Variable = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
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
      <h2>There are {length.toFixed(0)} rows here</h2>
      <h3>Variables</h3>
      <ul>
        {vars.map((d, i) => {
          const varType = typeof data[0][d]
          return (
            <Variable key={i}>
              <Label key={d}>{d}</Label>
              <p
                style={{ color: "grey", fontWeight: 400, fontSize: ".875rem" }}
              >
                | {varType}
              </p>
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
  const container = useRef(null)

  useEffect(() => {
    if (!container.current) return
    const plot = Plot.boxX(data).plot({ width: 300 })

    container.current.append(plot)

    return () => plot.remove()
  }, [data])

  return <div ref={container}></div>
}

export default Description
