import re

def cleanPrompt(prompt: str) -> str:
    """
    Clean and sanitize user prompts before sending to LLMs.
    
    This function:
    - Removes potentially harmful content
    - Filters out sensitive PII (SSN, phone numbers, addresses, etc.)
    - Normalizes whitespace
    - Removes excessive special characters
    - Ensures reasonable length limits
    
    Args:
        prompt (str): Raw user input prompt
        
    Returns:
        str: Cleaned and sanitized prompt
    """
    if not prompt or not isinstance(prompt, str):
        return ""
    
    # Remove excessive whitespace and normalize
    cleaned = re.sub(r'\s+', ' ', prompt.strip())
    
    # Remove potentially harmful patterns
    # Remove script tags and HTML
    cleaned = re.sub(r'<script[^>]*>.*?</script>', '', cleaned, flags=re.IGNORECASE | re.DOTALL)
    cleaned = re.sub(r'<[^>]+>', '', cleaned)
    
    # Filter out Personally Identifiable Information (PII)
    cleaned = filterPII(cleaned)
    
    # Remove excessive special characters (more than 3 in a row)
    cleaned = re.sub(r'([!@#$%^&*()_+=\[\]{}|;:,.<>?/~`-])\1{3,}', r'\1\1\1', cleaned)
    
    # Remove potentially malicious injection attempts
    injection_patterns = [
        r'(?i)(ignore|forget|disregard).*(previous|above|earlier).*(instruction|prompt|rule)',
        r'(?i)(system|admin|root).*(override|bypass|ignore)',
        r'(?i)jailbreak',
        r'(?i)pretend (you are|to be)',
        r'(?i)act as if',
    ]
    
    for pattern in injection_patterns:
        cleaned = re.sub(pattern, '[FILTERED]', cleaned)
    
    # Limit length (reasonable limit for most LLMs)
    max_length = 8000
    if len(cleaned) > max_length:
        cleaned = cleaned[:max_length] + "... [truncated]"
    
    # Ensure minimum meaningful content
    if len(cleaned.strip()) < 3:
        return "Please provide a meaningful prompt."
    
    return cleaned.strip()

