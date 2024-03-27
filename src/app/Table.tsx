"use client"

import styled from "styled-components"
import { max } from "d3-array"
import React from "react"

const TableContainer = styled.table`
  th,
  td {
    text-align: left;
  }
`

const Row = styled.tr``
const Header = styled.th`
  padding: 8px;
`
const Cell = styled.td`
  padding: 8px;
  height: 50px;
  border-bottom: 1px solid #fff;
  text-transform: capitalize;
`
const Bar = styled.span<{ width: number }>`
  background: steelblue;
  height: 8px;
  width: ${(props) => props.width}%;
  display: inline-block;
`

const Table = ({ data, xVar }: { data: Object[]; xVar: string }) => {
  const headers = Object.keys(data[0])

  //@ts-ignore
  const highest = max(data, (d) => d[xVar])

  return (
    <TableContainer>
      <thead>
        <Row>
          {headers.map((header, i) => (
            <Header key={i}>{header}</Header>
          ))}
          <Header>Chart</Header>
        </Row>
      </thead>
      <tbody>
        {data.map((row, i) => {
          const values = Object.values(row)

          return (
            <Row key={i}>
              {values.map((value) => {
                const isNumber = typeof value === "number"
                return isNumber ? (
                  <React.Fragment key={value}>
                    <Cell>{value.toFixed(2)}</Cell>
                    <Cell style={{ width: "100%" }} key={i}>
                      <Bar width={(value / highest) * 100} />
                    </Cell>
                  </React.Fragment>
                ) : (
                  <Cell key={value}>{value}</Cell>
                )
              })}
            </Row>
          )
        })}
      </tbody>
    </TableContainer>
  )
}

export default Table
