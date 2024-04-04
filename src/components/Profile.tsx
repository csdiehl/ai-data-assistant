import React from "react"
import styled from "styled-components"
import { primary } from "./settings"

interface Props {
  signOut: () => void
  credits: number
  name: string | null
}

const Container = styled.div`
  color: grey;
  display: flex;
  flex-direction: column;
  gap: 4px;

  p {
    margin: 4px 0;
  }
`

const LogOut = styled.button`
  all: unset;
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }
`

const Credits = styled.div`
  padding: 0 4px;
  border: 1px solid ${primary};
  color: ${primary};
  border-radius: 4px;
`

const Profile = ({ signOut, credits, name }: Props) => {
  return (
    <Container>
      <p>{name}</p>
      <Credits>
        <p>{credits} Credits</p>
      </Credits>
      <LogOut onClick={() => signOut()}>Log Out</LogOut>
    </Container>
  )
}

export default Profile
