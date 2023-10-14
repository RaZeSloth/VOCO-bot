import mongoose from 'mongoose';

const emailSchema = new mongoose.Schema({
	email: String,
	userId: String,
	lastUpdated: Date,
});
const emailModel = mongoose.model('emails', emailSchema);
export default emailModel;