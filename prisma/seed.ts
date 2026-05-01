// BikeTracker — Seed Script
// Pre-populates: Honda Dio, starting odometer 65,279 km,
// default maintenance tasks, LKR 294/L Octane 92 price

import { PrismaClient, FuelType, VehicleType, ExpenseCategory } from "@prisma/client";

const prisma = new PrismaClient();

// ── Change these to your actual Clerk user ID + email after first sign-in ──
const SEED_CLERK_ID = "YOUR_CLERK_USER_ID";
const SEED_EMAIL    = "your@email.com";
const SEED_NAME     = "Your Name";

// ── Honda Dio starting values ──
const STARTING_ODOMETER_KM = 65279;
const TANK_CAPACITY_L      = 5.3;
const BASELINE_KMPL        = 48.0;
const CURRENT_PRICE_LKR    = 294.0; // Octane 92, effective 2025-10-31

async function main() {
  console.log("🌱 Seeding BikeTracker...");

  // ── User ──────────────────────────────────────────────
  const user = await prisma.user.upsert({
    where: { clerkId: SEED_CLERK_ID },
    update: {},
    create: {
      clerkId: SEED_CLERK_ID,
      email:   SEED_EMAIL,
      name:    SEED_NAME,
    },
  });
  console.log(`✅ User: ${user.email}`);

  // ── User Settings ─────────────────────────────────────
  await prisma.userSettings.upsert({
    where:  { userId: user.id },
    update: {},
    create: {
      userId:              user.id,
      currency:            "LKR",
      defaultFuelType:     FuelType.OCTANE_92,
      lowFuelThresholdPct: 20,
      dueSoonKmThreshold:  500,
      dueSoonDayThreshold: 14,
    },
  });
  console.log("✅ UserSettings");

  // ── Vehicle ───────────────────────────────────────────
  const vehicle = await prisma.vehicle.upsert({
    where: { id: "seed-vehicle-dio" },
    update: {},
    create: {
      id:               "seed-vehicle-dio",
      userId:           user.id,
      name:             "My Dio",
      make:             "Honda",
      model:            "Dio",
      type:             VehicleType.SCOOTER,
      fuelType:         FuelType.OCTANE_92,
      tankCapacityL:    TANK_CAPACITY_L,
      baselineKmpl:     BASELINE_KMPL,
      currentOdometerKm: STARTING_ODOMETER_KM,
    },
  });
  console.log(`✅ Vehicle: ${vehicle.name} @ ${vehicle.currentOdometerKm} km`);

  // Set as default vehicle in settings
  await prisma.userSettings.update({
    where:  { userId: user.id },
    data:   { defaultVehicleId: vehicle.id },
  });

  // ── Initial odometer reading ──────────────────────────
  await prisma.odometerReading.upsert({
    where: { id: "seed-odometer-initial" },
    update: {},
    create: {
      id:         "seed-odometer-initial",
      vehicleId:  vehicle.id,
      date:       new Date(),
      odometerKm: STARTING_ODOMETER_KM,
      source:     "MANUAL",
      notes:      "Initial seeded odometer reading",
    },
  });
  console.log(`✅ Initial odometer: ${STARTING_ODOMETER_KM} km`);

  // ── Fuel price history ────────────────────────────────
  await prisma.priceHistory.upsert({
    where: {
      fuelType_effectiveDate: {
        fuelType:      FuelType.OCTANE_92,
        effectiveDate: new Date("2025-10-31"),
      },
    },
    update: {},
    create: {
      fuelType:      FuelType.OCTANE_92,
      pricePerLiter: CURRENT_PRICE_LKR,
      effectiveDate: new Date("2025-10-31"),
      source:        "CPC Gazette 2025-10-31",
    },
  });
  console.log(`✅ Fuel price: LKR ${CURRENT_PRICE_LKR}/L (Octane 92)`);

  // ── Maintenance tasks (Honda Dio defaults) ────────────
  // lastDoneKm is set to STARTING_ODOMETER - interval so first reminder
  // triggers at the right point going forward.
  const maintenanceTasks = [
    {
      type:           "oil_change",
      label:          "Engine Oil Change",
      intervalKm:     3000,
      intervalMonths: 3,
      sortOrder:      1,
    },
    {
      type:           "full_service",
      label:          "Full Service",
      intervalKm:     6000,
      intervalMonths: 6,
      sortOrder:      2,
    },
    {
      type:           "air_filter",
      label:          "Air Filter Clean / Replace",
      intervalKm:     6000,
      intervalMonths: 6,
      sortOrder:      3,
    },
    {
      type:           "spark_plug",
      label:          "Spark Plug Check",
      intervalKm:     12000,
      intervalMonths: 12,
      sortOrder:      4,
    },
    {
      type:           "tyre_front",
      label:          "Front Tyre Replacement",
      intervalKm:     15000,
      intervalMonths: 36,
      sortOrder:      5,
    },
    {
      type:           "tyre_rear",
      label:          "Rear Tyre Replacement",
      intervalKm:     12000,
      intervalMonths: 24,
      sortOrder:      6,
    },
    {
      type:           "brake_pads",
      label:          "Brake Pad Inspection",
      intervalKm:     6000,
      intervalMonths: 6,
      sortOrder:      7,
    },
    {
      type:           "drive_belt",
      label:          "Drive Belt (CVT)",
      intervalKm:     24000,
      intervalMonths: 24,
      sortOrder:      8,
    },
    {
      type:           "battery_check",
      label:          "Battery Check",
      intervalKm:     null,
      intervalMonths: 6,
      sortOrder:      9,
    },
  ];

  for (const task of maintenanceTasks) {
    const nextDueKm = task.intervalKm
      ? STARTING_ODOMETER_KM + task.intervalKm
      : null;

    const nextDueDate = task.intervalMonths
      ? new Date(
          new Date().setMonth(new Date().getMonth() + task.intervalMonths)
        )
      : null;

    await prisma.maintenanceTask.upsert({
      where: { id: `seed-task-${task.type}` },
      update: {},
      create: {
        id:             `seed-task-${task.type}`,
        vehicleId:      vehicle.id,
        type:           task.type,
        label:          task.label,
        intervalKm:     task.intervalKm,
        intervalMonths: task.intervalMonths,
        nextDueKm:      nextDueKm,
        nextDueDate:    nextDueDate,
        status:         "OK",
        sortOrder:      task.sortOrder,
      },
    });
    console.log(`  ✅ Task: ${task.label}`);
  }

  // ── Renewal reminders (placeholders — user fills actual dates) ────
  const today     = new Date();
  const oneYear   = new Date(today);
  oneYear.setFullYear(today.getFullYear() + 1);

  const renewals = [
    {
      id:    "seed-renewal-insurance",
      type:  "INSURANCE" as const,
      label: "Vehicle Insurance",
    },
    {
      id:    "seed-renewal-revenue-license",
      type:  "REVENUE_LICENSE" as const,
      label: "Revenue License",
    },
    {
      id:    "seed-renewal-emission",
      type:  "EMISSION_TEST" as const,
      label: "Emission Test",
    },
  ];

  for (const renewal of renewals) {
    await prisma.renewalReminder.upsert({
      where: { id: renewal.id },
      update: {},
      create: {
        id:               renewal.id,
        vehicleId:        vehicle.id,
        type:             renewal.type,
        label:            renewal.label,
        currentExpiryDate: oneYear, // placeholder — update via Settings
        notes:            "⚠️ Update your actual expiry date in Documents tab",
      },
    });
    console.log(`  ✅ Renewal: ${renewal.label}`);
  }

  console.log("\n🎉 Seed complete!");
  console.log(`\n⚠️  Before running: replace SEED_CLERK_ID and SEED_EMAIL in prisma/seed.ts`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
