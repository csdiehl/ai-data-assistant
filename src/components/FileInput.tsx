import React, { ChangeEvent, DragEvent, useRef } from "react"
import styled from "styled-components"
import { primary } from "./settings"

const FileUploadContainer = styled.div`
  border: 2px dashed #ccc;
  padding: 20px;
  text-align: center;
`

const FileInput = styled.input`
  display: none;
`

const UploadButton = styled.button`
  background-color: ${primary};
  color: #fff;
  margin-top: 4px;
  padding: 8px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
`

interface Props {
  selectedFile: File | string
  setSelectedFile: any
}

const FileUpload = ({ selectedFile, setSelectedFile }: Props) => {
  // Create a reference to the hidden file input element
  const hiddenFileInput = useRef<HTMLInputElement>(null)

  // Programatically click the hidden file input element
  // when the Button component is clicked
  const handleClick = (event: any) => {
    if (!hiddenFileInput?.current) return
    event.preventDefault()
    hiddenFileInput.current.click()
  }
  // Call a function (passed as a prop from the parent component)
  // to handle the user-selected file
  const handleChange = (event: any) => {
    const fileUploaded = event.target.files[0]
    setSelectedFile(fileUploaded)
  }

  const handleDragOver = (event: DragEvent) => {
    event.preventDefault()
  }

  const handleDrop = (event: any) => {
    event.preventDefault()
    const file = event.dataTransfer.files[0]
    setSelectedFile(file)
  }

  return (
    <FileUploadContainer onDragOver={handleDragOver} onDrop={handleDrop}>
      <FileInput
        ref={hiddenFileInput}
        id="fileInput"
        type="file"
        onChange={handleChange}
      />
      <div>Drag and drop your files here</div>
      <UploadButton onClick={handleClick}>Browse Files</UploadButton>
      {selectedFile && typeof selectedFile !== "string" && (
        <div>{selectedFile.name}</div>
      )}
    </FileUploadContainer>
  )
}

export default FileUpload
