import React, { useState } from "react"
import styled from "styled-components"
import { primary } from "./settings"
import FileInput from "@/components/FileInput"
import { Submit } from "./styles"

const Form = styled.form`
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 16px;
`

const URLInput = styled.input`
  all: unset;
  height: 48px;
  background: none;
  border: none;
  color: ${primary} !important;
  font-size: 1.2rem;
`

const Inputs = styled.div<{ $show: boolean }>`
  position: absolute;
  top: 80px;
  opacity: ${(props) => (props.$show ? 1 : 0)};
  transition: opacity 0.2s ease-in-out;
  background: #f5f5f5;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 16px;
`

interface Props {
  selectedFile: File | string
  setSelectedFile: (file: File | string) => void
  handleSubmit: any
  noData: boolean
}

const UploadForm = ({
  selectedFile,
  setSelectedFile,
  handleSubmit,
  noData,
}: Props) => {
  function uploadFileFromURL(e: any) {
    setSelectedFile(e.target.value)
  }

  const [show, setShow] = useState(false)

  const selectedURL = typeof selectedFile === "string" ? selectedFile : ""

  function toggleForm(e: any) {
    e.preventDefault()
    setShow((p) => !p)
  }

  return (
    <Form>
      <Inputs $show={show}>
        <FileInput
          selectedFile={selectedFile}
          setSelectedFile={setSelectedFile}
        ></FileInput>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <label htmlFor="url-input">Or enter a CSV or JSON URL</label>
          <URLInput
            value={selectedURL}
            id="url-input"
            placeholder="https://example.com"
            pattern="https://.*"
            type="url"
            onChange={uploadFileFromURL}
          ></URLInput>
        </div>
      </Inputs>

      <Submit onClick={toggleForm}>
        <img width="24" height="24" alt="upload" src="/icons/upload.svg"></img>{" "}
        Upload Data
      </Submit>

      <Submit
        type="submit"
        disabled={!noData || !selectedFile}
        onClick={handleSubmit}
      >
        Chat with your Data!
      </Submit>
    </Form>
  )
}

export default UploadForm
