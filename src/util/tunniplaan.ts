import Puppeteer from 'puppeteer';
import cron, { ScheduledTask } from 'node-cron';
import { green, yellow } from 'chalk';
import { lesson, partial_lesson, raw_lesson, week_type } from './interfaces';
import { client } from '..';
import { AttachmentBuilder, codeBlock, EmbedBuilder, GuildTextBasedChannel, time, TimestampStyles } from 'discord.js';

import { generateImgFromPDF, getBussTime, getFoodForToday, getLastLessonBuss, sanitizeString, sendEmail, weeksSinceSeptember1 } from './functions';
import lessonsModel from '../model/lessonsModel';
import axios from 'axios';
import fs from 'fs';
import emailModel from '../model/emailModel';

const cron_jobs: Set<ScheduledTask> = new Set();
const getAllSchoolTimesAndLessons_old = async (options?: { getNextWeek?: boolean }): Promise<partial_lesson[]> => {
	const lesson_array: string[] = [];
	const times_array: string[] = [];
	const b = await Puppeteer.launch({ headless: true });
	const page = await b.newPage();
	await page.goto('https://voco.ee/tunniplaan/');
	await page.select('#course_select', '1692');
	await new Promise(r => setTimeout(r, 2000));
	if (options?.getNextWeek) {
		await page.click('.fc-next-button');
		await new Promise(r => setTimeout(r, 2000));
	}
	const lessons = await page.$$('.fc-title');
	const timeWhenLesson = await page.$$('.fc-time span');
	for (const lesson of lessons) {
		const lesson_text = await page.evaluate(e => e.textContent, lesson);
		lesson_array.push(lesson_text);
	}
	for (const time of timeWhenLesson) {
		const time_text = await page.evaluate(e => e.textContent, time);
		times_array.push(time_text);
	}
	await b.close();
	const times = times_array.filter(d => {
		if (d.toString().includes('-')) {
			return d;
		}
	});
	let m: number;
	let c: number;
	const fil_times: partial_lesson[] = [];
	for (let k = 0; k < times.length; k++) {
		if (!m) {
			m = parseInt(times[k]);
			fil_times[0] = [{ lesson: lesson_array[k], time:times[k] }];
			c = k;
		} else if (m < parseInt(times[k])) {
			fil_times[c].push({ lesson: lesson_array[k], time:times[k] });
			m = parseInt(times[k]);
		} else if (m > parseInt(times[k])) {
			c++;
			fil_times[c] = [{ lesson: lesson_array[k], time:times[k] }];
			m = parseInt(times[k]);
		}
	}

	return fil_times;
};

