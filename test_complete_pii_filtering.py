#!/usr/bin/env python3
"""Complete test of PII filtering including names in document processing"""

import os
from main import app
from fastapi.testclient import TestClient

def test_complete_pii_filtering():
    """Test the complete pipeline with multiple files containing various PII including names"""
    
    # Set mock provider for testing
    os.environ['INCLUDE_MOCK_PROVIDER'] = 'True'
    client = TestClient(app)
    
    # Create test documents with different types of PII
    doc1_content = """
    CONFIDENTIAL FINANCIAL REPORT
    
    Prepared by: John Smith, Senior Analyst
    Reviewed by: Dr. Sarah Williams
    Date: March 15, 2024
    
    Contact: john.smith@company.com
    Phone: (555) 123-4567
    SSN: 123-45-6789
    
    According to Michael Johnson, the quarterly earnings have improved.
    Please contact Jennifer Davis at 555-987-6543 for additional details.
    
    Signed by: Robert Anderson
    Director of Finance
    """
    
    doc2_content = """
    MEETING NOTES - PROJECT ALPHA
    
    Attendees:
    - Thomas Wilson (thomas@company.com, 555-111-2222)  
    - Maria Rodriguez (maria.rodriguez@company.com)
    - David Chen, Project Manager
    
    From: Lisa Thompson
    To: All Team Members
    
    As discussed with Elena Petrova, the timeline needs adjustment.
    Contact information: 123 Main Street, Suite 456, New York, NY 10001
    
    Credit card ending in: 4532 1234 5678 9012
    IP Address: 192.168.1.100
    
    Best regards,
    Alexander Hamilton
    VP of Operations
    """
    
    doc3_content = """
    EMPLOYEE DIRECTORY UPDATE
    
    New Hires:
    - Benjamin Franklin (SSN: 987-65-4321, Phone: 555-333-7777)
    - Catherine Johnson (Address: 789 Oak Avenue, Chicago, IL 60601)
    
    James Madison said the onboarding process is complete.
    Please contact Abraham Lincoln for HR inquiries.
    
    Mr. George Washington will handle the final approvals.
    """
    
    files = [
        ("files", ("financial_report.txt", doc1_content, "text/plain")),
        ("files", ("meeting_notes.txt", doc2_content, "text/plain")),  
        ("files", ("employee_directory.txt", doc3_content, "text/plain")),
    ]
    
    print("🧪 Testing Complete PII Filtering with Multiple Documents\n")
    
    # Upload files
    print("📤 Uploading files...")
    upload_response = client.post("/api/upload", files=files)
    
    if upload_response.status_code != 200:
        print(f"❌ Upload failed: {upload_response.status_code}")
        return
    
    upload_result = upload_response.json()
    print(f"✅ Upload successful: {upload_result['summary']['successful']}/{upload_result['summary']['total_files']} files")
    
    # Analyze filtering results
    print("\n🔍 PII Filtering Analysis:")
    total_filtered_items = 0
    
    for i, result in enumerate(upload_result['results'], 1):
        if result['success']:
            filename = result['metadata']['filename']
            filtered_text = result['filtered_text']
            stats = result['filtering_stats']
            
            print(f"\n📄 Document {i}: {filename}")
            print(f"   Items filtered: {stats['items_filtered']}")
            print(f"   Filter types: {', '.join(stats['filter_types'])}")
            print(f"   Size reduction: {stats['reduction_percentage']}%")
            print(f"   Content preview: {filtered_text[:200]}...")
            
            total_filtered_items += stats['items_filtered']
            
            # Check for various PII markers
            pii_checks = [
                ("[EMAIL_FILTERED]" in filtered_text, "📧 Email"),
                ("[PHONE_FILTERED]" in filtered_text, "📱 Phone"),
                ("[SSN_FILTERED]" in filtered_text, "🆔 SSN"),
                ("[CARD_FILTERED]" in filtered_text, "💳 Credit Card"),
                ("[ADDRESS_FILTERED]" in filtered_text, "🏠 Address"),
                ("[IP_FILTERED]" in filtered_text, "🌐 IP"),
                ("J.S." in filtered_text or "S.W." in filtered_text, "👤 Names"),
            ]
            
            print("   🔒 PII Types Found:", end=" ")
            found_types = [desc for found, desc in pii_checks if found]
            print(" | ".join(found_types) if found_types else "None")
    
    print(f"\n📊 Total PII items filtered across all documents: {total_filtered_items}")
    
    # Test chat with all documents
    file_contents = [r['filtered_text'] for r in upload_result['results'] if r['success']]
    
    chat_data = {
        "prompt": "Summarize the key information from these documents while identifying any remaining sensitive information",
        "llm_provider": "mock",
        "model": None,
        "file_contents": file_contents
    }
    
    print("\n💬 Testing chat with filtered documents...")
    chat_response = client.post("/api/chat", json=chat_data)
    
    if chat_response.status_code == 200:
        chat_result = chat_response.json()
        cleaned_prompt = chat_result['cleaned_prompt']
        
        print(f"✅ Chat successful with {chat_result['document_info']['document_count']} documents")
        print(f"📝 Final prompt length: {len(cleaned_prompt)} characters")
        
        # Check that no original PII leaked through
        sensitive_patterns = [
            r'\b\d{3}-\d{2}-\d{4}\b',  # SSN
            r'\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b',  # Phone
            r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',  # Email
        ]
        
        leaked_pii = []
        for pattern in sensitive_patterns:
            import re
            if re.search(pattern, cleaned_prompt):
                leaked_pii.append(pattern)
        
        if leaked_pii:
            print(f"⚠️  WARNING: Some PII patterns may have leaked: {leaked_pii}")
        else:
            print("✅ No sensitive PII patterns detected in final prompt")
        
        # Count name initials vs full names
        import re
        initials = len(re.findall(r'\b[A-Z]\.[A-Z]\.', cleaned_prompt))
        full_names = len(re.findall(r'\b[A-Z][a-z]{3,}\s+[A-Z][a-z]{3,}\b', cleaned_prompt))
        
        print(f"👥 Name filtering stats: {initials} initials, {full_names} full names remaining")
        
    else:
        print(f"❌ Chat failed: {chat_response.status_code}")
    
    print("\n🎉 Complete PII filtering test completed!")

if __name__ == "__main__":
    test_complete_pii_filtering()
