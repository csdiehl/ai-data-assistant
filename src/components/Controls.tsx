import React from "react"
import { MenuButton } from "./styles"
import * as Papa from "papaparse"
import styled from "styled-components"

const Container = styled.div`
  display: flex;
  gap: 8px;
  padding: 8px;
`

interface Props {
  flip?: () => void
  data: any[]
}

const Controls = ({ flip, data }: Props) => {
  function downloadData() {
    const csv = Papa.unparse(data)
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "summary.csv"
    a.click()
  }
  return (
    <Container>
      {flip && <MenuButton onClick={flip}>Flip axes</MenuButton>}
      <MenuButton onClick={downloadData}> ↓CSV</MenuButton>
    </Container>
  )
}

export default Controls
