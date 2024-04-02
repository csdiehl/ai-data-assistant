import React, { useState, useRef } from "react"
import { MenuButton } from "./styles"
import { unparse } from "papaparse"
import styled from "styled-components"
import { uploadFile } from "@/firebase/storage"
import { useAuth } from "@/app/context"

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
  const [showUpload, setShowUpload] = useState(false)
  const [message, setMessage] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  const { user } = useAuth()
  function downloadData() {
    const csv = unparse(data)
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "summary.csv"
    a.click()
  }

  function uploadData() {
    if (!user) return
    const name = inputRef?.current?.value ?? "summary"
    uploadFile(data, user.uid, `${name}.json`).then((message) => {
      setMessage(message)
      setShowUpload(false)
    })
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
      {!showUpload ? (
        <MenuButton onClick={() => setShowUpload(true)}>↑Save</MenuButton>
      ) : (
        <>
          <input maxLength={15} type="text" ref={inputRef} />
          <MenuButton onClick={uploadData}>Upload</MenuButton>
        </>
      )}
      <p onClick={() => setMessage("")}>{message}</p>
    </Container>
  )
}

export default Controls
