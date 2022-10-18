import { Client, Collection, GatewayIntentBits } from 'discord.js';
import path from 'path';
import { command, lesson } from './interfaces';

class VocoBot extends Client {
	commands: Collection<string, command>;
	cache: Collection<number, lesson[][]>;
	constructor() {
		super({ intents: [GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages, GatewayIntentBits.Guilds] });
		this.commands = new Collection();
		this.cache = new Collection();
	}
	async start() {
		['cmd_handler', 'event_handler'].map(async hand => await (await import(path.resolve(__dirname, `../handlers/${hand}`))).default(this));
		await (await import('../util/tunniplaan')).init();
	}
}

export { VocoBot };
