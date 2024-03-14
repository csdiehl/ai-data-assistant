"use client"

import { FlightInfo } from "./action"
import styled from "styled-components"

const Card = styled.div`
  border: 1px solid #ccc;
  background: #fff;
  padding: 8px;
  border-radius: 8px;

  h2 {
    margin: 16px 0;
  }
`

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  grid-template-rows: 50px 50px;
`

const Answer = styled.p`
  font-size: 1.5rem;
  font-weight: bold;
`

// An example of a flight card component.
function FlightCard({ flightInfo }: { flightInfo: FlightInfo }) {
  return (
    <Card>
      <h2>Flight Information</h2>
      <Grid>
        <p>Flight Number</p>
        <p>Departure</p>
        <p>Arrival</p>
        <Answer>{flightInfo.flightNumber}</Answer>
        <Answer>{flightInfo.departure}</Answer>
        <Answer>{flightInfo.arrival}</Answer>
      </Grid>
    </Card>
  )
}

export default FlightCard
