-- CreateEnum
CREATE TYPE "EntitlementType" AS ENUM ('vault_access', 'grimoire_access', 'admin');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Entitlement" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "entitlementType" "EntitlementType" NOT NULL,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Entitlement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StripeEvent" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StripeEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentItem" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "requiredEntitlement" "EntitlementType",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "authorId" TEXT NOT NULL,

    CONSTRAINT "ContentItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentAsset" (
    "id" TEXT NOT NULL,
    "contentItemId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContentAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentItemTag" (
    "contentItemId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "ContentItemTag_pkey" PRIMARY KEY ("contentItemId","tagId")
);

-- CreateTable
CREATE TABLE "GrimoireEntry" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "currentRevisionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GrimoireEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GrimoireRevision" (
    "id" TEXT NOT NULL,
    "grimoireEntryId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "revisionNumber" INTEGER NOT NULL,
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GrimoireRevision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GrimoireEntryTag" (
    "grimoireEntryId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "GrimoireEntryTag_pkey" PRIMARY KEY ("grimoireEntryId","tagId")
);

-- CreateTable
CREATE TABLE "JournalEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JournalEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RitualInstance" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RitualInstance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "Entitlement_userId_idx" ON "Entitlement"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Entitlement_userId_entitlementType_key" ON "Entitlement"("userId", "entitlementType");

-- CreateIndex
CREATE UNIQUE INDEX "StripeEvent_eventId_key" ON "StripeEvent"("eventId");

-- CreateIndex
CREATE INDEX "StripeEvent_eventId_idx" ON "StripeEvent"("eventId");

-- CreateIndex
CREATE INDEX "StripeEvent_processed_idx" ON "StripeEvent"("processed");

-- CreateIndex
CREATE UNIQUE INDEX "ContentItem_slug_key" ON "ContentItem"("slug");

-- CreateIndex
CREATE INDEX "ContentItem_slug_idx" ON "ContentItem"("slug");

-- CreateIndex
CREATE INDEX "ContentItem_authorId_idx" ON "ContentItem"("authorId");

-- CreateIndex
CREATE INDEX "ContentAsset_contentItemId_idx" ON "ContentAsset"("contentItemId");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_name_key" ON "Tag"("name");

-- CreateIndex
CREATE INDEX "ContentItemTag_contentItemId_idx" ON "ContentItemTag"("contentItemId");

-- CreateIndex
CREATE INDEX "ContentItemTag_tagId_idx" ON "ContentItemTag"("tagId");

-- CreateIndex
CREATE UNIQUE INDEX "GrimoireEntry_slug_key" ON "GrimoireEntry"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "GrimoireEntry_currentRevisionId_key" ON "GrimoireEntry"("currentRevisionId");

-- CreateIndex
CREATE INDEX "GrimoireEntry_slug_idx" ON "GrimoireEntry"("slug");

-- CreateIndex
CREATE INDEX "GrimoireRevision_grimoireEntryId_idx" ON "GrimoireRevision"("grimoireEntryId");

-- CreateIndex
CREATE INDEX "GrimoireRevision_authorId_idx" ON "GrimoireRevision"("authorId");

-- CreateIndex
CREATE UNIQUE INDEX "GrimoireRevision_grimoireEntryId_revisionNumber_key" ON "GrimoireRevision"("grimoireEntryId", "revisionNumber");

-- CreateIndex
CREATE INDEX "GrimoireEntryTag_grimoireEntryId_idx" ON "GrimoireEntryTag"("grimoireEntryId");

-- CreateIndex
CREATE INDEX "GrimoireEntryTag_tagId_idx" ON "GrimoireEntryTag"("tagId");

-- CreateIndex
CREATE INDEX "JournalEntry_userId_idx" ON "JournalEntry"("userId");

-- CreateIndex
CREATE INDEX "RitualInstance_userId_idx" ON "RitualInstance"("userId");

-- CreateIndex
CREATE INDEX "RitualInstance_scheduledAt_idx" ON "RitualInstance"("scheduledAt");

-- CreateIndex
CREATE INDEX "AuditLog_adminId_idx" ON "AuditLog"("adminId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_resourceType_resourceId_idx" ON "AuditLog"("resourceType", "resourceId");

-- AddForeignKey
ALTER TABLE "Entitlement" ADD CONSTRAINT "Entitlement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentItem" ADD CONSTRAINT "ContentItem_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentAsset" ADD CONSTRAINT "ContentAsset_contentItemId_fkey" FOREIGN KEY ("contentItemId") REFERENCES "ContentItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentItemTag" ADD CONSTRAINT "ContentItemTag_contentItemId_fkey" FOREIGN KEY ("contentItemId") REFERENCES "ContentItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentItemTag" ADD CONSTRAINT "ContentItemTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GrimoireRevision" ADD CONSTRAINT "GrimoireRevision_grimoireEntryId_fkey" FOREIGN KEY ("grimoireEntryId") REFERENCES "GrimoireEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GrimoireRevision" ADD CONSTRAINT "GrimoireRevision_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GrimoireEntryTag" ADD CONSTRAINT "GrimoireEntryTag_grimoireEntryId_fkey" FOREIGN KEY ("grimoireEntryId") REFERENCES "GrimoireEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GrimoireEntryTag" ADD CONSTRAINT "GrimoireEntryTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalEntry" ADD CONSTRAINT "JournalEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RitualInstance" ADD CONSTRAINT "RitualInstance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
