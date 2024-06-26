import { OpenAI } from "openai"
import { createAI, getMutableAIState, createStreamableUI } from "ai/rsc"
import { z } from "zod"
import Chart from "@/components/Chart"
import Table from "@/components/Table"
// Import the necessary modules for SQLite
import sqlite3, { Database } from "sqlite3"
import { error } from "console"
import { Card, Caption, SkeletonChart } from "@/components/styles"
import { ReactNode } from "react"
import { runOpenAICompletion } from "@/lib/utils"
import TimeChart from "@/components/TimeChart"
import BarChart from "@/components/BarChart"

let db: any = null

function ResponseCard({
  title,
  caption,
  children,
}: {
  title: string
  caption: string
  children: ReactNode
}) {
  "use client"
  return (
    <Card>
      <h2>{title}</h2>
      {children}
      <Caption>{caption}</Caption>
    </Card>
  )
}

async function setupDB(file: string) {
  "use server"

  const parsedData = JSON.parse(file)
  const columns = parsedData[0]
  const data = parsedData.slice(1, parsedData.length)
  const dataKey = columns[0]
  const tableName = "data"

  db = new sqlite3.Database(":memory:") // Using in-memory database for demonstration

  // Create table with columns
  const createTableQuery = `CREATE TABLE IF NOT EXISTS ${tableName} (${columns
    .map((column: string, i: number) => {
      const dataType = typeof data[0][i]

      const sqlType = Number.isInteger(data[0][i])
        ? "REAL"
        : dataType === "number"
        ? "INTEGER"
        : "TEXT"

      return `${column} ${sqlType}`
    })
    .join(", ")})`

  db.serialize(() => {
    db.run(createTableQuery)

    // Insert data into the table
    const insertQuery = `INSERT INTO ${tableName} (${columns.join(
      ", "
    )}) VALUES (${columns.map(() => "?").join(", ")})`
    const stmt = db.prepare(insertQuery)

    data.forEach((row: any[]) => {
      stmt.run(row)
    })

    stmt.finalize()
  })

  const allData = await queryDB("SELECT * FROM data LIMIT 10000")
  const sampleData = allData.slice(0, 3)

  const schema = await getSchema(db, tableName)

  const aiState = getMutableAIState<typeof AI>()

  aiState.done({
    ...aiState.get(),
    tableName: "data",
    dataSummary: allData,
    dataKey,
    columns,
    sampleData,
    schema,
    topK: 5000,
  })
}

