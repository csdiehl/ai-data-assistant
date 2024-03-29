import React from "react"
import { MenuButton } from "./styles"
import { unparse } from "papaparse"
import styled from "styled-components"

const Container = styled.div`
  display: flex;
  gap: 8px;
  padding: 8px;
`

interface Props {
  flip?: () => void
  setScale?: any
  data: any[]
  scale: { x: string; y: string }
}

const Controls = ({ flip, data, setScale, scale }: Props) => {
  function downloadData() {
    const csv = unparse(data)
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
      {setScale && (
        <>
          <MenuButton onClick={() => setScale("x")}>
            X Scale: {scale.x}
          </MenuButton>
          <MenuButton onClick={() => setScale("y")}>
            Y Scale: {scale.y}
          </MenuButton>
        </>
      )}
    </Container>
  )
}

export default Controls
