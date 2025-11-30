package routes

import (
	"database/sql"

	"github.com/gin-gonic/gin"
	"github.com/shopping-list/backend/handlers"
)

// SetupRoutes sets up all routes for the API
func SetupRoutes(router *gin.Engine, db *sql.DB) {
	// Middleware
	router.Use(CORSMiddleware())

	// API v1 routes
	v1 := router.Group("/api/v1")
	{
		// Shopping Lists routes
		lists := v1.Group("/lists")
		{
			lists.POST("", handlers.CreateList(db))
			lists.GET("", handlers.GetUserLists(db))
			lists.GET("/:id", handlers.GetList(db))
			lists.PUT("/:id", handlers.UpdateList(db))
			lists.DELETE("/:id", handlers.DeleteList(db))
		}

		// Shopping Items routes
		items := v1.Group("/items")
		{
			items.POST("", handlers.CreateItem(db))
			items.PUT("/:id", handlers.UpdateItem(db))
			items.DELETE("/:id", handlers.DeleteItem(db))
		}

		// History routes
		history := v1.Group("/history")
		{
			history.GET("", handlers.GetUserHistory(db))
			history.POST("/reuse/:id", handlers.ReuseList(db))
		}
	}

	// Health check
	router.GET("/health", handlers.HealthCheck)
}

// CORSMiddleware handles CORS
func CORSMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}
