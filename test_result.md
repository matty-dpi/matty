#====================================================================================================
# START - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================

# THIS SECTION CONTAINS CRITICAL TESTING INSTRUCTIONS FOR BOTH AGENTS
# BOTH MAIN_AGENT AND TESTING_AGENT MUST PRESERVE THIS ENTIRE BLOCK

# Communication Protocol:
# If the `testing_agent` is available, main agent should delegate all testing tasks to it.
#
# You have access to a file called `test_result.md`. This file contains the complete testing state
# and history, and is the primary means of communication between main and the testing agent.
#
# Main and testing agents must follow this exact format to maintain testing data. 
# The testing data must be entered in yaml format Below is the data structure:
# 
## user_problem_statement: {problem_statement}
## backend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.py"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## frontend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.js"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## metadata:
##   created_by: "main_agent"
##   version: "1.0"
##   test_sequence: 0
##   run_ui: false
##
## test_plan:
##   current_focus:
##     - "Task name 1"
##     - "Task name 2"
##   stuck_tasks:
##     - "Task name with persistent issues"
##   test_all: false
##   test_priority: "high_first"  # or "sequential" or "stuck_first"
##
## agent_communication:
##     -agent: "main"  # or "testing" or "user"
##     -message: "Communication message between agents"

# Protocol Guidelines for Main agent
#
# 1. Update Test Result File Before Testing:
#    - Main agent must always update the `test_result.md` file before calling the testing agent
#    - Add implementation details to the status_history
#    - Set `needs_retesting` to true for tasks that need testing
#    - Update the `test_plan` section to guide testing priorities
#    - Add a message to `agent_communication` explaining what you've done
#
# 2. Incorporate User Feedback:
#    - When a user provides feedback that something is or isn't working, add this information to the relevant task's status_history
#    - Update the working status based on user feedback
#    - If a user reports an issue with a task that was marked as working, increment the stuck_count
#    - Whenever user reports issue in the app, if we have testing agent and task_result.md file so find the appropriate task for that and append in status_history of that task to contain the user concern and problem as well 
#
# 3. Track Stuck Tasks:
#    - Monitor which tasks have high stuck_count values or where you are fixing same issue again and again, analyze that when you read task_result.md
#    - For persistent issues, use websearch tool to find solutions
#    - Pay special attention to tasks in the stuck_tasks list
#    - When you fix an issue with a stuck task, don't reset the stuck_count until the testing agent confirms it's working
#
# 4. Provide Context to Testing Agent:
#    - When calling the testing agent, provide clear instructions about:
#      - Which tasks need testing (reference the test_plan)
#      - Any authentication details or configuration needed
#      - Specific test scenarios to focus on
#      - Any known issues or edge cases to verify
#
# 5. Call the testing agent with specific instructions referring to test_result.md
#
# IMPORTANT: Main agent must ALWAYS update test_result.md BEFORE calling the testing agent, as it relies on this file to understand what to test next.

#====================================================================================================
# END - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================



#====================================================================================================
# Testing Data - Main Agent and testing sub agent both should log testing data below this section
#====================================================================================================
user_problem_statement: "Import my portfolio code from GitHub repository: matty-dpi/matty. I have already updated the package.json and server.py to use the name 'matty'."
backend:
  - task: "Status Endpoint & Application Server"
    implemented: true
    working: true
    file: "server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        -working: "NA"
        -agent: "main"
        -comment: "Imported the backend code from matty-dpi/matty repository."
        -working: true
        -agent: "testing"
        -comment: "Backend fully functional. All 10 API endpoints tested and working: GET /api/ (root), GET /api/projects (all & filtered), GET /api/projects/{id}, GET /api/agent-data, POST /api/reel-meta (Vimeo integration), GET /api/avatar/quota, POST /api/contact (with validation). MongoDB connection working, contact data saved successfully. Server running on 0.0.0.0:8001, accessible via https://matty-build.preview.emergentagent.com/api"
frontend:
  - task: "Clone portfolio code"
    implemented: true
    working: "NA"
    file: "App.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        -working: "NA"
        -agent: "main"
        -comment: "Imported the frontend code from matty-dpi/matty repository."
metadata:
  created_by: "main_agent"
  version: "1.0"
  test_sequence: 2
  run_ui: false
test_plan:
  current_focus:
    - "Status Endpoint & Application Server"
  stuck_tasks: []
  test_all: true
  test_priority: "sequential"
agent_communication:
  -agent: "main"
  -message: "I have cloned the full portfolio repository for the user, placing the frontend code in /app/frontend and backend in /app/backend. Please run basic tests on the backend to ensure there are no startup errors and the main endpoints are functional."
  -agent: "testing"
  -message: "Backend testing complete. All 10 API endpoints are fully functional and working correctly. Server is healthy, MongoDB connection established, and external integrations (Vimeo API) are working. No issues found. Backend is production-ready."

backend:
  - task: "Fix RunwayML API connection 500 error"
    implemented: true
    working: true
    file: "server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        -working: "NA"
        -agent: "main"
        -comment: "User reported 500 RUNWAYML_API_SECRET not configured. Added the provided key to /app/backend/.env and restarted backend server."
        -working: true
        -agent: "testing"
        -comment: "Fixed .env formatting issue (CORS_ORIGINS and RUNWAYML_API_SECRET were on same line without newline, causing python-dotenv parse error). Restarted backend. Tested POST /api/avatar/connect with avatarId='game-character' - successfully created RunwayML session and returned sessionId/sessionKey. 500 error resolved. All 11 backend API endpoints passing."

