-- CreateTable
CREATE TABLE "schedule_rules" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "caregiver_id" TEXT NOT NULL,
    "day_of_week" INTEGER NOT NULL,
    "start_time_minutes" INTEGER NOT NULL,
    "end_time_minutes" INTEGER NOT NULL,
    "effective_start_date" TIMESTAMP(3) NOT NULL,
    "effective_end_date" TIMESTAMP(3),
    "service_code" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "schedule_rules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_schedule_rules_client_day" ON "schedule_rules"("client_id", "day_of_week");

-- CreateIndex
CREATE INDEX "idx_schedule_rules_caregiver_day" ON "schedule_rules"("caregiver_id", "day_of_week");

-- AddForeignKey
ALTER TABLE "schedule_rules" ADD CONSTRAINT "schedule_rules_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule_rules" ADD CONSTRAINT "schedule_rules_caregiver_id_fkey" FOREIGN KEY ("caregiver_id") REFERENCES "caregivers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
