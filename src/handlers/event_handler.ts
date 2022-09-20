import { VocoBot } from '../util/Bot';
import fs from 'fs';
import path from 'path';
export = async (client: VocoBot) => {
	const event_files = fs
		.readdirSync(`${path.dirname(require.main.filename)}${path.sep}events`)
		.filter((file) => file.endsWith('.ts') || file.endsWith('.js'));

	for (const file of event_files) {
		const event = await import(`${path.dirname(require.main.filename)}${path.sep}events/${file}`);
		const event_name = file.split('.')[0];
		client.on(event_name, event.default.bind(null, client));
	}
};