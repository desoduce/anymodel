#!/usr/bin/env python3
"""
Test script for the new indexed redaction system
"""

from prompt_cleaner import filterPII

def test_indexed_redaction():
    """Test that the indexed redaction system works correctly"""
    
    print("Testing Indexed PII Redaction System")
    print("=" * 50)
    
    # Test case 1: Same strings get same index
    test_text1 = """
    John's email is john@example.com and his phone is 555-123-4567.
    Later, john@example.com appears again, along with 555-123-4567.
    """
    
    filtered1 = filterPII(test_text1)
    print("Test 1 - Same strings get same index:")
    print("Original:", test_text1.strip())
    print("Filtered:", filtered1.strip())
    print()
    
    # Test case 2: Different strings get different indices
    test_text2 = """
    Contact info:
    Email: john@example.com
    Phone: 555-123-4567
    Email2: mary@example.com  
    Phone2: 555-987-6543
    SSN: 123-45-6789
    """
    
    filtered2 = filterPII(test_text2)
    print("Test 2 - Different strings get different indices:")
    print("Original:", test_text2.strip())
    print("Filtered:", filtered2.strip())
    print()
    
    # Test case 3: Mixed content with non-PII preserved
    test_text3 = """
    This is a normal sentence with no PII.
    
    But this email address john@example.com should be redacted.
    This phone number 555-123-4567 should also be redacted.
    This credit card 4532-1234-5678-9012 should be redacted too.
    
    However, this regular text should remain unchanged.
    Numbers like 123 or 9999 that aren't PII should stay.
    """
    
    filtered3 = filterPII(test_text3)
    print("Test 3 - Mixed content:")
    print("Original:", test_text3.strip())
    print("Filtered:", filtered3.strip())
    print()
    
    # Test case 4: Consistency across multiple calls
    test_text4 = "Email: john@example.com Phone: 555-123-4567"
    
    filtered4a = filterPII(test_text4)
    filtered4b = filterPII(test_text4)
    
    print("Test 4 - Consistency (should be different indices each run):")
    print("Original:", test_text4)
    print("Run 1:   ", filtered4a)
    print("Run 2:   ", filtered4b)
    print("Note: Each run starts fresh indexing, so indices may differ between runs")
    print()
    
    print("✅ All tests completed!")

if __name__ == "__main__":
    test_indexed_redaction()