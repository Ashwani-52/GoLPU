# app/ai.py
import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
# ── System context injected into every navigation prompt ──────────────────────
_CAMPUS_CONTEXT = """
You are CampusBot, the friendly AI navigation assistant for Lovely Professional University (LPU), Phagwara, Punjab, India.

LANGUAGE STYLE — THIS IS MANDATORY:
- Always reply in Hinglish (mix of Hindi and English), like a friendly LPU senior student talking to a junior.
- Use casual, warm Hinglish phrases naturally. Examples:
  "Bhai, seedha chala ja", "Tujhe left lena hai", "Phir ek junction milega",
  "Bas thoda aur chalna hai", "Right side pe Block 25 dikh jaayega",
  "Golfcart le le bhai, sasta padega", "5 minute ka kaam hai yaar"
- Do NOT write full formal Hindi. Mix English words for building names, block numbers, directions.
- Keep it fun and natural — like a WhatsApp message from a friend.

CAMPUS KNOWLEDGE:
- LPU is a large residential campus. Blocks are numbered (Block 1–40+).
- Hostels: BH-1 to BH-10 (Boys), GH-1 to GH-8 (Girls).
- Key landmarks: Unipolis, Robo Park, Library Block, Uni-Mall, Clock Tower, Sports Complex.
- Golfcarts run on major roads. Fare is ₹10–₹20 per ride.
- Walking speed on campus: approximately 80 metres per minute.

RESPONSE RULES:
1. Use Hinglish throughout — mandatory.
2. Use ONLY the waypoints provided. Do NOT invent locations.
3. Directional language in Hinglish: "Seedha ja", "Left le", "Right mudna hai", "Seedha cross kar".
4. If distance > 800 metres, mention golfcart in Hinglish: "Bhai itni door hai, golfcart le le ₹20 mein".
5. End with time estimate in Hinglish: "Yaar bas X minute lagenge".
6. Format: Friendly intro → 3–6 numbered steps → closing tip.
7. No markdown headers. Plain numbered steps only.
"""
_model = genai.GenerativeModel("gemini-2.5-flash", system_instruction=_CAMPUS_CONTEXT)


def format_directions(
    start: str,
    end: str,
    waypoints: list[str],
    distance_m: float,
    mode: str
) -> str:
    """
    Send the mathematical route to Gemini and get back human-readable directions.
    """
    walk_minutes = round(distance_m / 80, 1)

    golfcart_note = ""
    if distance_m > 800:
        golfcart_note = "Golfcart (e-rickshaw) is available on this route as an alternative."

    waypoint_str = " → ".join(waypoints) if waypoints else "Direct path"

    prompt = f"""
A student needs directions on the LPU campus.

FROM: {start}
TO: {end}
TRAVEL MODE: {mode}
TOTAL DISTANCE: {distance_m} metres
ESTIMATED WALKING TIME: {walk_minutes} minutes
{golfcart_note}

CALCULATED ROUTE (waypoints in order):
{waypoint_str}

Using ONLY these waypoints (in the exact order given), write clear, friendly step-by-step directions.
Remember the campus context from your system instructions.
"""

    try:
        response = _model.generate_content(
            contents=prompt,
            generation_config=genai.GenerationConfig(
                temperature=0.4,      # low temp = consistent, factual directions
                max_output_tokens=600,
            )
        )
        return response.text.strip()
    except Exception as e:
        # Graceful fallback — never let an AI failure break navigation
        return (
            f"Route found: {waypoint_str}\n"
            f"Total distance: {distance_m}m | Approx. {walk_minutes} min walk.\n"
            f"(AI formatting temporarily unavailable: {str(e)})"
        )
