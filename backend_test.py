#!/usr/bin/env python3
"""
Backend API Test Suite for MATTY Portfolio
Tests all endpoints defined in server.py
"""

import requests
import json
import sys
from typing import Dict, Any

# Load backend URL from frontend/.env
BACKEND_URL = "https://matty-build.preview.emergentagent.com/api"

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    END = '\033[0m'

def print_test(name: str, passed: bool, details: str = ""):
    status = f"{Colors.GREEN}✓ PASS{Colors.END}" if passed else f"{Colors.RED}✗ FAIL{Colors.END}"
    print(f"{status} - {name}")
    if details:
        print(f"  {details}")
    if not passed:
        print()

def test_root_endpoint():
    """Test GET /api/"""
    try:
        response = requests.get(f"{BACKEND_URL}/", timeout=10)
        if response.status_code == 200:
            data = response.json()
            if "message" in data and "director" in data:
                print_test("Root Endpoint (GET /api/)", True, f"Response: {data}")
                return True
            else:
                print_test("Root Endpoint (GET /api/)", False, f"Missing expected fields. Got: {data}")
                return False
        else:
            print_test("Root Endpoint (GET /api/)", False, f"Status: {response.status_code}, Body: {response.text}")
            return False
    except Exception as e:
        print_test("Root Endpoint (GET /api/)", False, f"Exception: {str(e)}")
        return False

def test_get_projects():
    """Test GET /api/projects"""
    try:
        response = requests.get(f"{BACKEND_URL}/projects", timeout=10)
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, list) and len(data) > 0:
                print_test("Get All Projects (GET /api/projects)", True, f"Found {len(data)} projects")
                return True
            else:
                print_test("Get All Projects (GET /api/projects)", False, f"Expected list with projects, got: {type(data)}")
                return False
        else:
            print_test("Get All Projects (GET /api/projects)", False, f"Status: {response.status_code}")
            return False
    except Exception as e:
        print_test("Get All Projects (GET /api/projects)", False, f"Exception: {str(e)}")
        return False

def test_get_projects_filtered():
    """Test GET /api/projects?cat=COMMERCIAL"""
    try:
        response = requests.get(f"{BACKEND_URL}/projects?cat=COMMERCIAL", timeout=10)
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, list):
                # Verify all returned projects are COMMERCIAL
                all_commercial = all(p.get("cat") == "COMMERCIAL" for p in data)
                if all_commercial:
                    print_test("Get Filtered Projects (GET /api/projects?cat=COMMERCIAL)", True, f"Found {len(data)} commercial projects")
                    return True
                else:
                    print_test("Get Filtered Projects (GET /api/projects?cat=COMMERCIAL)", False, "Some projects are not COMMERCIAL")
                    return False
            else:
                print_test("Get Filtered Projects (GET /api/projects?cat=COMMERCIAL)", False, f"Expected list, got: {type(data)}")
                return False
        else:
            print_test("Get Filtered Projects (GET /api/projects?cat=COMMERCIAL)", False, f"Status: {response.status_code}")
            return False
    except Exception as e:
        print_test("Get Filtered Projects (GET /api/projects?cat=COMMERCIAL)", False, f"Exception: {str(e)}")
        return False

def test_get_project_by_id():
    """Test GET /api/projects/{project_id}"""
    try:
        # First get all projects to get a valid ID
        response = requests.get(f"{BACKEND_URL}/projects", timeout=10)
        if response.status_code != 200:
            print_test("Get Project by ID (GET /api/projects/{id})", False, "Could not fetch projects list")
            return False
        
        projects = response.json()
        if not projects:
            print_test("Get Project by ID (GET /api/projects/{id})", False, "No projects available")
            return False
        
        project_id = projects[0]["id"]
        response = requests.get(f"{BACKEND_URL}/projects/{project_id}", timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            if data.get("id") == project_id:
                print_test("Get Project by ID (GET /api/projects/{id})", True, f"Retrieved project: {project_id}")
                return True
            else:
                print_test("Get Project by ID (GET /api/projects/{id})", False, f"ID mismatch: expected {project_id}, got {data.get('id')}")
                return False
        else:
            print_test("Get Project by ID (GET /api/projects/{id})", False, f"Status: {response.status_code}")
            return False
    except Exception as e:
        print_test("Get Project by ID (GET /api/projects/{id})", False, f"Exception: {str(e)}")
        return False

def test_get_project_not_found():
    """Test GET /api/projects/{invalid_id} - should return 404"""
    try:
        response = requests.get(f"{BACKEND_URL}/projects/invalid-project-id-12345", timeout=10)
        if response.status_code == 404:
            print_test("Get Project Not Found (GET /api/projects/{invalid_id})", True, "Correctly returned 404")
            return True
        else:
            print_test("Get Project Not Found (GET /api/projects/{invalid_id})", False, f"Expected 404, got: {response.status_code}")
            return False
    except Exception as e:
        print_test("Get Project Not Found (GET /api/projects/{invalid_id})", False, f"Exception: {str(e)}")
        return False

def test_agent_data():
    """Test GET /api/agent-data"""
    try:
        response = requests.get(f"{BACKEND_URL}/agent-data", timeout=10)
        if response.status_code == 200:
            data = response.json()
            required_fields = ["@context", "type", "director", "projects", "contact_endpoint"]
            missing_fields = [f for f in required_fields if f not in data]
            
            if not missing_fields:
                print_test("Agent Data (GET /api/agent-data)", True, f"All required fields present")
                return True
            else:
                print_test("Agent Data (GET /api/agent-data)", False, f"Missing fields: {missing_fields}")
                return False
        else:
            print_test("Agent Data (GET /api/agent-data)", False, f"Status: {response.status_code}")
            return False
    except Exception as e:
        print_test("Agent Data (GET /api/agent-data)", False, f"Exception: {str(e)}")
        return False

def test_reel_meta():
    """Test POST /api/reel-meta"""
    try:
        payload = [
            {"vimeoId": "76979871"},
            {"vimeoId": "22439234"}
        ]
        response = requests.post(f"{BACKEND_URL}/reel-meta", json=payload, timeout=20)
        
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, dict) and "76979871" in data and "22439234" in data:
                print_test("Reel Meta (POST /api/reel-meta)", True, f"Retrieved metadata for {len(data)} videos")
                return True
            else:
                print_test("Reel Meta (POST /api/reel-meta)", False, f"Unexpected response format: {data}")
                return False
        else:
            print_test("Reel Meta (POST /api/reel-meta)", False, f"Status: {response.status_code}, Body: {response.text}")
            return False
    except Exception as e:
        print_test("Reel Meta (POST /api/reel-meta)", False, f"Exception: {str(e)}")
        return False

