import User from '../models/user.model.js';

export async function getUserbyID(id) {
    return await User.findById(id);
};

export async function getUserbyEmail(email) {
    return await User.findOne({ email });
};

export async function createUser(data) {
    return await User.create(data);
};

export async function updateUser(id, updates) {
    return await User.findByIdAndUpdate(id, updates, { new: true });
};

export async function deleteUser(id) {
    return await User.findByIdAndDelete(id);
}

export async function getAllUsers() {
    return await User.find().sort({ createdAt: -1 });
};


