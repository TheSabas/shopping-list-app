package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/shopping-list/backend/models"
)

// HealthCheck returns the health status of the API
func HealthCheck(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status": "healthy",
		"time":   time.Now(),
	})
}

// CreateList creates a new shopping list
func CreateList(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var list models.ShoppingList
		if err := c.ShouldBindJSON(&list); err != nil {
			fmt.Printf("JSON binding error: %v\n", err)
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		fmt.Printf("Received list creation request - UserID: %d, Name: %s\n", list.UserID, list.Name)

		err := db.QueryRow(
			"INSERT INTO shopping_lists (user_id, name) VALUES ($1, $2) RETURNING id, created_at, updated_at",
			list.UserID, list.Name,
		).Scan(&list.ID, &list.CreatedAt, &list.UpdatedAt)

		if err != nil {
			fmt.Printf("Error creating list: %v\n", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create list: " + err.Error()})
			return
		}

		fmt.Printf("Successfully created list with ID: %d\n", list.ID)
		c.JSON(http.StatusCreated, list)
	}
}

// GetUserLists retrieves all lists for a user
func GetUserLists(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := c.Query("user_id")
		if userID == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "user_id query parameter required"})
			return
		}

		rows, err := db.Query(
			"SELECT id, user_id, name, created_at, updated_at FROM shopping_lists WHERE user_id = $1 ORDER BY updated_at DESC",
			userID,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve lists"})
			return
		}
		defer rows.Close()

		lists := []models.ShoppingList{}
		for rows.Next() {
			var list models.ShoppingList
			if err := rows.Scan(&list.ID, &list.UserID, &list.Name, &list.CreatedAt, &list.UpdatedAt); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to scan list"})
				return
			}

			// Get items for this list
			itemRows, err := db.Query(
				"SELECT id, list_id, name, quantity, unit, purchased, created_at FROM shopping_items WHERE list_id = $1",
				list.ID,
			)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve items"})
				return
			}
			defer itemRows.Close()

			items := []models.ShoppingItem{}
			for itemRows.Next() {
				var item models.ShoppingItem
				if err := itemRows.Scan(&item.ID, &item.ListID, &item.Name, &item.Quantity, &item.Unit, &item.Purchased, &item.CreatedAt); err != nil {
					c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to scan item"})
					return
				}
				items = append(items, item)
			}

			list.Items = items
			lists = append(lists, list)
		}

		c.JSON(http.StatusOK, lists)
	}
}

// GetList retrieves a specific shopping list with its items
func GetList(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")

		var list models.ShoppingList
		err := db.QueryRow(
			"SELECT id, user_id, name, created_at, updated_at FROM shopping_lists WHERE id = $1",
			id,
		).Scan(&list.ID, &list.UserID, &list.Name, &list.CreatedAt, &list.UpdatedAt)

		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "List not found"})
			return
		}
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve list"})
			return
		}

		// Get items
		rows, err := db.Query(
			"SELECT id, list_id, name, quantity, unit, purchased, created_at FROM shopping_items WHERE list_id = $1",
			id,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve items"})
			return
		}
		defer rows.Close()

		items := []models.ShoppingItem{}
		for rows.Next() {
			var item models.ShoppingItem
			if err := rows.Scan(&item.ID, &item.ListID, &item.Name, &item.Quantity, &item.Unit, &item.Purchased, &item.CreatedAt); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to scan item"})
				return
			}
			items = append(items, item)
		}

		list.Items = items
		c.JSON(http.StatusOK, list)
	}
}

// UpdateList updates a shopping list
func UpdateList(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		var list models.ShoppingList
		if err := c.ShouldBindJSON(&list); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		_, err := db.Exec(
			"UPDATE shopping_lists SET name = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
			list.Name, id,
		)

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update list"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "List updated successfully"})
	}
}

// DeleteList deletes a shopping list
func DeleteList(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")

		_, err := db.Exec("DELETE FROM shopping_lists WHERE id = $1", id)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete list"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "List deleted successfully"})
	}
}

