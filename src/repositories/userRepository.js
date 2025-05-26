const pool = require('../config/db');

class UserRepository {
    async create(data) {
        const { name, email } = data;
        const query = 'INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *';
        const values = [name, email];
        const result = await pool.query(query, values);
        return result.rows[0];
    }

    async findById(id) {
        const query = 'SELECT * FROM users WHERE id = $1';
        const result = await pool.query(query, [id]);
        return result.rows[0];
    }

    async update(id, data) {
        const { name, email } = data;
        const query = 'UPDATE users SET name = $1, email = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *';
        const values = [name, email, id];
        const result = await pool.query(query, values);
        return result.rows[0];
    }

    async delete(id) {
        const query = 'DELETE FROM users WHERE id = $1 RETURNING *';
        const result = await pool.query(query, [id]);
        return result.rows[0];
    }

    async findAll() {
        const query = 'SELECT * FROM users';
        const result = await pool.query(query);
        return result.rows;
    }
}

module.exports = new UserRepository();