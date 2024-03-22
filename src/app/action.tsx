import { OpenAI } from "openai"
import { createAI, getMutableAIState, render } from "ai/rsc"
import { z } from "zod"
import Card from "./Card"
import Description from "./Description"
import Chart from "./Chart"
import BarChart from "./BarChart"
import defaultData from "./cars.json"
import { unionOfLiterals, summarizeData, sortData } from "./tools"

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
  const allowedOperations = z.union([
    z.literal("sum"),
    z.literal("max"),
    z.literal("mean"),
    z.literal("count"),
  ])

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

If the user asks for a general description of the dataset, call \`describe_dataset\`
If the user wants to rank the data or uses a superlative like highest, most, least, or fewest, call \`sort_data\`
If the user wants a summary of the data, for example the average or total for each category, call \`summarize_data\`.
If the user wants to know the relationship between two or more numerical variables, call \`describe_relationship\`.

You can choose different charts depending on the question.
-Line charts show how data has changed over time. The time variable should be on the x axis. 
-Scatter plots show the relationship between two or more numeric variables, or how one variable depends on another.
-Bar charts show how a numeric variable differs between different categories. 
-Area charts show change over time for two or more variables that together add up to a whole. 

Here are some examples of queries the user might give you, and the tools you could use to respond: 

---
user input: what cars have the best horsepower
tool: \`sort_data\`
parameters: { category: "Horsepower", order: "descending" }

user input: what is the average horsepower in each country
tool: \`summarize_data\`
parameters: { variable: "Horsepower", operation: "mean", category: "Origin" }

user input: what is the total horsepower
tool: \`summarize_data\`
parameters: { category: "Horsepower", operation: "sum" }

user input: How has average acceleration changed over time? 
tool: \`summarize_data\`
parameters: { variable: "Acceleration", category: "Year", operation: "mean",  chartType: line"}

user input: What is the relationship between horsepower and acceleration? 
tool: \`describe_relationship\`
parameters: { y: "Horsepower", x: "Acceleration", type: "scatter" }

---

This is the data you summarized for the user based on their previous question: 
${JSON.stringify(dataSummary)}
You can use it to answer follow-up questions. 

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
      sort_data: {
        description: "Sort the data by a variable.",
        parameters: z
          .object({
            category: cols.describe("The variable to sort by."),
            order: z
              .union([z.literal("ascending"), z.literal("descending")])
              .describe(
                "Whether to sort the data by biggest first (descending) or smallest first (ascending)."
              ),
          })
          .required(),
        render: async function* ({ category, order }) {
          yield <Spinner />

          const sorted = sortData(dataset, { category, order })
          return (
            <BarChart
              data={sorted}
              x={category}
              y={dataKey}
              sortOrder={order}
            />
          )
        },
      },
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

          // Return the flight card to the client.
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
            variable: cols.describe(
              "The variable by which the user wants to summarize the data."
            ),
            operation: allowedOperations.describe(
              "The type of aggregation the user wants."
            ),
            filterCategory: z.optional(
              cols.describe(
                "The category to filter the data by. This is optional"
              )
            ),
            filterValue: z.optional(
              z
                .string()
                .describe("The value to filter the data by. This is optional")
            ),
            category: z.optional(
              cols.describe(
                "the variable to group the data by before performing the aggregation. If the user doesn't specify a variable to group by, do not include this parameter."
              )
            ),
            description: z
              .string()
              .describe(
                "a short description, no more than a few sentences, that answers the user's question."
              ),
            chartType: z
              .union([z.literal("bar"), z.literal("line"), z.literal("area")])
              .describe(
                "The type of chart to render, based on the type of variables the user has given."
              ),
          })
          .required(),
        render: async function* ({
          variable,
          operation,
          category,
          description,
          chartType,
          filterValue,
          filterCategory,
        }) {
          // Show a spinner on the client while we wait for the response.
          yield <Spinner />

          // get a summary of the data using D3

          // optional data filtering
          const filteredData =
            filterCategory && filterValue
              ? dataset.filter((d) => d[filterCategory] === filterValue)
              : dataset

          const dataSummary = summarizeData(filteredData, {
            variable,
            operation,
            category,
          })

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

          const x = chartType === "bar" ? "value" : "category"
          const y = chartType === "bar" ? "category" : "value"

          return dataSummary?.length > 1 ? (
            <Chart
              dataKey={dataKey}
              type={chartType}
              data={dataSummary}
              x={x}
              y={y}
              description={description}
              trace={`Getting the ${operation} of ${variable} for each ${category}. Filtering ${filterCategory} for ${filterValue}.`}
            />
          ) : (
            <Card description={description} answer={dataSummary[0].value} />
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
