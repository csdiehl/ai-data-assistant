import { getStorage, ref, uploadBytes } from "firebase/storage"

const storage = getStorage()

// 'file' comes from the Blob or File API
export function uploadFile(data, user, fileName) {
  const storageRef = ref(storage, `datasets/${user}/${fileName}`)
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
