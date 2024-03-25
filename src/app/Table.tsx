"use client"

import styled from "styled-components"
import { Caption, Card } from "./styles"
import { max } from "d3-array"

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

const Table = ({
  data,
  title,
  query,
  xVar,
}: {
  data: Object[]
  title: string
  query: string
  xVar: string
}) => {
  const headers = Object.keys(data[0])

  //@ts-ignore
  const highest = max(data, (d) => d[xVar])

  console.log("highest", highest)

  return (
    <Card>
      <h2>{title}</h2>
      <TableContainer>
        <Row>
          {headers.map((header, i) => (
            <Header key={i}>{header}</Header>
          ))}
          <Header>Chart</Header>
        </Row>
        {data.map((row, i) => {
          const values = Object.values(row)

          return (
            <Row key={i}>
              {values.map((value, i) => {
                const isNumber = typeof value === "number"
                return isNumber ? (
                  <>
                    <Cell key={i}>{value.toFixed(2)}</Cell>
                    <Cell style={{ width: "100%" }} key={i}>
                      <Bar width={(value / highest) * 100} />
                    </Cell>
                  </>
                ) : (
                  <Cell key={i}>{value}</Cell>
                )
              })}
            </Row>
          )
        })}
      </TableContainer>
      <Caption>
        <strong>{xVar} Query:</strong> {query}
      </Caption>
    </Card>
  )
}

export default Table
