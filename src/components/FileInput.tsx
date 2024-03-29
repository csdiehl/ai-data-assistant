import React, { useRef } from "react"
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
  padding: 8px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
`

const FileUpload = ({ selectedFile, setSelectedFile }) => {
  // Create a reference to the hidden file input element
  const hiddenFileInput = useRef<HTMLInputElement>(null)

  // Programatically click the hidden file input element
  // when the Button component is clicked
  const handleClick = (event) => {
    event.preventDefault()
    console.log(hiddenFileInput.current)
    hiddenFileInput.current.click()
  }
  // Call a function (passed as a prop from the parent component)
  // to handle the user-selected file
  const handleChange = (event) => {
    console.log(event)
    const fileUploaded = event.target.files[0]
    setSelectedFile(fileUploaded)
  }

  const handleDragOver = (event) => {
    event.preventDefault()
  }

  const handleDrop = (event) => {
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
      {selectedFile && <div>{selectedFile.name}</div>}
    </FileUploadContainer>
  )
}

export default FileUpload
