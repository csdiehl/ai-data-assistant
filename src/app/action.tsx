import { OpenAI } from "openai"
import { createAI, getMutableAIState, render } from "ai/rsc"
import { z } from "zod"
import Description from "./Description"
import Chart from "./Chart"
import { unionOfLiterals } from "./tools"
import Table from "./Table"
// Import the necessary modules for SQLite
import sqlite3 from "sqlite3"
import { open } from "sqlite"
import { error } from "console"
import dataConfig from "./dataConfig"

let db: any = null

async function setupDB(fileName: string) {
  "use server"

  const path = `${process.cwd()}/exampleData/${fileName}`

  // Open a new connection if there is none
  if (!db) {
    db = await open({
      filename: path,
      driver: sqlite3.Database,
    })
  }

  const tables = await queryDB(
    "select name from sqlite_master where type='table'"
  )

  const firstTable = tables[0].name
  const sampleData = await queryDB(`SELECT * FROM ${firstTable} LIMIT 3`)

  const columns = Object.keys(sampleData[0])
  const dataKey = columns[0]

  const aiState = getMutableAIState<typeof AI>()

  aiState.done({
    ...aiState.get(),
    tableName: firstTable,
    dataKey,
    columns,
    sampleData,
    schema: dataConfig.dbSchema, // need to remove this later
    topK: 5000,
  })
}

async function queryDB(query: string): Promise<any[]> {
  // Open a new connection if there is none
  if (!db) {
    throw error("no db connected!")
  }

  // Query to get all todos from the "todo" table
  const data = await db.all(query)
  return data
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// An example of a spinner component. You can also import your own components,
// or 3rd party component libraries.
function Spinner() {
  return <div>Loading...</div>
}

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
  const dataSummary: any[] = aiState.get().dataSummary
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
If the user just wants to show the general relationship between two or more variables, call \`describe_relationship\`

You can choose different charts depending on the question.
-Line charts show how data has changed over time. The time variable should be on the x axis. 
-Scatter plots show the relationship between two or more numeric variables, or how one variable depends on another.
-Bar charts show how a numeric variable differs between different categories. 
For a horizontal bar chart the numeric variable should be on the x axis and the category on the y axis. For a vertical bar chart it should be the reverse.
-Area charts show change over time for two or more variables that together add up to a whole. 

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
      describe_relationship: {
        description:
          "Describe the relationship between two variables, or how one depends on another.",
        parameters: chartSpecification,
        render: async function* ({ x, y, color, title }) {
          // Show a spinner on the client while we wait for the response.
          yield <Spinner />

          const chartData = await queryDB(
            `SELECT ${x}, ${y} from ${tableName} LIMIT 5000`
          )

          // Update the final AI state.
          aiState.done({
            ...aiState.get(),
            messages: [
              ...aiState.get().messages,
              {
                role: "function",
                name: "describe_relationship",
                // Content can be any string to provide context to the LLM in the rest of the conversation.
                content: `scatterplot of ${x} and ${y}`,
              },
            ],
          })

          // fix string types to number - super temporary hack. TODO: change this in the upload
          chartData.forEach((d) => {
            d[x] = +d[x]
            d[y] = +d[y]
          })

          return (
            <Chart
              dataKey={dataKey}
              type="scatter"
              data={chartData}
              x={x}
              y={y}
              color={color}
              description={title}
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
          yield <Spinner />

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
                content: JSON.stringify(dataSummary),
              },
            ],
          })

          const { x, y, title, type, color } = chartSpec

          // TODO: passing in the y variable seems to work ok for now, but should make this more robust
          return type === "bar" ? (
            <Table data={response} title={title} query={query} xVar={y} />
          ) : (
            <Chart
              type={type}
              data={response}
              dataKey={dataKey}
              x={x}
              y={y}
              color={color}
              description={title}
              query={query}
            />
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
  dataSummary: any[]
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
  dataSummary: [],
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
