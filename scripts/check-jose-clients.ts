import { prisma } from "../src/lib/prisma";

async function main() {
  const jose = await prisma.user.findFirst({
    where: { email: "chisailor67@gmail.com" },
    include: {
      clients: {
        include: {
          _count: {
            select: { workoutSessions: true },
          },
          workoutSessions: {
            select: {
              id: true,
              notes: true,
              status: true,
              createdAt: true,
              startedAt: true,
              completedAt: true,
              loggedByName: true,
              _count: { select: { exercises: true } },
            },
            orderBy: { createdAt: "desc" },
          },
        },
      },
    },
  });

  if (!jose) {
    console.log("Jose Dildine user not found in database.");
    return;
  }

  console.log(`\n=== COACH: ${jose.name} (${jose.email}) ===`);
  console.log(`Total Clients on Roster: ${jose.clients.length}\n`);

  let totalWorkoutsAcrossClients = 0;

  jose.clients.forEach((c, idx) => {
    const workoutCount = c.workoutSessions.length;
    totalWorkoutsAcrossClients += workoutCount;

    console.log(`${idx + 1}. Client: "${c.name}" (Email: ${c.email || "None"}, Phone: ${c.phone || "None"})`);
    console.log(`   - Workouts: ${workoutCount}`);
    if (workoutCount > 0) {
      console.log(`   - Date range: ${c.workoutSessions[c.workoutSessions.length - 1]?.createdAt?.toISOString().split('T')[0]} -> ${c.workoutSessions[0]?.createdAt?.toISOString().split('T')[0]}`);
      console.log(`   - Recent workouts:`);
      c.workoutSessions.slice(0, 5).forEach((w) => {
        const dateStr = (w.completedAt || w.startedAt || w.createdAt)?.toISOString().split('T')[0];
        console.log(`     * ${dateStr} | Status: ${w.status} | Exercises: ${w._count.exercises} | LoggedBy: ${w.loggedByName || "N/A"} | Notes: ${w.notes || "(none)"}`);
      });
    }
    console.log("");
  });

  console.log(`========================================`);
  console.log(`Total Workouts across all Jose's clients: ${totalWorkoutsAcrossClients}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