const getAllSchoolTimesAndLessons = async (options?: { getNextWeek?: boolean }): Promise<lesson[][]> => {
	const b = await Puppeteer.launch({ headless: true });
	const page = await b.newPage();
	const raw_lessons_objects: raw_lesson[] = [];
	const date_data = new Date(options?.getNextWeek ? new Date().getTime() + 7 * 24 * 60 * 60 * 1000 : new Date().getTime());
	const url = `https://siseveeb.voco.ee/veebivormid/tunniplaan/tunniplaan?oppegrupp=1692&nadal=${date_data.getDate()}.${date_data.getMonth() + 1}.${date_data.getFullYear()}`;
	await page.goto(url, {
		waitUntil: 'load',
	});
	const contents = await page.$$('.fc-content');
	for (const content of contents) {
		const content_object = await page.evaluate(e => {
			return { time: e.querySelector('.fc-time span')?.textContent, lesson: e.querySelector('.fc-title')?.textContent };
		}, content);
		if (content_object.time && content_object.lesson) {
			raw_lessons_objects.push(content_object);
		}
	}

	const les_object_arr: lesson[] = raw_lessons_objects.reduce((acc: lesson[], { time, lesson }) => {
		const lastLesson: lesson = acc[acc.length - 1];
		if (lastLesson && lastLesson.time === time) {
			lastLesson.lessons.push({ name: lesson });
			lastLesson.lesson_count++;
		} else {
			acc.push({ time, lesson_count: 1, lessons: [{ name: lesson }] });
		}
		return acc;
	}, []);

	// Old bad code which is not very efficient with Eve's plans on making the lesson schedules...
	/* for (const partial_lesson of raw_lessons_objects) {
		const currentLessonTime = partial_lesson.time;
		const beforeLessonTime = raw_lessons_objects[raw_lessons_objects.indexOf(partial_lesson) - 1]?.time;
		const afterLessonTime = raw_lessons_objects[raw_lessons_objects.indexOf(partial_lesson) + 1]?.time;
		if (currentLessonTime === afterLessonTime) {
			const obj: lesson = { time: partial_lesson.time, lesson_count: 0, lessons: [] };
			if (partial_lesson.lesson.includes('R1')) {
				obj.lessons.push(partial_lesson.lesson);
				obj.lessons.push(raw_lessons_objects[raw_lessons_objects.indexOf(partial_lesson) + 1].lesson);
				obj.lesson_count += 2;
			}
			if (partial_lesson.lesson.includes('R2')) {
				obj.lessons.push(partial_lesson.lesson);
				obj.lessons.push(raw_lessons_objects[raw_lessons_objects.indexOf(partial_lesson) + 1].lesson);
				obj.lesson_count += 2;
			}
			if (!obj.lessons.length) {
				obj.lessons.push(partial_lesson.lesson);
				obj.lessons.push(raw_lessons_objects[raw_lessons_objects.indexOf(partial_lesson) + 1].lesson);
				obj.lesson_count += 2;
			}
			les_object_arr.push(obj);
		}
		if (currentLessonTime === beforeLessonTime) {
			continue;
		}
		if (currentLessonTime !== beforeLessonTime && currentLessonTime !== afterLessonTime) {
			const obj: lesson = { time: partial_lesson.time, lesson_count: 1, lessons: [] };
			obj.lessons.push(partial_lesson.lesson);
			les_object_arr.push(obj);
		}
	} */


	const amount_of_lessons_per_day: number[] = [];
	const day_html_collection_of_children = (await page.$$('.fc-content-col'));
	for (const day of day_html_collection_of_children) {
		const amount_of_lessons = await page.evaluate(e => e.children[1].children.length, day);
		amount_of_lessons_per_day.push(amount_of_lessons);
	}
	const divideLessons = (lessons: lesson[], lessonsPerDay: number[]): lesson[][] => {
		const result: lesson[][] = [];
		let currentIndex = 0;
		for (let i = 0; i < lessonsPerDay.length; i++) {
			const currentLessons = [];
			let lessonsToTake = lessonsPerDay[i];
			while (lessonsToTake > 0 && currentIndex < lessons.length) {
				const lessonCount = lessons[currentIndex].lesson_count;
				if (lessonCount > lessonsToTake) {
					currentLessons.push({ lesson_count: lessonsToTake, lesson: lessons[currentIndex] });
					currentIndex++;
					lessonsToTake = 0;
				} else {
					currentLessons.push(lessons[currentIndex]);
					lessonsToTake -= lessonCount;
					currentIndex++;
				}
			}
			result.push(currentLessons);
		}
		return result;

	};
	const fil_times = divideLessons(les_object_arr, amount_of_lessons_per_day);
	/* Very ugly bad code, which does not work if the days between have 0 days which is bad, new function fixes that problem by not using this if statements in this commented code. */
	/* let m: number;
	let c: number;
	const fil_times: lesson[][] = [];
	for (let i = 0; i < les_object_arr.length; i++) {
		if (!m) {
			m = parseInt(les_object_arr[i].time);
			fil_times[0] = [les_object_arr[i]];
			c = i;
		} else if (m < parseInt(les_object_arr[i].time)) {
			if (amount_of_lessons_per_day[c] === fil_times[c].reduce((a, b) => a + b.lesson_count, 0)) {
				c++;
				fil_times[c] = [les_object_arr[i]];
			} else {
				fil_times[c].push(les_object_arr[i]);
				m = parseInt(les_object_arr[i].time);
			}
		} else if (m > parseInt(les_object_arr[i].time)) {
			c++;
			fil_times[c] = [les_object_arr[i]];
			m = parseInt(les_object_arr[i].time);
		}
	} */
	for (const day of fil_times) {
		for (const data of day) {
			for (const lesson of data.lessons) {
				const lessonName = sanitizeString(lesson.name);
				console.log(lessonName);
				const existingLesson = await lessonsModel.findOne({ lessonName });
				if (!existingLesson) {
					await lessonsModel.create({ lessonName, lastUpdated: new Date() });
				} else if (existingLesson.lessonGroup) {
					lesson.lesson_group = existingLesson.lessonGroup;
				}
			}
		}
	}

	client.cache.set(options?.getNextWeek ? week_type.next_week : week_type.this_week, fil_times);
	return fil_times;
};

const getMinforCron = (time: string) => {
	return parseInt(time.split('-')[0].trim().split(':')[1]);
};

