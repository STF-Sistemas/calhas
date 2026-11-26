ALTER TABLE "conf"."usuarios" ADD COLUMN "token_versao" INTEGER NOT NULL DEFAULT 0;
UPDATE "conf"."usuarios" SET "reset_token" = NULL, "reset_token_expiracao" = NULL;
