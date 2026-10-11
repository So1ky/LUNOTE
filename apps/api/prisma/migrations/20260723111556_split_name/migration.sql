-- 이름을 firstName/lastName으로 분리 (기존 name은 첫 공백 기준 분할 후 제거)
ALTER TABLE "users" ADD COLUMN "firstName" TEXT;
ALTER TABLE "users" ADD COLUMN "lastName" TEXT;

UPDATE "users" SET
  "firstName" = NULLIF(split_part("name", ' ', 1), ''),
  "lastName"  = NULLIF(btrim(substr("name", length(split_part("name", ' ', 1)) + 2)), '')
WHERE "name" IS NOT NULL;

ALTER TABLE "users" DROP COLUMN "name";
