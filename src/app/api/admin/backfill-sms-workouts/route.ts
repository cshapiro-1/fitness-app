export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const HISTORICAL_WORKOUT_SESSIONS = [
  // 1. March - Initial Phase
  {
    date: "2026-03-10",
    title: "Day 2 – Hip Mobility & Rotational Control",
    notes: "Trap Bar Deadlift, Lat Pulldowns, Pallof Press (Rehab phase)",
    exercises: [
      { name: "Trap Bar Deadlift", sets: [{ weight: 70, reps: 5 }, { weight: 70, reps: 5 }, { weight: 70, reps: 5 }] },
      { name: "Lat Pulldown", sets: [{ weight: 85, reps: 10 }, { weight: 85, reps: 12 }, { weight: 85, reps: 15 }] },
      { name: "Cable Pallof Press", sets: [{ weight: 20, reps: 10 }, { weight: 20, reps: 10 }, { weight: 20, reps: 10 }] },
      { name: "Single-Leg RDL", sets: [{ weight: 0, reps: 8 }, { weight: 0, reps: 8 }, { weight: 0, reps: 8 }] },
    ],
  },
  // 2. March - Foundation
  {
    date: "2026-03-14",
    title: "Day 1 – Foundation & Spinal Control",
    notes: "Goblet Box Squats, Split Squats, Incline DB Press, Curls",
    exercises: [
      { name: "Dead Bug", sets: [{ weight: 5, reps: 15 }, { weight: 5, reps: 15 }, { weight: 5, reps: 15 }] },
      { name: "Goblet Box Squat", sets: [{ weight: 45, reps: 10 }, { weight: 45, reps: 15 }, { weight: 45, reps: 15 }] },
      { name: "Rear Foot Elevated Split Squat", sets: [{ weight: 10, reps: 10 }, { weight: 10, reps: 12 }, { weight: 10, reps: 10 }] },
      { name: "Incline Dumbbell Press", sets: [{ weight: 30, reps: 12 }, { weight: 30, reps: 12 }, { weight: 30, reps: 12 }] },
      { name: "Incline Bicep Curl", sets: [{ weight: 15, reps: 15 }, { weight: 20, reps: 15 }] },
    ],
  },
  // 3. March/April
  {
    date: "2026-03-21",
    title: "Day 2 – Hip Mobility & Rotational Control (Progressed)",
    notes: "Increased Trap Bar Deadlift to 90lbs",
    exercises: [
      { name: "Trap Bar Deadlift", sets: [{ weight: 90, reps: 5 }, { weight: 90, reps: 5 }, { weight: 90, reps: 5 }] },
      { name: "Lat Pulldown", sets: [{ weight: 90, reps: 12 }, { weight: 90, reps: 12 }, { weight: 90, reps: 12 }] },
      { name: "Cable Pallof Press", sets: [{ weight: 25, reps: 10 }, { weight: 25, reps: 10 }, { weight: 25, reps: 10 }] },
      { name: "Single-Leg RDL", sets: [{ weight: 0, reps: 8 }, { weight: 0, reps: 8 }, { weight: 0, reps: 8 }] },
      { name: "Incline Bicep Curl", sets: [{ weight: 20, reps: 15 }, { weight: 20, reps: 15 }] },
    ],
  },
  // 4. April
  {
    date: "2026-04-04",
    title: "Day 1 – Foundation & Spinal Control",
    notes: "Goblet Box Squats, Lat Pulldown, Leg Press, Triceps",
    exercises: [
      { name: "Dead Bug", sets: [{ weight: 0, reps: 15 }, { weight: 0, reps: 15 }, { weight: 0, reps: 15 }] },
      { name: "Goblet Box Squat", sets: [{ weight: 35, reps: 15 }, { weight: 40, reps: 15 }, { weight: 50, reps: 15 }] },
      { name: "Lat Pulldown", sets: [{ weight: 70, reps: 12 }, { weight: 70, reps: 12 }, { weight: 70, reps: 12 }] },
      { name: "Leg Press", sets: [{ weight: 180, reps: 15 }, { weight: 230, reps: 15 }, { weight: 230, reps: 15 }] },
      { name: "Tricep Pushdown", sets: [{ weight: 50, reps: 15 }, { weight: 60, reps: 15 }, { weight: 60, reps: 15 }] },
    ],
  },
  // 5. April
  {
    date: "2026-04-11",
    title: "Lower Body Strength & Triceps",
    notes: "Step-Ups, Leg Press 380lbs, Leg Extensions",
    exercises: [
      { name: "Step-Ups", sets: [{ weight: 20, reps: 10 }, { weight: 30, reps: 10 }, { weight: 30, reps: 10 }] },
      { name: "Leg Press", sets: [{ weight: 380, reps: 15 }, { weight: 380, reps: 15 }, { weight: 380, reps: 15 }] },
      { name: "Tricep Pushdown", sets: [{ weight: 60, reps: 15 }, { weight: 70, reps: 15 }, { weight: 80, reps: 15 }, { weight: 90, reps: 16 }] },
      { name: "Leg Extension", sets: [{ weight: 65, reps: 15 }, { weight: 70, reps: 15 }, { weight: 80, reps: 20 }] },
    ],
  },
  // 6. April/May
  {
    date: "2026-04-18",
    title: "Chest, Incline Press & Single Leg RDL",
    notes: "Push-ups, Incline Bench, Single Leg RDL",
    exercises: [
      { name: "Push-Up", sets: [{ weight: 0, reps: 15 }, { weight: 0, reps: 15 }, { weight: 0, reps: 15 }] },
      { name: "Incline Dumbbell Press", sets: [{ weight: 30, reps: 12 }, { weight: 30, reps: 12 }, { weight: 30, reps: 12 }, { weight: 30, reps: 12 }] },
      { name: "Single-Leg RDL", sets: [{ weight: 30, reps: 10 }, { weight: 30, reps: 10 }, { weight: 30, reps: 10 }] },
      { name: "Bird Dog", sets: [{ weight: 0, reps: 24 }, { weight: 0, reps: 24 }] },
    ],
  },
  // 7. May
  {
    date: "2026-05-02",
    title: "Lower & Incline Bench & OHP",
    notes: "Step-ups 40lbs, Incline Bench 40lbs, Single Arm OHP, Grey Leg Press",
    exercises: [
      { name: "Step-Ups", sets: [{ weight: 30, reps: 15 }, { weight: 40, reps: 12 }, { weight: 40, reps: 12 }] },
      { name: "Incline Dumbbell Press", sets: [{ weight: 35, reps: 12 }, { weight: 40, reps: 12 }, { weight: 40, reps: 12 }, { weight: 40, reps: 12 }] },
      { name: "Dumbbell Shoulder Press", sets: [{ weight: 20, reps: 12 }, { weight: 25, reps: 12 }, { weight: 25, reps: 12 }] },
      { name: "Leg Press", sets: [{ weight: 270, reps: 15 }, { weight: 320, reps: 15 }, { weight: 360, reps: 15 }] },
      { name: "Tricep Pushdown", sets: [{ weight: 90, reps: 16 }, { weight: 100, reps: 15 }, { weight: 100, reps: 15 }] },
    ],
  },
  // 8. May
  {
    date: "2026-05-09",
    title: "Farmer Carry & Lat Pulldown / Leg Extensions",
    notes: "Farmer Carry 100lbs 3x60m, Lat Pulldown 85lbs, Pallof Press",
    exercises: [
      { name: "Dead Bug", sets: [{ weight: 0, reps: 15 }] },
      { name: "Farmer Carry", sets: [{ weight: 100, reps: 60 }, { weight: 100, reps: 60 }, { weight: 100, reps: 60 }] },
      { name: "Lat Pulldown", sets: [{ weight: 85, reps: 12 }, { weight: 85, reps: 12 }, { weight: 85, reps: 12 }] },
      { name: "Leg Extension", sets: [{ weight: 70, reps: 15 }, { weight: 70, reps: 20 }, { weight: 70, reps: 20 }] },
      { name: "Cable Pallof Press", sets: [{ weight: 35, reps: 15 }, { weight: 35, reps: 15 }, { weight: 45, reps: 15 }] },
    ],
  },
  // 9. May/June
  {
    date: "2026-05-23",
    title: "Lat Pulldown 130lbs, Incline Machine, Leg Press",
    notes: "130lb Lat pulldowns, Incline Machine 60lbs, Tricep pushdowns 100lbs",
    exercises: [
      { name: "Lat Pulldown", sets: [{ weight: 130, reps: 10 }, { weight: 130, reps: 8 }] },
      { name: "Incline Machine Press", sets: [{ weight: 60, reps: 12 }, { weight: 60, reps: 12 }, { weight: 60, reps: 10 }] },
      { name: "Dumbbell Shoulder Press", sets: [{ weight: 20, reps: 12 }, { weight: 25, reps: 12 }, { weight: 25, reps: 12 }] },
      { name: "Leg Press", sets: [{ weight: 380, reps: 15 }, { weight: 380, reps: 15 }, { weight: 380, reps: 15 }] },
      { name: "Tricep Pushdown", sets: [{ weight: 90, reps: 16 }, { weight: 100, reps: 15 }, { weight: 100, reps: 15 }] },
    ],
  },
  // 10. June
  {
    date: "2026-06-06",
    title: "Smith Military Press, Assisted Pull-ups, Chest Fly",
    notes: "Smith Machine 90lbs, Leg Press 390lbs, Chest Fly 40lbs",
    exercises: [
      { name: "Overhead Press", sets: [{ weight: 90, reps: 10 }, { weight: 90, reps: 10 }, { weight: 90, reps: 12 }] },
      { name: "Leg Press", sets: [{ weight: 380, reps: 12 }, { weight: 390, reps: 12 }, { weight: 390, reps: 12 }] },
      { name: "Assisted Pull-Up", sets: [{ weight: 95, reps: 8 }, { weight: 85, reps: 6 }, { weight: 85, reps: 6 }] },
      { name: "Chest Fly", sets: [{ weight: 35, reps: 15 }, { weight: 40, reps: 12 }, { weight: 40, reps: 12 }] },
    ],
  },
  // 11. June
  {
    date: "2026-06-13",
    title: "Lat Pulldown 130lbs, Incline Bench, Reverse Lunges",
    notes: "Lat pulldown 130lbs 3x12, Incline Machine 60lbs, Reverse Lunges 25lbs",
    exercises: [
      { name: "Lat Pulldown", sets: [{ weight: 130, reps: 12 }, { weight: 130, reps: 10 }, { weight: 130, reps: 10 }] },
      { name: "Incline Machine Press", sets: [{ weight: 55, reps: 12 }, { weight: 60, reps: 12 }, { weight: 60, reps: 12 }, { weight: 60, reps: 6 }] },
      { name: "Dumbbell Shoulder Press", sets: [{ weight: 25, reps: 10 }, { weight: 25, reps: 12 }, { weight: 25, reps: 12 }] },
      { name: "Reverse Lunges", sets: [{ weight: 25, reps: 10 }, { weight: 25, reps: 10 }, { weight: 25, reps: 10 }] },
      { name: "Tricep Pushdown", sets: [{ weight: 70, reps: 20 }, { weight: 100, reps: 14 }, { weight: 100, reps: 12 }] },
    ],
  },
  // 12. June
  {
    date: "2026-06-20",
    title: "Shoulder Press Machine 120lbs, Leg Press 360lbs",
    notes: "Shoulder Press 120lbs, Leg Press 360lbs, Lat Pulldown 100lbs, Hamstring Curls",
    exercises: [
      { name: "Overhead Press", sets: [{ weight: 120, reps: 10 }, { weight: 120, reps: 12 }, { weight: 120, reps: 12 }] },
      { name: "Leg Press", sets: [{ weight: 360, reps: 12 }, { weight: 360, reps: 15 }, { weight: 360, reps: 15 }] },
      { name: "Lat Pulldown", sets: [{ weight: 100, reps: 12 }, { weight: 100, reps: 12 }, { weight: 100, reps: 12 }] },
      { name: "Hamstring Leg Curl", sets: [{ weight: 70, reps: 10 }, { weight: 70, reps: 10 }, { weight: 70, reps: 10 }] },
    ],
  },
  // 13. June
  {
    date: "2026-06-24",
    title: "Goblet Squats 50lbs, Incline DB 40lbs, Chest Supported Row",
    notes: "Goblet Squats up to 50lbs, Incline DB 40lbs, Front Rack Carry 36lbs",
    exercises: [
      { name: "Goblet Squat", sets: [{ weight: 35, reps: 15 }, { weight: 40, reps: 12 }, { weight: 50, reps: 8 }, { weight: 50, reps: 8 }] },
      { name: "Incline Dumbbell Press", sets: [{ weight: 35, reps: 12 }, { weight: 40, reps: 12 }, { weight: 40, reps: 12 }] },
      { name: "Chest-Supported Row", sets: [{ weight: 15, reps: 12 }, { weight: 20, reps: 12 }, { weight: 20, reps: 12 }] },
      { name: "Front Rack Carry", sets: [{ weight: 36, reps: 30 }, { weight: 36, reps: 30 }, { weight: 36, reps: 30 }] },
    ],
  },
  // 14. June/July
  {
    date: "2026-06-27",
    title: "Goblet Squats 55lbs, Single Leg RDL, Dumbbell Row",
    notes: "Goblet Squat 55lbs 4x10, DB Row 45lbs 3x12, Incline DB Curls 25lbs",
    exercises: [
      { name: "Goblet Squat", sets: [{ weight: 55, reps: 10 }, { weight: 55, reps: 10 }, { weight: 55, reps: 10 }, { weight: 55, reps: 10 }] },
      { name: "Single-Leg RDL", sets: [{ weight: 25, reps: 12 }, { weight: 25, reps: 12 }, { weight: 25, reps: 12 }] },
      { name: "Incline Dumbbell Press", sets: [{ weight: 35, reps: 12 }, { weight: 40, reps: 12 }, { weight: 40, reps: 12 }] },
      { name: "Single-Arm Dumbbell Row", sets: [{ weight: 45, reps: 12 }, { weight: 45, reps: 12 }, { weight: 45, reps: 12 }] },
      { name: "Incline Bicep Curl", sets: [{ weight: 25, reps: 10 }, { weight: 25, reps: 8 }, { weight: 25, reps: 10 }] },
    ],
  },
  // 15. July
  {
    date: "2026-07-01",
    title: "Lat Pulldown 130lbs, Seated Cable Row 85lbs, Shoulder Press",
    notes: "Lat pulldown 130lbs 3x12, Seated cable row 85lbs, Shoulder press 45lbs",
    exercises: [
      { name: "Lat Pulldown", sets: [{ weight: 130, reps: 12 }, { weight: 130, reps: 11 }, { weight: 130, reps: 10 }] },
      { name: "Seated Cable Row", sets: [{ weight: 70, reps: 12 }, { weight: 70, reps: 12 }, { weight: 85, reps: 12 }] },
      { name: "Dumbbell Shoulder Press", sets: [{ weight: 35, reps: 10 }, { weight: 40, reps: 12 }, { weight: 45, reps: 12 }] },
      { name: "Dead Bug", sets: [{ weight: 0, reps: 25 }, { weight: 0, reps: 25 }, { weight: 0, reps: 25 }] },
    ],
  },
  // 16. July
  {
    date: "2026-07-04",
    title: "Smith Machine Squat 90lbs & Single Leg RDL 30lbs",
    notes: "Smith Squat 90lbs 4x8, Single Leg RDL 30lbs, Seated Calf Raises 50lbs",
    exercises: [
      { name: "Smith Machine Squat", sets: [{ weight: 90, reps: 8 }, { weight: 90, reps: 8 }, { weight: 90, reps: 8 }, { weight: 90, reps: 8 }] },
      { name: "Single-Leg RDL", sets: [{ weight: 25, reps: 12 }, { weight: 30, reps: 12 }, { weight: 30, reps: 12 }] },
      { name: "Standing Calf Raise", sets: [{ weight: 50, reps: 15 }, { weight: 50, reps: 15 }, { weight: 50, reps: 20 }] },
    ],
  },
  // 17. July
  {
    date: "2026-07-08",
    title: "Assisted Pull-ups, DB Incline Chest Press 55lbs",
    notes: "Assisted pull-ups 70lbs assistance, Incline DB 55lbs, Leg Extensions 85lbs",
    exercises: [
      { name: "Assisted Pull-Up", sets: [{ weight: 85, reps: 8 }, { weight: 70, reps: 8 }, { weight: 70, reps: 8 }] },
      { name: "Incline Dumbbell Press", sets: [{ weight: 30, reps: 10 }, { weight: 45, reps: 10 }, { weight: 55, reps: 10 }] },
      { name: "Leg Extension", sets: [{ weight: 55, reps: 15 }, { weight: 70, reps: 15 }, { weight: 75, reps: 15 }, { weight: 85, reps: 15 }] },
    ],
  },
  // 18. July
  {
    date: "2026-07-11",
    title: "Incline DB Press 60lbs, Goblet Squats 70lbs",
    notes: "Incline DB 60lbs 3x12, Goblet squat 70lbs 2x12, Chest supported row 90lbs",
    exercises: [
      { name: "Incline Dumbbell Press", sets: [{ weight: 60, reps: 12 }, { weight: 60, reps: 10 }, { weight: 60, reps: 10 }] },
      { name: "Goblet Squat", sets: [{ weight: 55, reps: 12 }, { weight: 60, reps: 12 }, { weight: 70, reps: 12 }, { weight: 70, reps: 12 }] },
      { name: "Chest-Supported Row", sets: [{ weight: 90, reps: 12 }, { weight: 90, reps: 12 }, { weight: 90, reps: 12 }] },
      { name: "Hamstring Leg Curl", sets: [{ weight: 70, reps: 12 }, { weight: 70, reps: 12 }, { weight: 50, reps: 6 }] },
    ],
  },
  // 19. July
  {
    date: "2026-07-15",
    title: "Cable Reverse Lunges, Landmine Press 40lbs, Lat Pulldown",
    notes: "Reverse Lunges 40lbs, Landmine Press 40lbs, Lat Pulldown 130lbs",
    exercises: [
      { name: "Reverse Lunges", sets: [{ weight: 30, reps: 12 }, { weight: 40, reps: 12 }, { weight: 40, reps: 12 }] },
      { name: "Leg Press", sets: [{ weight: 270, reps: 12 }, { weight: 270, reps: 12 }, { weight: 270, reps: 12 }] },
      { name: "Landmine Press", sets: [{ weight: 30, reps: 12 }, { weight: 35, reps: 8 }, { weight: 40, reps: 8 }] },
      { name: "Lat Pulldown", sets: [{ weight: 100, reps: 12 }, { weight: 115, reps: 12 }, { weight: 130, reps: 10 }] },
    ],
  },
  // 20. July
  {
    date: "2026-07-18",
    title: "Trap Bar Deadlift 165lbs, Incline DB 60lbs, Goblet 70lbs",
    notes: "Trap Bar 165lbs 4x5, Incline DB 60lbs 3x12, Cable row 85lbs, Dips",
    exercises: [
      { name: "Incline Dumbbell Press", sets: [{ weight: 60, reps: 12 }, { weight: 60, reps: 12 }, { weight: 60, reps: 8.5 }] },
      { name: "Goblet Squat", sets: [{ weight: 60, reps: 12 }, { weight: 70, reps: 12 }, { weight: 70, reps: 12 }, { weight: 70, reps: 12 }] },
      { name: "Trap Bar Deadlift", sets: [{ weight: 165, reps: 5 }, { weight: 165, reps: 5 }, { weight: 165, reps: 5 }, { weight: 165, reps: 5 }] },
      { name: "Seated Cable Row", sets: [{ weight: 85, reps: 12 }, { weight: 85, reps: 12 }, { weight: 85, reps: 12 }] },
      { name: "Hamstring Leg Curl", sets: [{ weight: 40, reps: 12 }, { weight: 50, reps: 12 }, { weight: 60, reps: 12 }, { weight: 70, reps: 8 }] },
      { name: "Dips", sets: [{ weight: 0, reps: 5 }, { weight: 0, reps: 5 }, { weight: 0, reps: 5 }] },
    ],
  },
  // 21. July
  {
    date: "2026-07-22",
    title: "Office Gym: Bulgarian Split Squats 25lbs, Incline DB 60lbs",
    notes: "Bulgarian Split Squats 25lbs, Single Leg RDL 30lbs, Incline DB 60lbs, Lat Pulldown 115lbs",
    exercises: [
      { name: "Bulgarian Split Squats", sets: [{ weight: 25, reps: 8 }, { weight: 25, reps: 8 }, { weight: 25, reps: 8 }] },
      { name: "Single-Leg RDL", sets: [{ weight: 30, reps: 8 }, { weight: 30, reps: 8 }, { weight: 30, reps: 8 }] },
      { name: "Hamstring Leg Curl", sets: [{ weight: 90, reps: 10 }, { weight: 90, reps: 10 }, { weight: 90, reps: 10 }] },
      { name: "Incline Dumbbell Press", sets: [{ weight: 60, reps: 10 }, { weight: 60, reps: 10 }, { weight: 60, reps: 10 }] },
      { name: "Lat Pulldown", sets: [{ weight: 115, reps: 10 }, { weight: 115, reps: 10 }, { weight: 115, reps: 10 }] },
      { name: "Seated Cable Row", sets: [{ weight: 85, reps: 10 }, { weight: 85, reps: 10 }, { weight: 85, reps: 10 }] },
      { name: "Farmer Carry", sets: [{ weight: 55, reps: 40 }, { weight: 55, reps: 40 }] },
    ],
  },
  // 22. July
  {
    date: "2026-07-25",
    title: "Linear Leg Press 450lbs & Barbell Bench Press 95lbs",
    notes: "Leg Press 450lbs 3x12, Bench Press 95lbs 4x10, Lateral Raises, Forearm Curls",
    exercises: [
      { name: "Leg Press", sets: [{ weight: 360, reps: 12 }, { weight: 450, reps: 12 }, { weight: 450, reps: 12 }, { weight: 450, reps: 12 }] },
      { name: "Barbell Bench Press", sets: [{ weight: 95, reps: 10 }, { weight: 95, reps: 10 }, { weight: 95, reps: 10 }, { weight: 95, reps: 10 }] },
      { name: "Lateral Raise", sets: [{ weight: 10, reps: 15 }, { weight: 15, reps: 15 }, { weight: 15, reps: 15 }] },
      { name: "Wrist Roller / Forearm", sets: [{ weight: 40, reps: 15 }, { weight: 40, reps: 15 }, { weight: 40, reps: 15 }] },
    ],
  },
  // 23. July
  {
    date: "2026-07-28",
    title: "Goblet Squats 70lbs, Incline DB 60lbs, Shoulder Press 25lbs",
    notes: "Goblet Squat 70lbs 2x12, Incline DB 60lbs 3x10, Walking Lunges 30lbs",
    exercises: [
      { name: "Goblet Squat", sets: [{ weight: 60, reps: 12 }, { weight: 70, reps: 12 }, { weight: 70, reps: 12 }] },
      { name: "Incline Dumbbell Press", sets: [{ weight: 60, reps: 10 }, { weight: 60, reps: 10 }, { weight: 60, reps: 10 }] },
      { name: "Dumbbell Shoulder Press", sets: [{ weight: 25, reps: 12 }, { weight: 25, reps: 12 }, { weight: 25, reps: 12 }] },
      { name: "Walking Lunges", sets: [{ weight: 25, reps: 10 }, { weight: 30, reps: 10 }, { weight: 30, reps: 10 }] },
      { name: "Dumbbell Bicep Curl", sets: [{ weight: 25, reps: 12 }, { weight: 25, reps: 12 }] },
    ],
  },
  // 24. July
  {
    date: "2026-07-30",
    title: "Leg Press 500lbs & Barbell Bench Press 135lbs (PR)",
    notes: "Linear Leg Press 500lbs, Bench Press hitting 135lbs 2x12, Lateral Raises 15lbs",
    exercises: [
      { name: "Leg Press", sets: [{ weight: 450, reps: 12 }, { weight: 500, reps: 12 }, { weight: 500, reps: 12 }] },
      { name: "Barbell Bench Press", sets: [{ weight: 105, reps: 10 }, { weight: 115, reps: 10 }, { weight: 135, reps: 10 }, { weight: 135, reps: 12 }] },
      { name: "Lateral Raise", sets: [{ weight: 15, reps: 15 }, { weight: 15, reps: 15 }, { weight: 15, reps: 15 }] },
      { name: "Dumbbell Bicep Curl", sets: [{ weight: 20, reps: 15 }, { weight: 25, reps: 12 }, { weight: 25, reps: 15 }] },
      { name: "Wrist Roller / Forearm", sets: [{ weight: 45, reps: 15 }, { weight: 45, reps: 15 }, { weight: 45, reps: 15 }] },
    ],
  },
  // 25. July
  {
    date: "2026-07-31",
    title: "Goblet Squats 70lbs 4x12, Incline DB 60lbs, Shoulder Press 30lbs",
    notes: "Goblet Squats 70lbs 4x12, Incline DB 60lbs, Seated Shoulder Press 30lbs, Walking Lunges 30lbs",
    exercises: [
      { name: "Goblet Squat", sets: [{ weight: 70, reps: 12 }, { weight: 70, reps: 12 }, { weight: 70, reps: 12 }, { weight: 70, reps: 12 }] },
      { name: "Incline Dumbbell Press", sets: [{ weight: 60, reps: 12 }, { weight: 60, reps: 12 }] },
      { name: "Dumbbell Shoulder Press", sets: [{ weight: 30, reps: 12 }, { weight: 30, reps: 12 }, { weight: 30, reps: 12 }] },
      { name: "Walking Lunges", sets: [{ weight: 30, reps: 10 }, { weight: 30, reps: 10 }, { weight: 30, reps: 10 }] },
      { name: "Dumbbell Bicep Curl", sets: [{ weight: 30, reps: 12 }, { weight: 30, reps: 12 }] },
    ],
  },
  // 26. July/August
  {
    date: "2026-08-01",
    title: "Office Gym: Trap Bar 175lbs, Lat Pulldown 140lbs, Flat DB 60lbs",
    notes: "Trap Bar Deadlift 175lbs 4x5, Lat Pulldown 140lbs, Seated Row 130lbs, Flat DB Press 60lbs, Dips",
    exercises: [
      { name: "Trap Bar Deadlift", sets: [{ weight: 175, reps: 5 }, { weight: 175, reps: 5 }, { weight: 175, reps: 5 }, { weight: 175, reps: 5 }] },
      { name: "Lat Pulldown", sets: [{ weight: 100, reps: 12 }, { weight: 140, reps: 10 }, { weight: 140, reps: 10 }] },
      { name: "Seated Cable Row", sets: [{ weight: 115, reps: 12 }, { weight: 115, reps: 12 }, { weight: 130, reps: 10 }] },
      { name: "Dumbbell Bench Press", sets: [{ weight: 60, reps: 10 }, { weight: 60, reps: 10 }, { weight: 60, reps: 10 }] },
      { name: "Hamstring Leg Curl", sets: [{ weight: 70, reps: 12 }, { weight: 75, reps: 10 }, { weight: 75, reps: 10 }] },
      { name: "Dips", sets: [{ weight: 0, reps: 10 }, { weight: 0, reps: 10 }, { weight: 0, reps: 8 }] },
    ],
  },
  // 27. August
  {
    date: "2026-08-03",
    title: "Leg Press 600lbs & Barbell Bench Press 155lbs (PR)",
    notes: "Leg Press 600lbs x 12, Bench Press 135x10, 145x12, 155 2x8 (Huge milestone)",
    exercises: [
      { name: "Leg Press", sets: [{ weight: 500, reps: 12 }, { weight: 540, reps: 12 }, { weight: 600, reps: 12 }] },
      { name: "Barbell Bench Press", sets: [{ weight: 135, reps: 10 }, { weight: 145, reps: 12 }, { weight: 155, reps: 8 }, { weight: 155, reps: 8 }] },
      { name: "Lateral Raise", sets: [{ weight: 15, reps: 15 }, { weight: 15, reps: 15 }, { weight: 15, reps: 15 }] },
      { name: "Dumbbell Bicep Curl", sets: [{ weight: 30, reps: 10 }, { weight: 30, reps: 10 }, { weight: 30, reps: 10 }] },
      { name: "Wrist Roller / Forearm", sets: [{ weight: 55, reps: 15 }, { weight: 55, reps: 15 }] },
    ],
  },
  // 28. August
  {
    date: "2026-08-04",
    title: "Leg Press 500lbs, Bench Press 155lbs, Lateral Raise 20lbs",
    notes: "Leg Press 500lbs 2x12, Bench Press 155lbs 2x10, Lateral Raise 20lbs, DB Curls 30lbs",
    exercises: [
      { name: "Leg Press", sets: [{ weight: 450, reps: 12 }, { weight: 500, reps: 12 }, { weight: 500, reps: 12 }] },
      { name: "Barbell Bench Press", sets: [{ weight: 155, reps: 10 }, { weight: 155, reps: 10 }, { weight: 135, reps: 10 }] },
      { name: "Lateral Raise", sets: [{ weight: 20, reps: 12 }, { weight: 20, reps: 12 }, { weight: 20, reps: 12 }] },
      { name: "Dumbbell Bicep Curl", sets: [{ weight: 30, reps: 10 }, { weight: 30, reps: 10 }, { weight: 30, reps: 10 }] },
    ],
  },
  // 29. August
  {
    date: "2026-08-05",
    title: "Step-ups 40lbs, Flat DB Bench 70lbs, Seated Leg Curl 100lbs",
    notes: "Step-ups 35lb DBs x 10, Flat DB Press 60, 65, 70lbs x 10, Seated Cable Row 100lbs",
    exercises: [
      { name: "Step-Ups", sets: [{ weight: 35, reps: 10 }, { weight: 35, reps: 10 }, { weight: 40, reps: 10 }] },
      { name: "Dumbbell Bench Press", sets: [{ weight: 60, reps: 10 }, { weight: 65, reps: 10 }, { weight: 70, reps: 10 }] },
      { name: "Seated Cable Row", sets: [{ weight: 100, reps: 12 }] },
      { name: "Hamstring Leg Curl", sets: [{ weight: 90, reps: 12 }, { weight: 100, reps: 10 }, { weight: 100, reps: 10 }] },
    ],
  },
  // 30. August
  {
    date: "2026-08-06",
    title: "Bench Press 205lbs (PR), Leg Press 500lbs, Lat Pulldown 130lbs",
    notes: "Leg press 500lbs 3x12, Bench Press: 155x2, 185x2, 195x2, 205x2 (MASSIVE PR!)",
    exercises: [
      { name: "Leg Press", sets: [{ weight: 500, reps: 12 }, { weight: 500, reps: 12 }, { weight: 500, reps: 12 }] },
      { name: "Barbell Bench Press", sets: [{ weight: 155, reps: 2 }, { weight: 185, reps: 2 }, { weight: 195, reps: 2 }, { weight: 205, reps: 2 }] },
      { name: "Lat Pulldown", sets: [{ weight: 130, reps: 10 }, { weight: 130, reps: 10 }, { weight: 130, reps: 10 }] },
    ],
  },
  // 31. August
  {
    date: "2026-08-07",
    title: "Leg Press 540lbs, Bench Press 185lbs 3x8, Preacher Curls",
    notes: "Leg press 540lbs 2x10, Bench Press 185lbs 3x8, Preacher Curls 55lbs",
    exercises: [
      { name: "Leg Press", sets: [{ weight: 450, reps: 12 }, { weight: 540, reps: 10 }, { weight: 540, reps: 12 }] },
      { name: "Barbell Bench Press", sets: [{ weight: 185, reps: 8 }, { weight: 185, reps: 7 }, { weight: 185, reps: 8 }, { weight: 135, reps: 10 }] },
      { name: "Preacher Curl", sets: [{ weight: 45, reps: 12 }, { weight: 55, reps: 12 }, { weight: 55, reps: 12 }] },
    ],
  },
  // 32. August
  {
    date: "2026-08-08",
    title: "Incline DB 70lbs, Seated Plate Row 270lbs, BB Curls 70lbs",
    notes: "Incline DB 70lbs 2x10, Shoulder Press 35lbs 3x10, Plate Row 270lbs, BB Curls 70lbs",
    exercises: [
      { name: "Incline Dumbbell Press", sets: [{ weight: 65, reps: 10 }, { weight: 70, reps: 10 }, { weight: 70, reps: 8 }] },
      { name: "Dumbbell Shoulder Press", sets: [{ weight: 35, reps: 10 }, { weight: 35, reps: 8 }, { weight: 35, reps: 10 }] },
      { name: "Seated Cable Row", sets: [{ weight: 180, reps: 12 }, { weight: 230, reps: 12 }, { weight: 270, reps: 10 }] },
      { name: "Barbell Curl", sets: [{ weight: 70, reps: 10 }, { weight: 70, reps: 7 }] },
    ],
  },
  // 33. August
  {
    date: "2026-08-10",
    title: "Bench Press 185lbs 5x5, Incline Bench 135lbs, Leg Press 540lbs",
    notes: "Linear Leg Press 540lbs, Bench Press 185lbs 5x5, Incline Bench 135lbs 2x8",
    exercises: [
      { name: "Leg Press", sets: [{ weight: 450, reps: 12 }, { weight: 540, reps: 12 }] },
      { name: "Barbell Bench Press", sets: [{ weight: 185, reps: 5 }, { weight: 185, reps: 5 }, { weight: 185, reps: 5 }, { weight: 185, reps: 5 }, { weight: 185, reps: 5 }] },
      { name: "Incline Barbell Bench Press", sets: [{ weight: 115, reps: 8 }, { weight: 135, reps: 8 }, { weight: 135, reps: 8 }] },
    ],
  },
  // 34. August
  {
    date: "2026-08-11",
    title: "Office Gym: Trap Bar 205lbs (PR), Lat Pulldown 140lbs",
    notes: "Trap Bar Deadlift 205lbs 4x5, Lat Pulldown 140lbs, Bulgarian Split Squats 35lbs, Hamstring Curls 130lbs",
    exercises: [
      { name: "Trap Bar Deadlift", sets: [{ weight: 185, reps: 5 }, { weight: 205, reps: 5 }, { weight: 205, reps: 5 }, { weight: 205, reps: 5 }, { weight: 205, reps: 5 }] },
      { name: "Lat Pulldown", sets: [{ weight: 130, reps: 10 }, { weight: 140, reps: 10 }, { weight: 140, reps: 8 }] },
      { name: "Bulgarian Split Squats", sets: [{ weight: 35, reps: 8 }, { weight: 35, reps: 8 }, { weight: 35, reps: 8 }] },
      { name: "Hamstring Leg Curl", sets: [{ weight: 100, reps: 12 }, { weight: 120, reps: 12 }, { weight: 130, reps: 12 }] },
      { name: "Face Pull", sets: [{ weight: 40, reps: 15 }, { weight: 40, reps: 15 }, { weight: 40, reps: 15 }] },
      { name: "Farmer Carry", sets: [{ weight: 60, reps: 40 }, { weight: 60, reps: 40 }, { weight: 60, reps: 40 }] },
    ],
  },
  // 35. August
  {
    date: "2026-08-12",
    title: "Goblet Squats 75lbs (PR), Chest Supported Row 45lbs, Shoulder Press",
    notes: "Goblet Squats 75lbs 3x12, Chest supported row 45lbs 4x12, Shoulder Press 45lbs, Back/QL Extensions",
    exercises: [
      { name: "Goblet Squat", sets: [{ weight: 75, reps: 12 }, { weight: 75, reps: 12 }, { weight: 75, reps: 12 }] },
      { name: "Chest-Supported Row", sets: [{ weight: 45, reps: 12 }, { weight: 45, reps: 12 }, { weight: 45, reps: 12 }, { weight: 45, reps: 12 }] },
      { name: "Dumbbell Shoulder Press", sets: [{ weight: 45, reps: 12 }, { weight: 45, reps: 12 }] },
      { name: "Hyperextensions (Back Extensions)", sets: [{ weight: 0, reps: 12 }, { weight: 0, reps: 20 }] },
    ],
  },
  // 36. August
  {
    date: "2026-08-13",
    title: "Barbell Bench 185lbs, Incline Bench 135lbs, Assisted Pull-ups",
    notes: "Barbell Bench 185lbs 4x8, Incline Bench 135lbs 3x8, Assisted Pull-ups, Leg Press 450lbs",
    exercises: [
      { name: "Barbell Bench Press", sets: [{ weight: 185, reps: 8 }, { weight: 185, reps: 8 }, { weight: 185, reps: 8 }, { weight: 185, reps: 8 }] },
      { name: "Incline Barbell Bench Press", sets: [{ weight: 135, reps: 8 }, { weight: 135, reps: 8 }, { weight: 135, reps: 8 }] },
      { name: "Assisted Pull-Up", sets: [{ weight: 80, reps: 10 }, { weight: 70, reps: 10 }, { weight: 60, reps: 10 }] },
      { name: "Leg Press", sets: [{ weight: 300, reps: 15 }, { weight: 360, reps: 15 }, { weight: 450, reps: 12 }] },
    ],
  },
  // 37. August
  {
    date: "2026-08-14",
    title: "Assisted Pull-ups, Leg Press 540lbs, Arms",
    notes: "Assisted pull-ups 60/50/40lbs, Leg extension 130lbs, Leg Press 540lbs, Curls 50lbs, Triceps 80lbs",
    exercises: [
      { name: "Assisted Pull-Up", sets: [{ weight: 60, reps: 12 }, { weight: 50, reps: 10 }, { weight: 40, reps: 6 }] },
      { name: "Hip Abduction Machine", sets: [{ weight: 110, reps: 20 }, { weight: 140, reps: 20 }, { weight: 150, reps: 20 }] },
      { name: "Leg Extension", sets: [{ weight: 85, reps: 15 }, { weight: 100, reps: 15 }, { weight: 115, reps: 15 }, { weight: 130, reps: 12 }] },
      { name: "Leg Press", sets: [{ weight: 360, reps: 15 }, { weight: 450, reps: 12 }, { weight: 540, reps: 12 }] },
      { name: "Barbell Curl", sets: [{ weight: 50, reps: 15 }, { weight: 50, reps: 15 }, { weight: 50, reps: 15 }] },
      { name: "Tricep Pushdown", sets: [{ weight: 60, reps: 15 }, { weight: 80, reps: 10 }, { weight: 80, reps: 10 }] },
    ],
  },
  // 38. August 18, 2026
  {
    date: "2026-08-18",
    title: "Romanian Deadlift, Leg Press 600lbs, Front Squats 95lbs",
    notes: "Harrd! Romanian Deadlifts 85lbs, Leg Press 600lbs, Front Squats 95lbs 4x10",
    exercises: [
      { name: "Romanian Deadlift", sets: [{ weight: 85, reps: 10 }, { weight: 85, reps: 8 }, { weight: 85, reps: 12 }] },
      { name: "Leg Press", sets: [{ weight: 450, reps: 15 }, { weight: 540, reps: 15 }, { weight: 600, reps: 15 }] },
      { name: "Leg Extension", sets: [{ weight: 130, reps: 12 }, { weight: 155, reps: 12 }, { weight: 165, reps: 12 }] },
      { name: "Front Squat", sets: [{ weight: 95, reps: 10 }, { weight: 95, reps: 10 }, { weight: 95, reps: 10 }, { weight: 95, reps: 10 }] },
    ],
  },
];

