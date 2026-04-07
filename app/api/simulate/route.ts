export const dynamic = "force-dynamic";

import { simulate, SimulationInput } from "@/lib/simulate";

export async function POST(request: Request) {
  let body: SimulationInput;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body?.stack?.llm) {
    return Response.json({ error: "stack.llm is required" }, { status: 400 });
  }
  if (!body.monthlyUsers || body.monthlyUsers <= 0) {
    return Response.json({ error: "monthlyUsers must be a positive number" }, { status: 400 });
  }
  if (!body.requestsPerUserPerDay || body.requestsPerUserPerDay <= 0) {
    return Response.json(
      { error: "requestsPerUserPerDay must be a positive number" },
      { status: 400 }
    );
  }
  if (!body.avgTokensPerRequest || body.avgTokensPerRequest <= 0) {
    return Response.json(
      { error: "avgTokensPerRequest must be a positive number" },
      { status: 400 }
    );
  }

  const result = simulate(body);
  return Response.json(result);
}
