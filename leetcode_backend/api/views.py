# api/views.py

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
import google.generativeai as genai
from django.conf import settings
# **FIX 1: Import the exceptions module**
from google.api_core import exceptions

genai.configure(api_key=settings.GEMINI_API_KEY)

@csrf_exempt
def solve_view(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        title = data.get("title")
        url = data.get("url")
        language = data.get("language", "C++")
        platform = data.get("platform", "LeetCode")

        print(f"Received: {platform} problem '{title}', Language: {language}")

        # (Your prompt generation logic is perfect and stays the same)
        if platform == "Codeforces":
            prompt = f"""
You are an expert competitive programmer solving a problem from a Codeforces contest.
The problem is: "{title}" ({url}).

Provide a complete, efficient {language} solution that reads from standard input (stdin) and writes to standard output (stdout).

The solution should include:
1.  **{language} Code:** A full, correct {language} solution in a single markdown code block.
2.  **Logic Explanation:** A brief explanation of the core logic and algorithm used.
3.  **Complexity Analysis:** Time and Space complexity.
"""
        else: # Default to LeetCode
            prompt = f"""
You are an expert programmer tasked with solving the LeetCode problem: "{title}" ({url}) in {language}.

Provide a complete and well-formatted solution that includes:
1.  **{language} Code:** A full, correct {language} solution inside a class structure if applicable.
2.  **Explanation:** A clear, step-by-step explanation of the code's logic.
3.  **Complexity Analysis:** Time and Space complexity.
"""

        # **FIX 2: Place the API call INSIDE the try block**
        try:
            model = genai.GenerativeModel("models/gemini-2.5-flash")
            response = model.generate_content(prompt)
            answer = response.text
            return JsonResponse({"solution": answer})

        except exceptions.ResourceExhausted:
            # Catch the specific quota error
            error_message = "The daily API request limit has been reached. Please try again tomorrow."
            return JsonResponse({"error": error_message}, status=429)

        except Exception as e:
            # Catch any other potential errors
            print(f"An unexpected error occurred: {e}")
            return JsonResponse({"error": "An unexpected server error occurred."}, status=500)

    return JsonResponse({"error": "Only POST allowed"}, status=400)