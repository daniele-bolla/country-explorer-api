CREATE TABLE "countries" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"cca3" varchar(3) NOT NULL,
	"capital" text[],
	"region_id" integer,
	"subregion_id" integer,
	"population" bigint,
	"flag_svg" text,
	"flag_png" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "countries_cca3_unique" UNIQUE("cca3")
);
--> statement-breakpoint
CREATE TABLE "country_currencies" (
	"country_id" integer NOT NULL,
	"currency_id" integer NOT NULL,
	CONSTRAINT "country_currencies_country_id_currency_id_pk" PRIMARY KEY("country_id","currency_id")
);
--> statement-breakpoint
CREATE TABLE "country_languages" (
	"country_id" integer NOT NULL,
	"language_id" integer NOT NULL,
	"official" boolean DEFAULT false,
	CONSTRAINT "country_languages_country_id_language_id_pk" PRIMARY KEY("country_id","language_id")
);
--> statement-breakpoint
CREATE TABLE "currencies" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(10) NOT NULL,
	"name" varchar(100) NOT NULL,
	"symbol" varchar(10),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "currencies_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "languages" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(10) NOT NULL,
	"name" varchar(100) NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "languages_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "regions" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "regions_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "subregions" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"region_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "countries" ADD CONSTRAINT "countries_region_id_regions_id_fk" FOREIGN KEY ("region_id") REFERENCES "public"."regions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "countries" ADD CONSTRAINT "countries_subregion_id_subregions_id_fk" FOREIGN KEY ("subregion_id") REFERENCES "public"."subregions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "country_currencies" ADD CONSTRAINT "country_currencies_country_id_countries_id_fk" FOREIGN KEY ("country_id") REFERENCES "public"."countries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "country_currencies" ADD CONSTRAINT "country_currencies_currency_id_currencies_id_fk" FOREIGN KEY ("currency_id") REFERENCES "public"."currencies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "country_languages" ADD CONSTRAINT "country_languages_country_id_countries_id_fk" FOREIGN KEY ("country_id") REFERENCES "public"."countries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "country_languages" ADD CONSTRAINT "country_languages_language_id_languages_id_fk" FOREIGN KEY ("language_id") REFERENCES "public"."languages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subregions" ADD CONSTRAINT "subregions_region_id_regions_id_fk" FOREIGN KEY ("region_id") REFERENCES "public"."regions"("id") ON DELETE cascade ON UPDATE no action;