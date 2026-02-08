from backend.app.model import load_bundle, generate

bundle = load_bundle()

q = "Define identifier and keywords in C. Explain basic data types supported by C."
print("EXAM:\n", generate(bundle.model, bundle.tokenizer, q, mode="exam"))
print("\nGUIDED:\n", generate(bundle.model, bundle.tokenizer, q, mode="guided"))