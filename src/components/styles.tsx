"use client"

import styled from "styled-components"

export const Card = styled.div`
  padding: 8px;
  border-radius: 8px;

  h2 {
    margin: 16px 0;
    font-size: 1.2rem;
    line-height: 1.5rem;
  }
`
export const SkeletonChart = styled.div`
  border-radius: 8px;
  width: 100%;
  padding: 16px;
  background: linear-gradient(0.25turn, lightgrey, 10%, steelblue);
  opacity: 0.7;
  height: 500px;
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
  color: #999;
  font-size: 0.875rem;
  line-height: 1rem;
  padding: 8px 0px;
`
export const MenuButton = styled.button`
  all: unset;
  padding: 4px;
  font-size: 0.875rem;
  line-height: 1rem;
  color: #555;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  border: none;
  cursor: pointer;

  &:hover {
    background: rgba(0, 0, 0, 0.2);
  }
`
