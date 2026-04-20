import { ChatInputCommandInteraction } from 'discord.js';

// Extend the Client type to include commands collection
declare module 'discord.js' {
  interface Client {
    commands: Map<string, Command>;
  }
}

// Command interface
export interface Command {
  data: {
    name: string;
    description: string;
  };
  execute(interaction: ChatInputCommandInteraction): Promise<void>;
}

// Event interface
export interface BotEvent {
  name: string;
  once?: boolean;
  execute(...args: any[]): Promise<void> | void;
}

// Database user model
export interface User {
  id?: number;
  memid: string;
  username: string;
  platform: string;
  rating: string;
  tag: string;
}

// Submission verification result
export interface SubmissionResult {
  verdict: boolean;
  timestamp: boolean;
}
