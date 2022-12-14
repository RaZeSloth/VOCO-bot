import { CommandInteraction, ContextMenuCommandInteraction, MessageComponentInteraction, ModalBuilder, ModalSubmitInteraction } from 'discord.js';
import Puppeteer from 'puppeteer';

const useModal: (sourceInteraction: CommandInteraction| ContextMenuCommandInteraction | MessageComponentInteraction, modal: ModalBuilder, timeout?: number,) => Promise<ModalSubmitInteraction | null> = async (commandInteraction, modal, timeout = 2 * 60 * 1000) => {
	await commandInteraction.showModal(modal);
	return commandInteraction.awaitModalSubmit({ time: timeout, filter: (filterInteraction) => filterInteraction.customId === modal.data.custom_id }).catch(() => null);
};

const getFoodForToday = async (): Promise<Buffer> => {
	const b = await Puppeteer.launch({ headless: true, defaultViewport: { width: 1920, height: 1080 } });
	const apiURL = 'https://siseveeb.voco.ee/veebivormid/restorani_menuu';
	const page = await b.newPage();
	await page.goto(apiURL);
	const buff = await page.screenshot();
	b.close();
	return buff as Buffer;
};

export { useModal, getFoodForToday };