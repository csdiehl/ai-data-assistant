import styled from "styled-components"

export const Card = styled.div`
  padding: 8px;
  border-radius: 8px;

  h2 {
    margin: 16px 0;
  }
`
export const Label = styled.li`
  list-style: none;
  font-size: 1rem;
  font-weight: 600;
  color: black;
  opacity: 0.5;
  transition: opacity 0.2s ease-in-out;

  &:hover {
    opacity: 1;
    cursor: pointer;
  }
`
export const Caption = styled.p`
  color: grey;
  font-size: 0.875rem;
  line-height: 1rem;
`
