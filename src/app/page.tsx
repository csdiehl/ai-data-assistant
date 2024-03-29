"use client"

import { useState } from "react"
import { useUIState, useActions, useAIState } from "ai/rsc"
import type { AI } from "./action"
import styled from "styled-components"
//@ts-ignore
import { parse } from "papaparse"
import Description from "@/components/Description"

const App = styled.div`
  background: #f5f5f5;
  color: #333;
  height: 100vh;
  padding: 16px;
  overflow-y: scroll;

  input {
    border-radius: 8px;
    border: 1px solid #ccc;
    background: #fff;
    padding: 16px;
    color: #555;
  }

  label {
    margin: 0;
    padding: 0;
    font-size: 0.875rem;
    line-height: 1rem;
    color: #555;
  }
`

const InputContainer = styled.div`
  position: absolute;
  bottom: 16px;
  left: 0;
  margin: 0 8px;
  width: calc(100% - 16px);
  max-width: 500px;
`

const Input = styled.input`
  height: 48px;
  width: 100%;
  border-radius: 8px;
  background: #fff;
  border: 1px solid #ccc;
  color: black;
  padding: 0 8px;
`

const Message = styled.div<{ $aiMessage: boolean }>`
  ${(props) => props.$aiMessage && "align-self: flex-end"};
  border-radius: 8px;
  padding: 8px;
  background: ${(props) => (props.$aiMessage ? "none" : "#eee")};
  margin: 8px 0;
  width: 100%;
  max-width: ${(props) => (props.$aiMessage ? "800px" : "400px")};
  font-size: 1rem;
  line-height: 1.25rem;
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

const Form = styled.form`
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 16px;
  padding: 24px;
`

const FileInput = styled.input``

export default function Page() {
  const [inputValue, setInputValue] = useState("")
  const [messages, setMessages] = useUIState<typeof AI>()
  const { submitUserMessage, setupDB } = useActions<typeof AI>()
  const [aiState, setAiState] = useAIState()
  const [user, setUser] = useState(false)

  const [selectedFile, setSelectedFile] = useState<File | string>("")
  const [length, setLength] = useState(0)

  function handleSubmit(e: any) {
    e.preventDefault()
    // if successful, update the data
    if (!selectedFile) {
      alert("Please select a file")
      return
    }

    function loadFile(data: any) {
      // fix spaces in column names
      data[0] = data[0].map((d: string) => d.replaceAll(" ", "_").trim())

      // pass to the AI
      setupDB(JSON.stringify(data))
      setLength(data.length)
    }

    const isURL =
      typeof selectedFile === "string" && selectedFile.startsWith("https")

    //@ts-ignore
    const isCSV = selectedFile?.type === "text/csv"
    //@ts-ignore
    const isJSON = selectedFile?.type === "application/json"

    if (isURL) {
      if (selectedFile.endsWith(".json")) {
        fetch(selectedFile)
          .then((response) => response.json())
          .then((data) => {
            const formatted = formatJSON(data)
            loadFile(formatted)
          })
      } else if (selectedFile.endsWith(".csv")) {
        parse(selectedFile, {
          download: true,
          dynamicTyping: true,
          // rest of config ...
          complete: (results: any) => loadFile(results.data),
        })
      } else {
        console.error("Unsupported file type: not a raw csv or json")
      }
      return
    }

    // parse the csv into json
    if (isCSV) {
      parse(selectedFile, {
        dynamicTyping: true,
        complete: (results: any) => loadFile(results.data),
      })
    } else if (isJSON) {
      jsonFileToArrays(selectedFile).then((data) => {
        loadFile(data)
      })
    } else {
      alert("Please select a CSV or JSON file")
      return
    }
  }

  function handleFileChange(e: any) {
    setSelectedFile(e.target.files[0])
  }

  function uploadFileFromURL(e: any) {
    setSelectedFile(e.target.value)
  }

  const noData = !aiState?.sampleData || aiState.sampleData.length === 0

  return (
    <App>
      <Form>
        <FileInput type="file" onChange={handleFileChange}></FileInput>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <label htmlFor="url-input">Or enter a URL to a CSV file</label>
          <input
            id="url-input"
            placeholder="https://example.com"
            pattern="https://.*"
            type="url"
            onChange={uploadFileFromURL}
          ></input>
        </div>

        <Submit onClick={handleSubmit}>Chat with your Data!</Submit>
      </Form>

      {noData ? (
        <div>
          <h2>To chat with the AI you need some data!</h2>
        </div>
      ) : (
        <Messages>
          <Description
            data={aiState.dataSummary}
            length={length}
            vars={aiState.columns}
          />
          {
            // View messages in UI state
            messages.map((message, i) => (
              <Message $aiMessage={i % 2 !== 0} key={message.id}>
                {message.display}
              </Message>
            ))
          }
        </Messages>
      )}

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
        <InputContainer>
          {selectedFile && (
            <p style={{ marginBottom: "8px" }}>
              {/*@ts-ignore*/}
              Chatting with {selectedFile.name}{" "}
              <span style={{ color: "grey" }}>{length} rows</span>
            </p>
          )}
          <Input
            disabled={noData}
            placeholder="Send a message..."
            value={inputValue}
            onChange={(event) => {
              setInputValue(event.target.value)
            }}
          />
        </InputContainer>
      </form>
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

  const result = formatJSON(jsonData)

  return result
}

function formatJSON(jsonData: any[]) {
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
