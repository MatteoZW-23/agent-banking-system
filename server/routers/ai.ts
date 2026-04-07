import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { invokeLLM } from "../_core/llm";

export const aiRouter = router({
  chat: protectedProcedure
    .input(
      z.object({
        messages: z.array(
          z.object({
            role: z.enum(["system", "user", "assistant"]),
            content: z.string(),
          })
        ),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content:
                "You are the AgentTrack AI Ethical Shield (v2.0). Your mission is to protect the Agent Banking System from fraud, internal collusion, and unethical financial behavior. You have deep awareness of transaction telemetry, risk scores, and liquidity patterns. When asked, analyze data for suspicious smurfing, layering, unusual timing, or velocity breaches. Be professional, direct, and vigilant.",
            },
            ...input.messages,
          ],
        });

        return (
          response.choices[0]?.message?.content ||
          "I'm sorry, I'm having trouble processing that request."
        );
      } catch (error) {
        console.error("[AI Router] LLM Error:", error);
        return "The AI system is temporarily unavailable. Please try again later.";
      }
    }),
});
