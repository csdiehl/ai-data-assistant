"use client"

import styled from "styled-components"

const Wrapper = styled.div`
  border: 1px solid #ccc;
  padding: 8px;
  border-radius: 8px;
  width: 100%;
  max-width: 600px;

  h2 {
    margin: 16px 0;
    font-size: 1.3rem;
    font-weight: bold;
  }
`

const Answer = styled.p`
  font-size: 1rem;
  font-weight: 400;
  color: grey;
`

function Card({
  description,
  answer,
}: {
  description: string
  answer: number
}) {
  return (
    <Wrapper>
      <h2>{answer.toFixed(1)}</h2>
      <Answer>{description}</Answer>
    </Wrapper>
  )
}

export default Card
