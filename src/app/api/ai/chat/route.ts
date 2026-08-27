export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, RATE_LIMIT_PRESETS } from "@/lib/rateLimit";
import { answerFitnessQuery } from "@/lib/aiChatAssistant";

export async function POST(req: NextRequest) {
  try {
    const rateCheck = checkRateLimit(req, RATE_LIMIT_PRESETS.AI);
    if (rateCheck.limited && rateCheck.response) {
      return rateCheck.response;
    }

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { query, clientId } = body;

    if (!query || typeof query !== "string" || !query.trim()) {
      return NextResponse.json({ error: "Query prompt is required." }, { status: 400 });
    }

    const user = session.user as { id: string; email?: string; role?: string; isAdmin?: boolean; clientProfileId?: string; name?: string };
    const userRole = (user.role || "TRAINER").toUpperCase() as "TRAINER" | "CLIENT" | "ADMIN";
    const isAdmin = !!user.isAdmin || userRole === "ADMIN";

    let targetClient: any = null;
    let targetWorkouts: any[] = [];
    let targetName = user.name || "You";

    // 1. CLIENT ACCESS CONTROL: Clients can ONLY query their own history
    if (userRole === "CLIENT" && !isAdmin) {
      const ownClient = await prisma.client.findFirst({
        where: {
          OR: [
            { id: user.clientProfileId || undefined },
            { email: user.email || undefined },
            { userId: user.id },
          ],
        },
      });

      if (clientId && ownClient && clientId !== ownClient.id) {
        return NextResponse.json(
          { error: "Forbidden: Clients are only permitted to query their own workout history and logs." },
          { status: 403 }
        );
      }

      if (ownClient) {
        targetClient = ownClient;
        targetName = ownClient.name;
        targetWorkouts = await prisma.workoutSession.findMany({
          where: { clientId: ownClient.id, deletedAt: null },
          include: {
            exercises: {
              include: { sets: true },
              orderBy: { order: "asc" },
            },
          },
          orderBy: { completedAt: "desc" },
        });
      }
    }
    // 2. TRAINER ACCESS CONTROL: Trainers can only query their own logs or their assigned clients
    else if (userRole === "TRAINER" && !isAdmin) {
      if (clientId && clientId !== "self") {
        const client = await prisma.client.findUnique({
          where: { id: clientId },
        });

        if (!client) {
          return NextResponse.json({ error: "Athlete profile not found." }, { status: 404 });
        }

        // Verify trainer ownership
        if (client.userId !== user.id) {
          return NextResponse.json(
            { error: "Forbidden: You do not have permission to query logs for this athlete." },
            { status: 403 }
          );
        }

        targetClient = client;
        targetName = client.name;
        targetWorkouts = await prisma.workoutSession.findMany({
          where: { clientId: client.id, deletedAt: null },
          include: {
            exercises: {
              include: { sets: true },
              orderBy: { order: "asc" },
            },
          },
          orderBy: { completedAt: "desc" },
        });
      } else {
        // Querying trainer's own sessions / all managed client sessions
        const managedClients = await prisma.client.findMany({
          where: { userId: user.id },
          select: { id: true },
        });
        const clientIds = managedClients.map((c) => c.id);

        targetName = "your studio athletes";
        targetWorkouts = await prisma.workoutSession.findMany({
          where: {
            OR: [
              { clientId: { in: clientIds } },
              { loggedById: user.id },
            ],
            deletedAt: null,
          },
          include: {
            exercises: {
              include: { sets: true },
              orderBy: { order: "asc" },
            },
          },
          orderBy: { completedAt: "desc" },
        });
      }
    }
    // 3. ADMIN ACCESS: Unrestricted
    else if (isAdmin) {
      if (clientId && clientId !== "self") {
        const client = await prisma.client.findUnique({
          where: { id: clientId },
        });
        if (client) {
          targetClient = client;
          targetName = client.name;
          targetWorkouts = await prisma.workoutSession.findMany({
            where: { clientId: client.id, deletedAt: null },
            include: {
              exercises: {
                include: { sets: true },
                orderBy: { order: "asc" },
              },
            },
            orderBy: { completedAt: "desc" },
          });
        }
      }
    }

    // Format workout sessions for analytics parsing
    const formattedWorkouts = targetWorkouts.map((w) => ({
      id: w.id,
      completedAt: w.completedAt ? w.completedAt.toISOString() : new Date().toISOString(),
      notes: w.notes,
      exercises: (w.exercises || []).map((ex: any) => ({
        name: ex.name,
        category: ex.category || "STRENGTH",
        sets: (ex.sets || []).map((s: any) => ({
          weight: s.weight,
          reps: s.reps,
          notes: s.notes,
        })),
      })),
    }));

    // Generate fallback deterministic result & action intent
    const result = answerFitnessQuery(query, {
      requesterRole: userRole,
      requesterName: user.name || "User",
      targetName,
      targetClientId: targetClient?.id,
      workouts: formattedWorkouts,
    });

    let finalAnswer = result.answer;

    // Optional LLM API Provider (Gemini / OpenAI) Integration
    const geminiApiKey = process.env.GEMINI_API_KEY;
    const openAiApiKey = process.env.OPENAI_API_KEY;

    if (geminiApiKey) {
      try {
        const workoutSummaryText = formattedWorkouts.slice(0, 10).map((w, idx) => 
          `Workout #${idx+1} (${w.completedAt ? w.completedAt.split("T")[0] : "Recent"}): ${w.exercises.map((e: any) => `${e.name} [${e.sets.map((s: any) => `${s.weight}lbs x ${s.reps}reps`).join(", ")}]`).join(" | ")}`
        ).join("\n");

        const systemInstruction = `You are the STRKYR AI Performance Co-Pilot, an elite CSCS Strength & Conditioning Specialist and biomechanics researcher.
You provide precise, evidence-based, concise guidance for coaches and athletes.

CRITICAL EXERCISE SCIENCE PRINCIPLES:
1. PROGRESSIVE OVERLOAD INCREMENTS:
   - For lower body compound movements (Deadlift, Squat, Leg Press, Hip Thrust): standard load progression is +5 to +10 lbs (approx +2.5% to +5%). NEVER suggest unreasonable jumps (e.g. after completing 205 lbs, the next step is 210 to 215 lbs; jumping to 600 lbs is physically impossible and dangerous!).
   - For upper body compound movements (Bench Press, Incline Press, Overhead Press, Barbell Row): standard load progression is +2.5 to +5 lbs (micro-loading).
   - For isolation and dumbbell movements: +2.5 lbs or add +1-2 reps at same weight before increasing load.
   - NSCA 2-for-2 Rule: Only increase load if the athlete completes 2 or more repetitions above the goal on the last set for 2 consecutive workouts.
2. DISTINGUISH TOTAL VOLUME FROM WORKING WEIGHT:
   - Total volume = Sum(weight * reps * sets). Working load = weight on the barbell for a single set. Never confuse total session volume with working weight!
3. TONE & FORMAT:
   - Be authoritative, encouraging, concise, and structured with bullet points.
   - If recommending a workout routine or progression, clearly specify exercise names, sets, reps, and weights.`;

        const userPrompt = `Athlete Context: ${targetName} (${userRole})
Recent Logged Training History:
${workoutSummaryText || "No prior workouts logged yet."}

User Question: "${query}"

Provide your professional coaching response:`;

        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                {
                  role: "user",
                  parts: [{ text: `${systemInstruction}\n\n${userPrompt}` }],
                },
              ],
              generationConfig: {
                temperature: 0.3,
                maxOutputTokens: 800,
              },
            }),
          }
        );

        if (geminiRes.ok) {
          const geminiData = await geminiRes.json();
          const textOutput = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
          if (textOutput && textOutput.trim()) {
            finalAnswer = textOutput.trim();
          }
        }
      } catch (geminiErr) {
        console.error("Gemini API call error, using deterministic engine:", geminiErr);
      }
    } else if (openAiApiKey) {
      try {
        const workoutSummaryText = formattedWorkouts.slice(0, 10).map((w, idx) => 
          `Workout #${idx+1} (${w.completedAt ? w.completedAt.split("T")[0] : "Recent"}): ${w.exercises.map((e: any) => `${e.name} [${e.sets.map((s: any) => `${s.weight}lbs x ${s.reps}reps`).join(", ")}]`).join(" | ")}`
        ).join("\n");

        const openAiRes = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${openAiApiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content: `You are the STRKYR AI Performance Co-Pilot, an elite CSCS Strength & Conditioning Specialist.
CRITICAL RULES:
- Progressive overload on Deadlift/Squat is strictly +5 to +10 lbs (e.g. from 205 lbs to 210-215 lbs, NEVER 600 lbs!).
- Upper body compound: +2.5 to +5 lbs.
- Apply the NSCA 2-for-2 rule.
- Do not confuse session cumulative volume with single-set working load.`,
              },
              {
                role: "user",
                content: `Athlete: ${targetName}\nHistory:\n${workoutSummaryText || "None"}\n\nQuestion: "${query}"`,
              },
            ],
            temperature: 0.3,
            max_tokens: 800,
          }),
        });

        if (openAiRes.ok) {
          const data = await openAiRes.json();
          const text = data.choices?.[0]?.message?.content;
          if (text && text.trim()) {
            finalAnswer = text.trim();
          }
        }
      } catch (openAiErr) {
        console.error("OpenAI API call error, using deterministic engine:", openAiErr);
      }
    }

    return NextResponse.json({
      success: true,
      query: query.trim(),
      target: {
        id: targetClient?.id || "self",
        name: targetName,
      },
      answer: finalAnswer,
      action: result.action || null,
      referencedExercises: result.referencedExercises,
      metricsFound: result.metricsFound,
      generatedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("AI Chat Query Error:", error);
    return NextResponse.json({ error: error.message || "Failed to process AI query." }, { status: 500 });
  }
}