def filterPII(text: str) -> str:
    """
    Filter out Personally Identifiable Information from text.
    
    Removes or masks:
    - Social Security Numbers
    - Phone Numbers
    - Email Addresses
    - Credit Card Numbers
    - Addresses (basic patterns)
    - IP Addresses
    - Personal Names (replaced with initials)
    
    Args:
        text (str): Input text
        
    Returns:
        str: Text with PII filtered out
    """
    # Social Security Numbers (XXX-XX-XXXX format and variations)
    text = re.sub(r'\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b', '[SSN_FILTERED]', text)
    
    # Phone Numbers (various formats)
    phone_patterns = [
        r'\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b',  # 123-456-7890, 123.456.7890, 123 456 7890
        r'\(\d{3}\)\s?\d{3}[-.\s]?\d{4}',      # (123) 456-7890
        r'\+1[-.\s]?\d{3}[-.\s]?\d{3}[-.\s]?\d{4}',  # +1-123-456-7890
    ]
    for pattern in phone_patterns:
        text = re.sub(pattern, '[PHONE_FILTERED]', text)
    
    # Email Addresses
    text = re.sub(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', '[EMAIL_FILTERED]', text)
    
    # Credit Card Numbers (basic pattern - 4 groups of 4 digits)
    text = re.sub(r'\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b', '[CARD_FILTERED]', text)
    
    # IP Addresses
    text = re.sub(r'\b(?:\d{1,3}\.){3}\d{1,3}\b', '[IP_FILTERED]', text)
    
    # Street Addresses (basic patterns)
    # Pattern for number + street name + common suffixes
    address_patterns = [
        r'\b\d+\s+[A-Za-z\s]+\s+(Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Boulevard|Blvd|Circle|Cir|Court|Ct|Place|Pl)\b',
        r'\b\d+\s+[A-Za-z\s]+\s+(St|Ave|Rd|Dr|Ln|Blvd|Cir|Ct|Pl)\.?\b',
    ]
    for pattern in address_patterns:
        text = re.sub(pattern, '[ADDRESS_FILTERED]', text, flags=re.IGNORECASE)
    
    # ZIP Codes (5 digits or 5+4 format)
    text = re.sub(r'\b\d{5}(?:-\d{4})?\b', '[ZIP_FILTERED]', text)
    
    # Driver's License Numbers (varies by state, but common patterns)
    dl_patterns = [
        r'\b[A-Z]\d{7,8}\b',  # Letter followed by 7-8 digits (many states)
        r'\b\d{8,12}\b',      # 8-12 digits (some states)
    ]
    for pattern in dl_patterns:
        text = re.sub(pattern, '[DL_FILTERED]', text)
    
    # Bank Account Numbers (basic pattern - 8-17 digits)
    text = re.sub(r'\b\d{8,17}\b', '[ACCOUNT_FILTERED]', text)
    
    # Passport Numbers (basic pattern - letter + 8 digits)
    text = re.sub(r'\b[A-Z]\d{8}\b', '[PASSPORT_FILTERED]', text)
    
    # Personal Names (replace with initials)
    # text = filterNames(text)
    
    return text

def filterNames(text: str) -> str:
    """
    Replace personal names with initials to reduce indexability.
    
    Handles:
    - Full names (First Last, First Middle Last)
    - Names in various contexts
    - Common name patterns
    - Preserves meaning while reducing PII
    
    Args:
        text (str): Input text
        
    Returns:
        str: Text with names replaced by initials
    """
    import re
    
    # Common prefixes that indicate names
    name_prefixes = [
        r'Mr\.?\s+', r'Mrs\.?\s+', r'Ms\.?\s+', r'Dr\.?\s+', r'Prof\.?\s+',
        r'Director\s+', r'Manager\s+', r'CEO\s+', r'President\s+',
        r'signed\s+by\s+', r'from\s+', r'to\s+', r'contact\s+',
        r'Dear\s+', r'Hello\s+', r'Hi\s+',
        r'authored\s+by\s+', r'written\s+by\s+', r'prepared\s+by\s+',
        r'reviewed\s+by\s+', r'approved\s+by\s+'
    ]
    
    # Common suffixes that indicate names
    name_suffixes = [
        r'\s+Jr\.?', r'\s+Sr\.?', r'\s+III', r'\s+IV', r'\s+PhD', r'\s+MD',
        r'\s+Esq\.?', r'\s+CPA', r'\s+MBA'
    ]
    
    # Pattern for potential names (capitalized words)
    # This is a basic pattern - First Last or First Middle Last
    name_patterns = [
        # With prefixes: "Mr. John Smith" -> "Mr. J.S."
        r'(' + '|'.join(name_prefixes) + r')([A-Z][a-z]+)\s+([A-Z][a-z]+)(?:\s+([A-Z][a-z]+))?',
    ]
    
    def replace_name_match(match):
        """Replace a name match with initials"""
        groups = match.groups()
        
        # Handle different group structures
        if len(groups) >= 3 and groups[0] and any(prefix in groups[0] for prefix in ['Mr', 'Mrs', 'Ms', 'Dr', 'Prof']):
            # Prefix + names: "Mr. John Smith" -> "Mr. J.S."
            prefix = groups[0]
            first = groups[1]
            last = groups[2]
            middle = groups[3] if len(groups) > 3 and groups[3] else None
            
            if middle:
                return f"{prefix}{first[0]}.{middle[0]}.{last[0]}."
            else:
                return f"{prefix}{first[0]}.{last[0]}."
        
        elif len(groups) >= 2:
            # Find the name parts (skip non-name groups)
            name_parts = []
            context_before = ""
            context_after = ""
            
            for i, group in enumerate(groups):
                if group and re.match(r'^[A-Z][a-z]{2,}$', group):
                    name_parts.append(group)
                elif group and not name_parts:
                    context_before = group + " "
                elif group and name_parts:
                    context_after = " " + group
            
            if len(name_parts) >= 2:
                initials = ".".join([name[0] for name in name_parts]) + "."
                return context_before + initials + context_after
        
        # Fallback: return original if we can't parse properly
        return match.group(0)
    
    # Apply name filtering patterns
    for pattern in name_patterns:
        text = re.sub(pattern, replace_name_match, text, flags=re.MULTILINE)
    
    # Handle simple "First Last" patterns more conservatively
    # Only replace if they appear in clearly personal contexts
    personal_contexts = [
        # Names with clear personal verbs/actions
        r'\b([A-Z][a-z]{2,})\s+([A-Z][a-z]{2,})\s+(said|wrote|stated|reported|mentioned|noted|explained|argued|claimed|believes|thinks|will|has|had|is|was)',
        
        # Names in communication contexts
        r'\b(From:|To:|Dear|Hello|Hi|Sincerely|Regards|Thanks|Best regards?)\s+(?:Ms\.\s+|Mr\.\s+|Mrs\.\s+|Dr\.\s+)?([A-Z][a-z]{2,})\s+([A-Z][a-z]{2,})',
        
        # Names with attribution or professional context  
        r'\b(According to|As per|Contact|signed by|prepared by|reviewed by|authored by|written by|approved by|discussed with)\s+([A-Z][a-z]{2,})\s+([A-Z][a-z]{2,})',
        
        # Names at end of sentences (signatures, etc)
        r'\b([A-Z][a-z]{2,})\s+([A-Z][a-z]{2,})\s*(?:,?\s*(?:Jr\.?|Sr\.?|PhD|MD|CPA|MBA|Esq\.?))?[\.\,]?\s*$',
        
        # Names in common professional contexts
        r'\b([A-Z][a-z]{2,})\s+([A-Z][a-z]{2,})\s*\n\s*(Director|Manager|CEO|President|VP|Vice President)',
    ]
    
    def replace_simple_name(match):
        groups = match.groups()
        full_match = match.group(0)
        
        # Find the name parts in the groups
        name_parts = []
        context_parts = []
        
        for group in groups:
            if group and re.match(r'^[A-Z][a-z]{2,}$', group):
                name_parts.append(group)
            elif group:
                context_parts.append(group)
        
        if len(name_parts) >= 2:
            # Create initials from the first two name parts
            initials = f"{name_parts[0][0]}.{name_parts[1][0]}."
            
            # Replace just the name parts in the full match
            name_sequence = f"{name_parts[0]} {name_parts[1]}"
            return full_match.replace(name_sequence, initials)
        
        return full_match
    
    for pattern in personal_contexts:
        text = re.sub(pattern, replace_simple_name, text, flags=re.IGNORECASE)
    
    return text

def validatePrompt(prompt: str) -> tuple[bool, str]:
    """
    Validate if a prompt is acceptable.
    
    Returns:
        tuple: (is_valid, error_message)
    """
    if not prompt:
        return False, "Prompt cannot be empty"
    
    if len(prompt.strip()) < 3:
        return False, "Prompt too short"
    
    if len(prompt) > 10000:
        return False, "Prompt too long (max 10,000 characters)"
    
    # Check for obvious spam patterns
    if len(set(prompt)) < 5:  # Too few unique characters
        return False, "Prompt appears to be spam"
    
    return True, ""
