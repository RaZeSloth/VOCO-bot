import { Client, Collection, GatewayIntentBits } from 'discord.js';
import path from 'path';
import { command } from './interfaces';

class VocoBot extends Client {
	commands: Collection<string, command>;
	constructor() {
		super({ intents: [GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages, GatewayIntentBits.Guilds] });
		this.commands = new Collection();
	}
	async start() {
		await (await import(path.resolve(__dirname, '../handlers/cmd_handler'))).default(this);
		await (await import(path.resolve(__dirname, '../handlers/event_handler'))).default(this);
	}
}

export { VocoBot };
