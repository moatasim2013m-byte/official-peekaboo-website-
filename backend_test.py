#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime

class PeekabooAPITester:
    def __init__(self, base_url="https://playdate-hub.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.admin_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details
        })

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if headers:
            test_headers.update(headers)
        
        if self.token and 'Authorization' not in test_headers:
            test_headers['Authorization'] = f'Bearer {self.token}'

        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=10)

            success = response.status_code == expected_status
            details = f"Status: {response.status_code}"
            
            if not success:
                details += f" (Expected {expected_status})"
                try:
                    error_data = response.json()
                    if 'error' in error_data:
                        details += f" - {error_data['error']}"
                except:
                    details += f" - {response.text[:100]}"
            
            self.log_test(name, success, details)
            
            return success, response.json() if success and response.content else {}

        except Exception as e:
            self.log_test(name, False, f"Error: {str(e)}")
            return False, {}

    def test_health_check(self):
        """Test API health check"""
        success, response = self.run_test(
            "API Health Check",
            "GET", 
            "",
            200
        )
        return success and 'message' in response

    def test_user_registration(self):
        """Test user registration"""
        timestamp = datetime.now().strftime('%H%M%S')
        test_user = {
            "email": f"test_user_{timestamp}@example.com",
            "password": "TestPass123!",
            "name": "Test User"
        }
        
        success, response = self.run_test(
            "User Registration",
            "POST",
            "auth/register",
            201,
            data=test_user
        )
        
        if success and 'token' in response:
            self.token = response['token']
            return True
        return False

    def test_user_login(self):
        """Test user login with admin credentials"""
        admin_creds = {
            "email": "admin@peekaboo.com",
            "password": "admin123"
        }
        
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "auth/login",
            200,
            data=admin_creds
        )
        
        if success and 'token' in response:
            self.admin_token = response['token']
            return True
        return False

    def test_get_themes(self):
        """Test getting themes"""
        success, response = self.run_test(
            "Get Themes",
            "GET",
            "themes",
            200
        )
        
        if success and 'themes' in response:
            themes_count = len(response['themes'])
            print(f"   Found {themes_count} themes")
            return themes_count >= 10  # Should have 10 seeded themes
        return False

    def test_get_subscription_plans(self):
        """Test getting subscription plans"""
        success, response = self.run_test(
            "Get Subscription Plans",
            "GET",
            "subscriptions/plans",
            200
        )
        
        if success and 'plans' in response:
            plans_count = len(response['plans'])
            print(f"   Found {plans_count} subscription plans")
            return plans_count >= 3  # Should have 3 seeded plans
        return False

    def test_get_gallery(self):
        """Test getting gallery"""
        success, response = self.run_test(
            "Get Gallery",
            "GET",
            "gallery",
            200
        )
        
        if success and 'media' in response:
            media_count = len(response['media'])
            print(f"   Found {media_count} gallery items")
            return True
        return False

    def test_protected_route(self):
        """Test protected route access"""
        if not self.token:
            self.log_test("Protected Route Test", False, "No token available")
            return False
            
        success, response = self.run_test(
            "Get Current User",
            "GET",
            "auth/me",
            200
        )
        
        return success and 'user' in response

    def test_admin_access(self):
        """Test admin-only access"""
        if not self.admin_token:
            self.log_test("Admin Access Test", False, "No admin token available")
            return False
            
        # Temporarily use admin token
        old_token = self.token
        self.token = self.admin_token
        
        success, response = self.run_test(
            "Admin User Info",
            "GET",
            "auth/me",
            200
        )
        
        # Restore original token
        self.token = old_token
        
        return success and 'user' in response

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting Peekaboo API Tests...")
        print(f"Testing against: {self.base_url}")
        print("=" * 50)

        # Basic API tests
        self.test_health_check()
        
        # Public API tests
        self.test_get_themes()
        self.test_get_subscription_plans()
        self.test_get_gallery()
        
        # Authentication tests
        self.test_user_registration()
        self.test_user_login()
        
        # Protected route tests
        if self.token:
            self.test_protected_route()
            
        if self.admin_token:
            self.test_admin_access()

        # Print summary
        print("\n" + "=" * 50)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return 0
        else:
            print("⚠️  Some tests failed")
            return 1

def main():
    tester = PeekabooAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())