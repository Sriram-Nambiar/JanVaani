import os
from dotenv import load_dotenv
from sarvamai import SarvamAI

# Load environment variables from .env
load_dotenv()

api_key = os.getenv("SARVAM_API_KEY")
if not api_key:
    raise ValueError("SARVAM_API_KEY not found in environment.")

# Initialize the Sarvam AI client
client = SarvamAI(api_subscription_key=api_key)

# Make a chat completion call with sarvam-105b-conversations model
response = client.chat.completions(
    model="sarvam-105b-conversations",
    messages=[
        {"role": "user", "content": "Hello! Introduce yourself in one sentence."}
    ],
)

# Print the reply
print(response.choices[0].message.content)
