#!/usr/bin/env python3
"""Test script to verify name filtering functionality"""

from prompt_cleaner import cleanPrompt, filterNames

def test_name_filtering():
    """Test various name filtering scenarios"""
    
    test_cases = [
        {
            "input": "John Smith said that the project is on track.",
            "expected_contains": "J.S. said",
            "description": "Simple name with action verb"
        },
        {
            "input": "Mr. Robert Johnson will handle the client meeting.",
            "expected_contains": "Mr. R.J. will",
            "description": "Name with title prefix"
        },
        {
            "input": "The report was prepared by Sarah Williams and reviewed by Michael Davis.",
            "expected_contains": ["S.W.", "M.D."],
            "description": "Multiple names in professional context"
        },
        {
            "input": "Dear Jennifer Martinez, Thank you for your email.",
            "expected_contains": "Dear J.M.,",
            "description": "Name in greeting"
        },
        {
            "input": "According to Thomas Anderson, the quarterly results show improvement.",
            "expected_contains": "According to T.A.,",
            "description": "Name with attribution"
        },
        {
            "input": "Dr. Elizabeth Harper has published a new research paper.",
            "expected_contains": "Dr. E.H. has",
            "description": "Name with professional title"
        },
        {
            "input": "The contract was signed by David Wilson Jr. on Monday.",
            "expected_contains": "D.W. Jr.",
            "description": "Name with suffix"
        },
        {
            "input": "Contact information for Maria Rodriguez is available in the directory.",
            "expected_contains": "M.R. is",
            "description": "Name in contact context"
        },
        {
            "input": "Apple Inc. and Microsoft Corporation are technology companies.",
            "expected_not_contains": ["A.I.", "M.C."],
            "description": "Company names should not be filtered"
        },
        {
            "input": "New York City and Los Angeles are major cities.",
            "expected_not_contains": ["N.Y.", "L.A."],
            "description": "Place names should not be filtered"
        }
    ]
    
    print("🧪 Testing Name Filtering Functionality\n")
    
    passed = 0
    failed = 0
    
    for i, test in enumerate(test_cases, 1):
        print(f"Test {i}: {test['description']}")
        print(f"Input: {test['input']}")
        
        # Test just name filtering
        filtered = filterNames(test['input'])
        print(f"Name filtered: {filtered}")
        
        # Test full PII cleaning
        fully_cleaned = cleanPrompt(test['input'])
        print(f"Fully cleaned: {fully_cleaned}")
        
        # Check expectations
        success = True
        
        if 'expected_contains' in test:
            expected = test['expected_contains']
            if isinstance(expected, str):
                expected = [expected]
            
            for exp in expected:
                if exp not in filtered:
                    print(f"❌ Expected '{exp}' not found in filtered text")
                    success = False
        
        if 'expected_not_contains' in test:
            not_expected = test['expected_not_contains']
            if isinstance(not_expected, str):
                not_expected = [not_expected]
            
            for not_exp in not_expected:
                if not_exp in filtered:
                    print(f"❌ Unexpected '{not_exp}' found in filtered text")
                    success = False
        
        if success:
            print("✅ PASSED")
            passed += 1
        else:
            print("❌ FAILED")
            failed += 1
        
        print("-" * 60)
    
    print(f"\n📊 Results: {passed} passed, {failed} failed")
    
    if failed == 0:
        print("🎉 All name filtering tests passed!")
    else:
        print(f"⚠️  {failed} test(s) failed - review the patterns")

def test_combined_pii_and_names():
    """Test that name filtering works with other PII filtering"""
    
    test_text = """
    From: John Smith <john@company.com>
    Phone: 555-123-4567
    SSN: 123-45-6789
    
    Dear Ms. Sarah Johnson,
    
    As discussed with Robert Davis, the project timeline has been updated.
    Please contact Jennifer Wilson at 555-987-6543 for further details.
    
    Best regards,
    Michael Anderson
    Director of Operations
    michael.anderson@company.com
    """
    
    print("🔒 Testing Combined PII and Name Filtering\n")
    print("Original text:")
    print(test_text)
    print("\n" + "="*60 + "\n")
    
    cleaned = cleanPrompt(test_text)
    print("Cleaned text:")
    print(cleaned)
    
    # Check that various PII types were filtered
    checks = [
        ("[EMAIL_FILTERED]" in cleaned, "Email filtering"),
        ("[PHONE_FILTERED]" in cleaned, "Phone filtering"),
        ("[SSN_FILTERED]" in cleaned, "SSN filtering"),
        ("J.S." in cleaned, "Name filtering (John Smith)"),
        ("S.J." in cleaned, "Name filtering (Sarah Johnson)"),
        ("R.D." in cleaned, "Name filtering (Robert Davis)"),
        ("M.A." in cleaned, "Name filtering (Michael Anderson)"),
    ]
    
    print("\n📋 Filtering Checks:")
    for check, description in checks:
        status = "✅" if check else "❌"
        print(f"{status} {description}")

if __name__ == "__main__":
    test_name_filtering()
    print("\n" + "="*80 + "\n")
    test_combined_pii_and_names()
