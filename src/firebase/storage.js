import { storage } from "./config"
import {
  ref,
  uploadBytes,
  listAll,
  deleteObject,
  getDownloadURL,
} from "firebase/storage"

const dataBucketName = "datasets"

// 'file' comes from the Blob or File API
export function uploadFile(data, user, fileName) {
  const storageRef = ref(storage, `${dataBucketName}/${user}/${fileName}`)
  const blob = new Blob([JSON.stringify(data)], {
    type: "application/json",
  })
  return uploadBytes(storageRef, blob)
    .then((snapshot) => {
      return `Uploaded ${fileName} successfully!`
    })
    .catch((error) => {
      console.error(error)
      return "error uploading file"
    })
}

// delete a file
export async function deleteFile(user, fileName) {
  // Create a reference to the file to delete
  const objectRef = ref(storage, `datasets/${user}/${fileName}`)

  try {
    await deleteObject(objectRef)
    return "file deleted"
  } catch (error) {
    console.error(error)
  }
}

// list files
export async function listUserFiles(user) {
  // Create a reference under which you want to list
  const listRef = ref(storage, `${dataBucketName}/${user}`)
  // Find all the prefixes and items.
  const files = []
  try {
    const res = await listAll(listRef)

    res.items.forEach((folderRef) => {
      files.push(folderRef.name)
    })
  } catch (error) {
    console.error(error)
  }

  return files
}

// load file
export async function createDownloadURL(user, fileName) {
  const pathReference = ref(storage, `${dataBucketName}/${user}/${fileName}`)

  const url = await getDownloadURL(pathReference)
  return url
}
