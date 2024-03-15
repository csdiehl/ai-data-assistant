"use client"

import styled from "styled-components"
import { Label } from "./styles"

const Wrapper = styled.div`
  border: 1px solid #ccc;
  background: #fff;
  padding: 8px;
  border-radius: 8px;

  h2 {
    margin: 16px 0;
    font-size: 1rem;
    font-weight: bold;
  }
`

// An example of a flight card component.
function Description({ length, vars }: { length: number; vars: string[] }) {
  return (
    <Wrapper>
      <h2>There are {length.toFixed(0)} rows here</h2>
      <h3>Variables</h3>
      <ul>
        {vars.map((d) => (
          <Label key={d}>{d}</Label>
        ))}
      </ul>
    </Wrapper>
  )
}

export default Description
