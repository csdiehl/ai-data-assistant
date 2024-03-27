import { OpenAI } from "openai"
import { createAI, getMutableAIState, render } from "ai/rsc"
import { z } from "zod"
import Description from "./Description"
import Chart from "./Chart"
import { unionOfLiterals } from "./tools"
import Table from "./Table"
// Import the necessary modules for SQLite
import sqlite3, { Database } from "sqlite3"
import { error } from "console"
import { Card, Caption, SkeletonChart } from "./styles"
import { ReactNode } from "react"

const db = new sqlite3.Database(":memory:") // Using in-memory database for demonstration

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

  const sampleData = await queryDB("SELECT * FROM data LIMIT 3")

  console.log(createTableQuery)

  const schema = await getSchema(db, tableName)

  const aiState = getMutableAIState<typeof AI>()

  aiState.done({
    ...aiState.get(),
    tableName: "data",
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
  const { dataKey, tableName, columns } = aiState.get()
  // Force the ai to use the actual column names, even if the user provides similar-sounding names
  const cols: any = unionOfLiterals(columns)

  const chartSpecification = z.object({
    type: z
      .union([
        z.literal("bar"),
        z.literal("scatter"),
        z.literal("line"),
        z.literal("area"),
      ])
      .describe(
        "The type of chart to render to show the results of the query, based on the type of variables the user has given."
      ),
    x: cols.describe("The x-axis variable."),
    y: cols.describe("The y-axis variable."),
    color: z.optional(
      cols.describe(
        "The color variable. It could be a third variable or just a color name. Optional."
      )
    ),
    title: z
      .string()
      .describe(
        "A brief title for a chart that shows the results of the query"
      ),
  })

  const sampleData: any[] = aiState.get().sampleData
  const dbSchema: string = aiState.get().schema
  const topK: number = aiState.get().topK

  // The `render()` creates a generated, streamable UI.
  const ui = render({
    model: "gpt-3.5-turbo",
    temperature: 0,
    provider: openai,
    messages: [
      {
        role: "system",
        content: `\
You are a data visualization assistant. Your job is to help the user understand a dataset that they have.
You can summarize data for the user, give them insights about the type of data they have, or generate simple charts for them. 

Here is a sample of the dataset:
${JSON.stringify(sampleData)}

If the user asks a question about the data, create a syntactically correct sqlite3 query to run, using the following schema:
${dbSchema}
Unless the user specifies a specific number of examples they wish to obtain, always limit your query to at most ${topK} results using the LIMIT clause.
You can order the results by a relevant column to return the most interesting examples in the database.
Never query for all the columns from a specific table, only ask for a the few relevant columns given the question.
DO NOT make any DML statements (INSERT, UPDATE, DELETE, DROP etc.) to the database.
To use your query to interact with the database, call \`summarize_data\`. 

If the user just wants a general description of the dataset, call \`describe_data\`.

You can choose charts depending on the number and data type of variables in the question. The data types are described in the schema.
For just one numeric and one text variable, use a bar chart. 

For two or more numeric variables, use a scatter, line or area chart. 
-Line or area charts show how a variable has changed over time. Time goes on the x axis. 
-Scatter plots show the relationship between two or more unordered numeric variable. They could also show a category by size or color.

For two categorical variables, and one numeric, use a heatmap. 

If the user wants to complete an impossible task, respond that you are a a work in progress and cannot do that.

Besides that, you can also chat with users and do some calculations if needed.`,
      },
      { role: "user", content: userInput },
    ],
    // `text` is called when an AI returns a text response (as opposed to a tool call).
    // Its content is streamed from the LLM, so this function will be called
    // multiple times with `content` being incremental.
    text: ({ content, done }) => {
      // When it's the final content, mark the state as done and ready for the client to access.
      if (done) {
        aiState.done({
          ...aiState.get(),
          messages: [
            ...aiState.get().messages,
            {
              role: "assistant",
              content,
            },
          ],
        })
      }

      return <p>{content}</p>
    },
    tools: {
      describe_dataset: {
        description:
          "Give a general description of the data, including the variables and size of the dataset.",
        parameters: z.object({}).required(),
        render: async function* () {
          const allData = await queryDB(`SELECT * FROM ${tableName};`)
          return (
            <Description
              data={allData}
              length={allData.length}
              vars={columns}
            />
          )
        },
      },
      summarize_data: {
        description:
          "Create a summary of the data, grouping one variable by another.",
        parameters: z
          .object({
            query: z
              .string()
              .describe("The sqlite3 query that answers the user's question."),
            chartSpec: chartSpecification,
          })
          .required(),
        render: async function* ({ query, chartSpec }) {
          // Show a spinner on the client while we wait for the response.
          yield (
            <ResponseCard title={"thinking..."} caption={query}>
              <SkeletonChart />
            </ResponseCard>
          )

          const response = await queryDB(query)

          // Update the final AI state.
          aiState.done({
            ...aiState.get(),
            messages: [
              ...aiState.get().messages,
              {
                role: "function",
                name: "summarize_data",
                // Content can be any string to provide context to the LLM in the rest of the conversation.
                content: JSON.stringify(response),
              },
            ],
          })

          const { x, y, title, type, color } = chartSpec

          // TODO: passing in the y variable seems to work ok for now, but should make this more robust
          return type === "bar" ? (
            <ResponseCard title={title} caption={query}>
              <Table data={response} xVar={y} />
            </ResponseCard>
          ) : (
            <ResponseCard title={title} caption={query}>
              <Chart
                type={type}
                data={response}
                dataKey={dataKey}
                x={x}
                y={y}
                color={color}
              />
            </ResponseCard>
          )
        },
      },
    },
  })

  return {
    id: Date.now(),
    display: ui,
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
