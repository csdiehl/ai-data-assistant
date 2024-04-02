import React, { useEffect, useState } from "react"
import { listUserFiles } from "@/firebase/storage"

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
      <h3>Your files</h3>
      <ul>
        {files.length > 0 && files.map((name) => <li key={name}>{name}</li>)}
      </ul>
      {error && <p>{error}</p>}
    </div>
  )
}

export default FileList