const getHourforCron = (time: string) => {
	return parseInt(time.split('-')[0].trim().split(':')[0]);
};
const getCrons = (options: { lesson_data: lesson, getRawDate?: true }) => {
	const date = new Date();
	date.setHours(getHourforCron(options.lesson_data.time));
	date.setMinutes(getMinforCron(options.lesson_data.time));
	const eating_time = options.lesson_data.lessons.some(lesson => lesson.name.includes('Söömine'));
	if (options?.getRawDate) {
		if (eating_time) {
			date.setMinutes(date.getMinutes() + 35);
		}
		return { date, cron: `${date.getMinutes()} ${date.getHours()} * * *` };
	}
	date.setMinutes(date.getMinutes() - 15);
	if (eating_time) {
		date.setMinutes(date.getMinutes() + 35);
	}
	return { string: `${date.getMinutes()} ${date.getHours()} * * *`, date };
};
const startCronJobs = async () => {
	const day = new Date().getDay();
	if (day >= 1 && day <= 5) {
		const data = await getAllSchoolTimesAndLessons();
		const currentDay = data[day - 1];
		if (currentDay.length === 0) return;
		for (const lessonData of currentDay) {
			const lesson_object_cron = getCrons({ lesson_data: lessonData });
			const job = cron.schedule(lesson_object_cron.string, async () => {
				const time_until_les = getCrons({ lesson_data: lessonData, getRawDate: true });
				const notification_embed = new EmbedBuilder()
					.setTitle(lessonData.time + ` (${time(time_until_les.date, TimestampStyles.RelativeTime)})`)
					.setColor('#000000');
				notification_embed.setDescription(codeBlock(`${lessonData.lessons.map(data => `${data.name} - ${data.lesson_group}`).join('\n----------------------------------\n')}`));
				await (client.channels.cache.get('1029381699009794139') as GuildTextBasedChannel).send({ content: '<@&1029335363040329749>', embeds: [notification_embed] });
				job.stop();
			}, { timezone: 'Europe/Tallinn' });
			cron_jobs.add(job);
			console.log(green(`Lesson nr ${currentDay.indexOf(lessonData) + 1} at ${lesson_object_cron.date.toLocaleTimeString('et-EE', { hour: '2-digit', minute:'2-digit' })} is scheduled`));
		}
		const lastLesson = currentDay[currentDay.length - 1];
		const lastLessonMin = parseInt(lastLesson.time.split('-')[1].trim().split(':')[1]);
		const lastLessonHour = parseInt(lastLesson.time.split('-')[1].trim().split(':')[0]);
		const lastLessonTime = new Date();
		lastLessonTime.setHours(lastLessonHour);
		lastLessonTime.setMinutes(lastLessonMin);
		const lastLesson_object_cron = { cron: `${lastLessonMin} ${lastLessonHour} * * *`, date: lastLessonTime };
		const bussTimeNotification = cron.schedule(lastLesson_object_cron.cron, async () => {
			const bussTimesArray = getLastLessonBuss(lastLesson.time, await getBussTime());
			const embed = new EmbedBuilder()
				.setTitle('`4` Alasi (Karete suunas)')
				.addFields(bussTimesArray.map(bussTimeObject => ({ name: '\u200B', value: codeBlock(bussTimeObject.time), inline: true })))
				.setColor('#000000');
			await (await client.channels.fetch('1029381699009794139') as GuildTextBasedChannel).send({ content: '<@&1066785642115235900>', embeds: [embed] });
		}, { timezone: 'Europe/Tallinn' });
		cron_jobs.add(bussTimeNotification);
		console.log(green(`Buss notification at: ${lastLesson_object_cron.date.toLocaleTimeString('et-EE', { hour: '2-digit', minute:'2-digit' })} is scheduled`));

		const food = cron.schedule('45 11 * * *', async () => {
			const embed = new EmbedBuilder()
				.setTitle('Söömine! 12:00 - 12:30')
				.setColor('#000000');
			const food = await getFoodForToday();
			embed.setImage('attachment://sook.png');
			await (client.channels.cache.get('1029381699009794139') as GuildTextBasedChannel).send({ embeds: [embed], files: [new AttachmentBuilder(food, { name: 'sook.png' })] });
		}, { timezone: 'Europe/Tallinn' });
		cron_jobs.add(food);
		console.log(green('Food at 11:45 is scheduled'));
	} else {
		console.log(yellow('Weekend day, skipping...'));
	}
};

export = { init: async () => {
	await startCronJobs();
	cron.schedule('0 0 * * *', async () => {
		cron_jobs.forEach(job => job.stop());
		cron_jobs.clear();
		await (client.channels.cache.get('1029381699009794139') as GuildTextBasedChannel).bulkDelete(100).catch(() => null);
		await startCronJobs();
	}, { timezone: 'Europe/Tallinn' });
	cron.schedule('0 22 * * 0', async () => {
		const date = new Date();
		date.setDate(date.getDate() + 1);
		const writer = fs.createWriteStream('tunniplaan.pdf');
		const response = await axios.get(`https://siseveeb.voco.ee/veebivormid/tunniplaan/tunniplaani_pdf?vaade=grupid&oppegrupp=1692&nadal=${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}`, { responseType: 'stream' });
		response.data.pipe(writer);
		writer.on('finish', async () => {
			const emails = await emailModel.find();
			const user_emails = emails.map(email => email.emails).flat();
			const pdf_image = await generateImgFromPDF('tunniplaan.pdf');
			fs.writeFileSync('tunniplaan.png', pdf_image);
			await sendEmail({ emails: user_emails, subject: `${weeksSinceSeptember1()}. nädala tunniplaan`, html: '<img src="cid:tunniplaan_pilt" alt="Tunniplaan" style="display: block; margin-left: auto; margin-right: auto" loading="lazy"/>', attachments: [{ path: 'tunniplaan.pdf' }, { path: 'tunniplaan.png', cid: 'tunniplaan_pilt' }] });
		});
	});
}, getAllSchoolTimesAndLessons, getAllSchoolTimesAndLessons_old };
