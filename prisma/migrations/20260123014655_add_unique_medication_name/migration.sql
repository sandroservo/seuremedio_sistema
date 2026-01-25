/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `Medication` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Medication_name_key" ON "Medication"("name");
