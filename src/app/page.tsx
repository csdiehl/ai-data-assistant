"use client"

import { useAIState, useActions, useUIState } from "ai/rsc"
import { useEffect, useRef, useState } from "react"
import styled from "styled-components"
import type { AI } from "./action"
//@ts-ignore
import Description from "@/components/Description"
import FileInput from "@/components/FileInput"
import { primary } from "@/components/settings"
import { parse } from "papaparse"

import { signOut } from "@/firebase/useAuth"
import { useRouter } from "next/navigation"
import { useAuth } from "./context"
// import { useGoogleSignIn } from "@/firebase/auth"

const inputHeight = 24

const App = styled.div`
  background: #f5f5f5;
  color: #333;
  height: 100vh;
  padding: 16px;
  overflow-y: scroll;

  label {
    margin: 0;
    padding: 0;
    font-size: 0.875rem;
    line-height: 1rem;
    color: #555;
  }
`

const InputContainer = styled.div`
  margin: 16px 8px;
  width: calc(100% - 16px);
  max-width: 500px;
`

const Input = styled.input`
  height: 48px;
  width: 100%;
  background: #f5f5f5;
  border: none;
  border-bottom: 2px solid ${primary};
  color: ${primary};
  font-size: 1rem;
  line-height: 1rem;
`

const URLInput = styled.input`
  height: ${inputHeight}px;
  background: none;
  border: none;
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
  background: ${primary};
  font-weight: bold;
  border: none;
  cursor: pointer;
  height: 48px;
  height: 48px;

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
  align-items: center;
  justify-content: flex-start;
  gap: 16px;
  padding: 24px;
`
const EmptyState = styled.h2`
  margin: 160px auto;
  font-weight: lighter;
  text-align: center;
  color: grey;
`

export default function Page() {
  const { user } = useAuth()
  const [inputValue, setInputValue] = useState("")
  const [messages, setMessages] = useUIState<typeof AI>()
  const { submitUserMessage, setupDB } = useActions<typeof AI>()
  const [aiState, setAiState] = useAIState()

  console.log("user in page", user)

  const router = useRouter()

  useEffect(() => {
    if (user == null) router.push("/login")
  }, [user, router])

  const [selectedFile, setSelectedFile] = useState<File | string>("")
  const [length, setLength] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

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
    } else if (isJSON) {
      jsonFileToArrays(selectedFile).then((data) => {
        loadFile(data)
      })
    } else {
      alert("Please select a CSV or JSON file")
      return
    }
  }

  function uploadFileFromURL(e: any) {
    setSelectedFile(e.target.value)
  }

  useEffect(() => {
    if (messages.length > 0 && inputRef?.current) {
      // scroll to bottom of messages
      inputRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  const noData = !aiState?.sampleData || aiState.sampleData.length === 0

  return (
    <App>
      <Form>
        <FileInput
          selectedFile={selectedFile}
          setSelectedFile={setSelectedFile}
        ></FileInput>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <label htmlFor="url-input">Or enter a CSV or JSON URL</label>
          <URLInput
            id="url-input"
            placeholder="https://example.com"
            pattern="https://.*"
            type="url"
            onChange={uploadFileFromURL}
          ></URLInput>
        </div>

        <Submit disabled={!noData} onClick={handleSubmit}>
          Chat with your Data!
        </Submit>
        <button onClick={() => signOut()}>Log Out</button>
      </Form>

      {noData ? (
        <EmptyState>
          Welcome, {user?.displayName} <br />
          To chat with the AI you need some data!
        </EmptyState>
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
                <p style={{ color: primary }}>
                  {/*@ts-ignore*/}
                  Chatting with {selectedFile.name}{" "}
                  <span style={{ color: "grey" }}>{length} rows</span>
                </p>
              )}
              <Input
                ref={inputRef}
                disabled={noData}
                placeholder="Send a message..."
                value={inputValue}
                onChange={(event) => {
                  setInputValue(event.target.value)
                }}
              />
            </InputContainer>
          </form>
        </Messages>
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
