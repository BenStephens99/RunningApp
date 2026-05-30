import { createServerFn } from "@tanstack/react-start";
import { CURRENT_MODEL, gemini } from "./geminiServerClient";
import { addMessageToHistory, updateMessageHistory } from "./llmPlanMessageServerFunctions";
import { MessageHistory, RunPlanPayload, RunPlanResponse } from "./types";

export const sendGeminiMessage = createServerFn({ method: "POST" })
  .inputValidator((d: { message: string }) => d)
  .handler(async ({ data }) => {
    const response = await gemini.models.generateContent({
      model: CURRENT_MODEL,
      contents: data.message,
    });

    return response.text;
  });

export const sendGeminiRunPlan = createServerFn({ method: "POST" })
  .inputValidator((d: RunPlanPayload) => d)
  .handler(async ({ data }) => {
    const message = `
    You are an expert running coach. Create a running plan for the following user:
    - Current age: ${data.current_age}
    - Distance goal: ${data.distance_goal}
    - Days of week: ${data.days_of_week.join(", ")}
    - Start date: ${data.start_date}
    - Race date: ${data.race_date}
    - Additional notes: ${data.additional_notes}

    The plan should be based on the user's current fitness level, age and goals.
    Feel free to add a small comments section to explain the plan. and any other relevant information.

    Make sure you generate a run for every day labled between the start date and race date based on the days of week, unless you think it should be a rest day.

    Dont include a day as 0km labled rest day, just skip adding a day if you think it should be a rest day.

    Dont forget a tapering phase. As a rough guide a half marathon would have a 10-14 day taper phase.

    For the per run notes. Say what the benefit will be (ie Long slow run to build base endurance). If its an interval session, make it clear what the intervals should be in this section 
    formatted like: "Intervals: 8 x 400m at 5:00 /km (1:30 rest between intervals)". 

    If a run is not an interval session, NEVER include pace or distance in the notes section for that run.

    Return the plan in the following JSON format only, (the date must be in the format of YYYY-MM-DD and the distance must be in kilometers and just the number, notes can be flexible, pace goal should be in the format of mm:ss /km, ): 
  {
    "plan": [
      {
        "date": "2026-01-01",
        "distance": 10,
        "pace": "5:00 /km",
        "notes": "Add any additional notes about the run here"
      }
      {
        "date": "2026-01-02",
        "distance": 10,
        "pace": "5:00 /km",
        "notes": "Add any additional notes about the run here"
      }
      ...
    ],
    "comments": "Add any additional notes about the plan here"
  }
    `;

    const messageHistory: MessageHistory = await addMessageToHistory({
      data: {
        message: message,
      },
    });

    let response: any;

    try {
      response = await gemini.models.generateContent({
        model: CURRENT_MODEL,
        contents: message,
      });
    } catch (error) {
      await updateMessageHistory({
        data: {
          id: messageHistory.id,
          status: "error",
          raw_response: (error as Error).message,
          formatted_response: {
            plan: [],
            comments: "",
          },
        },
      });
      throw new Error("Error generating Gemini response");
    }

    if (!response.text) {
      await updateMessageHistory({
        data: {
          id: messageHistory.id,
          status: "error",
          raw_response: "",
          formatted_response: {
            plan: [],
            comments: "",
          },
        },
      });
      throw new Error("No response from Gemini");
    }

    let cleanedText = response.text.trim();

    if (cleanedText.startsWith("```json")) {
      cleanedText = cleanedText
        .replace(/^```json\s*/i, "")
        .replace(/\s*```.*$/s, "");
    } else if (cleanedText.startsWith("```")) {
      cleanedText = cleanedText
        .replace(/^```\s*/, "")
        .replace(/\s*```.*$/s, "");
    }

    let json: RunPlanResponse = {
      plan: [],
      comments: "",
    };

    try {
      json = JSON.parse(cleanedText);
    } catch (error) {
      await updateMessageHistory({
        data: {
          id: messageHistory.id,
          status: "error",
          raw_response: response.text,
          formatted_response: {
            plan: [],
            comments: "",
          },
        },
      });
      throw new Error("Invalid JSON response from Gemini");
    }

    await updateMessageHistory({
      data: {
        id: messageHistory.id,
        status: "awaiting_user_confirmation",
        raw_response: response.text,
        formatted_response: json,
      },
    });

    return json as RunPlanResponse;
  });
