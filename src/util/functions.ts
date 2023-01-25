import { CommandInteraction, ContextMenuCommandInteraction, MessageComponentInteraction, ModalBuilder, ModalSubmitInteraction } from 'discord.js';
import Puppeteer from 'puppeteer';
import axios from 'axios';
import { load } from 'cheerio';
import busTimesJson from '../json/bus_times.json';

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
const getBussTime = async (): Promise<string[]> => {
	const data = (await axios.get(busTimesJson['Alasi (Karete suunas)'])).data;
	const $ = load(data);
	// const time = $('span.time').toArray().map((e) => $(e).text());
	// div.momentum-scroll:nth-child(1) > a:nth-child(1) > p:nth-child(1) > span:nth-child(2) > span:nth-child(2)
	const times: string[] = [];
	$('p.route-detail-text').each(function() {
		if ($(this).find('.vehicle-number').text() == '4') {
			const time = $(this).find('.time').text();
			times.push(time);
		}
	});
	return times;
};
const getLastLessonBuss = (lastLessonTime: string, bussTimes: string[]): {time: string, date: Date}[] => {
	const endTime = lastLessonTime.split('-')[1].trim();
	const timeObjects = bussTimes.map(time => new Date(`1970-01-01T${time}`));
	const endTimeObject = new Date(`1970-01-01T${endTime}`);

	let closestTime = timeObjects[0];
	let closestDiff = Math.abs(closestTime.getTime() - endTimeObject.getTime());

	for (let i = 1; i < timeObjects.length; i++) {
		const diff = Math.abs(timeObjects[i].getTime() - endTimeObject.getTime());
		if (diff < closestDiff) {
			closestDiff = diff;
			closestTime = timeObjects[i];
		}
	}
	if (closestTime < endTimeObject) {
		const nextIndex = (bussTimes.indexOf(closestTime.toLocaleTimeString('et-EE', { hour: '2-digit', minute:'2-digit' })) + 1) % bussTimes.length;
		return [{ time: bussTimes[nextIndex], date: new Date(`1970-01-01T${bussTimes[nextIndex]}`) }, { time: bussTimes[nextIndex + 1], date: new Date(`1970-01-01T${bussTimes[nextIndex + 1]}`) }];
	} else {
		const index = bussTimes.indexOf(closestTime.toLocaleTimeString('et-EE', { hour: '2-digit', minute:'2-digit' }));
		return [{ time: bussTimes[index], date: new Date(`1970-01-01T${bussTimes[index]}`) }, { time: bussTimes[index + 1], date: new Date(`1970-01-01T${bussTimes[index + 1]}`) }];
	}
};

export { useModal, getFoodForToday, getBussTime, getLastLessonBuss };