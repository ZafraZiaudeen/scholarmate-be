from sentence_transformers import SentenceTransformer
import sys
import json
import re

model = SentenceTransformer('all-MiniLM-L6-v2')

def clean_text(text):
    """Clean text by replacing problematic characters and normalizing."""
    if not isinstance(text, str):
        sys.stderr.write(f"Non-string input detected: {type(text)}\n")
        return " "
    # Replace special Unicode characters with space or equivalent
    text = re.sub(r'[^\x00-\x7F]+', ' ', text)  # Remove non-ASCII characters
    text = re.sub(r'\s+', ' ', text)  # Normalize multiple spaces
    text = text.strip()  # Remove leading/trailing spaces
    if not text:
        sys.stderr.write(f"Text became empty after cleaning\n")
        return " "
    return text

def main():
    try:
        input_data = sys.stdin.read()
        sys.stderr.write(f"Input data length: {len(input_data)}\n")
        texts = json.loads(input_data)
        sys.stderr.write(f"Texts type: {type(texts)}\n")
        if isinstance(texts, list):
            sys.stderr.write(f"Len texts: {len(texts)}\n")
            for i, text in enumerate(texts):
                sys.stderr.write(f"Text {i}: type={type(text)}, len={len(str(text))}, value={str(text)[:50]}\n")
        cleaned_texts = [clean_text(text) if text and isinstance(text, (str, int, float)) else " " for text in texts]
        sys.stderr.write(f"Cleaned type: {type(cleaned_texts)}\n")
        sys.stderr.write(f"Len cleaned: {len(cleaned_texts)}\n")
        for i, text in enumerate(cleaned_texts):
            sys.stderr.write(f"Cleaned text {i}: type={type(text)}, len={len(text)}, value={text[:50]}\n")
        embeddings = model.encode(cleaned_texts).tolist()
        print(json.dumps(embeddings))
    except Exception as e:
        sys.stderr.write(f"Error: {str(e)}\n")
        sys.exit(1)

if __name__ == "__main__":
    main()