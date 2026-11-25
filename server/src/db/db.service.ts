import { Injectable, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Collection, Document, MongoClient } from "mongodb";

@Injectable()
export class DbService implements OnModuleInit {
  private client?: MongoClient;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit(): Promise<void> {
    const uri = this.configService.get<string>("DATABASE_URL") || "mongodb://localhost:27017/opshub";
    this.client = await new MongoClient(uri).connect();
  }

  get db() {
    if (!this.client) throw new Error("Database not connected yet");
    return this.client.db();
  }

  collection<T extends Document = Document>(name: string): Collection<T> {
    return this.db.collection<T>(name);
  }
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function uid(prefix = "id"): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

export function stripDoc<T extends object>(doc: Document & T): T {
  const { _id, ...rest } = doc;
  return rest as T;
}
