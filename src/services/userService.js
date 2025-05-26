const userRepository = require('../repositories/userRepository');
const cache = require('../utils/cache');

class UserService {
    async createUser(data) {
        const user = await userRepository.create(data);
        await cache.set(`user:${user.id}`, user);
        return user;
    }

    async getUser(id) {
        const cachedUser = await cache.get(`user:${id}`);
        if (cachedUser) {
            return cachedUser;
        }
        const user = await userRepository.findById(id);
        if (!user) {
            throw new Error('User not found');
        }
        await cache.set(`user:${id}`, user, 3600); // Cache for 1 hour
        return user;
    }

    async updateUser(id, data) {
        const user = await userRepository.update(id, data);
        if (!user) {
            throw new Error('User not found');
        }
        await cache.set(`user:${id}`, user);
        return user;
    }

    async deleteUser(id) {
        // delete user from db
        const result = await userRepository.delete(id);
        if (!result) {
            throw new Error('User not found');
        }
        // delete user from cache
        await cache.del(`user:${id}`);
        return result;
    }

    async getAllUsers() {
        return await userRepository.findAll();
    }
}

module.exports = new UserService();