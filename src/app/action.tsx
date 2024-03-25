import { OpenAI } from "openai"
import { createAI, getMutableAIState, render } from "ai/rsc"
import { z } from "zod"
import Description from "./Description"
import Chart from "./Chart"
import defaultData from "./cars.json"
import { unionOfLiterals } from "./tools"
import Table from "./Table"

const dbSchema = `CREATE TABLE titanic("PassengerId" TEXT,
  "Survived" TEXT,
  "Pclass" TEXT,
  "Name" TEXT,
  "Sex" TEXT,
  "Age" TEXT,
  "SibSp" TEXT,
  "Parch" TEXT,
  "Ticket" TEXT,
  "Fare" TEXT,
  "Cabin" TEXT,
  "Embarked" TEXT
);`

const exampleData = [
  {
    PassengerId: "2",
    Survived: "1",
    Pclass: "1",
    Name: "Cumings, Mrs. John Bradley (Florence Briggs Thayer)",
    Sex: "female",
    Age: 38,
    SibSp: "1",
    Parch: "0",
    Ticket: "PC 17599",
    Fare: 71.2833,
    Cabin: "C85",
    Embarked: "C",
  },
  {
    PassengerId: "3",
    Survived: "1",
    Pclass: "3",
    Name: "Heikkinen, Miss. Laina",
    Sex: "female",
    Age: 26,
    SibSp: "0",
    Parch: "0",
    Ticket: "STON/O2. 3101282",
    Fare: 7.925,
    Cabin: null,
    Embarked: "S",
  },
  {
    PassengerId: "4",
    Survived: "1",
    Pclass: "1",
    Name: "Futrelle, Mrs. Jacques Heath (Lily May Peel)",
    Sex: "female",
    Age: 35,
    SibSp: "1",
    Parch: "0",
    Ticket: "113803",
    Fare: 53.1,
    Cabin: "C123",
    Embarked: "S",
  },
  {
    PassengerId: "5",
    Survived: "0",
    Pclass: "3",
    Name: "Allen, Mr. William Henry",
    Sex: "male",
    Age: 35,
    SibSp: "0",
    Parch: "0",
    Ticket: "373450",
    Fare: 8.05,
    Cabin: null,
    Embarked: "S",
  },
]

// Import the necessary modules for SQLite
import sqlite3 from "sqlite3"
import { open } from "sqlite"

let db: any = null

async function queryDB(query: string): Promise<any[]> {
  // Open a new connection if there is none
  if (!db) {
    db = await open({
      filename: process.cwd() + "/titanic.db",
      driver: sqlite3.Database,
    })
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

  // Force the ai to use the actual column names, even if the user provides similar-sounding names
  const cols: any = unionOfLiterals(aiState.get().columns)

  const { dataset, dataKey } = aiState.get()
  const dataSummary: any[] = aiState.get().dataSummary

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
${JSON.stringify(exampleData)}

If the user asks a question about the data, create a syntactically correct sqlite3 query to run, using the following schema:
${dbSchema}
Unless the user specifies a specific number of examples they wish to obtain, always limit your query to at most 20 results using the LIMIT clause.
You can order the results by a relevant column to return the most interesting examples in the database.
Never query for all the columns from a specific table, only ask for a the few relevant columns given the question.
DO NOT make any DML statements (INSERT, UPDATE, DELETE, DROP etc.) to the database.
To use your query to interact with the database, call \`summarize_data\`. 

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
          return (
            <Description
              data={dataset}
              length={dataset.length}
              vars={Object.keys(dataset[0])}
            />
          )
        },
      },
      describe_relationship: {
        description:
          "Describe the relationship between two variables, or how one variable depends on another.",
        parameters: z
          .object({
            x: cols.describe("The x-axis variable."),
            y: cols.describe("The y-axis variable."),
            color: z.optional(
              cols.describe(
                "The color variable. It could be a third variable or just a color name."
              )
            ),
          })
          .required(),
        render: async function* ({ x, y, color }) {
          // Show a spinner on the client while we wait for the response.
          yield <Spinner />

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

          return (
            <Chart
              dataKey={dataKey}
              type="scatter"
              data={dataset}
              x={x}
              y={y}
              color={color}
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
            chartSpec: z.object({
              x: z
                .string()
                .describe(
                  "The variable that is being averaged, summed or counted in the query."
                ),
              title: z
                .string()
                .describe(
                  "A brief title for a chart that shows the results of the query"
                ),
            }),
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

          const { x, title } = chartSpec

          return <Table data={response} title={title} query={query} xVar={x} />
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
  dataset: any[]
  dataKey: string
  columns: string[]
  dataSummary: any[]
  messages: {
    role: "user" | "assistant" | "system" | "function"
    content: string
    id?: string
    name?: string
  }[]
} = {
  dataset: [],
  dataSummary: [],
  dataKey: Object.keys(defaultData[0])[0],
  messages: [],
  columns: Object.keys(defaultData[0]),
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
  },
  // Each state can be any shape of object, but for chat applications
  // it makes sense to have an array of messages. Or you may prefer something like { id: number, messages: Message[] }
  initialUIState,
  initialAIState,
})

/**
 * 
 *  type: z
                .union([
                  z.literal("horizontal bar"),
                  z.literal("vertical bar"),
                  z.literal("scatter"),
                  z.literal("line"),
                  z.literal("area"),
                ])
                .describe(
                  "The type of chart to render to show the results of the query, based on the type of variables the user has given."
                ),
 */