export async function GET() {
  try {
    const targetEmail = "collin.shapiro1@gmail.com";

    // 1. Find Collin's user and client profile
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: targetEmail, mode: "insensitive" } },
          { email: { contains: "collin", mode: "insensitive" } },
        ],
      },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: targetEmail,
          name: "Collin Shapiro",
          role: "TRAINER",
          isAdmin: true,
          subscriptionStatus: "active",
        },
      });
    }

    // Find or create Collin's client profile
    let client = await prisma.client.findFirst({
      where: {
        OR: [
          { userId: user.id },
          { email: { equals: targetEmail, mode: "insensitive" } },
          { name: { contains: "Collin", mode: "insensitive" } },
        ],
      },
    });

    if (!client) {
      client = await prisma.client.create({
        data: {
          userId: user.id,
          name: "Collin Shapiro",
          email: targetEmail,
          fitnessGoals: "Strength, Hypertrophy & L5-S1 Spine Integrity",
        },
      });
    }

    // 2. Clear old backfilled sessions if any (to avoid duplicates)
    await prisma.workoutSession.deleteMany({
      where: {
        clientId: client.id,
        notes: { contains: "[SMS Backfill]" },
      },
    });

    // 3. Ingest all 38 historical workout sessions
    const createdSessions = [];

    for (const s of HISTORICAL_WORKOUT_SESSIONS) {
      const completedDate = new Date(`${s.date}T12:00:00.000Z`);

      const sessionRecord = await prisma.workoutSession.create({
        data: {
          clientId: client.id,
          status: "COMPLETED",
          startedAt: completedDate,
          completedAt: completedDate,
          notes: `[SMS Backfill] ${s.notes}`,
          loggedByRole: "TRAINER",
          loggedById: user.id,
          loggedByName: "Jose Dildine",
          exercises: {
            create: s.exercises.map((ex, exIdx) => ({
              name: ex.name,
              order: exIdx,
              sets: {
                create: ex.sets.map((st, stIdx) => ({
                  order: stIdx,
                  weight: st.weight,
                  reps: st.reps,
                })),
              },
            })),
          },
        },
        include: {
          exercises: {
            include: { sets: true },
          },
        },
      });

      createdSessions.push(sessionRecord);
    }

    const totalExercises = createdSessions.reduce((sum, s) => sum + s.exercises.length, 0);
    const totalSets = createdSessions.reduce(
      (sum, s) => sum + s.exercises.reduce((exSum, e) => exSum + e.sets.length, 0),
      0
    );

    return NextResponse.json({
      success: true,
      message: `Successfully backfilled ${createdSessions.length} historical workout sessions (${totalExercises} exercises, ${totalSets} sets) from March 10 to August 18, 2026!`,
      client: {
        id: client.id,
        name: client.name,
        email: client.email,
      },
      sessionsCount: createdSessions.length,
      totalExercises,
      totalSets,
      firstSessionDate: HISTORICAL_WORKOUT_SESSIONS[0].date,
      latestSessionDate: HISTORICAL_WORKOUT_SESSIONS[HISTORICAL_WORKOUT_SESSIONS.length - 1].date,
    });
  } catch (error: any) {
    console.error("Backfill Error:", error);
    return NextResponse.json({ error: error.message || "Failed to backfill historical workouts." }, { status: 500 });
  }
}
