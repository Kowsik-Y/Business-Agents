CREATE SCHEMA IF NOT EXISTS "audit";
--> statement-breakpoint
CREATE SCHEMA IF NOT EXISTS "case_management";
--> statement-breakpoint
CREATE SCHEMA IF NOT EXISTS "conversation";
--> statement-breakpoint
CREATE SCHEMA IF NOT EXISTS "customer";
--> statement-breakpoint
CREATE SCHEMA IF NOT EXISTS "policy";
--> statement-breakpoint
CREATE TABLE "audit"."action_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"actor_id" text NOT NULL,
	"actor_type" text NOT NULL,
	"action" text NOT NULL,
	"resource_type" text NOT NULL,
	"resource_id" text NOT NULL,
	"correlation_id" text,
	"details" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "case_management"."cases" (
	"id" text PRIMARY KEY NOT NULL,
	"conversation_id" text NOT NULL,
	"customer_id" text NOT NULL,
	"assigned_agent_id" text,
	"status" text DEFAULT 'open' NOT NULL,
	"priority" text DEFAULT 'medium' NOT NULL,
	"subject" text NOT NULL,
	"summary" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "conversation"."conversations" (
	"id" text PRIMARY KEY NOT NULL,
	"customer_id" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"channel" text DEFAULT 'web_chat' NOT NULL,
	"subject" text,
	"active_intent" text,
	"sentiment" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer"."customers" (
	"id" text PRIMARY KEY NOT NULL,
	"external_id" text,
	"email" text,
	"name" text,
	"authentication_level" integer DEFAULT 0 NOT NULL,
	"locale" text DEFAULT 'en' NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "case_management"."escalations" (
	"id" text PRIMARY KEY NOT NULL,
	"conversation_id" text NOT NULL,
	"case_id" text,
	"reason" text NOT NULL,
	"summary" text NOT NULL,
	"active_intent" text,
	"sentiment" text,
	"risk_level" text,
	"information_collected" jsonb,
	"missing_information" jsonb,
	"actions_attempted" jsonb,
	"recommended_next_action" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conversation"."messages" (
	"id" text PRIMARY KEY NOT NULL,
	"conversation_id" text NOT NULL,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"channel" text DEFAULT 'web_chat' NOT NULL,
	"language" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit"."tool_executions" (
	"id" text PRIMARY KEY NOT NULL,
	"turn_id" text NOT NULL,
	"conversation_id" text NOT NULL,
	"customer_id" text NOT NULL,
	"tool_name" text NOT NULL,
	"arguments" jsonb NOT NULL,
	"success" boolean NOT NULL,
	"result" jsonb,
	"error_code" text,
	"policy_decision_id" text,
	"duration_ms" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "policy"."tool_policies" (
	"id" text PRIMARY KEY NOT NULL,
	"tool_name" text NOT NULL,
	"required_auth_level" integer DEFAULT 0 NOT NULL,
	"requires_confirmation" boolean DEFAULT false NOT NULL,
	"requires_human_approval" boolean DEFAULT false NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"config" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conversation"."turns" (
	"id" text PRIMARY KEY NOT NULL,
	"conversation_id" text NOT NULL,
	"message_id" text NOT NULL,
	"status" text DEFAULT 'started' NOT NULL,
	"intent" text,
	"response_id" text,
	"error_code" text,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
