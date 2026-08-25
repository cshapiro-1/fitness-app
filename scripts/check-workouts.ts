import "dotenv/config";
import { prisma } from "../src/lib/prisma";

async function main() {
  const users = await prisma.user.findMany({ select: { id: true, name: true, email: true, role: true, clientProfileId: true } });
  console.log("Users:", JSON.stringify(users, null, 2));

  const clients = await prisma.client.findMany({ select: { id: true, name: true, email: true, userId: true } });
  console.log("Clients:", JSON.stringify(clients, null, 2));

  const recentWorkouts = await prisma.workoutSession.findMany({
    where: { deletedAt: null },
    include: { exercises: { include: { sets: true } }, client: true },
    orderBy: { completedAt: "desc" },
    take: 15,
  });

  console.log("Recent workouts count:", recentWorkouts.length);
  for (const w of recentWorkouts) {
    console.log("Workout ID:", w.id);
    console.log("Client:", w.client?.name);
    console.log("Status:", w.status);
    console.log("CompletedAt:", w.completedAt);
    console.log("CreatedAt:", w.createdAt);
    console.log("Notes:", w.notes);
    console.log("Exercises:", w.exercises.map((e) => `${e.name}: ${e.sets.map((s) => `${s.weight}x${s.reps}`).join(", ")}`));
    console.log("---");
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
