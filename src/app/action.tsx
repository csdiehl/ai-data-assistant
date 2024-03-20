import { OpenAI } from "openai"
import { createAI, getMutableAIState, render } from "ai/rsc"
import { z } from "zod"
import Card from "./Card"
import Description from "./Description"
import Chart from "./Chart"
import BarChart from "./BarChart"
import { sum, max, mean, rollups } from "d3-array"
import defaultData from "./cars.json"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// An example of a spinner component. You can also import your own components,
// or 3rd party component libraries.
function Spinner() {
  return <div>Loading...</div>
}

function unionOfLiterals<T extends string | number>(constants: readonly T[]) {
  const literals = constants.map((x) => z.literal(x)) as unknown as readonly [
    z.ZodLiteral<T>,
    z.ZodLiteral<T>,
    ...z.ZodLiteral<T>[]
  ]
  return z.union(literals)
}

// An example of a function that fetches flight information from an external API.
// TODO test this out before you give it to the AI
function summarizeData(
  data: any[],
  {
    category,
    operation,
    group,
  }: {
    category: string
    operation: "sum" | "max" | "mean" | "count"
    group?: string
  }
): number | Array<[string, number]> {
  const f = (dataset: any[]) => {
    switch (operation) {
      case "sum":
        return sum(dataset, (d) => d[category])
      case "max":
        return max(dataset, (d) => d[category])
      case "mean":
        return mean(dataset, (d) => d[category])
      case "count":
        return dataset.length
    }
  }

  return group
    ? rollups(
        data,
        (v) => f(v),
        (d) => d[group]
      ).map((d) => ({ category: d[0], value: d[1] }))
    : f(data)
}

function sortData(
  data: any[],
  {
    category,
    order,
    topK = 20,
  }: {
    category: string
    order: "ascending" | "descending"
    topK?: number
  }
) {
  return data
    .toSorted((a, b) =>
      order === "ascending"
        ? a[category] - b[category]
        : b[category] - a[category]
    )
    .slice(0, topK)
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

  // const dataset: string = JSON.stringify(aiState.get().dataset)

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
If you need to produce a chart, graph or plot, call \`render_chart\`.

You can choose different charts depending on the question.
-Line charts show how data has changed over time. The time variable should be on the x axis. 
-Scatter plots show the relationship between two or more variables, or how one variable depends on another.
-Bar charts show how a numeric variable differs between different categories. 
-Area charts show change over time for two or more variables that together add up to a whole. 

Here are some examples of queries the user might give you, and the tools you could use to respond: 

---
user input: what cars have the best horsepower
tool: \`sort_data\`
parameters: { category: "Horsepower", order: "descending" }

user input: what is the average horsepower in each country
tool: \`summarize_data\`
parameters: { category: "Horsepower", operation: "mean", group: "Origin" }

user input: what is the total horsepower
tool: \`summarize_data\`
parameters: { category: "Horsepower", operation: "sum" }

user input: How has acceleration changed over time in each country of origin? 
tool: \`render_chart\`
parameters: { y: "Acceleration", x: "Year", color: "Origin", type: "line" }

user input: What is the relationship between horsepower and acceleration? 
tool: \`render_chart\`
parameters: { y: "Horsepower", x: "Acceleration", type: "scatter" }

---

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

          const { dataset, dataKey } = aiState.get()
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
          const dataset: any[] = aiState.get().dataset
          return (
            <Description
              length={dataset.length}
              vars={Object.keys(dataset[0])}
            />
          )
        },
      },
      render_chart: {
        description:
          "Render a chart based on the variables the user has provided.",
        parameters: z
          .object({
            type: z
              .union([
                z.literal("area"),
                z.literal("line"),
                z.literal("bar"),
                z.literal("scatter"),
              ])
              .describe("The type of chart to render."),
            x: cols.describe("The x-axis variable."),
            y: cols.describe("The y-axis variable."),
            color: z.optional(
              z
                .string()
                .describe(
                  "The color variable. It could be a variable or just a color name."
                )
            ),
          })
          .required(),
        render: async function* ({ x, y, color }) {
          // Show a spinner on the client while we wait for the response.
          yield <Spinner />

          const data = aiState.get().dataset

          // Update the final AI state.
          aiState.done({
            ...aiState.get(),
            messages: [
              ...aiState.get().messages,
              {
                role: "function",
                name: "render_chart",
                // Content can be any string to provide context to the LLM in the rest of the conversation.
                content: `scatterplot of ${x} and ${y}`,
              },
            ],
          })

          // Return the flight card to the client.
          return <Chart data={data} x={x} y={y} color={color} />
        },
      },

      summarize_data: {
        description:
          "Create a summary of the data, grouping one variable by another.",
        parameters: z
          .object({
            category: cols.describe(
              "The category by which the user wants to summarize the data."
            ),
            operation: z
              .union([
                z.literal("sum"),
                z.literal("max"),
                z.literal("mean"),
                z.literal("count"),
              ])
              .describe("The type of aggregation the user wants."),
            group: z.optional(
              cols.describe(
                "the variable to group the data by before performing the aggregation. If the user doesn't specify a group, do not include this parameter."
              )
            ),
            description: z
              .string()
              .describe(
                "a short description, no more than a few sentences, that answers the user's question."
              ),
            chartType: z
              .union([z.literal("bar"), z.literal("line")])
              .describe(
                "The type of chart to render, based on the type of variables the user has given."
              ),
          })
          .required(),
        render: async function* ({
          category,
          operation,
          group,
          description,
          chartType,
        }) {
          // Show a spinner on the client while we wait for the response.
          yield <Spinner />

          const data = aiState.get().dataset
          // get a summary of the data using D3
          const dataSummary = summarizeData(data, {
            category,
            operation,
            group,
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

          // Return the flight card to the client.
          return Array.isArray(dataSummary) ? (
            <Chart
              type={chartType}
              data={dataSummary}
              x={x}
              y={y}
              description={description}
            />
          ) : (
            <Card category={category} type={operation} answer={dataSummary} />
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
  messages: {
    role: "user" | "assistant" | "system" | "function"
    content: string
    id?: string
    name?: string
  }[]
} = {
  dataset: [],
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

// what cars have the most horsepower?
