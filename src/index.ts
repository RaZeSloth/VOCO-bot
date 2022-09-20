import { VocoBot } from './util/Bot';
import 'dotenv/config';

const client = new VocoBot();
// Invite: https://discord.com/api/oauth2/authorize?client_id=1021872045690191932&permissions=8&scope=bot%20applications.commands
client.login(process.env.token).then(() => client.start()).catch((e) => {
	console.error(e);
	process.exit();
});
