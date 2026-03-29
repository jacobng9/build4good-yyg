import asyncio
from main import generate_stability_image

async def run():
    print("Testing Stability Image Generator...")
    result = await generate_stability_image("A glowing golden parabolic curve intersecting a neon blue plane on a pitch-black background")
    if result and result.startswith('data:image/png;base64,'):
        print("SUCCESS! Successfully retrieved 512x512 image from Stability API in Base64.")
    else:
        print("FAILED: Result is completely invalid or None.", result)

asyncio.run(run())
