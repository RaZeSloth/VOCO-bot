import { VocoBot } from '../util/Bot';
import glob from 'glob';
import path from 'path';
import { yellow, green } from 'chalk';
import { command } from '../util/interfaces';
export = async (client: VocoBot) => {
	const failid = glob.sync(path.resolve(__dirname, '../commands/**/*.{js,ts}'));
	if (failid.length <= 0) return console.log(yellow('Pole kommande lol'));
	const slashCmdArray: command[] = [];
	for (const file of failid) {
		const slashCommand = await import(file);
		slashCmdArray.push(slashCommand.default);
		client.commands.set(slashCommand.name, slashCommand);
	}
	client.on('ready', async () => {
		console.log(green(`Startup: ${new Date()}`));
		await client.application.commands.set(slashCmdArray);
	});
}
