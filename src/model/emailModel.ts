import mongoose from 'mongoose';
import { emailData } from '../util/interfaces';

const emailSchema = new mongoose.Schema<emailData>({
	emails: Array,
	userId: String,
	lastUpdated: Date,
});
const emailModel = mongoose.model('emails', emailSchema);
export default emailModel;