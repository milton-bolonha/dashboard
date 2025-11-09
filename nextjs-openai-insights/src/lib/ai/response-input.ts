export type ConversationRole = "assistant" | "system" | "user";

export interface ConversationTurn {
  role: ConversationRole;
  content: string;
}

interface ResponsesInputText {
  type: "input_text";
  text: string;
}

interface ResponsesInputMessage {
  role: ConversationRole;
  content: ResponsesInputText[];
}

export function toResponsesInput(
  conversation: ConversationTurn[]
): ResponsesInputMessage[] {
  return conversation.map((turn) => ({
    role: turn.role,
    content: [
      {
        type: "input_text",
        text: turn.content,
      },
    ],
  }));
}

