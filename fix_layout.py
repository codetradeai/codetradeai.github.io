import re

css_replacements = [
    # Remove margin-top: auto from .contact-links and replace with fixed elegant margin
    (r"\.contact-links\s*\{\s*display:\s*flex;\s*flex-direction:\s*column;\s*gap:\s*16px;\s*margin-top:\s*auto;\s*font-size:\s*0\.95rem;\s*\}",
     ".contact-links {\n            display: flex;\n            flex-direction: column;\n            gap: 16px;\n            margin-top: 48px;\n            font-size: 0.95rem;\n        }"),
    
    # Update sidebar properties for better sticky behavior
    (r"position:\s*sticky;\s*top:\s*0;\s*height:\s*100vh;", 
     "position: sticky;\n            top: 0;\n            height: max-content;\n            min-height: 100vh;"),
    
    # Fix mobile layout and add tablet breakpoint
    (r"@media\s*\(max-width:\s*768px\)", 
     "@media (max-width: 992px) {\n            .sidebar {\n                width: 40%;\n                padding: 60px 30px;\n            }\n            .main-content {\n                width: 60%;\n                padding: 60px 40px;\n            }\n        }\n\n        @media (max-width: 768px)")
]

for filename in ["index.html", "index-en.html"]:
    with open(filename, "r") as f:
        text = f.read()

    # Apply fixes
    for pattern, repl in css_replacements:
        text = re.sub(pattern, repl, text, flags=re.MULTILINE)
        
    # Fix mobile center for contact-links
    text = re.sub(
        r"\.contact-links\s*\{\s*justify-content:\s*center;\s*\}",
        ".contact-links {\n                align-items: center;\n            }",
        text
    )

    with open(filename, "w") as f:
        f.write(text)

print("Layout updated.")