// Function to retrieve schema
function getSchema(db: Database, tableName: string): Promise<string> {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT * FROM sqlite_master WHERE type='table' AND name='${tableName}'`,
      (err, rows) => {
        if (err) {
          reject(err)
        } else {
          //@ts-ignore - a bit worried about this
          const schema = rows[0].sql
          resolve(schema)
        }
      }
    )
  })
}

// Function to execute a query and return rows
function queryDB(query: string): Promise<any[]> {
  if (!db) {
    throw error("no db connected!")
  }

  return new Promise((resolve, reject) => {
    db.all(query, (err: any, rows: any[]) => {
      if (err) {
        reject(err)
      } else {
        resolve(rows)
      }
    })
  })
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

async function submitUserMessage(userInput: string) {
  "use server"

  const aiState = getMutableAIState<typeof AI>()

  // Update the AI state with the new user message.
  aiState.update({
    ...aiState.get(),
    messages: [
      ...aiState.get().messages,
      {
        role: "user",
        content: userInput,
      },
    ],
  })

  // metadata that is needed to answer queries
  const { dataKey } = aiState.get()

  const sampleData: any[] = aiState.get().sampleData
  const dbSchema: string = aiState.get().schema
  const topK: number = aiState.get().topK

  const reply = createStreamableUI(
    <ResponseCard title={"thinking..."} caption={""}>
      <SkeletonChart />
    </ResponseCard>
  )

  // The `render()` creates a generated, streamable UI.
  const completion = runOpenAICompletion(openai, {
    model: "gpt-3.5-turbo",
    temperature: 0,
    messages: [
      {
        role: "system",
        content: `\
You are a data visualization assistant. Your job is to help the user understand a dataset that they have.
You can summarize data for the user, give them insights about the type of data they have, or generate simple charts for them. 

Here is a sample of the dataset:
${JSON.stringify(sampleData)}

If the user just asks a general question about the data, without mentioning anything in the sample, just respond with text. 

If the user asks a question about the data, create a syntactically correct sqlite3 query to run, using the following schema:
${dbSchema}
You can sort the results by a relevant column to return the most interesting examples in the database.
Never query for all the columns from a specific table, only ask for a the few relevant columns given the question.
DO NOT make any DML statements (INSERT, UPDATE, DELETE, DROP etc.) to the database.
To use your query to interact with the database, call \`summarize_data\`. 

You can choose charts depending on the number and data type of variables in the question. The data types are described in the schema.
If there are less than 15 rows in the result, always put 'table' for the chart type, unless the user says they want a chart. Limit tables to at most 20 rows using the limit clause in your SQL query.
For just one numeric and one text variable, use a bar chart. For barY, the text variable should be on the x axis. 
For barX, the text variable should be on the y axis.

Line or area charts show how a variable has changed over time. In line or area charts, time goes on the x axis. 

For two or more numeric variables, use a scatter, line or area chart. 
-Scatter plots show the relationship between two or more unordered numeric variable. They can also show categories by size and color.
-Density can be used for a scatter plot with a lot of points.

For two categorical variables, and one numeric, use a heatmap. 

If the user wants to complete an impossible task, respond that you are a a work in progress and cannot do that.

Besides that, you can also chat with users and do some calculations if needed.`,
      },
      { role: "user", content: userInput },
    ],
    functions: [
      {
        name: "summarize_data",
        description:
          "Create a summary of the data, grouping one variable by another.",
        parameters: z
          .object({
            query: z
              .string()
              .describe("The sqlite3 query that answers the user's question."),
            chartSpec: z.object({
              type: z
                .union([
                  z.literal("table"),
                  z.literal("barX"),
                  z.literal("barY"),
                  z.literal("scatter"),
                  z.literal("line"),
                  z.literal("area"),
                  z.literal("heatmap"),
                  z.literal("density"),
                ])
                .describe(
                  "The type of chart to render to show the results of the query, based on the type of variables the user has given. For simple queries with one text and one numeric variable, always use a table, unless the user requests a chart."
                ),
              x: z.string().describe("The x-axis variable."),
              y: z.string().describe("The y-axis variable."),
              timeFormat: z
                .string()
                .optional()
                .describe(
                  "If this is a line chart, include this field. This is the format specifier for the time field on the x axis. For example, for dates like 1970-01-01, the specifier would be %Y-%m-%d"
                ),
              size: z
                .string()
                .optional()
                .describe("The variable to be represented by size."),
              color: z.optional(
                z.string().describe("The variable to be represented by color.")
              ),
              title: z
                .string()
                .describe(
                  "A brief title for a chart that shows the results of the query"
                ),
            }),
          })
          .required(),
      },
    ],
  })

  // called when the ai just returns a text response
  completion.onTextContent((content: string, isFinal: boolean) => {
    reply.update(
      <ResponseCard title={""} caption={""}>
        <p>{content}</p>
      </ResponseCard>
    )
    if (isFinal) {
      reply.done()
      aiState.done({
        ...aiState.get(),
        messages: [...aiState.get().messages, { role: "assistant", content }],
      })
    }
  })

  completion.onFunctionCall("summarize_data", async ({ query, chartSpec }) => {
    const { x, y, title, type, color, size, timeFormat } = chartSpec

    reply.update(
      <ResponseCard title={title} caption={query}>
        <SkeletonChart>
          Building {type} chart of {x}, {y}, {color}
        </SkeletonChart>
      </ResponseCard>
    )

    const response = await queryDB(query)

    const component = (
      <ResponseCard title={title} caption={query}>
        {type === "table" ? (
          <Table data={response} xVar={x} />
        ) : type === "line" || type === "area" ? (
          <TimeChart
            type={type}
            data={response}
            dataKey={dataKey}
            x={x}
            y={y}
            color={color}
            timeFormat={timeFormat}
          />
        ) : type === "barX" || type === "barY" ? (
          <BarChart
            type={type}
            data={response}
            dataKey={dataKey}
            x={x}
            y={y}
            color={color}
          />
        ) : (
          <Chart
            type={type}
            data={response}
            dataKey={dataKey}
            x={x}
            y={y}
            size={size}
            color={color}
          />
        )}
      </ResponseCard>
    )

    reply.done(component)

    // Update the final AI state.
    aiState.done({
      ...aiState.get(),
      dataSummary: response,
      messages: [
        ...aiState.get().messages,

        {
          role: "function",
          name: "summarize_data",
          // Content can be any string to provide context to the LLM in the rest of the conversation.
          content: `answered question using ${query}. Data from this answer is saved in the data summmary`,
        },
      ],
    })
  })

  return {
    id: Date.now(),
    display: reply.value,
  }
}

// Define the initial state of the AI. It can be any JSON object.
const initialAIState: {
  sampleData: any[]
  dataKey: string
  columns: string[]
  tableName: string
  schema: string
  topK: number
  dataSummary: any[]
  messages: {
    role: "user" | "assistant" | "system" | "function"
    content: string
    id?: string
    name?: string
  }[]
} = {
  sampleData: [],
  dataKey: "",
  messages: [],
  columns: [],
  tableName: "",
  schema: "",
  topK: 5000,
  dataSummary: [], // this will hold all the data for a short time, then summaries
}

// The initial UI state that the client will keep track of, which contains the message IDs and their UI nodes.
const initialUIState: {
  id: number
  display: React.ReactNode
}[] = []

// AI is a provider you wrap your application with so you can access AI and UI state in your components.
export const AI = createAI({
  actions: {
    submitUserMessage,
    setupDB,
  },
  // Each state can be any shape of object, but for chat applications
  // it makes sense to have an array of messages. Or you may prefer something like { id: number, messages: Message[] }
  initialUIState,
  initialAIState,
})
