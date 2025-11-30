package models

import "time"

// User represents a user in the system
type User struct {
	ID        int       `json:"id"`
	Email     string    `json:"email"`
	Password  string    `json:"-"`
	CreatedAt time.Time `json:"created_at"`
}

// ShoppingList represents a shopping list
type ShoppingList struct {
	ID        int          `json:"id"`
	UserID    int          `json:"user_id"`
	Name      string       `json:"name"`
	Items     []ShoppingItem `json:"items"`
	CreatedAt time.Time    `json:"created_at"`
	UpdatedAt time.Time    `json:"updated_at"`
}

// ShoppingItem represents an item in a shopping list
type ShoppingItem struct {
	ID        int       `json:"id"`
	ListID    int       `json:"list_id"`
	Name      string    `json:"name"`
	Quantity  float64   `json:"quantity"`
	Unit      string    `json:"unit"`
	Purchased bool      `json:"purchased"`
	CreatedAt time.Time `json:"created_at"`
}

// ListHistory represents the history of a shopping list action
type ListHistory struct {
	ID             int       `json:"id"`
	UserID         int       `json:"user_id"`
	OriginalListID *int      `json:"original_list_id"`
	Action         string    `json:"action"` // "created", "updated", "reused"
	Data           string    `json:"data"`   // JSON data of the action
	CreatedAt      time.Time `json:"created_at"`
}
