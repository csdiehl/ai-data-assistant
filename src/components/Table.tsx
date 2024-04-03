"use client"

import styled from "styled-components"
import { max } from "d3-array"
import React from "react"
import Controls from "./Controls"
import { primary } from "./settings"

const TableContainer = styled.table`
  th,
  td {
    text-align: left;
  }
`

const Row = styled.tr`
  color: #555;
`
const Header = styled.th`
  padding: 8px;
  color: #333;
`
const Cell = styled.td`
  padding: 8px;
  height: 50px;
  border-bottom: 1px solid #fff;
  text-transform: capitalize;
`
const Bar = styled.span<{ width: number }>`
  background: linear-gradient(to right, teal, ${primary});
  opacity: 0.8;
  height: 4px;
  border-radius: 4px;
  width: ${(props) => props.width}%;
  display: inline-block;
`

const Table = ({ data, xVar }: { data: Object[]; xVar: string }) => {
  const headers = Object.keys(data[0])

  //@ts-ignore
  const highest = max(data, (d) => d[xVar])

  return (
    <>
      <Controls data={data} />
      <TableContainer>
        <thead>
          <Row>
            {headers.map((header, i) => (
              <Header key={i}>{header}</Header>
            ))}
          </Row>
        </thead>
        <tbody>
          {data.slice(0, 30).map((row, i) => {
            const values = Object.values(row)

            return (
              <Row key={i}>
                {values.map((value) => {
                  const isNumber = typeof value === "number"
                  return isNumber ? (
                    <Cell
                      style={{
                        width: "100%",
                        minWidth: "max(300px, 100%)",
                        display: "flex",
                        flexDirection: "column",
                        gap: "2px",
                      }}
                      key={value}
                    >
                      <p style={{ fontSize: ".875rem", lineHeight: ".9rem" }}>
                        {value.toFixed(2)}
                      </p>
                      <Bar width={(value / highest) * 100} />
                    </Cell>
                  ) : (
                    <Cell key={value}>{value}</Cell>
                  )
                })}
              </Row>
            )
          })}
        </tbody>
      </TableContainer>
    </>
  )
}

export default Table
