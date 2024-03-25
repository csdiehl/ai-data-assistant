"use client"

import { useState } from "react"
import { useUIState, useActions, useAIState } from "ai/rsc"
import type { AI } from "./action"
import styled from "styled-components"
import dataConfig from "./dataConfig"

const App = styled.div`
  background: #f5f5f5;
  color: black;
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

export default function Page() {
  const [inputValue, setInputValue] = useState("")
  const [messages, setMessages] = useUIState<typeof AI>()
  const { submitUserMessage } = useActions<typeof AI>()

  const [aiState, setAiState] = useAIState()
  const [file, setFile] = useState<any[] | null>(dataConfig.sampleData)

  function handleChange(e: any) {
    new Response(e.target.files[0]).json().then((data) => {
      setFile(data)
    })
  }

  function handleSubmit(e: any) {
    e.preventDefault()
    if (!file) return
    // if successful, update the data
    setAiState({
      ...aiState,
      sampleData: file.slice(0, 3),
      // make the key the first variable encountered in the dataset by default
      dataKey: Object.keys(file[0])[0],
      columns: Object.keys(file[0]),
      tableName: dataConfig.tableName,
      schema: dataConfig.dbSchema,
    })
  }

  const noData = !aiState?.sampleData || aiState.sampleData.length === 0

  return (
    <App>
      {file === dataConfig.sampleData && (
        <h3>Using the example {dataConfig.tableName} dataset.</h3>
      )}
      {noData ? (
        <UploadForm>
          <h2>To chat with the AI you need some data!</h2>
          <p>Current dataset: {dataConfig.tableName}</p>
          <form>
            <input type="file" onChange={handleChange} />
            <Submit type="submit" onClick={handleSubmit}>
              Upload your data
            </Submit>
          </form>
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
