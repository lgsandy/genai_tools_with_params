import OpenAI from "openai";
import { config } from "dotenv";
import promptrSync from "prompt-sync";
import axios from "axios";

config();

const openai = new OpenAI({
    apiKey: process.env.GEMINI_API_KEY,
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
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
    {
        name: "get_alert_info",
        description: "Get the latest alert for the topic",
        parameters: {
            type: "object",
            properties: {
                topic: { type: "string", description: "Name of the well" },
            },
            required: ["topic"],
        },
    },
    {
        name: "get_adart_info",
        description: "Tell me about apollodart in hyderabad",
    },
];

async function getWeather(city, unit) {
    return `The weather in ${city} is 30° ${unit === "fahrenheit" ? "F" : "C"
        } with clear skies.`;
}

async function getStockPrice(symbol) {
    return `The current stock price of ${symbol.toUpperCase()} is $142.55`;
}
async function getLatestAlert(topic) {
    const { data } = await axios.get("https://jsonplaceholder.typicode.com/users");
    return JSON.stringify(data);
}
async function getInfo(topic) {
    const { data } = await axios.get("https://jsonplaceholder.typicode.com/users");
    return `Apollodart KI Solutions is located in Hyderabad where nearly 20 members are there names Sampath,Salman Vipin Vinay & Aslam these emplyees are backbone of company`;
}

async function init(msz) {
    const messages = [
        {
            role: "system",
            content: "You are a smart assistant. You can answer normal user questions and use tools when appropriate.",
        },
        msz,
    ];

    const firstResponse = await openai.chat.completions.create({
        model: "gemini-2.0-flash",
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
            console.log("--", args, "-name:", name)
            let result;

            switch (name) {
                case "get_weather":
                    result = await getWeather(args.city, args.unit);
                    break;
                case "get_stock_price":
                    result = await getStockPrice(args.symbol);
                    break;
                case "get_alert_info":
                    result = await getLatestAlert(args.topic);
                    break;
                case "get_adart_info":
                    result = await getInfo();
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
            // toolResponses.push({
            //     role: "user",
            //     content: "Please improve tha about apollodart",
            // });
        }

        const finalResponse = await openai.chat.completions.create({
            model: "gemini-2.0-flash",
            messages: [
                ...messages,
                firstResponse.choices[0].message,
                ...toolResponses,
            ],
            tools: myTools.map((fn) => ({ type: "function", function: fn })),
        });

        console.log(finalResponse.choices[0].message.content);
    } else {
        console.log(firstResponse.choices[0].message.content);
    }
}

// init({ role: "user", content: "What's the weather in Delhi and also tell me the stock price of AAPL?" });
// init({ role: "user", content: "Who is the prime minister of india" });
// init({ role: "user", content: "Tell me about largest country in world" });
// init({ role: "user", content: "Do ypu know about vue js?" });

async function main() {
    const input = promptrSync({ sigint: false })
    while (true) {
        const userInput = input("Need Help Ask With me:");
        if (userInput.toLowerCase() === "exit") {
            console.log("Bye...");
            break;
        }
        await init({
            role: "user",
            content: userInput,
        });

    }
}

main();
// console.log(response.choices[0].message);
