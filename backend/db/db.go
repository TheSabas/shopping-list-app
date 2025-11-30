package db

import (
	"database/sql"
	"fmt"

	_ "github.com/lib/pq"
)

// InitDB initializes the database connection
func InitDB(dbURL string) (*sql.DB, error) {
	db, err := sql.Open("postgres", dbURL)
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %w", err)
	}

	// Test the connection
	if err = db.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	return db, nil
}

// RunMigrations runs all database migrations
func RunMigrations(db *sql.DB) error {
	migrations := []string{
		createUsersTable,
		createShoppingListsTable,
		createShoppingItemsTable,
		createListHistoryTable,
	}

	for _, migration := range migrations {
		if _, err := db.Exec(migration); err != nil {
			return fmt.Errorf("migration failed: %w", err)
		}
	}

	// Create default user if it doesn't exist
	if err := createDefaultUser(db); err != nil {
		return fmt.Errorf("failed to create default user: %w", err)
	}

	return nil
}

// createDefaultUser creates a default user for testing
func createDefaultUser(db *sql.DB) error {
	var count int
	err := db.QueryRow("SELECT COUNT(*) FROM users WHERE id = 1").Scan(&count)
	if err != nil {
		return err
	}

	if count == 0 {
		_, err := db.Exec(
			"INSERT INTO users (id, email, password) VALUES (1, $1, $2)",
			"user@example.com",
			"password123",
		)
		if err != nil {
			return err
		}
	}

	return nil
}

const (
	createUsersTable = `
	CREATE TABLE IF NOT EXISTS users (
		id SERIAL PRIMARY KEY,
		email VARCHAR(255) UNIQUE NOT NULL,
		password VARCHAR(255) NOT NULL,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);
	`

	createShoppingListsTable = `
	CREATE TABLE IF NOT EXISTS shopping_lists (
		id SERIAL PRIMARY KEY,
		user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
		name VARCHAR(255) NOT NULL,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);
	`

	createShoppingItemsTable = `
	CREATE TABLE IF NOT EXISTS shopping_items (
		id SERIAL PRIMARY KEY,
		list_id INTEGER NOT NULL REFERENCES shopping_lists(id) ON DELETE CASCADE,
		name VARCHAR(255) NOT NULL,
		quantity DECIMAL(10, 2) DEFAULT 1,
		unit VARCHAR(50),
		purchased BOOLEAN DEFAULT FALSE,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);
	`

	createListHistoryTable = `
	CREATE TABLE IF NOT EXISTS list_history (
		id SERIAL PRIMARY KEY,
		user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
		original_list_id INTEGER REFERENCES shopping_lists(id) ON DELETE SET NULL,
		action VARCHAR(50) NOT NULL,
		data JSONB,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);
	`
)
