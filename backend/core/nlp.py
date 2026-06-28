import re

def parse_nl_query(query: str):
    """
    Parses a natural language query and extracts structured filters.
    """
    if not query:
        return {
            "search_text": "",
            "radius": None,
            "max_rate": None,
            "min_rate": None,
            "min_experience": None,
            "min_rating": None
        }

    original_query = query.lower()
    search_text = original_query
    radius = None
    max_rate = None
    min_rate = None
    min_experience = None
    min_rating = None

    # 1. Parse Radius & Distance
    if any(word in search_text for word in ["near me", "nearby", "close by", "local", "around here", "in my area"]):
        radius = 5
        for word in ["near me", "nearby", "close by", "local", "around here", "in my area"]:
            search_text = search_text.replace(word, "")
    
    # "within 50 km", "no more than 20 miles away", "less than 10km"
    radius_match = re.search(r'(?:within|in|around|under|less than|no more than)\s*(?:a\s*)?(\d+)\s*(?:kilometers|miles|km|mi)\b', search_text)
    if not radius_match:
        radius_match = re.search(r'(\d+)\s*(?:kilometers|miles|km|mi)\b\s*(?:radius|away)', search_text)
        
    if radius_match:
        radius = int(radius_match.group(1))
        search_text = search_text.replace(radius_match.group(0), "")

    # 2. Parse Rate Ranges & Budgets
    # "between 50 and 100", "50 to 100", "$50-$100"
    range_match = re.search(r'(?:between\s*)?\$?(\d+)\s*(?:and|to|-)\s*\$?(\d+)', search_text)
    if range_match:
        min_rate = int(range_match.group(1))
        max_rate = int(range_match.group(2))
        search_text = search_text.replace(range_match.group(0), "")
    else:
        # Max Rate: "rate below 100", "under 100", "< 100", "max 100", "maximum 100 bucks per hour"
        max_match = re.search(r'(?:rate|price|cost|wage|budget|max|maximum|charges|paying)?\s*(?:below|bellow|under|less than|<|max|maximum|no more than)\s*\$?\s*(\d+)\s*(?:bucks|dollars|pay)?\s*(?:/hr|per hour|an hour|a hour)?', search_text)
        if max_match:
            max_rate = int(max_match.group(1))
            search_text = search_text.replace(max_match.group(0), "")
            
        # Min Rate: "rate above 50", "> 50", "min 50", "minimum 50", "starting from 50", "paying at least"
        min_match = re.search(r'(?:rate|price|cost|wage|min|minimum|paying|charges)?\s*(?:above|over|more than|>|min|minimum|starting from|at least)\s*\$?\s*(\d+)\s*(?:bucks|dollars|pay)?\s*(?:/hr|per hour|an hour|a hour)?', search_text)
        if min_match:
            min_rate = int(min_match.group(1))
            search_text = search_text.replace(min_match.group(0), "")

    # Budget keywords
    if "cheap" in search_text or "affordable" in search_text or "low cost" in search_text:
        max_rate = max_rate or 50
        for w in ["cheap", "affordable", "low cost"]:
            search_text = search_text.replace(w, "")
            
    if "expensive" in search_text or "premium" in search_text or "high paying" in search_text:
        min_rate = min_rate or 100
        for w in ["expensive", "premium", "high paying"]:
            search_text = search_text.replace(w, "")

    # 3. Parse Ratings
    # "4 stars", "5 star rated", "rating > 4", "at least 4 stars"
    rating_match = re.search(r'(?:at least\s*|rating\s*(?:>|over)\s*)?(\d+(?:\.\d+)?)\s*(?:stars?|star rated)', search_text)
    if rating_match:
        min_rating = float(rating_match.group(1))
        search_text = search_text.replace(rating_match.group(0), "")
    
    if any(word in search_text for word in ["top rated", "highly rated", "best rated", "great reviews", "good reviews", "best", "top tier"]):
        min_rating = min_rating or 4.5
        for word in ["top rated", "highly rated", "best rated", "great reviews", "good reviews", "best", "top tier"]:
            search_text = search_text.replace(word, "")

    # 4. Parse Min Experience
    # "at least 5 years experience", "> 5 years"
    exp_match = re.search(r'(?:at least|>|over|more than|min|minimum)?\s*(\d+)\s*(?:\+|plus)?\s*years?(?:\s*of)?(?:\s*experience)?', search_text)
    if exp_match:
        min_experience = int(exp_match.group(1))
        search_text = search_text.replace(exp_match.group(0), "")
        
    if any(word in search_text for word in ["expert", "senior", "master", "highly experienced", "professional"]):
        min_experience = min_experience or 5
        for word in ["expert", "senior", "master", "highly experienced", "professional"]:
            search_text = search_text.replace(word, "")

    # Clean up search text
    # Remove filler words
    fillers = [
        "workers with", "worker with", "workers", "worker", "contractor", "freelancer",
        "i need a", "i need", "need a", "need", "looking for a", "looking for", 
        "find me a", "find me", "show me", "searching for", "please find", "can you find me",
        "someone to", "someone who can", "somebody to", "is there a", "anyone who",
        "with", "who is", "who has", "that is", "that has", "and", "or", "who charges", "who works for",
        "jobs", "job", "vacancy", "vacancies", "work", "task", "tasks", "my house", "my car", "my plumbing",
        "who", "whom", "for", "a", "an", "the", "some", "any", "radius", "away", "distance"
    ]
    
    # Sort fillers by length descending so "workers with" replaces before "workers"
    fillers.sort(key=len, reverse=True)
    
    for filler in fillers:
        # We run this multiple times to catch layered fillers like "a who"
        for _ in range(3):
            # Check start
            if search_text.startswith(filler + " ") or search_text == filler:
                search_text = search_text.replace(filler + " ", "", 1).strip()
                if search_text == filler: search_text = ""
            # Check end
            if search_text.endswith(" " + filler):
                # reverse replace
                search_text = search_text[::-1].replace((" " + filler)[::-1], "", 1)[::-1].strip()
            
    # Clean up stray punctuation or double spaces
    search_text = re.sub(r'[^\w\s]', '', search_text)
    search_text = " ".join(search_text.split()).strip()
    
    # Run filler removal one more time after removing punctuation
    for filler in fillers:
        if search_text.startswith(filler + " ") or search_text == filler:
            search_text = search_text.replace(filler + " ", "", 1).strip()
            if search_text == filler: search_text = ""
        if search_text.endswith(" " + filler):
            search_text = search_text[::-1].replace((" " + filler)[::-1], "", 1)[::-1].strip()
            
    search_text = " ".join(search_text.split()).strip()

    # 5. Synonym & Role Normalization (Maximized)
    # We map roles and synonyms directly to the category IDs found in frontend/src/constants/categories.ts
    # so that job_roles__category__icontains matches perfectly.
    role_mappings = {
        # Roles -> Categories
        "painter": "painting",
        "carpenter": "carpentry",
        "plumber": "plumbing",
        "electrician": "electrical",
        "cleaner": "cleaning",
        "gardener": "gardening",
        "mover": "moving",
        "exterminator": "pest_control",
        "technician": "appliance",
        "courier": "delivery",
        "guard": "home_security",
        "security guard": "home_security",
        "driver": "transportation",
        
        # Plurals -> Categories
        "painters": "painting",
        "carpenters": "carpentry",
        "plumbers": "plumbing",
        "electricians": "electrical",
        "cleaners": "cleaning",
        "gardeners": "gardening",
        "movers": "moving",
        "exterminators": "pest_control",
        "technicians": "appliance",
        "couriers": "delivery",
        "guards": "home_security",
        "drivers": "transportation",
        "mechanics": "mechanic",
        "handymen": "handyman",
        "tilers": "tiler",
        "roofers": "roofer",
        "masons": "mason",
        "arborists": "arborist",
        
        # Synonyms / Verbs -> Categories
        "paint": "painting",
        "build": "carpentry",
        "woodwork": "carpentry",
        "clean": "cleaning",
        "garden": "gardening",
        "move": "moving",
        "pest": "pest_control",
        "bugs": "pest_control",
        "appliance repair": "appliance",
        "appliances": "appliance",
        "cars": "mechanic",
        "car repair": "mechanic",
        "auto": "mechanic",
        "wiring": "electrical",
        "pipes": "plumbing",
        "fixing": "handyman",
        "repair": "handyman",
        "repairs": "handyman",
        "trees": "arborist",
        "tree cutting": "arborist",
        "delivery driver": "delivery",
        "transport": "transportation"
    }
    
    # Replace entire words using regex word boundaries to avoid partial matches
    # We sort keys by length descending to match multi-word phrases (like 'pest control') first
    for syn in sorted(role_mappings.keys(), key=len, reverse=True):
        role = role_mappings[syn]
        # Use regex word boundaries for safe replacement
        search_text = re.sub(rf'\b{syn}\b', role, search_text)
        
    search_text = " ".join(search_text.split()).strip()

    return {
        "search_text": search_text,
        "radius": radius,
        "max_rate": max_rate,
        "min_rate": min_rate,
        "min_experience": min_experience,
        "min_rating": min_rating
    }