def test_avatar_quota():
    """Test GET /api/avatar/quota"""
    try:
        response = requests.get(f"{BACKEND_URL}/avatar/quota", timeout=10)
        if response.status_code == 200:
            data = response.json()
            required_fields = ["allowed", "remaining", "limit", "retry_after_seconds"]
            missing_fields = [f for f in required_fields if f not in data]
            
            if not missing_fields:
                print_test("Avatar Quota (GET /api/avatar/quota)", True, f"Quota info: {data['remaining']}/{data['limit']} remaining")
                return True
            else:
                print_test("Avatar Quota (GET /api/avatar/quota)", False, f"Missing fields: {missing_fields}")
                return False
        else:
            print_test("Avatar Quota (GET /api/avatar/quota)", False, f"Status: {response.status_code}")
            return False
    except Exception as e:
        print_test("Avatar Quota (GET /api/avatar/quota)", False, f"Exception: {str(e)}")
        return False

def test_contact_submission():
    """Test POST /api/contact"""
    try:
        payload = {
            "name": "John Director",
            "email": "john.director@filmstudio.com",
            "phone": "+1-555-0123",
            "company": "Acme Film Studios",
            "message": "Hi Matty, I'm interested in discussing a potential commercial project for our spring campaign. Would love to connect!"
        }
        response = requests.post(f"{BACKEND_URL}/contact", json=payload, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            required_fields = ["id", "name", "email", "message", "created_at"]
            missing_fields = [f for f in required_fields if f not in data]
            
            if not missing_fields:
                print_test("Contact Submission (POST /api/contact)", True, f"Contact created with ID: {data['id']}")
                return True
            else:
                print_test("Contact Submission (POST /api/contact)", False, f"Missing fields in response: {missing_fields}")
                return False
        else:
            print_test("Contact Submission (POST /api/contact)", False, f"Status: {response.status_code}, Body: {response.text}")
            return False
    except Exception as e:
        print_test("Contact Submission (POST /api/contact)", False, f"Exception: {str(e)}")
        return False

def test_contact_validation():
    """Test POST /api/contact with invalid data (no email or phone)"""
    try:
        payload = {
            "name": "Test User",
            "message": "This should fail validation"
        }
        response = requests.post(f"{BACKEND_URL}/contact", json=payload, timeout=10)
        
        if response.status_code == 422:  # Validation error
            print_test("Contact Validation (POST /api/contact - invalid)", True, "Correctly rejected invalid contact data")
            return True
        else:
            print_test("Contact Validation (POST /api/contact - invalid)", False, f"Expected 422, got: {response.status_code}")
            return False
    except Exception as e:
        print_test("Contact Validation (POST /api/contact - invalid)", False, f"Exception: {str(e)}")
        return False

def main():
    print(f"\n{Colors.BLUE}{'='*60}{Colors.END}")
    print(f"{Colors.BLUE}MATTY Portfolio Backend API Test Suite{Colors.END}")
    print(f"{Colors.BLUE}Backend URL: {BACKEND_URL}{Colors.END}")
    print(f"{Colors.BLUE}{'='*60}{Colors.END}\n")
    
    tests = [
        ("Root Endpoint", test_root_endpoint),
        ("Get All Projects", test_get_projects),
        ("Get Filtered Projects", test_get_projects_filtered),
        ("Get Project by ID", test_get_project_by_id),
        ("Get Project Not Found", test_get_project_not_found),
        ("Agent Data", test_agent_data),
        ("Reel Meta", test_reel_meta),
        ("Avatar Quota", test_avatar_quota),
        ("Contact Submission", test_contact_submission),
        ("Contact Validation", test_contact_validation),
    ]
    
    results = []
    for test_name, test_func in tests:
        results.append(test_func())
    
    print(f"\n{Colors.BLUE}{'='*60}{Colors.END}")
    passed = sum(results)
    total = len(results)
    percentage = (passed / total * 100) if total > 0 else 0
    
    if passed == total:
        print(f"{Colors.GREEN}All tests passed! ({passed}/{total}){Colors.END}")
    else:
        print(f"{Colors.YELLOW}Tests completed: {passed}/{total} passed ({percentage:.1f}%){Colors.END}")
        print(f"{Colors.RED}Failed tests: {total - passed}{Colors.END}")
    
    print(f"{Colors.BLUE}{'='*60}{Colors.END}\n")
    
    return 0 if passed == total else 1

if __name__ == "__main__":
    sys.exit(main())
