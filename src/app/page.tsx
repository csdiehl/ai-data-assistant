"use client"

import { useState } from "react"
import { useUIState, useActions } from "ai/rsc"
import type { AI } from "./action"
import styled from "styled-components"

const App = styled.div`
  background: #f5f5f5;
  color: black;
  height: 100vh;
  padding: 16px;
`

const Input = styled.input`
  height: 48px;
  width: 100%;
  max-width: 500px;
  border-radius: 8px;
  background: #fff;
  border: 1px solid #ccc;
  color: black;
`

const Message = styled.div`
  border-radius: 8px;
  padding: 8px;
  background: rgba(18, 18, 18, 0.05);
  margin: 8px 0;
  max-width: 500px;
  font-size: 1rem;
  line-height: 1.25rem;
`

export default function Page() {
  const [inputValue, setInputValue] = useState("")
  const [messages, setMessages] = useUIState<typeof AI>()
  const { submitUserMessage } = useActions<typeof AI>()

  return (
    <App>
      {
        // View messages in UI state
        messages.map((message) => (
          <Message key={message.id}>{message.display}</Message>
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
        <Input
          placeholder="Send a message..."
          value={inputValue}
          onChange={(event) => {
            setInputValue(event.target.value)
          }}
        />
      </form>
    </App>
  )
}