// MarkListDone marks a shopping list as done and moves it to history
func MarkListDone(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		var req struct {
			UserID int `json:"user_id"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// Get the list details
		var listName string
		var userID int
		err := db.QueryRow(
			"SELECT name, user_id FROM shopping_lists WHERE id = $1",
			id,
		).Scan(&listName, &userID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve list"})
			return
		}

		// Get all items for the list
		rows, err := db.Query(
			"SELECT id, name, quantity, unit, purchased FROM shopping_items WHERE list_id = $1 ORDER BY id",
			id,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve items"})
			return
		}
		defer rows.Close()

		var items []map[string]interface{}
		for rows.Next() {
			var itemID int
			var name string
			var quantity float64
			var unit *string
			var purchased bool
			if err := rows.Scan(&itemID, &name, &quantity, &unit, &purchased); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to scan items"})
				return
			}
			items = append(items, map[string]interface{}{
				"id":        itemID,
				"name":      name,
				"quantity":  quantity,
				"unit":      unit,
				"purchased": purchased,
			})
		}

		// Create data JSON
		data := map[string]interface{}{
			"name":  listName,
			"items": items,
		}
		dataJSON, err := json.Marshal(data)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to marshal data"})
			return
		}

		// Insert into list_history
		_, err = db.Exec(
			"INSERT INTO list_history (user_id, original_list_id, action, data) VALUES ($1, $2, $3, $4)",
			userID, id, "created", string(dataJSON),
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save to history"})
			return
		}

		// Delete the list (cascade will delete items)
		_, err = db.Exec("DELETE FROM shopping_lists WHERE id = $1", id)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete list"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "List marked as done and saved to history"})
	}
}

// CreateItem creates a new item in a shopping list
func CreateItem(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var item models.ShoppingItem
		if err := c.ShouldBindJSON(&item); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		err := db.QueryRow(
			"INSERT INTO shopping_items (list_id, name, quantity, unit) VALUES ($1, $2, $3, $4) RETURNING id, created_at",
			item.ListID, item.Name, item.Quantity, item.Unit,
		).Scan(&item.ID, &item.CreatedAt)

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create item"})
			return
		}

		c.JSON(http.StatusCreated, item)
	}
}

// UpdateItem updates an item
func UpdateItem(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		var item models.ShoppingItem
		if err := c.ShouldBindJSON(&item); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		_, err := db.Exec(
			"UPDATE shopping_items SET name = $1, quantity = $2, unit = $3, purchased = $4 WHERE id = $5",
			item.Name, item.Quantity, item.Unit, item.Purchased, id,
		)

		if err != nil {
			fmt.Printf("Error updating item: %v\n", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update item"})
			return
		}

		// Fetch and return the updated item
		err = db.QueryRow(
			"SELECT id, list_id, name, quantity, unit, purchased, created_at FROM shopping_items WHERE id = $1",
			id,
		).Scan(&item.ID, &item.ListID, &item.Name, &item.Quantity, &item.Unit, &item.Purchased, &item.CreatedAt)

		if err != nil {
			fmt.Printf("Error fetching updated item: %v\n", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch updated item"})
			return
		}

		c.JSON(http.StatusOK, item)
	}
}

// DeleteItem deletes an item
func DeleteItem(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")

		_, err := db.Exec("DELETE FROM shopping_items WHERE id = $1", id)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete item"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "Item deleted successfully"})
	}
}

// GetUserHistory retrieves the history of user actions
func GetUserHistory(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := c.Query("user_id")
		if userID == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "user_id query parameter required"})
			return
		}

		rows, err := db.Query(
			"SELECT id, user_id, original_list_id, action, data, created_at FROM list_history WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50",
			userID,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve history"})
			return
		}
		defer rows.Close()

		history := []models.ListHistory{}
		for rows.Next() {
			var h models.ListHistory
			if err := rows.Scan(&h.ID, &h.UserID, &h.OriginalListID, &h.Action, &h.Data, &h.CreatedAt); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to scan history"})
				return
			}
			history = append(history, h)
		}

		c.JSON(http.StatusOK, history)
	}
}

// ReuseList creates a new list from a past list
func ReuseList(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		userID := c.Query("user_id")
		if userID == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "user_id query parameter required"})
			return
		}

		// Get the history entry
		var historyData string
		err := db.QueryRow(
			"SELECT data FROM list_history WHERE id = $1 AND user_id = $2",
			id, userID,
		).Scan(&historyData)
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "History entry not found"})
			return
		}
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve history"})
			return
		}

		// Parse history data
		var data map[string]interface{}
		if err := json.Unmarshal([]byte(historyData), &data); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse history data"})
			return
		}

		listName, ok := data["name"].(string)
		if !ok {
			listName = "Reused List"
		}

		// Get items from history data
		var items []map[string]interface{}
		if itemsData, ok := data["items"].([]interface{}); ok {
			for _, item := range itemsData {
				if itemMap, ok := item.(map[string]interface{}); ok {
					items = append(items, itemMap)
				}
			}
		}

		// Create new list
		var newListID int
		err = db.QueryRow(
			"INSERT INTO shopping_lists (user_id, name) VALUES ($1, $2) RETURNING id",
			userID, listName,
		).Scan(&newListID)

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create new list"})
			return
		}

		// Copy items
		for _, item := range items {
			name, _ := item["name"].(string)
			quantity, _ := item["quantity"].(float64)
			unit, _ := item["unit"].(string)

			_, err := db.Exec(
				"INSERT INTO shopping_items (list_id, name, quantity, unit) VALUES ($1, $2, $3, $4)",
				newListID, name, quantity, unit,
			)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to copy item"})
				return
			}
		}

		// Record in history
		historyEntry, _ := json.Marshal(map[string]interface{}{
			"original_history_id": id,
			"new_list_id":         newListID,
		})
		_, err = db.Exec(
			"INSERT INTO list_history (user_id, original_list_id, action, data) VALUES ($1, $2, $3, $4)",
			userID, newListID, "reused", string(historyEntry),
		)

		if err != nil {
			// Log but don't fail
			println("Failed to record history:", err.Error())
		}

		c.JSON(http.StatusCreated, gin.H{
			"id":      newListID,
			"message": "List created from history successfully",
		})
	}
}
