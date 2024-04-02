import React, { useEffect, useState } from "react"
import {
  listUserFiles,
  deleteFile,
  createDownloadURL,
} from "@/firebase/storage"
import styled from "styled-components"
import { primary } from "./settings"

const List = styled.ul`
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 8px;

  li {
    display: flex;
    gap: 8px;
    align-items: center;
    color: ${primary};
    cursor: pointer;

    &:hover {
      filter: brightness(80%);
    }
  }
`
const Header = styled.h3`
  color: grey;
  padding: 8px 0;
`

const FileList = ({
  userId,
  setSelectedFile,
}: {
  userId: string
  setSelectedFile: (file: string) => void
}) => {
  const [files, setFiles] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    listUserFiles(userId)
      .then((files) => setFiles(files))
      .catch((error) => setError(error.message))
  }, [userId])

  function deleteAndRefresh(userId: string, name: String) {
    deleteFile(userId, name).then(() => {
      listUserFiles(userId)
        .then((files) => setFiles(files))
        .catch((error) => setError(error.message))
    })
  }

  function loadFile(name: string) {
    createDownloadURL(userId, name).then((url) => {
      setSelectedFile(url)
    })
  }

  return (
    <div>
      <Header>Your Data Snapshots</Header>
      <List>
        {files.length > 0 &&
          files.map((name) => (
            <li key={name}>
              <button style={{ all: "unset" }} onClick={() => loadFile(name)}>
                <p>{name}</p>
              </button>

              <button
                style={{ all: "unset" }}
                onClick={() => deleteAndRefresh(userId, name)}
              >
                <img
                  alt="close-button"
                  height={16}
                  width={16}
                  src="/icons/xmark.svg"
                ></img>
              </button>
            </li>
          ))}
      </List>
      {error && <p>{error}</p>}
    </div>
  )
}

export default FileList
