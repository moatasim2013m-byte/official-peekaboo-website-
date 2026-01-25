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
        self.parent_token = None
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
            "email": f"parent_{timestamp}@peekaboo.com",
            "password": "ParentPass123!",
            "name": "Sarah Ahmed",
            "phone": "+962791234567"
        }
        
        success, response = self.run_test(
            "Parent Registration",
            "POST",
            "auth/register",
            201,
            data=test_user
        )
        
        if success and 'token' in response:
            self.parent_token = response['token']
            return True
        return False

    def test_admin_login(self):
        """Test admin login"""
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

    # ==================== NEW PRICING TESTS ====================
    
    def test_fetch_hourly_pricing_public(self):
        """Test 1: Fetch Hourly Pricing (Public Endpoint)"""
        success, response = self.run_test(
            "Fetch Hourly Pricing (Public)",
            "GET",
            "payments/hourly-pricing",
            200,
            headers={}  # No auth required
        )
        
        if success and 'pricing' in response:
            pricing = response['pricing']
            extra_hour_price = response.get('extra_hour_price', 0)
            
            # Validate expected pricing structure
            expected_prices = {1: 7, 2: 10, 3: 13}
            actual_prices = {p['hours']: p['price'] for p in pricing}
            
            pricing_correct = (
                actual_prices.get(1) == expected_prices[1] and
                actual_prices.get(2) == expected_prices[2] and
                actual_prices.get(3) == expected_prices[3] and
                extra_hour_price == 3
            )
            
            if pricing_correct:
                print(f"   ✓ Pricing: 1hr={actual_prices.get(1)}JD, 2hr={actual_prices.get(2)}JD, 3hr={actual_prices.get(3)}JD, extra={extra_hour_price}JD")
                return True
            else:
                print(f"   ✗ Incorrect pricing: {actual_prices}, extra: {extra_hour_price}")
                return False
        return False

    def test_admin_pricing_access(self):
        """Test 2: Admin Access to Pricing Management"""
        if not self.admin_token:
            self.log_test("Admin Pricing Access", False, "No admin token available")
            return False
            
        # Temporarily use admin token
        old_token = self.token
        self.token = self.admin_token
        
        success, response = self.run_test(
            "Admin Get Pricing",
            "GET",
            "admin/pricing",
            200
        )
        
        # Restore original token
        self.token = old_token
        
        if success and 'pricing' in response:
            pricing = response['pricing']
            expected_keys = ['hourly_1hr', 'hourly_2hr', 'hourly_3hr', 'hourly_extra_hr']
            has_all_keys = all(key in pricing for key in expected_keys)
            
            if has_all_keys:
                print(f"   ✓ Admin pricing: 1hr={pricing['hourly_1hr']}, 2hr={pricing['hourly_2hr']}, 3hr={pricing['hourly_3hr']}, extra={pricing['hourly_extra_hr']}")
                return True
            else:
                print(f"   ✗ Missing pricing keys: {pricing}")
                return False
        return False

    def test_admin_pricing_update(self):
        """Test 3: Update Pricing as Admin"""
        if not self.admin_token:
            self.log_test("Admin Pricing Update", False, "No admin token available")
            return False
            
        # Temporarily use admin token
        old_token = self.token
        self.token = self.admin_token
        
        pricing_data = {
            "hourly_1hr": 7,
            "hourly_2hr": 10,
            "hourly_3hr": 13,
            "hourly_extra_hr": 3
        }
        
        success, response = self.run_test(
            "Admin Update Pricing",
            "PUT",
            "admin/pricing",
            200,
            data=pricing_data
        )
        
        # Restore original token
        self.token = old_token
        
        return success and 'message' in response

    def test_verify_subscription_plans(self):
        """Test 4: Verify Updated Subscription Plans"""
        if not self.admin_token:
            self.log_test("Verify Subscription Plans", False, "No admin token available")
            return False
            
        # Temporarily use admin token
        old_token = self.token
        self.token = self.admin_token
        
        success, response = self.run_test(
            "Get Subscription Plans",
            "GET",
            "admin/plans",
            200
        )
        
        # Restore original token
        self.token = old_token
        
        if success and 'plans' in response:
            plans = response['plans']
            
            # Check for expected plans: 59 JD/8 visits, 79 JD/12 visits, 120 JD/unlimited daily pass
            expected_plans = [
                {"price": 59, "visits": 8},
                {"price": 79, "visits": 12},
                {"price": 120, "is_daily_pass": True}
            ]
            
            plans_found = []
            for plan in plans:
                for expected in expected_plans:
                    if (plan.get('price') == expected['price'] and 
                        (plan.get('visits') == expected.get('visits') or 
                         plan.get('is_daily_pass') == expected.get('is_daily_pass'))):
                        plans_found.append(expected)
                        break
            
            if len(plans_found) >= 3:
                print(f"   ✓ Found {len(plans)} subscription plans including expected ones")
                return True
            else:
                print(f"   ✗ Missing expected plans. Found: {[p.get('price') for p in plans]}")
                return False
        return False

    def test_hourly_booking_with_duration(self):
        """Test 5: Hourly Booking Creation with Duration & Notes"""
        if not self.parent_token:
            self.log_test("Hourly Booking with Duration", False, "No parent token available")
            return False
            
        # First create a child for the parent
        old_token = self.token
        self.token = self.parent_token
        
        # Create child
        child_data = {
            "name": "Layla Ahmed",
            "age": 5,
            "gender": "female"
        }
        
        child_success, child_response = self.run_test(
            "Create Child for Booking",
            "POST",
            "profile/children",
            201,
            data=child_data
        )
        
        if not child_success or 'child' not in child_response:
            self.token = old_token
            return False
            
        child_id = child_response['child']['id']
        
        # Get available slots
        slots_success, slots_response = self.run_test(
            "Get Available Slots",
            "GET",
            "slots/available?date=2024-12-25&slot_type=hourly",
            200
        )
        
        if not slots_success or 'slots' not in slots_response or not slots_response['slots']:
            self.token = old_token
            return False
            
        slot_id = slots_response['slots'][0]['id']
        
        # Create checkout with duration and notes
        checkout_data = {
            "type": "hourly",
            "reference_id": slot_id,
            "child_id": child_id,
            "duration_hours": 2,
            "custom_notes": "Please have staff greet my child by name - Layla loves unicorns!",
            "origin_url": "https://playdate-hub.preview.emergentagent.com"
        }
        
        success, response = self.run_test(
            "Create Hourly Checkout with Duration",
            "POST",
            "payments/create-checkout",
            200,
            data=checkout_data
        )
        
        # Restore original token
        self.token = old_token
        
        if success and 'url' in response and 'session_id' in response:
            print(f"   ✓ Checkout created for 2hr booking with custom notes")
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