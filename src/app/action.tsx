import { OpenAI } from "openai"
import { createAI, getMutableAIState, render } from "ai/rsc"
import { z } from "zod"
import Card from "./Card"
import Description from "./Description"
import Chart from "./Chart"
import BarChart from "./BarChart"
import { sum, max, mean } from "d3-array"

const nameVar = "Name"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// An example of a spinner component. You can also import your own components,
// or 3rd party component libraries.
function Spinner() {
  return <div>Loading...</div>
}

// An example of a function that fetches flight information from an external API.
function summarizeData(
  data: any[],
  {
    category,
    operation,
  }: {
    category: string
    operation: "sum" | "max" | "mean"
  }
) {
  console.log(category, operation)
  return operation === "sum"
    ? sum(data, (d) => d[category])
    : operation === "max"
    ? max(data, (d) => d[category])
    : mean(data, (d) => d[category])
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

  // const dataset: string = JSON.stringify(aiState.get().dataset)

  // The `render()` creates a generated, streamable UI.
  const ui = render({
    model: "gpt-3.5-turbo",
    provider: openai,
    messages: [
      {
        role: "system",
        content: `\
You are a data visualization assistant. Your job is to help the user understand a dataset that they have.
You can summarize data for the user, give them insights about the type of data they have, or generate simple charts for them.  

If the user asks for a general description of the dataset, call \`describe_dataset\`
If the user uses for a superlative like highest, most, least, or fewest, call \`sort_data\`
If the user includes terms like mean, sum, maximum or how many - call \`summarize_data\` to give them the results.
If you need to make a chart to show the relationship between two or more variables, call \`render_chart\`.

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
          dataset: aiState.get().dataset,
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
            category: z.string().describe("The variable to sort by."),
            order: z
              .union([z.literal("ascending"), z.literal("descending")])
              .describe(
                "Whether to sort the data by biggest first (descending) or smallest first (ascending)."
              ),
          })
          .required(),
        render: async function* ({ category, order }) {
          yield <Spinner />

          const data = aiState.get().dataset
          const sorted = sortData(data, { category, order })
          return (
            <BarChart
              data={sorted}
              x={category}
              y={nameVar}
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
            x: z.string().describe("The x-axis variable."),
            y: z.string().describe("The y-axis variable."),
            color: z
              .string()
              .describe(
                "The color variable. It could be a variable or just a color name."
              ),
          })
          .required(),
        render: async function* ({ x, y, color }) {
          // Show a spinner on the client while we wait for the response.
          yield <Spinner />

          const data = aiState.get().dataset

          // Update the final AI state.
          aiState.done({
            dataset: data,
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
            category: z
              .string()
              .describe(
                "The category by which the user wants to summarize the data."
              ),
            operation: z
              .union([z.literal("sum"), z.literal("max"), z.literal("mean")])
              .describe(
                "The type of aggregation the user wants. This can be sum, mean, or max."
              ),
          })
          .required(),
        render: async function* ({ category, operation }) {
          // Show a spinner on the client while we wait for the response.
          yield <Spinner />

          const data = aiState.get().dataset
          // Fetch the flight information from an external API.
          const dataSummary = summarizeData(data, { category, operation })

          // Update the final AI state.
          aiState.done({
            dataset: data,
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

          // Return the flight card to the client.
          return (
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
  messages: {
    role: "user" | "assistant" | "system" | "function"
    content: string
    id?: string
    name?: string
  }[]
} = {
  dataset: [],
  messages: [],
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
