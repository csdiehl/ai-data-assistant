"use client"

import { useState } from "react"
import { useUIState, useActions, useAIState } from "ai/rsc"
import type { AI } from "./action"
import styled from "styled-components"
import { options } from "./dataConfig"

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

  const [selectedFile, setSelectedFile] = useState("Cars.db")

  function handleSubmit(e: any) {
    e.preventDefault()
    // if successful, update the data
    setupDB(selectedFile)
  }

  function handleFileChange(e: any) {
    setSelectedFile(e.target.value)
  }

  const noData = !aiState?.sampleData || aiState.sampleData.length === 0

  return (
    <App>
      {noData ? (
        <UploadForm>
          <h2>To chat with the AI you need some data!</h2>
          <Form>
            <Select onChange={handleFileChange}>
              {options.map(({ value, label }) => (
                <option value={value} key={label}>
                  {label}
                </option>
              ))}
            </Select>
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

/**
 * file uploads
 *   function handleChange(e: any) {
    new Response(e.target.files[0]).json().then((data) => {
      setFile(data)
    })
  }
 */
