import re
import os
import json
import logging
from groq import Groq
from django.conf import settings

logger = logging.getLogger(__name__)

# Initialize Groq client
# Fallback to empty string to prevent crash on init; API will error on use if empty
# Load .env manually since python-dotenv might not be installed
env_path = os.path.join(settings.BASE_DIR, '.env')
groq_api_key = os.environ.get("GROQ_API_KEY", "")

if not groq_api_key and os.path.exists(env_path):
    with open(env_path, 'r') as f:
        for line in f:
            line = line.strip()
            if line.startswith("GROQ_API_KEY="):
                groq_api_key = line.split('=', 1)[1].strip().strip('"').strip("'")
                break

client = Groq(api_key=groq_api_key) if groq_api_key else None

def parse_nl_query(query: str):
    """
    Parses a natural language query and extracts structured filters using Groq AI.
    """
    if not query or not query.strip():
        return {
            "search_text": "",
            "radius": None,
            "max_rate": None,
            "min_rate": None,
            "min_experience": None,
            "min_rating": None
        }

    # If Groq is not configured, fallback to simple text parsing
    if not client:
        logger.warning("GROQ_API_KEY is not set. Falling back to simple text parsing.")
        return _fallback_parse(query)

    system_prompt = """
    You are an intelligent search query parser for a local worker finding application.
    Extract filtering parameters from the user's natural language query.
    Return ONLY a valid JSON object with EXACTLY the following keys (use null if not mentioned):
    - "search_text": A string containing the core search intent (e.g., job role, skill, task). Remove ALL filler words including: "looking for", "find me", "near me", "jobs", "job", "workers", "worker", "rate", "paying", "with", "who", "that", "price", "distance", etc. Use base categories if applicable (e.g., "plumbing", "electrical", "cleaning", "carpentry", "painting", "gardening", "appliance", "moving", "pest_control", "home_security", "mechanic", "handyman", "tiler", "roofer", "mason", "arborist", "delivery", "transportation"). If the entire query was just filters (e.g. "jobs with rate above 200"), this MUST be an empty string "".
    - "radius": An integer representing the search radius in kilometers (e.g. "within 50km" equals 50, "near me" equals 5, "10 miles" equals 16).
    - "max_rate": An integer representing the maximum hourly rate budget (e.g., "under 50", "max 100", "less than 50", "maximum 100", "cheaper than 40", "budget 60").
    - "min_rate": An integer representing the minimum hourly rate expected (e.g., "above 50", "more than 50", "min 20", "minimum 50", "at least 50", "pays 60+").
    - "min_experience": An integer representing the minimum years of experience (e.g., "5+ years exp" equals 5, "highly experienced" equals 5).
    - "min_rating": A float representing the minimum star rating (e.g., "4 stars" equals 4.0, "top rated" equals 4.5, "better than 3" equals 3.5).
    
    IMPORTANT: Pay close attention to "above" vs "under" and implied constraints. 
    "Jobs with rate above 200" should map to min_rate = 200. 
    "Workers under 50" should map to max_rate = 50.
    """

    try:
        response = client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Query: {query}"}
            ],
            model="llama-3.1-8b-instant",
            temperature=0,
            response_format={"type": "json_object"}
        )
        
        data = json.loads(response.choices[0].message.content)
        
        # Aggressively clean up search_text in Python to prevent AI hallucinations
        search_text = data.get("search_text", "") or ""
        if search_text:
            search_text = search_text.lower()
            fillers = [
                r'\bjobs?\b', r'\bworkers?\b', r'\bprofessionals?\b', r'\bpeople\b', r'\bsomeone\b', r'\bperson\b',
                r'\brate\b', r'\babove\b', r'\bunder\b', r'\bbelow\b', r'\bover\b', r'\bmore than\b', r'\bless than\b',
                r'\bpaying\b', r'\bpays?\b', r'\bbudget\b', r'\bcost\b', r'\bprice\b', r'\bcheap\b', r'\bexpensive\b',
                r'\bwith\b', r'\bwho\b', r'\bthat\b', r'\bcan\b', r'\bdo\b', r'\bis\b', r'\bare\b', r'\bhas\b', r'\bhave\b',
                r'\bdistance\b', r'\blooking for\b', r'\bfind me\b', r'\bnear me\b', r'\bnearby\b', r'\baround me\b',
                r'\bminimum\b', r'\bmaximum\b', r'\bleast\b', r'\bat most\b', r'\bat least\b',
                r'\bwithin\b', r'\bkm\b', r'\bmiles?\b', r'\bkilometers?\b', r'\bradius\b',
                r'\byears?\b', r'\bexp\b', r'\byoe\b', r'\bexperience\b', r'\bexperienced\b',
                r'\brating\b', r'\bstars?\b', r'\btop rated\b', r'\bhighly rated\b', r'\breviews?\b',
                r'\bhourly\b', r'\bper hour\b', r'\ban hour\b', r'\ba hour\b', r'\bhr\b',
                r'\bfor\b', r'\bin\b', r'\ba\b', r'\ban\b', r'\bthe\b', r'\bto\b', r'\bof\b', r'\band\b',
                r'\bneed\b', r'\bwant\b', r'\bsearch\b', r'\bshow\b', r'\bget\b', r'\bme\b'
            ]
            for f in fillers:
                search_text = re.sub(f, '', search_text)
            
            # Remove isolated numbers and special characters that might be leftover from rate/distance
            search_text = re.sub(r'\b\d+(\.\d+)?\b', '', search_text)
            search_text = re.sub(r'[^\w\s]', '', search_text)
            
            search_text = " ".join(search_text.split()).strip()
            
            # Verb/Field to Role Mappings
            role_mappings = {
                "painting": "painter",
                "paint": "painter",
                "carpentry": "carpenter",
                "woodwork": "carpenter",
                "fixing": "handyman",
                "repair": "handyman",
                "repairing": "handyman",
                "wiring": "electrician",
                "electrical": "electrician",
                "wires": "electrician",
                "pipes": "plumber",
                "plumbing": "plumber",
                "trees": "arborist",
                "tree cutting": "arborist",
                "tree": "arborist",
                "bugs": "exterminator",
                "pest control": "exterminator",
                "cleaning": "cleaner",
                "gardening": "gardener",
                "garden": "gardener",
                "moving": "mover",
                "tiling": "tiler",
                "tiles": "tiler",
                "roofing": "roofer",
                "roof": "roofer",
                "masonry": "mason",
                "bricks": "mason",
                "delivering": "delivery",
                "driving": "driver",
                "transporting": "transporter",
                "mechanics": "mechanic",
                "cars": "mechanic",
                "auto": "mechanic"
            }
            
            # Apply mapping if there's a direct match
            if search_text in role_mappings:
                search_text = role_mappings[search_text]
                
            data["search_text"] = search_text

        # Return standardized types
        return {
            "search_text": data.get("search_text", ""),
            "radius": int(data.get("radius")) if data.get("radius") is not None else None,
            "max_rate": int(data.get("max_rate")) if data.get("max_rate") is not None else None,
            "min_rate": int(data.get("min_rate")) if data.get("min_rate") is not None else None,
            "min_experience": int(data.get("min_experience")) if data.get("min_experience") is not None else None,
            "min_rating": float(data.get("min_rating")) if data.get("min_rating") is not None else None
        }
    except Exception as e:
        logger.error(f"Groq NLP parse error: {str(e)}")
        return _fallback_parse(query)


def _fallback_parse(query: str):
    """Fallback basic parsing when AI fails or key is missing."""
    search_text = query.lower()
    
    # basic radius
    radius = 5 if any(w in search_text for w in ["near me", "nearby", "local"]) else None
    
    # basic cleanup
    fillers = ["looking for", "find me", "someone to", "i need", "workers", "a ", "an ", "the "]
    for f in fillers:
        search_text = search_text.replace(f, "")
        
    return {
        "search_text": search_text.strip(),
        "radius": radius,
        "max_rate": None,
        "min_rate": None,
        "min_experience": None,
        "min_rating": None
    }
