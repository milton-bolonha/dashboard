import test from "node:test";
import assert from "node:assert/strict";
import { handler as storyCreate } from "../../netlify/functions/story-create.js";

const mockContext = {};

test("story-create returns new story", async () => {
  const mockEvent = {
    httpMethod: "POST",
    body: JSON.stringify({ title: "Nossa história" }),
  };
  const res = await storyCreate(mockEvent, mockContext);
  assert.equal(res.statusCode, 200);
  const data = JSON.parse(res.body);
  assert.ok(data.story.id.startsWith("story_"));
});
