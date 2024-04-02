import React, { useEffect, useState } from "react"
import { listUserFiles } from "@/firebase/storage"
import styled from "styled-components"
import { primary } from "./settings"

const List = styled.ul`
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 8px;

  li {
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

const FileList = ({ userId }: { userId: string }) => {
  const [files, setFiles] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    listUserFiles(userId)
      .then((files) => setFiles(files))
      .catch((error) => setError(error.message))
  }, [userId])

  return (
    <div>
      <Header>Your Data Snapshots</Header>
      <List>
        {files.length > 0 && files.map((name) => <li key={name}>{name}</li>)}
      </List>
      {error && <p>{error}</p>}
    </div>
  )
}

export default FileList