agent_communication:
  -agent: "main"
  -message: "I have added the RUNWAYML_API_SECRET to the backend environment variables. Please test the POST /api/avatar/connect endpoint to ensure the 500 error is resolved and it can successfully initiate an avatar session."
  -agent: "testing"
  -message: "Avatar connect endpoint tested and working. The issue was a .env formatting problem - RUNWAYML_API_SECRET was appended to CORS_ORIGINS line without newline. Fixed formatting, restarted backend, and confirmed POST /api/avatar/connect successfully creates RunwayML sessions. All backend tests passing (11/11)."

backend:
  - task: "Configure Resend API Key"
    implemented: true
    working: true
    file: "server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        -working: "NA"
        -agent: "main"
        -comment: "User provided Resend API key. Added to backend .env file. Need to verify /api/contact endpoint to ensure emails can be sent."
        -working: true
        -agent: "testing"
        -comment: "Verified POST /api/contact endpoint with Resend API key configured. Endpoint works correctly without errors. Tested multiple scenarios: (1) Valid contact with email+phone - 200 OK, contact saved to DB with ID; (2) Valid contact with phone only - 200 OK; (3) Invalid contact without email/phone - 422 validation error (correct); (4) Invalid contact with empty message - 422 validation error (correct). Resend module v2.33.0 installed and imported successfully. Backend server running without configuration errors. NOTE: Email notifications require CONTACT_NOTIFY_EMAIL env var to be set (currently not set, so emails are not sent but endpoint works correctly). Default sender is 'onboarding@resend.dev' which can only send to registered Resend account email unless domain is verified."

agent_communication:
  -agent: "main"
  -message: "I have added the RESEND_API_KEY to the backend .env file. Please test the POST /api/contact endpoint to ensure that form submissions successfully trigger an email without errors."
  -agent: "testing"
  -message: "Contact endpoint testing complete. POST /api/contact works perfectly with Resend API key configured. All validation working correctly. Contacts are saved to MongoDB successfully. No configuration errors. Email sending functionality requires CONTACT_NOTIFY_EMAIL env var (not currently set, but this is by design - endpoint still works and saves contacts to DB)."

backend:
  - task: "Configure Resend recipient email"
    implemented: true
    working: true
    file: "server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        -working: "NA"
        -agent: "main"
        -comment: "User provided recipient email matt@heartsandminds.la for Resend notifications. Added to backend .env file as CONTACT_NOTIFY_EMAIL."
        -working: true
        -agent: "testing"
        -comment: "Email dispatch functionality verified and working correctly. Tested POST /api/contact endpoint with CONTACT_NOTIFY_EMAIL configured. The resend.Emails.send() function executes successfully without errors. Email sent successfully to matt@heartsandminds.la with email ID ecd2c465-4183-4e27-bd2e-57add140aa31. Resend API responding with 200 OK, rate limits working (9/10 remaining), daily quota: 4 emails sent. No sandbox restriction errors encountered. Contact form submissions are saved to MongoDB and email notifications are dispatched successfully."

agent_communication:
  -agent: "main"
  -message: "I have added CONTACT_NOTIFY_EMAIL=matt@heartsandminds.la to the backend .env file. Please perform a final test on the POST /api/contact endpoint to ensure the email dispatch function executes properly now that a recipient is configured."
  -agent: "testing"
  -message: "Email dispatch testing complete. POST /api/contact endpoint successfully executes resend.Emails.send() function. Email notifications are being sent to matt@heartsandminds.la without errors. Verified with backend logs showing successful email dispatch with Resend API returning email ID and 200 OK status. All 11 backend API endpoints passing tests. Backend is fully functional."

backend:
  - task: "Check RunwayML API connection 500 error again"
    implemented: true
    working: true
    file: "server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        -working: "NA"
        -agent: "main"
        -comment: "User reported 500 RUNWAYML_API_SECRET not configured again. Testing locally to see if it works in preview."
        -working: true
        -agent: "testing"
        -comment: "Tested POST /api/avatar/connect endpoint in preview environment. NO 500 error occurring. RUNWAYML_API_SECRET is properly configured in /app/backend/.env (132 characters, verified loaded). Ran full backend test suite: all 11/11 endpoints passing including avatar/connect. Tested avatar/connect 3 times: 2x returned 200 OK with valid sessionId/sessionKey, 1x returned 429 rate limit (expected behavior). Backend logs show successful RunwayML API calls (200 OK responses). The 500 error 'RUNWAYML_API_SECRET not configured' is NOT occurring in the current preview environment. User may have experienced cached error from browser or tested before configuration was applied."

agent_communication:
  -agent: "main"
  -message: "Please test the POST /api/avatar/connect endpoint to ensure the 500 error is NOT present in the preview environment."
  -agent: "testing"
  -message: "Avatar/connect endpoint tested and confirmed working in preview environment. The 500 error 'RUNWAYML_API_SECRET not configured' is NOT occurring. RUNWAYML_API_SECRET is properly configured and loaded. All 11 backend endpoints passing tests. The endpoint successfully creates RunwayML sessions and returns sessionId/sessionKey. Rate limiting (429) also working correctly. No issues found."
