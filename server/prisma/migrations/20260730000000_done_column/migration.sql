-- AlterTable
ALTER TABLE "board_lists" ADD COLUMN     "isDoneColumn" BOOLEAN NOT NULL DEFAULT false;

-- Backfill: existing boards inferred completion from the list name, so preserve
-- that behaviour for lists already named like a completion column.
UPDATE "board_lists"
SET "isDoneColumn" = true
WHERE "name" ~* '(^|[^a-z])(done|complete|completed|shipped)([^a-z]|$)';
