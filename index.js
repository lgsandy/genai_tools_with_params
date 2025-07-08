import OpenAI from "openai";
import { config } from "dotenv";

config();

const openai = new OpenAI({
  apiKey: "ollama",
  baseURL: "http://localhost:11434/v1",
});

const myTools = [
  {
    name: "get_weather",
    description: "Get the weather for a specific city",
    parameters: {
      type: "object",
      properties: {
        city: { type: "string", description: "Name of the city" },
        unit: {
          type: "string",
          enum: ["celsius", "fahrenheit"],
          description: "Temperature unit",
        },
      },
      required: ["city"],
    },
  },
  {
    name: "get_stock_price",
    description: "Get the current stock price for a company symbol",
    parameters: {
      type: "object",
      properties: {
        symbol: { type: "string", description: "Stock ticker symbol" },
      },
      required: ["symbol"],
    },
  },
];

async function getWeather(city, unit) {
  return `The weather in ${city} is 30° ${
    unit === "fahrenheit" ? "F" : "C"
  } with clear skies.`;
}

async function getStockPrice(symbol) {
  return `The current stock price of ${symbol.toUpperCase()} is $142.55`;
}

async function init(msz) {
  const messages = [
   {
      role: "system",
      content: "You are a smart assistant. You can answer normal user questions and use tools when appropriate."
    },
    msz,
  ];
  const firstResponse = await openai.chat.completions.create({
    model: "qwen3:1.7b",
    messages: messages,
    tools: myTools.map((fn) => ({ type: "function", function: fn })),
    tool_choice: "auto",
  });

  const toolCalls = firstResponse.choices[0].message.tool_calls;

  const toolResponses = [];

  if (toolCalls?.length) {
    for (const toolCall of toolCalls) {
      const { name, arguments: argsJSON } = toolCall.function;
      const args = JSON.parse(argsJSON);

      let result;

      switch (name) {
        case "get_weather":
          result = await getWeather(args.city, args.unit);
          break;
        case "get_stock_price":
          result = await getStockPrice(args.symbol);
          break;
        default:
          result = "Unknown function.";
      }

      toolResponses.push({
        tool_call_id: toolCall.id,
        role: "tool",
        name,
        content: result,
      });
    }

    const finalResponse = await openai.chat.completions.create({
      model: "qwen3:1.7b",
      messages: [
        ...messages,
        firstResponse.choices[0].message,
        ...toolResponses,
      ],
    });

    console.log(finalResponse.choices[0].message.content);
  } else {
    console.log(firstResponse.choices[0].message.content);
  }
}

// init({
//   role: "user",
//   content:
//     "What's the weather in Delhi and also tell me the stock price of AAPL?",
// });
init({
  role: "user",
  content:
    "Write a c program to print hello",
});

// console.log(response.choices[0].message);
