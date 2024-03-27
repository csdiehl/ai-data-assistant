"use client"

import { useState } from "react"
import { useUIState, useActions, useAIState } from "ai/rsc"
import type { AI } from "./action"
import styled from "styled-components"
//@ts-ignore
import { parse } from "papaparse"

const App = styled.div`
  background: #f5f5f5;
  color: #333;
  height: 100vh;
  padding: 16px;
  overflow-y: scroll;
`

const Input = styled.input`
  height: 48px;
  width: 100%;
  max-width: 500px;
  border-radius: 8px;
  background: #fff;
  border: 1px solid #ccc;
  color: black;
  position: absolute;
  bottom: 16px;
`

const Message = styled.div<{ $aiMessage: boolean }>`
  ${(props) => props.$aiMessage && "align-self: flex-end"};
  border-radius: 8px;
  padding: 8px;
  background: #eee;
  margin: 8px 0;
  width: 100%;
  max-width: ${(props) => (props.$aiMessage ? "800px" : "400px")};
  font-size: 1rem;
  line-height: 1.25rem;
`

const UploadForm = styled.div`
  border: 1px dotted grey;
  padding: 16px;
  border-radius: 8px;
  margin: 160px auto;
  max-width: 500px;
  min-height: 200px;
`

const Submit = styled.button`
  padding: 8px;
  border-radius: 8px;
  background: steelblue;
  font-weight: bold;
  border: none;
  cursor: pointer;

  $:hover {
    filter: brightness(80%);
  }
`

const Messages = styled.div`
  margin-bottom: 100px;
  display: flex;
  flex-direction: column;
  max-width: 1000px;
`

const Select = styled.select`
  background: #fff;
  padding: 8px;
  color: black;
  border: 1px solid #ccc;
  border-radius: 8px;
`

const Form = styled.form`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 24px;
`

export default function Page() {
  const [inputValue, setInputValue] = useState("")
  const [messages, setMessages] = useUIState<typeof AI>()
  const { submitUserMessage, setupDB } = useActions<typeof AI>()
  const [aiState, setAiState] = useAIState()

  const [selectedFile, setSelectedFile] = useState(null)

  function handleSubmit(e: any) {
    e.preventDefault()
    // if successful, update the data
    if (!selectedFile) {
      alert("Please select a file")
      return
    }

    //@ts-ignore
    const isCSV = selectedFile.type === "text/csv"
    //@ts-ignore
    const isJSON = selectedFile.type === "application/json"

    if (!isCSV && !isJSON) {
      alert("Please select a CSV or JSON file")
      return
    }

    // parse the csv into json
    if (isCSV) {
      parse(selectedFile, {
        dynamicTyping: true,
        complete: function (results: any) {
          setupDB(JSON.stringify(results.data))
        },
      })
    }
    if (isJSON) {
      jsonFileToArrays(selectedFile).then((data) => {
        setupDB(JSON.stringify(data))
      })
    }
  }

  function handleFileChange(e: any) {
    setSelectedFile(e.target.files[0])
  }

  const noData = !aiState?.sampleData || aiState.sampleData.length === 0

  return (
    <App>
      {noData ? (
        <UploadForm>
          <h2>To chat with the AI you need some data!</h2>
          <Form>
            <input type="file" onChange={handleFileChange}></input>
            <Submit onClick={handleSubmit}>Chat with your Data!</Submit>
          </Form>
        </UploadForm>
      ) : (
        <>
          <Messages>
            {
              // View messages in UI state
              messages.map((message, i) => (
                <Message $aiMessage={i % 2 !== 0} key={message.id}>
                  {message.display}
                </Message>
              ))
            }
          </Messages>

          <form
            onSubmit={async (e) => {
              e.preventDefault()

              // Add user message to UI state
              setMessages((currentMessages) => [
                ...currentMessages,
                {
                  id: Date.now(),
                  display: <div>{inputValue}</div>,
                },
              ])

              // Submit and get response message
              const responseMessage = await submitUserMessage(inputValue)
              setMessages((currentMessages) => [
                ...currentMessages,
                responseMessage,
              ])

              setInputValue("")
            }}
          >
            <Input
              placeholder="Send a message..."
              value={inputValue}
              onChange={(event) => {
                setInputValue(event.target.value)
              }}
            />
          </form>
        </>
      )}
    </App>
  )
}

async function jsonFileToArrays(jsonFile: File) {
  // Read the contents of the JSON file
  const fileReader = new FileReader()

  const readFilePromise = new Promise((resolve, reject) => {
    fileReader.onload = () => {
      resolve(fileReader.result)
    }

    fileReader.onerror = reject

    fileReader.readAsText(jsonFile)
  })

  // Wait for the file contents to be read
  const fileContent = await readFilePromise

  // Parse the JSON content
  //@ts-ignore
  const jsonData = JSON.parse(fileContent)

  // Extract column names from the keys of the first object
  const columnNames = Object.keys(jsonData[0])

  // Initialize result array with column names as the first array
  const result = [columnNames]

  // Iterate through each object in the JSON array
  jsonData.forEach((obj: any) => {
    // Extract values for each column
    const values = columnNames.map((column) => obj[column])
    // Push values into the result array
    result.push(values)
  })

  return result
}
