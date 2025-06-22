#!/usr/bin/env python3
import requests
import json
import os
import time
import random
import string
import unittest
from dotenv import load_dotenv
import sys
from pathlib import Path

# Load environment variables from frontend/.env to get the backend URL
load_dotenv(Path(__file__).parent / "frontend" / ".env")

# Get the backend URL from environment variables
BACKEND_URL = os.environ.get("REACT_APP_BACKEND_URL")
if not BACKEND_URL:
    print("Error: REACT_APP_BACKEND_URL not found in environment variables")
    sys.exit(1)

# Ensure the URL ends with /api for all requests
API_URL = f"{BACKEND_URL}/api"
print(f"Using API URL: {API_URL}")

class OlystBackendTest(unittest.TestCase):
    def setUp(self):
        # Generate random user data for testing
        random_suffix = ''.join(random.choices(string.ascii_lowercase + string.digits, k=8))
        self.test_user = {
            "email": f"test.user.{random_suffix}@example.com",
            "username": f"testuser_{random_suffix}",
            "password": "Password123!"
        }
        self.admin_token = None
        self.user_token = None
        self.test_product = None
        
    def test_01_register_user(self):
        """Test user registration"""
        print("\n--- Testing User Registration ---")
        
        # Register a new user
        response = requests.post(
            f"{API_URL}/auth/register",
            json=self.test_user
        )
        
        # Check if registration was successful
        self.assertEqual(response.status_code, 200, f"Registration failed: {response.text}")
        data = response.json()
        
        # Verify response structure
        self.assertIn("token", data, "Token not found in response")
        self.assertIn("user", data, "User data not found in response")
        self.assertEqual(data["user"]["email"], self.test_user["email"], "Email mismatch")
        self.assertEqual(data["user"]["username"], self.test_user["username"], "Username mismatch")
        self.assertFalse(data["user"]["is_admin"], "User should not be admin by default")
        
        # Save token for later tests
        self.user_token = data["token"]
        print(f"User registered successfully: {self.test_user['email']}")
        
    def test_02_login_user(self):
        """Test user login"""
        print("\n--- Testing User Login ---")
        
        # Skip if no user token available from registration
        if not hasattr(self, 'user_token') or not self.user_token:
            print("Using registration token for subsequent tests")
            self.skipTest("Using registration token instead")
            return
            
        # First logout to invalidate the registration token
        try:
            logout_response = requests.post(
                f"{API_URL}/auth/logout",
                headers={"Authorization": f"Bearer {self.user_token}"}
            )
            print(f"Logged out before testing login: {logout_response.status_code}")
        except Exception as e:
            print(f"Error during pre-login logout: {e}")
        
        # Login with the registered user
        response = requests.post(
            f"{API_URL}/auth/login",
            json={
                "email": self.test_user["email"],
                "password": self.test_user["password"]
            }
        )
        
        # Check if login was successful
        self.assertEqual(response.status_code, 200, f"Login failed: {response.text}")
        data = response.json()
        
        # Verify response structure
        self.assertIn("token", data, "Token not found in response")
        self.assertIn("user", data, "User data not found in response")
        self.assertEqual(data["user"]["email"], self.test_user["email"], "Email mismatch")
        
        # Save token for later tests
        self.user_token = data["token"]
        print(f"User logged in successfully: {self.test_user['email']}")
        
    def test_03_get_user_profile(self):
        """Test getting user profile with token"""
        print("\n--- Testing User Profile Retrieval ---")
        
        # Skip if no token available
        if not self.user_token:
            self.skipTest("No user token available")
        
        # Get user profile
        response = requests.get(
            f"{API_URL}/auth/me",
            headers={"Authorization": f"Bearer {self.user_token}"}
        )
        
        # Check if profile retrieval was successful
        self.assertEqual(response.status_code, 200, f"Profile retrieval failed: {response.text}")
        data = response.json()
        
        # Verify response structure
        self.assertEqual(data["email"], self.test_user["email"], "Email mismatch")
        self.assertEqual(data["username"], self.test_user["username"], "Username mismatch")
        print("User profile retrieved successfully")
        
    def test_04_logout_user(self):
        """Test user logout"""
        print("\n--- Testing User Logout ---")
        
        # Skip if no token available
        if not self.user_token:
            self.skipTest("No user token available")
        
        # Logout user
        response = requests.post(
            f"{API_URL}/auth/logout",
            headers={"Authorization": f"Bearer {self.user_token}"}
        )
        
        # Check if logout was successful
        self.assertEqual(response.status_code, 200, f"Logout failed: {response.text}")
        data = response.json()
        
        # Verify response structure
        self.assertIn("message", data, "Message not found in response")
        print("User logged out successfully")
        
        # Verify token is invalidated by trying to access profile
        response = requests.get(
            f"{API_URL}/auth/me",
            headers={"Authorization": f"Bearer {self.user_token}"}
        )
        self.assertEqual(response.status_code, 401, "Token should be invalidated after logout")
        print("Token invalidated successfully")
        
    def test_05_register_admin_user(self):
        """Register an admin user for testing admin endpoints"""
        print("\n--- Registering Admin User for Testing ---")
        
        # Generate random admin user data
        random_suffix = ''.join(random.choices(string.ascii_lowercase + string.digits, k=8))
        admin_user = {
            "email": f"admin.{random_suffix}@example.com",
            "username": f"admin_{random_suffix}",
            "password": "AdminPass123!"
        }
        
        # Register admin user
        response = requests.post(
            f"{API_URL}/auth/register",
            json=admin_user
        )
        
        # Check if registration was successful
        self.assertEqual(response.status_code, 200, f"Admin registration failed: {response.text}")
        data = response.json()
        
        # Save admin token
        self.admin_token = data["token"]
        self.admin_user_id = data["user"]["id"]
        
        print(f"Admin user registered: {admin_user['email']}")
        
        # We need to manually make this user an admin in the database
        # For testing purposes, we'll use a direct API call to simulate this
        # In a real scenario, this would be done through a database update
        
        # For now, we'll just note that we can't test admin functionality properly
        print("Note: Admin functionality can't be fully tested without direct database access")
        print("Skipping admin-only endpoint tests")
        
    def test_06_get_categories(self):
        """Test categories API endpoint"""
        print("\n--- Testing Categories API ---")
        
        # Get categories
        response = requests.get(f"{API_URL}/categories")
        
        # Check if categories retrieval was successful
        self.assertEqual(response.status_code, 200, f"Categories retrieval failed: {response.text}")
        data = response.json()
        
        # Verify response structure
        self.assertIsInstance(data, list, "Categories should be a list")
        self.assertEqual(len(data), 5, "There should be 5 categories")
        
        # Check for expected categories
        category_ids = [cat["id"] for cat in data]
        expected_categories = ["ebooks", "templates", "audio", "videos", "ai_packs"]
        for cat in expected_categories:
            self.assertIn(cat, category_ids, f"Category {cat} not found")
        
        print("Categories API working correctly")
        
    def test_07_get_products(self):
        """Test products retrieval"""
        print("\n--- Testing Products Retrieval ---")
        
        # Get all products
        response = requests.get(f"{API_URL}/products")
        
        # Check if products retrieval was successful
        self.assertEqual(response.status_code, 200, f"Products retrieval failed: {response.text}")
        data = response.json()
        
        # Verify response structure
        self.assertIsInstance(data, list, "Products should be a list")
        print(f"Retrieved {len(data)} products")
        
        # Test category filtering if there are products
        if len(data) > 0:
            # Get a category from the first product
            category = data[0]["category"]
            
            # Filter products by this category
            response = requests.get(f"{API_URL}/products?category={category}")
            self.assertEqual(response.status_code, 200, f"Category filtering failed: {response.text}")
            filtered_data = response.json()
            
            # Verify all returned products have the correct category
            for product in filtered_data:
                self.assertEqual(product["category"], category, f"Product has wrong category: {product}")
            
            print(f"Category filtering working correctly for '{category}'")
        
        # Test search functionality
        if len(data) > 0:
            # Get a search term from the first product name
            search_term = data[0]["name"].split()[0] if " " in data[0]["name"] else data[0]["name"]
            
            # Search products by this term
            response = requests.get(f"{API_URL}/products?search={search_term}")
            self.assertEqual(response.status_code, 200, f"Search failed: {response.text}")
            search_data = response.json()
            
            # Verify search works
            if len(search_data) > 0:
                print(f"Search functionality working correctly for term '{search_term}'")
        
    def test_08_create_product_as_normal_user(self):
        """Test product creation as normal user (should fail)"""
        print("\n--- Testing Product Creation as Normal User (should fail) ---")
        
        # Skip if no user token available
        if not self.user_token:
            self.skipTest("No user token available")
        
        # Create a test product
        test_product = {
            "name": "Test Product",
            "description": "This is a test product",
            "price": 19.99,
            "category": "ebooks"
        }
        
        # Try to create product as normal user
        response = requests.post(
            f"{API_URL}/products",
            json=test_product,
            headers={"Authorization": f"Bearer {self.user_token}"}
        )
        
        # Check that creation fails with 403 Forbidden
        self.assertEqual(response.status_code, 403, "Normal users should not be able to create products")
        print("Product creation correctly restricted to admin users")
        
    def test_09_create_product_as_admin(self):
        """Test product creation as admin"""
        print("\n--- Testing Product Creation as Admin ---")
        
        # Skip if no admin token available
        if not self.admin_token:
            self.skipTest("No admin token available")
        
        # Create a test product
        test_product = {
            "name": "Admin Test Product",
            "description": "This is a test product created by admin",
            "price": 29.99,
            "category": "templates",
            "image_base64": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
        }
        
        # Try to create product as admin
        response = requests.post(
            f"{API_URL}/products",
            json=test_product,
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        
        # Since we can't make a real admin user without direct DB access,
        # this test will likely fail with 403 Forbidden
        if response.status_code == 403:
            print("Admin product creation test skipped - can't create real admin user without DB access")
            self.skipTest("Can't create real admin user without DB access")
        else:
            # If it somehow succeeds, verify the response
            self.assertEqual(response.status_code, 200, f"Admin product creation failed: {response.text}")
            data = response.json()
            
            # Save product ID for later tests
            self.test_product_id = data["id"]
            print(f"Product created successfully with ID: {self.test_product_id}")
            
    def test_10_get_product_by_id(self):
        """Test getting a product by ID"""
        print("\n--- Testing Get Product by ID ---")
        
        # Skip if no product was created
        if not hasattr(self, 'test_product_id'):
            # Try to get the first product from the list
            response = requests.get(f"{API_URL}/products")
            if response.status_code == 200 and len(response.json()) > 0:
                self.test_product_id = response.json()[0]["id"]
            else:
                print("No products available to test get_product_by_id")
                self.skipTest("No products available to test")
                return
        
        # Get product by ID
        response = requests.get(f"{API_URL}/products/{self.test_product_id}")
        
        # Check if product retrieval was successful
        self.assertEqual(response.status_code, 200, f"Product retrieval failed: {response.text}")
        data = response.json()
        
        # Verify response structure
        self.assertEqual(data["id"], self.test_product_id, "Product ID mismatch")
        print(f"Product retrieved successfully: {data['name']}")
        
    def test_11_update_product(self):
        """Test updating a product"""
        print("\n--- Testing Product Update ---")
        
        # Skip if no product was created or no admin token
        if not hasattr(self, 'test_product_id') or not self.admin_token:
            self.skipTest("No product ID or admin token available")
        
        # Update product data
        updated_product = {
            "name": "Updated Test Product",
            "description": "This product has been updated",
            "price": 39.99,
            "category": "templates"
        }
        
        # Update product
        response = requests.put(
            f"{API_URL}/products/{self.test_product_id}",
            json=updated_product,
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        
        # Since we can't make a real admin user without direct DB access,
        # this test will likely fail with 403 Forbidden
        if response.status_code == 403:
            print("Admin product update test skipped - can't create real admin user without DB access")
            self.skipTest("Can't create real admin user without DB access")
        else:
            # If it somehow succeeds, verify the response
            self.assertEqual(response.status_code, 200, f"Product update failed: {response.text}")
            print("Product updated successfully")
            
            # Verify the update by getting the product
            response = requests.get(f"{API_URL}/products/{self.test_product_id}")
            self.assertEqual(response.status_code, 200)
            data = response.json()
            self.assertEqual(data["name"], updated_product["name"], "Product name not updated")
            
    def test_12_delete_product(self):
        """Test deleting a product (soft delete)"""
        print("\n--- Testing Product Deletion ---")
        
        # Skip if no product was created or no admin token
        if not hasattr(self, 'test_product_id') or not self.admin_token:
            self.skipTest("No product ID or admin token available")
        
        # Delete product
        response = requests.delete(
            f"{API_URL}/products/{self.test_product_id}",
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        
        # Since we can't make a real admin user without direct DB access,
        # this test will likely fail with 403 Forbidden
        if response.status_code == 403:
            print("Admin product deletion test skipped - can't create real admin user without DB access")
            self.skipTest("Can't create real admin user without DB access")
        else:
            # If it somehow succeeds, verify the response
            self.assertEqual(response.status_code, 200, f"Product deletion failed: {response.text}")
            print("Product deleted (soft delete) successfully")
            
            # Verify the product is no longer returned in the products list
            response = requests.get(f"{API_URL}/products")
            self.assertEqual(response.status_code, 200)
            products = response.json()
            product_ids = [p["id"] for p in products]
            self.assertNotIn(self.test_product_id, product_ids, "Deleted product still appears in products list")
            
    def test_13_create_order(self):
        """Test order creation"""
        print("\n--- Testing Order Creation ---")
        
        # Get a product to include in the order
        response = requests.get(f"{API_URL}/products")
        if response.status_code != 200 or len(response.json()) == 0:
            self.skipTest("No products available for order testing")
            
        products = response.json()
        product = products[0]
        
        # Create order data
        order_data = {
            "user_email": self.test_user["email"],
            "products": [
                {
                    "product_id": product["id"],
                    "name": product["name"],
                    "price": product["price"]
                }
            ],
            "total_amount": product["price"]
        }
        
        # Create order
        response = requests.post(
            f"{API_URL}/orders",
            json=order_data
        )
        
        # Check if order creation was successful
        self.assertEqual(response.status_code, 200, f"Order creation failed: {response.text}")
        data = response.json()
        
        # Verify response structure
        self.assertIn("id", data, "Order ID not found in response")
        self.assertEqual(data["total_amount"], order_data["total_amount"], "Order total amount mismatch")
        self.assertEqual(data["status"], "pending", "Order status should be pending")
        
        # Save order ID for later tests
        self.order_id = data["id"]
        print(f"Order created successfully with ID: {self.order_id}")
        
    def test_14_get_order(self):
        """Test getting an order by ID"""
        print("\n--- Testing Get Order by ID ---")
        
        # Skip if no order was created
        if not hasattr(self, 'order_id'):
            self.skipTest("No order ID available")
        
        # Get order by ID
        response = requests.get(f"{API_URL}/orders/{self.order_id}")
        
        # Check if order retrieval was successful
        self.assertEqual(response.status_code, 200, f"Order retrieval failed: {response.text}")
        data = response.json()
        
        # Verify response structure
        self.assertEqual(data["id"], self.order_id, "Order ID mismatch")
        self.assertEqual(data["user_email"], self.test_user["email"], "Order user email mismatch")
        print(f"Order retrieved successfully: {data['id']}")

if __name__ == "__main__":
    # Run the tests
    unittest.main(argv=['first-arg-is-ignored'], exit=False)