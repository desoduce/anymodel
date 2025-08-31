#!/usr/bin/env python3
"""Test script for multiple file upload functionality"""

import requests
import json

# Test the multiple file upload
def test_multiple_files():
    # Create some test files in memory
    files_data = [
        ("files", ("test1.txt", "This is test file 1 with some content.", "text/plain")),
        ("files", ("test2.txt", "This is test file 2 with different content and a phone number 555-123-4567.", "text/plain")),
    ]
    
    try:
        # Test upload endpoint
        print("Testing multiple file upload...")
        upload_response = requests.post("http://localhost:8000/api/upload", files=files_data)
        
        if upload_response.status_code == 200:
            upload_result = upload_response.json()
            print(f"Upload successful! {upload_result['summary']['successful']} files processed")
            
            # Extract file contents for chat
            file_contents = [r["filtered_text"] for r in upload_result["results"] if r["success"]]
            
            # Test chat endpoint with multiple files
            chat_data = {
                "prompt": "Summarize the contents of these documents",
                "llm_provider": "mock",
                "model": None,
                "file_contents": file_contents
            }
            
            print("Testing chat with multiple files...")
            chat_response = requests.post(
                "http://localhost:8000/api/chat",
                headers={"Content-Type": "application/json"},
                data=json.dumps(chat_data)
            )
            
            if chat_response.status_code == 200:
                chat_result = chat_response.json()
                print("Chat successful!")
                print(f"Response: {chat_result['response']}")
                print(f"Documents included: {chat_result['document_info']}")
            else:
                print(f"Chat failed: {chat_response.status_code} - {chat_response.text}")
        else:
            print(f"Upload failed: {upload_response.status_code} - {upload_response.text}")
            
    except requests.exceptions.ConnectionError:
        print("Could not connect to server. Please start the server first with: python3 main.py")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_multiple_files()
